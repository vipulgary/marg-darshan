/**
 * Minimal Razorpay REST client (no SDK): Basic auth with RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.
 * Env is read at call time so a missing key never crashes the app at import.
 */
const BASE_URL = "https://api.razorpay.com/v1";
const TIMEOUT_MS = 15_000;

export type RazorpayNotes = Record<string, string>;

export interface RazorpayOrder {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: RazorpayNotes | unknown[];
  created_at: number;
}

export type RazorpayMethod = "card" | "netbanking" | "wallet" | "emi" | "upi" | "cardless_emi" | "paylater" | "bank_transfer" | string;

export interface RazorpayPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string | null;
  invoice_id?: string | null;
  method: RazorpayMethod;
  amount_refunded: number;
  refund_status: "null" | "partial" | "full" | null;
  captured: boolean;
  description?: string | null;
  vpa?: string | null;
  bank?: string | null;
  wallet?: string | null;
  email?: string | null;
  contact?: string | null;
  notes: RazorpayNotes | unknown[];
  error_code?: string | null;
  error_description?: string | null;
  error_reason?: string | null;
  upi?: { payer_account_type?: string; vpa?: string; flow?: string } | null;
  created_at: number;
}

export interface RazorpayPaymentLink {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: "created" | "partially_paid" | "expired" | "cancelled" | "paid";
  short_url: string;
  reference_id: string | null;
  description: string | null;
  expire_by: number;
  notes: RazorpayNotes | null;
  created_at: number;
}

export interface RazorpayRefund {
  id: string;
  entity: "refund";
  amount: number;
  currency: string;
  payment_id: string;
  status: "pending" | "processed" | "failed";
  speed_processed?: string;
  notes: RazorpayNotes | unknown[];
  created_at: number;
}

export class RazorpayError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `Razorpay request failed with HTTP ${status}`);
    this.name = "RazorpayError";
  }
}

export class RazorpayNotConfiguredError extends Error {
  constructor() {
    super("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)");
    this.name = "RazorpayNotConfiguredError";
  }
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** The public key id handed to Checkout on the browser. */
export function razorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID || undefined;
}

function errorDescription(body: unknown): string | undefined {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error?: { description?: unknown } }).error;
    if (err && typeof err.description === "string") return err.description;
  }
  return undefined;
}

async function request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new RazorpayNotConfiguredError();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new RazorpayError(0, null, `Razorpay unreachable: ${e instanceof Error ? e.message : String(e)}`);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new RazorpayError(res.status, data, errorDescription(data));
  if (!data || typeof data !== "object") throw new RazorpayError(res.status, data, "Unexpected Razorpay response");
  return data as T;
}

/** Razorpay limits notes to 15 keys of ≤ 256 chars. */
function cleanNotes(notes: RazorpayNotes | undefined): RazorpayNotes | undefined {
  if (!notes) return undefined;
  return Object.fromEntries(
    Object.entries(notes)
      .slice(0, 15)
      .map(([k, v]) => [k, String(v).slice(0, 256)]),
  );
}

function assertPaise(amountPaise: number) {
  if (!Number.isInteger(amountPaise) || amountPaise < 100) throw new RangeError(`invalid amount in paise: ${amountPaise}`);
}

export function createOrder({
  amountPaise,
  receipt,
  notes,
}: {
  amountPaise: number;
  receipt: string;
  notes?: RazorpayNotes;
}): Promise<RazorpayOrder> {
  assertPaise(amountPaise);
  return request<RazorpayOrder>("POST", "/orders", {
    amount: amountPaise,
    currency: "INR",
    receipt: receipt.slice(0, 40),
    notes: cleanNotes(notes),
  });
}

export function fetchPayment(id: string): Promise<RazorpayPayment> {
  return request<RazorpayPayment>("GET", `/payments/${encodeURIComponent(id)}`);
}

export function createPaymentLink({
  amountPaise,
  description,
  customer,
  notes,
  expireBy,
  callbackUrl,
  referenceId,
}: {
  amountPaise: number;
  description: string;
  customer: { name: string; email?: string | null; contact?: string | null };
  notes?: RazorpayNotes;
  expireBy: Date;
  callbackUrl?: string;
  referenceId?: string;
}): Promise<RazorpayPaymentLink> {
  assertPaise(amountPaise);
  return request<RazorpayPaymentLink>("POST", "/payment_links", {
    amount: amountPaise,
    currency: "INR",
    accept_partial: false,
    description: description.slice(0, 2048),
    customer: {
      name: customer.name,
      ...(customer.email && { email: customer.email }),
      ...(customer.contact && { contact: customer.contact }),
    },
    // We send our own bilingual email; Razorpay's SMS still helps on mobile.
    notify: { sms: Boolean(customer.contact), email: false },
    reminder_enable: true,
    notes: cleanNotes(notes),
    expire_by: Math.floor(expireBy.getTime() / 1000),
    ...(referenceId && { reference_id: referenceId.slice(0, 40) }),
    ...(callbackUrl && { callback_url: callbackUrl, callback_method: "get" }),
  });
}

/** Full refund when amountPaise is omitted. */
export function refundPayment(paymentId: string, amountPaise?: number, notes?: RazorpayNotes): Promise<RazorpayRefund> {
  if (amountPaise !== undefined) assertPaise(amountPaise);
  return request<RazorpayRefund>("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, {
    ...(amountPaise !== undefined && { amount: amountPaise }),
    speed: "normal",
    notes: cleanNotes(notes),
  });
}
