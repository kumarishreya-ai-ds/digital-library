import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntry, getPublicSettings, type EntrySummary } from "@/lib/library.functions";
import { ENTRY_TYPE_LABEL, formatPrice } from "@/lib/library";

export const Route = createFileRoute("/entry")({
  head: () => ({
    meta: [
      { title: "Library Entry बुक करें | श्री गणेश लाइब्रेरी" },
      {
        name: "description",
        content:
          "श्री गणेश लाइब्रेरी में Half Day या Full Day एंट्री ऑनलाइन बुक करें – नाम, मोबाइल, तारीख और समय भरें।",
      },
      { property: "og:title", content: "Library Entry बुक करें | श्री गणेश लाइब्रेरी" },
      {
        property: "og:description",
        content: "Half Day या Full Day एंट्री बुक करें और Entry ID प्राप्त करें।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntryPage,
});

type FormState = {
  fullName: string;
  mobile: string;
  entryType: "half_day" | "full_day";
  entryDate: string;
  entryTime: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.fullName.trim().length < 3) errors.fullName = "पूरा नाम लिखें (कम से कम 3 अक्षर)";
  else if (!/^[\p{L}\s.'-]+$/u.test(form.fullName.trim()))
    errors.fullName = "नाम में केवल अक्षर लिखें";
  if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
    errors.mobile = "10 अंकों का सही मोबाइल नंबर डालें";
  if (!form.entryDate) errors.entryDate = "तारीख चुनें";
  else if (form.entryDate < todayIso()) errors.entryDate = "बीती हुई तारीख नहीं चुन सकते";
  if (!form.entryTime) errors.entryTime = "समय चुनें";
  return errors;
}

function EntryPage() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    mobile: "",
    entryType: "full_day",
    entryDate: todayIso(),
    entryTime: "09:00",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [summary, setSummary] = useState<EntrySummary | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
  });
  const submitEntry = useServerFn(createEntry);

  const mutation = useMutation({
    mutationFn: (payload: FormState) =>
      submitEntry({
        data: {
          fullName: payload.fullName.trim(),
          mobile: payload.mobile.trim(),
          entryType: payload.entryType,
          entryDate: payload.entryDate,
          entryTime: payload.entryTime,
        },
      }),
    onSuccess: (result) => {
      setSummary(result);
      toast.success("एंट्री दर्ज हो गई");
    },
    onError: (error: Error) => toast.error(error.message || "एंट्री दर्ज नहीं हो सकी"),
  });

  const price =
    form.entryType === "half_day" ? settings?.halfDayPrice : settings?.fullDayPrice;

  if (summary) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-md border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
              <h1 className="font-heading text-xl text-foreground">एंट्री दर्ज हो गई</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              यह Entry ID संभाल कर रखें। भुगतान और Entry Pass के लिए इसकी ज़रूरत होगी।
            </p>

            <dl className="mt-5 divide-y divide-border rounded-md border border-border">
              <Row label="Entry ID" value={summary.entryCode} strong />
              <Row label="नाम" value={summary.fullName} />
              <Row label="मोबाइल" value={summary.mobileMasked} />
              <Row label="Entry Type" value={ENTRY_TYPE_LABEL[summary.entryType]} />
              <Row label="तारीख" value={summary.entryDate} />
              <Row label="समय" value={summary.entryTime.slice(0, 5)} />
              <Row
                label="राशि"
                value={
                  formatPrice(summary.amount) ??
                  "Price will be configured by the library administrator."
                }
              />
              <Row label="Entry Status" value="Pending – भुगतान verification बाकी" />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/payment"
                search={{ code: summary.entryCode }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                भुगतान करें
              </Link>
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="inline-flex items-center justify-center rounded-md border border-input px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                नई एंट्री
              </button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-heading text-2xl text-primary sm:text-3xl">Library Entry</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          नीचे सही जानकारी भरें। एंट्री दर्ज होने पर आपको Entry ID मिलेगा।
        </p>

        <form
          noValidate
          className="mt-6 space-y-5 rounded-md border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const found = validate(form);
            setErrors(found);
            if (Object.keys(found).length > 0) return;
            mutation.mutate(form);
          }}
        >
          <div>
            <Label htmlFor="fullName">पूरा नाम (Full Name)</Label>
            <Input
              id="fullName"
              value={form.fullName}
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1"
            />
            {errors.fullName && <FieldError id="fullName-error">{errors.fullName}</FieldError>}
          </div>

          <div>
            <Label htmlFor="mobile">मोबाइल नंबर (Mobile Number)</Label>
            <Input
              id="mobile"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              value={form.mobile}
              aria-invalid={!!errors.mobile}
              aria-describedby={errors.mobile ? "mobile-error" : undefined}
              onChange={(e) =>
                setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              className="mt-1"
            />
            {errors.mobile && <FieldError id="mobile-error">{errors.mobile}</FieldError>}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-foreground">Entry Type</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["half_day", "full_day"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    form.entryType === type
                      ? "border-primary bg-accent"
                      : "border-border bg-background"
                  }`}
                >
                  <input
                    type="radio"
                    name="entryType"
                    value={type}
                    checked={form.entryType === type}
                    onChange={() => setForm({ ...form, entryType: type })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {ENTRY_TYPE_LABEL[type]}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatPrice(
                        type === "half_day" ? settings?.halfDayPrice : settings?.fullDayPrice,
                      ) ?? "शुल्क व्यवस्थापक द्वारा तय किया जाएगा"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="entryDate">तारीख (Date)</Label>
              <Input
                id="entryDate"
                type="date"
                min={todayIso()}
                value={form.entryDate}
                aria-invalid={!!errors.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                className="mt-1"
              />
              {errors.entryDate && <FieldError>{errors.entryDate}</FieldError>}
            </div>
            <div>
              <Label htmlFor="entryTime">एंट्री समय (Entry Time)</Label>
              <Input
                id="entryTime"
                type="time"
                value={form.entryTime}
                aria-invalid={!!errors.entryTime}
                onChange={(e) => setForm({ ...form, entryTime: e.target.value })}
                className="mt-1"
              />
              {errors.entryTime && <FieldError>{errors.entryTime}</FieldError>}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            देय राशि:{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(price) ?? "Price will be configured by the library administrator."}
            </span>
          </p>

          <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Entry दर्ज करें
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}

function FieldError({ children, id }: { children: string; id?: string }) {
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-destructive">
      {children}
    </p>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          strong ? "font-mono text-base font-semibold text-primary" : "text-sm text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
