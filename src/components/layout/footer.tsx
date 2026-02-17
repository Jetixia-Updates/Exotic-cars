import Link from "next/link";
import { Car, Mail, MapPin, Phone } from "lucide-react";

const links = {
  marketplace: [
    { href: "/cars", label: "Explore Cars" },
    { href: "/auctions", label: "Live Auctions" },
    { href: "/parts", label: "Spare Parts" },
  ],
  community: [
    { href: "/community", label: "Community" },
    { href: "/events", label: "Events" },
    { href: "/workshops", label: "Workshops" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
};

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-white/10 bg-exotic-carbon mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-2xl font-bold text-exotic-gold">
              EXOTIC CARS
            </Link>
            <p className="mt-4 text-sm text-white/60 max-w-sm">
              The world&apos;s premier marketplace for exotic modified cars, live auctions,
              spare parts, and elite automotive community.
            </p>
            <div className="mt-4 flex gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" /> contact@exoticcars.com
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> +1 234 567 890
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-exotic-gold mb-4">Marketplace</h4>
            <ul className="space-y-2">
              {links.marketplace.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-exotic-gold transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-exotic-gold mb-4">Community</h4>
            <ul className="space-y-2">
              {links.community.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-exotic-gold transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-exotic-gold mb-4">Company</h4>
            <ul className="space-y-2">
              {links.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-exotic-gold transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Exotic Cars. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-exotic-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-exotic-gold">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
