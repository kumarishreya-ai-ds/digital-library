import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupEntry, submitPayment, type EntrySummary } from "@/lib/library.functions";
import { ENTRY_TYPE_LABEL, formatPrice } from "@/lib/library";

const PAYMENT_NUMBER = "7061038932";
const RECIPIENT_NAME = "KUMARI SHREYA";
const PAYMENT_SUPPORT_NUMBER = "9852688787";
const MAX_SCREENSHOT_SIZE = 5_000_000;
const SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

function isScreenshotType(value: string): value is (typeof SCREENSHOT_TYPES)[number] {
  return value === "image/png" || value === "image/jpeg" || value === "image/webp";
}

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? search["code"] : "",
  }),
  head: () => ({
    meta: [
      { title: "भुगतान | श्री गणेश लाइब्रेरी" },
      {
        name: "description",
        content: "अपनी लाइब्रेरी एंट्री की जानकारी देखकर भुगतान जमा करें।",
      },
    ],
  }),
  component: PaymentPage,
});

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("स्क्रीनशॉट पढ़ा नहीं जा सका"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("स्क्रीनशॉट पढ़ा नहीं जा सका"));
        return;
      }
      const separator = reader.result.indexOf(",");
      if (separator < 0) {
        reject(new Error("स्क्रीनशॉट फ़ाइल सही नहीं है"));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.readAsDataURL(file);
  });
}

function PaymentPage() {
  const { code } = Route.useSearch();
  const [entryCode, setEntryCode] = useState(code);
  const [mobile, setMobile] = useState("");
  const [booking, setBooking] = useState<EntrySummary | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  useEffect(() => {
    setEntryCode(code);
  }, [code]);

  const findBooking = useServerFn(lookupEntry);
  const sendPayment = useServerFn(submitPayment);

  const lookupMutation = useMutation({
    mutationFn: () =>
      findBooking({
        data: {
          entryCode: entryCode.trim().toUpperCase(),
          mobile: mobile.trim(),
        },
      }),
    onSuccess: (result) => {
      setBooking(result);
      setUtr("");
      setScreenshot(null);
    },
    onError: (error: Error) => {
      setBooking(null);
      toast.error(error.message || "बुकिंग की जानकारी नहीं मिल सकी");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("पहले अपनी बुकिंग की जानकारी खोजें");
      if (screenshot && screenshot.size > MAX_SCREENSHOT_SIZE) {
        throw new Error("स्क्रीनशॉट 5MB से बड़ा नहीं होना चाहिए");
      }
      if (screenshot && !isScreenshotType(screenshot.type)) {
        throw new Error("स्क्रीनशॉट PNG, JPG या WEBP फ़ाइल होना चाहिए");
      }

      const screenshotBase64 = screenshot ? await readFileAsBase64(screenshot) : undefined;
      return sendPayment({
        data: {
          entryCode: booking.entryCode,
          mobile: mobile.trim(),
          utr: utr.trim(),
          ...(screenshot && screenshotBase64 && isScreenshotType(screenshot.type)
            ? { screenshotBase64, screenshotType: screenshot.type }
            : {}),
        },
      });
    },
    onSuccess: (result) => {
      setBooking(result);
      setUtr("");
      setScreenshot(null);
      toast.success("भुगतान जमा हुआ — verification अभी बाकी है");
    },
    onError: (error: Error) => toast.error(error.message || "भुगतान जानकारी जमा नहीं हो सकी"),
  });

  const bookingStatus = booking?.paymentStatus;
  const paymentAlreadySubmitted = bookingStatus === "pending" && Boolean(booking?.utr);
  const canSubmitPayment =
    booking !== null &&
    booking.entryStatus !== "rejected" &&
    bookingStatus !== "verified" &&
    !paymentAlreadySubmitted &&
    booking.amount !== null &&
    Number.isFinite(booking.amount) &&
    booking.amount > 0;
  const inputsLocked = lookupMutation.isPending || paymentMutation.isPending;

  function clearBooking() {
    setBooking(null);
    setUtr("");
    setScreenshot(null);
    lookupMutation.reset();
    paymentMutation.reset();
  }

  function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearBooking();
    lookupMutation.mutate();
  }

  function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    paymentMutation.mutate();
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-heading text-2xl text-primary sm:text-3xl">भुगतान</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          भुगतान से पहले अपनी एंट्री की जानकारी जांचें। भुगतान जमा करने पर वह केवल verification के
          लिए भेजा जाएगा।
        </p>

        <div className="mt-6 rounded-md border border-border bg-card p-5">
          <h2 className="font-heading text-lg text-primary">भुगतान प्राप्तकर्ता</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">प्राप्तकर्ता का नाम</dt>
              <dd className="mt-1 font-semibold text-foreground">{RECIPIENT_NAME}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                भुगतान के लिए मोबाइल नंबर
              </dt>
              <dd className="mt-1 font-mono text-lg font-semibold text-foreground">
                {PAYMENT_NUMBER}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive">
            अपने UPI ऐप में भुगतान करने से पहले प्राप्तकर्ता का नाम और नंबर ध्यान से जांचें। दोनों
            बिल्कुल {RECIPIENT_NAME} और {PAYMENT_NUMBER} होने चाहिए। इनमें से कोई भी जानकारी मेल न
            खाए, तो भुगतान बिल्कुल न करें।
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            इस पेज पर कोई UPI ID या QR कोड नहीं दिया गया है। ऐप में सही प्राप्तकर्ता की पुष्टि न हो
            पाए तो भुगतान रोकें और सहायता के लिए{" "}
            <a
              href={`tel:${PAYMENT_SUPPORT_NUMBER}`}
              className="inline-flex items-center gap-1 font-semibold text-primary underline"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {PAYMENT_SUPPORT_NUMBER}
            </a>{" "}
            पर कॉल करें।
          </p>
        </div>

        <form
          className="mt-6 space-y-4 rounded-md border border-border bg-card p-5"
          onSubmit={handleLookup}
        >
          <h2 className="font-heading text-lg text-primary">अपनी बुकिंग खोजें</h2>
          <div>
            <Label htmlFor="payment-entry-code">Entry ID</Label>
            <Input
              id="payment-entry-code"
              value={entryCode}
              onChange={(event) => {
                setEntryCode(event.target.value);
                clearBooking();
              }}
              placeholder="SGL-2026-00001"
              autoComplete="off"
              pattern="SGL-[0-9]{4}-[0-9]{5}"
              required
              maxLength={14}
              disabled={inputsLocked}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="payment-mobile">बुकिंग में दिया गया मोबाइल नंबर</Label>
            <Input
              id="payment-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              value={mobile}
              onChange={(event) => {
                setMobile(event.target.value.replace(/\D/g, "").slice(0, 10));
                clearBooking();
              }}
              required
              disabled={inputsLocked}
              className="mt-1"
            />
          </div>
          {lookupMutation.error && (
            <p role="alert" className="text-sm text-destructive">
              {lookupMutation.error.message}
            </p>
          )}
          <Button type="submit" disabled={lookupMutation.isPending}>
            {lookupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            बुकिंग की जानकारी देखें
          </Button>
        </form>

        {booking && (
          <section className="mt-6 rounded-md border border-border bg-card p-5">
            <h2 className="font-heading text-lg text-primary">बुकिंग की जानकारी</h2>
            <dl className="mt-3 divide-y divide-border rounded-md border border-border">
              <SummaryRow label="Entry ID" value={booking.entryCode} />
              <SummaryRow label="नाम" value={booking.fullName} />
              <SummaryRow label="मोबाइल" value={booking.mobileMasked} />
              <SummaryRow label="Entry Type" value={ENTRY_TYPE_LABEL[booking.entryType]} />
              <SummaryRow label="तारीख" value={booking.entryDate} />
              <SummaryRow label="समय" value={booking.entryTime.slice(0, 5)} />
              <SummaryRow
                label="राशि"
                value={formatPrice(booking.amount) ?? "अभी निर्धारित नहीं"}
              />
            </dl>

            {booking.entryStatus === "rejected" ? (
              <StatusMessage>
                यह एंट्री रद्द हो चुकी है; इसके लिए भुगतान जमा नहीं किया जा सकता।
              </StatusMessage>
            ) : bookingStatus === "verified" ? (
              <StatusMessage>इस भुगतान को लाइब्रेरी द्वारा verified किया जा चुका है।</StatusMessage>
            ) : paymentAlreadySubmitted ? (
              <StatusMessage>
                भुगतान जानकारी जमा हो चुकी है। भुगतान की पुष्टि लाइब्रेरी द्वारा की जाएगी; दोबारा
                जमा करने की आवश्यकता नहीं है।
              </StatusMessage>
            ) : (
              <>
                {bookingStatus === "rejected" && (
                  <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    पिछला भुगतान अस्वीकार किया गया था। दोबारा भुगतान करने से पहले सहायता नंबर पर
                    संपर्क करें और विवरण जांचें.
                  </p>
                )}
                {(!booking.amount || booking.amount <= 0) && (
                  <StatusMessage>
                    इस बुकिंग की राशि अभी उपलब्ध नहीं है। भुगतान करने से पहले लाइब्रेरी से संपर्क
                    करके राशि की पुष्टि करें।
                  </StatusMessage>
                )}
                <form className="mt-5 space-y-4" onSubmit={handlePayment}>
                  <p className="text-sm text-muted-foreground">
                    UPI ऐप में भुगतान करने के बाद ही UTR / Transaction ID भरें। स्क्रीनशॉट वैकल्पिक
                    है। सबमिट करने से भुगतान verified नहीं होगा।
                  </p>
                  <div>
                    <Label htmlFor="payment-utr">UTR / Transaction ID</Label>
                    <Input
                      id="payment-utr"
                      value={utr}
                      onChange={(event) => setUtr(event.target.value)}
                      minLength={6}
                      maxLength={40}
                      pattern="[A-Za-z0-9-]+"
                      autoComplete="off"
                      required
                      disabled={!canSubmitPayment || paymentMutation.isPending}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-screenshot">भुगतान स्क्रीनशॉट (वैकल्पिक)</Label>
                    <Input
                      id="payment-screenshot"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!canSubmitPayment || paymentMutation.isPending}
                      onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG या WEBP; अधिकतम 5MB। स्क्रीनशॉट से भुगतान अपने-आप verified नहीं होगा।
                    </p>
                  </div>
                  {paymentMutation.error && (
                    <p role="alert" className="text-sm text-destructive">
                      {paymentMutation.error.message}
                    </p>
                  )}
                  <Button type="submit" disabled={!canSubmitPayment || paymentMutation.isPending}>
                    {paymentMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    )}
                    भुगतान verification के लिए जमा करें
                  </Button>
                </form>
              </>
            )}
          </section>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          भुगतान सहायता:{" "}
          <a
            href={`tel:${PAYMENT_SUPPORT_NUMBER}`}
            className="font-semibold text-primary underline"
          >
            {PAYMENT_SUPPORT_NUMBER}
          </a>
        </p>
      </section>
    </SiteLayout>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function StatusMessage({ children }: { children: string }) {
  return (
    <p className="mt-4 rounded-md border border-border bg-secondary p-3 text-sm text-foreground">
      {children}
    </p>
  );
}
