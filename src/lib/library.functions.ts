import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PublicSettings = {
  upiId: string | null;
  receiverName: string | null;
  halfDayPrice: number | null;
  fullDayPrice: number | null;
  qrImageUrl: string | null;
  address: string | null;
  timings: string | null;
  ownerName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export type EntrySummary = {
  entryCode: string;
  fullName: string;
  mobileMasked: string;
  entryType: "half_day" | "full_day";
  entryDate: string;
  entryTime: string;
  amount: number | null;
  entryStatus: "pending" | "confirmed" | "rejected";
  paymentStatus: "pending" | "verified" | "rejected" | null;
  utr: string | null;
  adminNote: string | null;
};

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "10 अंकों का सही मोबाइल नंबर डालें");

const entrySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "पूरा नाम डालें")
    .max(80, "नाम बहुत लंबा है")
    .regex(/^[\p{L}\s.'-]+$/u, "नाम में केवल अक्षर लिखें"),
  mobile: mobileSchema,
  entryType: z.enum(["half_day", "full_day"]),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "सही तारीख चुनें"),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/, "सही समय चुनें"),
});

const paymentSchema = z
  .object({
    entryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^SGL-\d{4}-\d{5}$/, "सही Entry ID डालें (जैसे SGL-2026-00001)"),
    mobile: mobileSchema,
    utr: z
      .string()
      .trim()
      .min(6, "UTR / Transaction ID कम से कम 6 अक्षर का होता है")
      .max(40, "UTR बहुत लंबा है")
      .regex(/^[A-Za-z0-9-]+$/, "UTR में केवल अक्षर और अंक हो सकते हैं"),
    screenshotBase64: z
      .string()
      .min(1, "स्क्रीनशॉट खाली है")
      .max(7_000_000)
      .regex(
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
        "सही स्क्रीनशॉट फ़ाइल चुनें",
      )
      .optional(),
    screenshotType: z.enum(["image/png", "image/jpeg", "image/webp"]).optional(),
  })
  .superRefine(({ screenshotBase64, screenshotType }, ctx) => {
    if ((screenshotBase64 === undefined) !== (screenshotType === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "स्क्रीनशॉट फ़ाइल की जानकारी अधूरी है",
      });
    }
  });

const lookupSchema = z.object({
  entryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SGL-\d{4}-\d{5}$/, "सही Entry ID डालें"),
  mobile: mobileSchema,
});

function maskMobile(mobile: string) {
  return `${mobile.slice(0, 2)}XXXXX${mobile.slice(-3)}`;
}

const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));

export const getPublicSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSettings> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .select(
        "upi_id, receiver_name, half_day_price, full_day_price, qr_image_path, address, timings, owner_name, contact_phone, contact_email",
      )
      .eq("id", true)
      .maybeSingle();

    if (error) throw new Error("सेटिंग्स लोड नहीं हो सकीं");

    let qrImageUrl: string | null = null;
    if (data?.qr_image_path) {
      const signed = await supabaseAdmin.storage
        .from("library-assets")
        .createSignedUrl(data.qr_image_path, 60 * 60);
      qrImageUrl = signed.data?.signedUrl ?? null;
    }

    return {
      upiId: data?.upi_id ?? null,
      receiverName: data?.receiver_name ?? null,
      halfDayPrice: num(data?.half_day_price),
      fullDayPrice: num(data?.full_day_price),
      qrImageUrl,
      address: data?.address ?? null,
      timings: data?.timings ?? null,
      ownerName: data?.owner_name ?? null,
      contactPhone: data?.contact_phone ?? null,
      contactEmail: data?.contact_email ?? null,
    };
  },
);

export const createEntry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => entrySchema.parse(input))
  .handler(async ({ data }): Promise<EntrySummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const chosen = new Date(`${data.entryDate}T00:00:00Z`);
    if (chosen.getTime() < today.getTime() - 86_400_000) {
      throw new Error("बीती हुई तारीख नहीं चुन सकते");
    }

    const studentLookup = await supabaseAdmin
      .from("students")
      .select("id, full_name")
      .eq("mobile", data.mobile)
      .maybeSingle();
    if (studentLookup.error) throw new Error("छात्र की जानकारी जांची नहीं जा सकी");

    let studentId = studentLookup.data?.id;
    if (!studentId) {
      const inserted = await supabaseAdmin
        .from("students")
        .insert({ full_name: data.fullName, mobile: data.mobile })
        .select("id")
        .single();
      if (inserted.error || !inserted.data) throw new Error("रजिस्ट्रेशन नहीं हो सका");
      studentId = inserted.data.id;
    } else if (studentLookup.data?.full_name !== data.fullName) {
      const updated = await supabaseAdmin
        .from("students")
        .update({ full_name: data.fullName })
        .eq("id", studentId);
      if (updated.error) throw new Error("छात्र की जानकारी अपडेट नहीं हो सकी");
    }

    const settings = await supabaseAdmin
      .from("admin_settings")
      .select("half_day_price, full_day_price")
      .eq("id", true)
      .maybeSingle();
    if (settings.error) throw new Error("भुगतान राशि लोड नहीं हो सकी");

    const price =
      data.entryType === "half_day"
        ? num(settings.data?.half_day_price)
        : num(settings.data?.full_day_price);

    const entry = await supabaseAdmin
      .from("entries")
      .insert({
        student_id: studentId,
        entry_type: data.entryType,
        entry_date: data.entryDate,
        entry_time: data.entryTime,
        amount: price,
      })
      .select("entry_code, entry_type, entry_date, entry_time, amount, status, id")
      .single();

    if (entry.error || !entry.data) {
      if (entry.error?.code === "23505") {
        throw new Error("इस तारीख के लिए इस मोबाइल नंबर से एंट्री पहले ही बुक है");
      }
      throw new Error("एंट्री सेव नहीं हो सकी");
    }

    const payment = await supabaseAdmin
      .from("payments")
      .insert({ entry_id: entry.data.id, amount: price });
    if (payment.error) {
      throw new Error(
        `एंट्री बन गई है, लेकिन भुगतान रिकॉर्ड तैयार नहीं हुआ। सहायता के लिए Entry ID ${entry.data.entry_code} बताएं।`,
      );
    }

    return {
      entryCode: entry.data.entry_code as string,
      fullName: data.fullName,
      mobileMasked: maskMobile(data.mobile),
      entryType: entry.data.entry_type,
      entryDate: entry.data.entry_date,
      entryTime: entry.data.entry_time,
      amount: num(entry.data.amount),
      entryStatus: entry.data.status,
      paymentStatus: "pending",
      utr: null,
      adminNote: null,
    };
  });

async function loadEntry(entryCode: string, mobile: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select(
      "id, entry_code, entry_type, entry_date, entry_time, amount, status, students!inner(full_name, mobile)",
    )
    .eq("entry_code", entryCode)
    .maybeSingle();

  if (error) throw new Error("जानकारी लोड नहीं हो सकी");
  if (!data || data.students?.mobile !== mobile) {
    throw new Error("Entry ID और मोबाइल नंबर मेल नहीं खा रहे");
  }
  const payment = await supabaseAdmin
    .from("payments")
    .select("status, utr, admin_note, created_at")
    .eq("entry_id", data.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (payment.error) throw new Error("भुगतान जानकारी लोड नहीं हो सकी");
  return { supabaseAdmin, row: { ...data, payments: payment.data ? [payment.data] : [] } };
}

function toSummary(row: {
  entry_code: string | null;
  entry_type: "half_day" | "full_day";
  entry_date: string;
  entry_time: string;
  amount: number | string | null;
  status: "pending" | "confirmed" | "rejected";
  students: { full_name: string; mobile: string } | null;
  payments: {
    status: "pending" | "verified" | "rejected";
    utr: string | null;
    admin_note: string | null;
  }[];
}): EntrySummary {
  const payment = row.payments?.[0] ?? null;
  return {
    entryCode: row.entry_code ?? "",
    fullName: row.students?.full_name ?? "",
    mobileMasked: maskMobile(row.students?.mobile ?? "0000000000"),
    entryType: row.entry_type,
    entryDate: row.entry_date,
    entryTime: row.entry_time,
    amount: num(row.amount),
    entryStatus: row.status,
    paymentStatus: payment?.status ?? null,
    utr: payment?.utr ?? null,
    adminNote: payment?.admin_note ?? null,
  };
}

export const lookupEntry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }): Promise<EntrySummary> => {
    const { row } = await loadEntry(data.entryCode, data.mobile);
    return toSummary(row as never);
  });

export const submitPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => paymentSchema.parse(input))
  .handler(async ({ data }): Promise<EntrySummary> => {
    const { supabaseAdmin, row } = await loadEntry(data.entryCode, data.mobile);
    const amount = num(row.amount);
    if (row.status === "rejected") {
      throw new Error("यह एंट्री रद्द हो चुकी है; इसके लिए भुगतान जमा नहीं किया जा सकता");
    }
    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("भुगतान राशि उपलब्ध नहीं है। राशि की पुष्टि के लिए लाइब्रेरी से संपर्क करें");
    }

    const existing = await supabaseAdmin
      .from("payments")
      .select("id, status, utr")
      .eq("entry_id", row.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing.error) throw new Error("मौजूदा भुगतान जानकारी जांची नहीं जा सकी");
    if (existing.data?.status === "verified") {
      throw new Error("इस एंट्री का भुगतान पहले ही verify हो चुका है");
    }
    if (existing.data?.utr && existing.data.status === "pending") {
      throw new Error("इस एंट्री के लिए भुगतान पहले ही जमा है, verification का इंतज़ार करें");
    }

    const duplicate = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("utr", data.utr)
      .maybeSingle();
    if (duplicate.error) throw new Error("UTR / Transaction ID की जांच नहीं हो सकी");
    if (duplicate.data && duplicate.data.id !== existing.data?.id) {
      throw new Error("यह UTR / Transaction ID पहले उपयोग हो चुका है");
    }

    let screenshotPath: string | null = null;
    if (data.screenshotBase64 && data.screenshotType) {
      const ext = data.screenshotType.split("/")[1];
      const bytes = Uint8Array.from(atob(data.screenshotBase64), (c) => c.charCodeAt(0));
      if (bytes.byteLength > 5_000_000) throw new Error("स्क्रीनशॉट 5MB से बड़ा नहीं होना चाहिए");
      if (bytes.byteLength === 0) throw new Error("स्क्रीनशॉट खाली है");
      const path = `${data.entryCode}/${Date.now()}.${ext}`;
      const upload = await supabaseAdmin.storage
        .from("payment-screenshots")
        .upload(path, bytes, { contentType: data.screenshotType, upsert: false });
      if (upload.error) throw new Error("स्क्रीनशॉट अपलोड नहीं हो सका");
      screenshotPath = path;
    }

    const payload = {
      utr: data.utr,
      status: "pending" as const,
      admin_note: null,
      screenshot_path: screenshotPath,
    };

    if (existing.data?.id) {
      const updated = await supabaseAdmin
        .from("payments")
        .update(payload)
        .eq("id", existing.data.id);
      if (updated.error) throw new Error("भुगतान जानकारी सेव नहीं हो सकी");
    } else {
      const inserted = await supabaseAdmin
        .from("payments")
        .insert({ entry_id: row.id, amount, ...payload });
      if (inserted.error) {
        if (inserted.error.code === "23505") {
          throw new Error("यह UTR / Transaction ID पहले उपयोग हो चुका है");
        }
        throw new Error("भुगतान जानकारी सेव नहीं हो सकी");
      }
    }

    const fresh = await loadEntry(data.entryCode, data.mobile);
    return toSummary(fresh.row as never);
  });

/** Bootstrap: the first signed-in user can claim admin access when no admin exists yet. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ granted: boolean; reason?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error("भूमिका जांची नहीं जा सकी");
    if ((count ?? 0) > 0) {
      return { granted: false, reason: "Admin पहले से मौजूद है" };
    }
    const inserted = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (inserted.error) throw new Error("Admin अधिकार नहीं दिए जा सके");
    return { granted: true };
  });
