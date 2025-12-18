// src/app/user/layout.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import api, { clearAuth } from "@/lib/api";

const NAV = [
  { href: "/user/dashboard", label: "Inicio" },
  { href: "/user/mis-cursos", label: "Mis cursos" },
  { href: "/user/perfil", label: "Mi perfil" },
  { href: "/user/ayuda", label: "Ayuda" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      try { clearAuth(); } catch {}
      router.replace("/login");
    }
  }

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="brand-sm flex items-center gap-3 px-3 py-4">

          {/* LOGO desde /public */}
          <Image
            src="/logo-betania.png"
            width={42}
            height={42}
            alt="Logo Fundación Betania Acoge"
            className="rounded-lg shadow-sm"
          />

          <div>
            <div className="text-xs text-white/80">Fundación Betania Acoge</div>
            <div className="brand-title-sm">Panel Beneficiario</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación usuario">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="dashboard-wrapper">{children}</main>
    </div>
  );
}
