import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone, MapPin, Clock, Mail, User, MessageSquare, ShieldCheck, CreditCard } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { LIBRARY } from "@/lib/library";
import { getPublicSettings } from "@/lib/library.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "संपर्क करें (Contact Us) | " + LIBRARY.nameEn },
      {
        name: "description",
        content: `${LIBRARY.nameEn}, ${LIBRARY.address} से संपर्क करें – फोन/व्हाट्सएप: ${LIBRARY.phone}, ईमेल: ${LIBRARY.email}।`,
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
  });

  const address = data?.address || LIBRARY.address;
  const phone = data?.contactPhone || LIBRARY.phone;
  const email = data?.contactEmail || LIBRARY.email;
  const timings = data?.timings || "प्रातः 7:00 AM से सायं 5:00 PM (सातों दिन खुला)";
  const owner = data?.ownerName || "Kumari Shreya";

  const rows = [
    {
      icon: Phone,
      label: "हेल्पलाइन / फोन",
      value: phone,
      href: `tel:${phone}`,
      sub: "सोमवार से रविवार, सुबह 7 से शाम 7 बजे तक",
    },
    {
      icon: MessageSquare,
      label: "WhatsApp चैट सहायता",
      value: `+91 ${phone}`,
      href: LIBRARY.whatsappUrl,
      sub: "स्क्रीनशॉट एवं पूछताछ हेतु",
    },
    {
      icon: MapPin,
      label: "पुस्तकालय का पता",
      value: address,
      sub: "पचलखी, सीवान, बिहार, भारत",
    },
    {
      icon: Clock,
      label: "पुस्तकालय अध्ययन समय",
      value: timings,
      sub: "मॉर्निंग (7 AM–12 PM) | सेकंड हाफ (12 PM–5 PM) | फुल-टाइम (7 AM–5 PM)",
    },
    {
      icon: User,
      label: "संचालिका / व्यवस्थापक",
      value: owner,
      sub: LIBRARY.nameEn,
    },
    {
      icon: Mail,
      label: "आधिकारिक ईमेल",
      value: email,
      href: `mailto:${email}`,
      sub: "किसी भी आधिकारिक सूचना हेतु",
    },
    {
      icon: CreditCard,
      label: "आधिकारिक UPI ID",
      value: LIBRARY.upiId,
      sub: LIBRARY.upiInstruction,
    },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="border-b border-border pb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> संपर्क एवं सहायता
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-primary sm:text-3xl">
            {LIBRARY.nameEn} से संपर्क करें
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            सीट उपलब्धता, फीस भुगतान, एडमिशन अथवा किसी भी तकनीकी सहायता के लिए हमसे संपर्क करें।
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex gap-3.5 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <row.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {row.label}
                </p>
                {isLoading ? (
                  <span className="mt-1 block h-4 w-32 animate-pulse rounded bg-muted" />
                ) : row.href ? (
                  <a
                    href={row.href}
                    target={row.href.startsWith("http") ? "_blank" : undefined}
                    rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-0.5 block font-semibold text-primary hover:underline truncate"
                  >
                    {row.value}
                  </a>
                ) : (
                  <p className="mt-0.5 font-semibold text-foreground">{row.value}</p>
                )}
                <p className="mt-0.5 text-[11px] text-muted-foreground">{row.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp Direct Action Banner */}
        <div className="mt-8 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/70 p-6 dark:bg-emerald-950/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold text-emerald-900 dark:text-emerald-200">
                सीधे व्हाट्सएप पर सहायता पाएं
              </h3>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300">
                फीस का स्क्रीनशॉट भेजने या सीट कन्फर्मेशन के लिए व्हाट्सएप पर मैसेज करें।
              </p>
            </div>
            <a
              href={LIBRARY.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <MessageSquare className="h-4 w-4" /> व्हाट्सएप खोलें (Chat on WhatsApp)
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
