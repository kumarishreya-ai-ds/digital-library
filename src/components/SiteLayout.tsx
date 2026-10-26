import { Link } from "@tanstack/react-router";
import { Menu, Phone, MessageSquare, Shield, User, Calendar, BookOpen, CreditCard, Clock, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LIBRARY } from "@/lib/library";

const NAV = [
  { to: "/", label: "होम (Home)", icon: BookOpen },
  { to: "/book", label: "सीट बुकिंग (Seats)", icon: Calendar },
  { to: "/admission", label: "एडमिशन (Admission)", icon: User },
  { to: "/payment", label: "फीस भुगतान (Payment)", icon: CreditCard },
  { to: "/attendance", label: "उपस्थिति (Attendance)", icon: Clock },
  { to: "/student", label: "स्टूडेंट पोर्टल (Portal)", icon: User },
  { to: "/admin", label: "व्यवस्थापक (Admin)", icon: Shield },
  { to: "/contact", label: "संपर्क (Contact)", icon: Phone },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Banner */}
      <div className="border-b border-border/80 bg-primary/5 px-4 py-1.5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">
              {LIBRARY.nameEn} — {LIBRARY.building}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={LIBRARY.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp: {LIBRARY.phone}
            </a>
            <span className="hidden sm:inline text-border">|</span>
            <a href={`tel:${LIBRARY.phone}`} className="hidden sm:inline font-medium hover:text-primary">
              कॉल: {LIBRARY.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 font-heading text-xl font-bold text-primary shadow-xs"
            >
              श्री
            </span>
            <div className="leading-tight">
              <span className="block font-heading text-lg font-bold text-primary sm:text-xl">
                {LIBRARY.nameEn}
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-muted-foreground">
                {LIBRARY.nameHi} — {LIBRARY.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden items-center gap-2 md:flex xl:hidden">
            <Link
              to="/book"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              सीट चुनें
            </Link>
            <Link
              to="/student"
              className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              स्टूडेंट पोर्टल
            </Link>
            <Link
              to="/admin"
              className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              Admin
            </Link>
          </div>

          {/* Direct WhatsApp & Mobile toggle */}
          <div className="flex items-center gap-2">
            <a
              href={LIBRARY.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              aria-label={open ? "मेन्यू बंद करें" : "मेन्यू खोलें"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-foreground xl:hidden hover:bg-secondary"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <nav className="border-t border-border bg-card px-4 py-3 shadow-lg xl:hidden animate-in slide-in-from-top-2">
            <div className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
              <a
                href={LIBRARY.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white"
              >
                <MessageSquare className="h-4 w-4" /> WhatsApp पर संपर्क करें (9852688787)
              </a>
              <a
                href={`tel:${LIBRARY.phone}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <Phone className="h-4 w-4" /> कॉल करें: {LIBRARY.phone}
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500 bg-amber-50 font-heading font-bold text-primary">
                श्री
              </span>
              <h2 className="font-heading text-xl font-bold text-primary">{LIBRARY.nameEn}</h2>
            </div>
            <p className="mt-2 text-sm text-foreground/80">{LIBRARY.subtext}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>स्थान:</strong> {LIBRARY.address}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <strong>समय:</strong> प्रातः 7:00 AM से सायं 5:00 PM (सोमवार से रविवार)
            </p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-semibold">UPI ID: {LIBRARY.upiId}</p>
              <p className="mt-1">{LIBRARY.upiInstruction}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">त्वरित लिंक (Links)</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.slice(0, 5).map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-muted-foreground transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">पोर्टल एवं सहायता</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/student" className="text-muted-foreground hover:text-primary">
                  छात्र पोर्टल (Student Dashboard)
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-muted-foreground hover:text-primary">
                  व्यवस्थापक लॉगिन (Admin Portal)
                </Link>
              </li>
              <li>
                <a href={LIBRARY.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline dark:text-emerald-400">
                  WhatsApp Support (9852688787)
                </a>
              </li>
              <li>
                <a href={`mailto:${LIBRARY.email}`} className="text-muted-foreground hover:text-primary">
                  {LIBRARY.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {LIBRARY.nameEn}. सर्वाधिकार सुरक्षित (All Rights Reserved).
        </div>
      </footer>
    </div>
  );
}
