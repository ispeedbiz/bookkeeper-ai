import Link from "next/link";
import { Phone, Mail, MapPin, Linkedin, Twitter, Youtube } from "lucide-react";
import { COMPANY } from "@/lib/constants";

const FOOTER_LINKS = {
  Services: [
    { label: "Bookkeeping", href: "/#services" },
    { label: "Reconciliations", href: "/#services" },
    { label: "Payroll Services", href: "/payroll" },
    { label: "AI Analytics", href: "/#services" },
    { label: "Tax Support", href: "/#services" },
    { label: "Compliance & Risk", href: "/#services" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/about#team" },
    { label: "Contact", href: "/contact" },
    { label: "Get Started", href: "/get-started" },
  ],
  Resources: [
    { label: "For CPA Firms", href: "/#for-cpas" },
    { label: "Pricing", href: "/pricing" },
    { label: "Payroll Plans", href: "/payroll#pricing" },
    { label: "Login", href: "/login" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const SOCIALS = [
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] bg-[#050a18]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Top section */}
        <div className="grid gap-12 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600">
                <span className="text-xs font-bold text-[#050a18]">BA</span>
              </div>
              <span className="text-lg font-bold text-white">
                Bookkeeper<span className="text-teal-400">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-500 leading-relaxed">
              {COMPANY.description}
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-3">
              <a
                href={`tel:${COMPANY.phone}`}
                className="flex items-center gap-2.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
              >
                <Phone className="h-4 w-4 text-teal-400/60" />
                {COMPANY.phone}
              </a>
              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-2.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
              >
                <Mail className="h-4 w-4 text-teal-400/60" />
                {COMPANY.email}
              </a>
              <p className="flex items-center gap-2.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0 text-teal-400/60" />
                {COMPANY.address}
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved. Est.{" "}
            {COMPANY.founded}.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-500 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-white"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
