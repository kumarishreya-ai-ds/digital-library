import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AirVent,
  Camera,
  Wifi,
  Armchair,
  BookOpen,
  Phone,
  Zap,
  Droplet,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  UserCheck,
  CreditCard,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  LIBRARY,
  FACILITIES,
  MEMBERSHIP_PLANS,
  formatPrice,
} from "@/lib/library";
import { getPublicSettings } from "@/lib/library.functions";
import hallImage from "@/assets/library-hall.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${LIBRARY.nameEn} | ${LIBRARY.nameHi} — Siwan, Bihar` },
      {
        name: "description",
        content: `${LIBRARY.nameEn}, ${LIBRARY.address} — 20 फिजिकल सीटें, AC/Cooler, CCTV, Free Wi-Fi, RO वाटर एवं शांत अध्ययन वातावरण। ऑनलाइन एडमिशन एवं सीट बुकिंग उपलब्ध।`,
      },
      { property: "og:title", content: `${LIBRARY.nameEn} — नया रूप, नई सुविधाएं` },
      {
        property: "og:description",
        content: "शांत, सुरक्षित और आधुनिक अध्ययन कक्ष। 20 सीटें, 3 शिफ्ट्स (मॉर्निंग, सेकंड हाफ, फुल-टाइम)।",
      },
    ],
  }),
  component: HomePage,
});

const FACILITY_CARD_ICONS = [
  { icon: BookOpen, title: "शांत अध्ययन वातावरण", desc: "शोर-शराबे से दूर पूर्ण एकाग्रता के साथ अध्ययन।" },
  { icon: AirVent, title: "AC / Cooler", desc: "मौसम अनुसार ठंडा और आरामदायक अध्ययन कक्ष।" },
  { icon: Camera, title: "24x7 CCTV Security", desc: "छात्र-छात्राओं की पूर्ण सुरक्षा हेतु परिसर में कैमरे।" },
  { icon: Wifi, title: "हाई-स्पीड Free Wi-Fi", desc: "ऑनलाइन लेक्चर्स और स्टडी मैटेरियल डाउनलोड करने हेतु।" },
  { icon: Armchair, title: "आरामदायक कुर्सी और टेबल", desc: "लंबे समय तक पढ़ाई के लिए एर्गोनॉमिक अध्ययन डेस्क।" },
  { icon: Droplet, title: "RO Drinking Water", desc: "स्वच्छ, शुद्ध और ठंडा पेयजल हमेशा उपलब्ध।" },
  { icon: Zap, title: "डेस्क चार्जिंग सॉकेट", desc: "लैपटॉप और मोबाइल चार्जिंग की सीधी सुविधा।" },
  { icon: Clock, title: "फ्लेक्सिबल शिफ्ट्स", desc: "मॉर्निंग, सेकंड हाफ एवं फुल-टाइम अध्ययन स्लॉट्स।" },
];

const FAQS = [
  {
    q: "पुस्तकालय में कुल कितनी सीटें उपलब्ध हैं?",
    a: "श्री गणेश डिजिटल लाइब्रेरी में कुल 20 फिजिकल सीटें (Seat 01 से Seat 20) उपलब्ध हैं, जिन्हें व्यक्तिगत अध्ययन केबिन के रूप में व्यवस्थित किया गया है।",
  },
  {
    q: "क्या मॉर्निंग और सेकंड हाफ की सीटें एक जैसी हो सकती हैं?",
    a: "हाँ! मॉर्निंग हाफ (7:00 AM से 12:00 PM) और सेकंड हाफ (12:00 PM से 5:00 PM) के समय अलग-अलग हैं, इसलिए एक ही फिजिकल सीट को दो छात्र अलग-अलग शिफ्ट के लिए बुक कर सकते हैं।",
  },
  {
    q: "फुल-टाइम स्लॉट के क्या नियम हैं?",
    a: "फुल-टाइम स्लॉट सुबह 7:00 बजे से शाम 5:00 बजे तक (10 घंटे) मान्य है। फुल-टाइम चुनने पर वह सीट पूरे दिन के लिए ब्लॉक हो जाती है और कोई अन्य छात्र उसे बुक नहीं कर सकता।",
  },
  {
    q: "एडमिशन और फीस भुगतान की प्रक्रिया क्या है?",
    a: "सबसे पहले वेबसाइट पर सीट चुनें और एडमिशन फॉर्म भरें। इसके बाद हमारे आधिकारिक UPI ID (7061038932-p36a@ibl) पर फीस भेजें और UTR दर्ज करें। व्यवस्थापक द्वारा बैंक खाते में सत्यापन के उपरांत डिजिटल पास जारी होगा।",
  },
];

function HomePage() {
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
  });

  return (
    <SiteLayout>
      {/* HERO SECTION */}
      <section className="relative border-b border-border bg-gradient-to-b from-card to-secondary/30 py-12 md:py-18">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50/80 px-3 py-1 text-xs font-bold text-primary dark:bg-amber-950/30">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{LIBRARY.building}</span>
            </div>

            <h1 className="font-heading text-3xl font-extrabold leading-tight text-primary sm:text-4xl lg:text-5xl">
              {LIBRARY.nameEn}
            </h1>
            <p className="font-heading text-xl font-bold text-amber-700 dark:text-amber-400">
              {LIBRARY.nameHi} — {LIBRARY.tagline}
            </p>
            <p className="text-base text-foreground/85 leading-relaxed">
              {LIBRARY.subtext}। खुद्रा, पचलखी, सीवान में प्रतियोगी परीक्षाओं एवं उच्च शिक्षा की तैयारी कर रहे विद्यार्थियों के लिए शांत, आधुनिक एवं समर्पित अध्ययन केंद्र।
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                <Calendar className="h-4 w-4" /> सीट चुनें एवं बुक करें
              </Link>
              <Link
                to="/admission"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/5"
              >
                <UserCheck className="h-4 w-4" /> एडमिशन फॉर्म भरें
              </Link>
            </div>

            {/* Contact Callouts */}
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-muted-foreground border-t border-border/80">
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-primary" />
                <span>फोन: <strong>{LIBRARY.phone}</strong></span>
              </div>
              <span className="text-border">|</span>
              <a
                href={LIBRARY.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp: 9852688787</span>
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border-2 border-primary/20 shadow-xl">
              <img
                src={hallImage}
                alt="श्री गणेश डिजिटल लाइब्रेरी का आधुनिक अध्ययन कक्ष"
                width={1600}
                height={1008}
                className="w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            {/* 20-Seats Badge Overlay */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card p-3 shadow-lg">
              <p className="text-xs font-bold text-primary uppercase">सीमित सीटें</p>
              <p className="font-heading text-lg font-bold text-foreground">कुल 20 सीटें (Seat 01-20)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 20 PHYSICAL SEATS & SHIFTS HIGHLIGHT */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            समय स्लॉट्स एवं मासिक शुल्क (Membership Plans)
          </span>
          <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            अपनी सुविधानुसार अध्ययन स्लॉट चुनें
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            प्रति माह बेहद किफायती शुल्क में उच्च गुणवत्ता की अध्ययन सुविधाएं प्राप्त करें।
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Plan 1: Morning Half */}
          <div className="rounded-xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                शिफ्ट A
              </span>
              <h3 className="mt-3 font-heading text-xl font-bold text-foreground">
                {MEMBERSHIP_PLANS.morning_half.nameEn}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {MEMBERSHIP_PLANS.morning_half.nameHi}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-extrabold text-primary">
                  {formatPrice(MEMBERSHIP_PLANS.morning_half.priceMonthly)}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">/ प्रति माह</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>समय: {MEMBERSHIP_PLANS.morning_half.timing}</span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {MEMBERSHIP_PLANS.morning_half.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Link
                to="/book"
                search={{ slot: "morning_half" }}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                मॉर्निंग सीट चुनें →
              </Link>
            </div>
          </div>

          {/* Plan 2: Second Half */}
          <div className="rounded-xl border-2 border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                शिफ्ट B
              </span>
              <h3 className="mt-3 font-heading text-xl font-bold text-foreground">
                {MEMBERSHIP_PLANS.second_half.nameEn}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {MEMBERSHIP_PLANS.second_half.nameHi}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-extrabold text-primary">
                  {formatPrice(MEMBERSHIP_PLANS.second_half.priceMonthly)}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">/ प्रति माह</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>समय: {MEMBERSHIP_PLANS.second_half.timing}</span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {MEMBERSHIP_PLANS.second_half.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Link
                to="/book"
                search={{ slot: "second_half" }}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                सेकंड हाफ सीट चुनें →
              </Link>
            </div>
          </div>

          {/* Plan 3: Full-Time (Featured) */}
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground">
              सर्वाधिक लोकप्रिय (Full Day)
            </span>

            <div>
              <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                शिफ्ट C — 10 घंटे
              </span>
              <h3 className="mt-3 font-heading text-xl font-bold text-foreground">
                {MEMBERSHIP_PLANS.full_time.nameEn}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {MEMBERSHIP_PLANS.full_time.nameHi}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-extrabold text-primary">
                  {formatPrice(MEMBERSHIP_PLANS.full_time.priceMonthly)}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">/ प्रति माह</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>समय: {MEMBERSHIP_PLANS.full_time.timing}</span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {MEMBERSHIP_PLANS.full_time.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80">
              <Link
                to="/book"
                search={{ slot: "full_time" }}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                फुल-टाइम सीट चुनें →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIRMED FACILITIES SECTION */}
      <section className="border-t border-border bg-card/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">
              पुस्तकालय सुविधाएं (Verified Facilities)
            </span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
              अध्ययन के लिए सर्वोत्तम डिजिटल वातावरण
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {LIBRARY.nameEn} में केवल वही सुविधाएं प्रदर्शित हैं जो वास्तविक रूप से उपलब्ध हैं।
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITY_CARD_ICONS.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-STEP ADMISSION PROCESS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            प्रक्रिया (Step-by-Step Flow)
          </span>
          <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            प्रवेश एवं सीट बुकिंग कैसे करें?
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <span className="font-heading text-2xl font-extrabold text-primary">01</span>
            <h3 className="mt-2 text-sm font-bold text-foreground">सीट एवं स्लॉट चुनें</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              सीट नक्शे पर 20 सीटों में से अपनी पसंदीदा सीट और समय स्लॉट (मॉर्निंग/सेकंड/फुल) चुनें।
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <span className="font-heading text-2xl font-extrabold text-primary">02</span>
            <h3 className="mt-2 text-sm font-bold text-foreground">एडमिशन फॉर्म भरें</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              नाम, मोबाइल, पता, फोटो एवं डिजिटल हस्ताक्षर दर्ज करें। आपको यूनिक छात्र आईडी मिलेगी।
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <span className="font-heading text-2xl font-extrabold text-primary">03</span>
            <h3 className="mt-2 text-sm font-bold text-foreground">UPI से फीस भुगतान</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              आधिकारिक UPI (7061038932-p36a@ibl) पर फीस भेजें और UTR नंबर पोर्टल में दर्ज करें।
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <span className="font-heading text-2xl font-extrabold text-primary">04</span>
            <h3 className="mt-2 text-sm font-bold text-foreground">सत्यापित पास प्राप्त करें</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              व्यवस्थापक द्वारा फीस सत्यापन के बाद रसीद प्राप्त करें और प्रतिदिन उपस्थिति दर्ज करें।
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/admission"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            अभी एडमिशन शुरू करें <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">
              अक्सर पूछे जाने वाले प्रश्न (FAQ)
            </span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-foreground">
              अक्सर पूछे जाने वाले सवाल
            </h2>
          </div>

          <div className="mt-8 space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  {faq.q}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATION & CONTACT SECTION */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-8 shadow-md">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                लाइब्रेरी का पता एवं संपर्क
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
                {LIBRARY.nameEn}
              </h2>
              <p className="mt-2 text-sm text-foreground/80">{LIBRARY.address}</p>

              <div className="mt-6 space-y-3 text-xs">
                <p>
                  <strong>फोन / हेल्पलाइन:</strong>{" "}
                  <a href={`tel:${LIBRARY.phone}`} className="font-bold text-primary">
                    {LIBRARY.phone}
                  </a>
                </p>
                <p>
                  <strong>व्हाट्सएप सहायता:</strong>{" "}
                  <a
                    href={LIBRARY.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 underline dark:text-emerald-400"
                  >
                    https://wa.me/919852688787
                  </a>
                </p>
                <p>
                  <strong>ईमेल:</strong>{" "}
                  <a href={`mailto:${LIBRARY.email}`} className="text-muted-foreground hover:underline">
                    {LIBRARY.email}
                  </a>
                </p>
                <p>
                  <strong>समय:</strong> प्रातः 7:00 AM से सायं 5:00 PM (सातों दिन खुला)
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-primary px-5 py-2.5 text-xs font-bold text-primary hover:bg-primary/5"
                >
                  संपूर्ण संपर्क विवरण
                </Link>
                <a
                  href={LIBRARY.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> व्हाट्सएप चैट
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-6 text-center space-y-3">
              <span className="font-heading text-xl font-bold text-primary">UPI शुल्क भुगतान</span>
              <div className="rounded-lg border border-input bg-card p-3 font-mono font-bold text-sm text-foreground select-all">
                {LIBRARY.upiId}
              </div>
              <p className="text-xs text-muted-foreground">
                {LIBRARY.upiInstruction}
              </p>
              <Link
                to="/payment"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                फीस पोर्टल पर जाएं
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
