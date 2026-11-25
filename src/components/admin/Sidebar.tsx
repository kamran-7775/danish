"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/projects", label: "Projects", icon: "🎬" },
  { href: "/admin/categories", label: "Categories", icon: "☰" },
  { href: "/admin/bts", label: "Behind the scenes", icon: "📷" },
  { href: "/admin/showreel", label: "Showreel", icon: "▶" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <nav className="side__nav" aria-label="Admin">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`side__link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <span aria-hidden="true">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
