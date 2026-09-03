import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AirVent, Camera, Wifi, Armchair, BookOpen, Ruler, Phone } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { LIBRARY, formatPrice } from "@/lib/library";
import { getPublicSettings } from "@/lib/library.functions";
import hallImage from "@/assets/library-hall.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "श्री गणेश लाइब्रेरी | Shri Ganesh Library – नया रूप, नई सुविधाएं" },
      {
        name: "description",
        content:
          "श्री गणेश लाइब्रेरी, खुद्रा लाइट ऑफ इंडिया भवन – AC/Cooler, CCTV, Free Wi-Fi और शांत अध्ययन वातावरण। ऑनलाइन एंट्री बुक करें।",
      },
      { property: "og:title", content: "श्री गणेश लाइब्रेरी – नया रूप, नई सुविधाएं" },
      {
        property: "og:description",
        content: "शांत, सुरक्षित और सुविधाजनक अध्ययन वातावरण। ऑनलाइन एंट्री और UPI भुगतान।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const FACILITY_ICONS = [
  { icon: AirVent, title: "AC / Cooler", desc: "गर्मी में ठंडा और आरामदायक माहौल" },
  { icon: Camera, title: "CCTV Security", desc: "पूरे परिसर में CCTV निगरानी" },
  { icon: Wifi, title: "Free Wi-Fi", desc: "पढ़ाई के लिए मुफ्त इंटरनेट" },
  { icon: Armchair, title: "Comfortable Seating", desc: "आरामदायक कुर्सी और टेबल" },
  { icon: BookOpen, title: "शांत अध्ययन वातावरण", desc: "बिना शोर, पूरी एकाग्रता" },
  { icon: Ruler, title: "Spacious Study Area", desc: "खुला और बड़ा अध्ययन कक्ष" },
];

function HomePage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
  });

  const half = formatPrice(settings?.halfDayPrice);
  const full = formatPrice(settings?.fullDayPrice);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-14">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-foreground uppercase">
              {LIBRARY.building}
            </p>
            <h1 className="mt-3 font-heading text-3xl leading-snug text-primary sm:text-4xl">
              {LIBRARY.nameHi}
            </h1>
            <p className="mt-2 font-heading text-xl text-gold-foreground">{LIBRARY.tagline}</p>
            <p className="mt-4 text-base text-foreground">{LIBRARY.subtext}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/entry"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Entry Book करें
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-md border border-primary px-5 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Contact करें
              </Link>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              जानकारी के लिए फोन करें:{" "}
              <a
                href={`tel:${LIBRARY.phone}`}
                className="inline-flex items-center gap-1 font-semibold text-primary"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {LIBRARY.phone}
              </a>
            </p>
          </div>

          <img
            src={hallImage}
            alt="श्री गणेश लाइब्रेरी का अध्ययन कक्ष – लकड़ी की टेबल और कुर्सियां"
            width={1600}
            height={1008}
            className="w-full rounded-md border border-border object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="font-heading text-2xl text-primary">लाइब्रेरी की सुविधाएं</h2>
        <div className="gold-rule mt-3 max-w-24" aria-hidden />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITY_ICONS.map((f) => (
            <div key={f.title} className="rounded-md border border-border bg-card p-4">
              <f.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-4">
        <div className="rounded-md border border-border bg-secondary p-5">
          <h2 className="font-heading text-xl text-primary">एंट्री शुल्क</h2>
          {isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">शुल्क लोड हो रहा है…</p>
          ) : half || full ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4">
                <dt className="text-sm text-muted-foreground">Half Day (आधा दिन)</dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  {half ?? "व्यवस्थापक द्वारा तय किया जाएगा"}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <dt className="text-sm text-muted-foreground">Full Day (पूरा दिन)</dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  {full ?? "व्यवस्थापक द्वारा तय किया जाएगा"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-foreground">
              Price will be configured by the library administrator.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-heading text-xl text-primary">एंट्री की प्रक्रिया</h2>
          <ol className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              <span className="font-semibold">1.</span> Entry पेज पर नाम, मोबाइल, दिन का प्रकार,
              तारीख और समय भरें।
            </li>
            <li>
              <span className="font-semibold">2.</span> आपको एक Entry ID मिलेगा (जैसे
              SGL-2026-00001)।
            </li>
            <li>
              <span className="font-semibold">3.</span> Payment पेज पर UPI से भुगतान करके UTR /
              Transaction ID जमा करें।
            </li>
            <li>
              <span className="font-semibold">4.</span> लाइब्रेरी द्वारा भुगतान verify होने के बाद
              Entry Pass पेज से अपना पास दिखाएं।
            </li>
          </ol>
        </div>
      </section>
    </SiteLayout>
  );
}
