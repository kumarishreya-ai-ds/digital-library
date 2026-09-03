import { Link } from "@tanstack/react-router";
import { Menu, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LIBRARY } from "@/lib/library";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/entry", label: "Entry" },
  { to: "/payment", label: "Payment" },
  { to: "/pass", label: "Entry Pass" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gold bg-accent font-heading text-xl text-primary"
            >
              श्री
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-lg text-primary sm:text-xl">
                {LIBRARY.nameHi}
              </span>
              <span className="block text-xs tracking-wide text-muted-foreground uppercase">
                {LIBRARY.nameEn}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${LIBRARY.phone}`}
              className="ml-2 inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-accent"
            >
              <Phone className="h-4 w-4" aria-hidden /> {LIBRARY.phone}
            </a>
          </nav>

          <button
            type="button"
            aria-label="मेन्यू खोलें"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-foreground md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {open && (
          <nav className="border-t border-border bg-card px-4 pb-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block border-b border-border py-3 text-sm font-medium text-foreground last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${LIBRARY.phone}`}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Phone className="h-4 w-4" aria-hidden /> {LIBRARY.phone}
            </a>
          </nav>
        )}
        <div className="gold-rule" aria-hidden />
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-border bg-secondary">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
          <div>
            <h2 className="font-heading text-lg text-primary">{LIBRARY.nameHi}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{LIBRARY.building}</p>
            <p className="mt-1 text-sm text-muted-foreground">{LIBRARY.tagline}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">पेज</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-muted-foreground hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">संपर्क</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              फोन:{" "}
              <a className="font-semibold text-primary" href={`tel:${LIBRARY.phone}`}>
                {LIBRARY.phone}
              </a>
            </p>
            <Link
              to="/admin"
              className="mt-3 inline-block text-xs text-muted-foreground underline hover:text-primary"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
