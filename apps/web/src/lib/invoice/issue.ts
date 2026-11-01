import { db } from "@/lib/db";
import { getService } from "@/content/catalog";
import { SAC_CONSULTING, financialYear, formatInvoiceNumber, splitInclusive } from "./gst";

/** Seller details come from env so they can change without a deploy. */
export function sellerFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return {
    name: env.BUSINESS_NAME ?? "Marg Darshan",
    address: env.BUSINESS_ADDRESS ?? "",
    gstin: env.BUSINESS_GSTIN ?? "",
    stateCode: env.BUSINESS_STATE_CODE ?? "09",
    registered: env.GST_REGISTERED === "true",
  };
}

export type Seller = ReturnType<typeof sellerFromEnv>;

export interface InvoiceBreakdown {
  seller: Seller;
  buyer: { name: string; email: string | null; phone: string | null; stateCode?: string };
  items: { description: string; sac: string; quantity: number; amountPaise: number }[];
  placeOfSupply: string;
  installmentNo: number;
  planType: string;
  razorpayPaymentId: string | null;
}

/**
 * Issue (or return the existing) invoice for a captured payment. Idempotent per payment.
 * A per-FY advisory lock keeps numbers gap-free and unique under concurrent webhooks.
 */
export async function issueInvoiceForPayment(paymentId: string, buyerStateCode?: string) {
  const existing = await db.invoice.findUnique({ where: { paymentId } });
  if (existing) return existing;

  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { appointment: { include: { client: true, service: true, problem: true } } },
  });
  if (payment.status !== "CAPTURED") throw new Error(`payment ${paymentId} is ${payment.status}, not CAPTURED`);

  const seller = sellerFromEnv();
  const placeOfSupply = buyerStateCode ?? seller.stateCode;
  const totalPaise = payment.amountInr * 100;
  const gst = splitInclusive(totalPaise, { registered: seller.registered, supplierState: seller.stateCode, placeOfSupply });
  const { appointment } = payment;
  const service = getService(appointment.service.slug);
  const mode = appointment.visitMode === "ONLINE_ZOOM" ? "Online (Zoom)" : "Personal visit";

  const breakdown: InvoiceBreakdown = {
    seller,
    buyer: {
      name: appointment.client.fullName,
      email: appointment.client.email,
      phone: appointment.client.whatsappPhone,
      stateCode: buyerStateCode,
    },
    items: [
      {
        description:
          `${service?.title.en ?? appointment.service.titleEn} — ${appointment.problem.titleEn}, ${appointment.durationMins} min, ${mode}` +
          (payment.planType === "SPLIT_PLAN" ? ` (installment ${payment.installmentNo})` : ""),
        sac: SAC_CONSULTING,
        quantity: 1,
        amountPaise: totalPaise,
      },
    ],
    placeOfSupply,
    installmentNo: payment.installmentNo,
    planType: payment.planType,
    razorpayPaymentId: payment.razorpayPaymentId,
  };

  const issuedAt = new Date();
  const fy = financialYear(issuedAt);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice:${fy}`}))`;
    const again = await tx.invoice.findUnique({ where: { paymentId } });
    if (again) return again;
    const last = await tx.invoice.aggregate({ where: { fy }, _max: { seq: true } });
    const seq = (last._max.seq ?? 0) + 1;
    return tx.invoice.create({
      data: {
        paymentId,
        fy,
        seq,
        number: formatInvoiceNumber(fy, seq),
        issuedAt,
        totalPaise: gst.totalPaise,
        taxablePaise: gst.taxablePaise,
        cgstPaise: gst.cgstPaise,
        sgstPaise: gst.sgstPaise,
        igstPaise: gst.igstPaise,
        breakdown: breakdown as object,
      },
    });
  });
}
