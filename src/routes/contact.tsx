import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone, MapPin, Clock, Mail, User } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { LIBRARY } from "@/lib/library";
import { getPublicSettings } from "@/lib/library.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "संपर्क करें | श्री गणेश लाइब्रेरी" },
      {
        name: "description",
        content: `श्री गणेश लाइब्रेरी, ${LIBRARY.building} से संपर्क करें – फोन ${LIBRARY.phone}।`,
      },
      { property: "og:title", content: "संपर्क करें | श्री गणेश लाइब्रेरी" },
      {
        property: "og:description",
        content: "लाइब्रेरी का पता, समय और फोन नंबर की जानकारी।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
  });

  const rows = [
    { icon: Phone, label: "फोन", value: data?.contactPhone || LIBRARY.phone, href: `tel:${data?.contactPhone || LIBRARY.phone}` },
    { icon: MapPin, label: "भवन", value: LIBRARY.building },
    {
      icon: MapPin,
      label: "पूरा पता",
      value: data?.address || "पता व्यवस्थापक द्वारा जोड़ा जाएगा।",
    },
    {
      icon: Clock,
      label: "समय",
      value: data?.timings || "समय व्यवस्थापक द्वारा जोड़ा जाएगा।",
    },
    {
      icon: User,
      label: "संचालक",
      value: data?.ownerName || "जानकारी व्यवस्थापक द्वारा जोड़ी जाएगी।",
    },
    {
      icon: Mail,
      label: "ईमेल",
      value: data?.contactEmail || "ईमेल व्यवस्थापक द्वारा जोड़ा जाएगा।",
      href: data?.contactEmail ? `mailto:${data.contactEmail}` : undefined,
    },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-heading text-2xl text-primary sm:text-3xl">संपर्क करें</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          किसी भी जानकारी, सीट उपलब्धता या भुगतान से जुड़ी समस्या के लिए फोन करें।
        </p>

        <div className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-3 p-4">
              <row.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {row.label}
                </p>
                {isLoading ? (
                  <span className="mt-1 block h-4 w-40 animate-pulse rounded bg-muted" />
                ) : row.href ? (
                  <a href={row.href} className="text-base font-medium text-primary">
                    {row.value}
                  </a>
                ) : (
                  <p className="text-base text-foreground">{row.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
