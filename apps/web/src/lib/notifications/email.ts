/**
 * Transactional email via SMTP when SMTP_USER/SMTP_PASS are set (e.g. Gmail + App Password, no
 * domain needed), else the Resend REST API (AMX-091). With neither configured the message is
 * printed with console.info so local development and previews still work. Every attempt is
 * written to NotificationLog (template + entity) — that log is also the idempotency record.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/lib/db";
import type { NotificationChannel } from "@/generated/prisma/enums";

export interface EmailAttachment {
  filename: string;
  /** base64-encoded file content */
  content: string;
  contentType?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
  /** NotificationLog.template, e.g. "booking_confirmed" */
  template?: string;
  /** NotificationLog.entityId, e.g. the appointment id */
  entityId?: string | null;
}

export interface SendEmailResult {
  ok: boolean;
  provider: "smtp" | "resend" | "console";
  id?: string;
  error?: string;
}

const RESEND_URL = "https://api.resend.com/emails";

/** SMTP (e.g. Gmail + App Password) needs no verified domain, so it works on a temporary site address. */
const smtpConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

export function emailConfigured(): boolean {
  return smtpConfigured() || Boolean(process.env.RESEND_API_KEY);
}

let smtpTransport: Transporter | null = null;
function smtp(): Transporter {
  if (!smtpTransport) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }
  return smtpTransport;
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const { to, subject, html, text, attachments } = input;
  try {
    const info = await smtp().sendMail({
      // Gmail rewrites any other From to the signed-in account, so default to it.
      from: process.env.EMAIL_FROM ?? `Marg Darshan <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      ...(process.env.EMAIL_REPLY_TO && { replyTo: process.env.EMAIL_REPLY_TO }),
      ...(attachments?.length && {
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          encoding: "base64",
          ...(a.contentType && { contentType: a.contentType }),
        })),
      }),
    });
    return { ok: true, provider: "smtp", id: info.messageId };
  } catch (e) {
    return { ok: false, provider: "smtp", error: e instanceof Error ? e.message : String(e) };
  }
}

export async function logNotification(row: {
  channel: NotificationChannel;
  template: string;
  to: string;
  entityId?: string | null;
  status: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    await db.notificationLog.create({ data: { ...row, entityId: row.entityId ?? null } });
  } catch (e) {
    console.error("[notifications] could not write NotificationLog", e);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { to, subject, html, text, attachments, template = "adhoc", entityId } = input;
  const key = process.env.RESEND_API_KEY;
  let result: SendEmailResult;

  if (smtpConfigured()) {
    result = await sendViaSmtp(input);
    if (!result.ok) console.error(`[email] ${template} to ${to} failed: ${result.error}`);
  } else if (!key) {
    console.info(
      `[email:console] to=${to} template=${template} subject=${subject}` +
        (attachments?.length ? ` attachments=${attachments.map((a) => a.filename).join(",")}` : "") +
        `\n${text}`,
    );
    result = { ok: true, provider: "console" };
  } else {
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          // Retried sends of the same notification are de-duplicated by Resend.
          ...(entityId && template !== "adhoc" && { "Idempotency-Key": `${template}:${entityId}`.slice(0, 256) }),
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "Marg Darshan <bookings@astromax.in>",
          to: [to],
          subject,
          html,
          text,
          ...(process.env.EMAIL_REPLY_TO && { reply_to: process.env.EMAIL_REPLY_TO }),
          ...(attachments?.length && {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              ...(a.contentType && { content_type: a.contentType }),
            })),
          }),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      result = res.ok
        ? { ok: true, provider: "resend", id: data?.id }
        : { ok: false, provider: "resend", error: data?.message ?? `HTTP ${res.status}` };
    } catch (e) {
      result = { ok: false, provider: "resend", error: e instanceof Error ? e.message : String(e) };
    }
    if (!result.ok) console.error(`[email] ${template} to ${to} failed: ${result.error}`);
  }

  await logNotification({
    channel: "EMAIL",
    template,
    to,
    entityId,
    status: result.ok ? (result.provider === "console" ? "logged" : "sent") : "failed",
  });
  return result;
}
