// src/app/admin/layout.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api, { clearAuth } from "@/lib/api";
import React from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Inicio" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/modulos", label: "Módulos" },
  { href: "/admin/clases", label: "Clases" },
  { href: "/admin/reportes", label: "Reportes" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      try { clearAuth(); } catch {}
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">

        {/* BRAND + LOGO */}
        <div className="brand-sm flex items-center gap-3 px-3 py-4">
          <Image
            src="/logo-betania.png"
            alt="Logo Fundación Betania Acoge"
            width={42}
            height={42}
            className="rounded-lg shadow-sm"
          />
          <div>
            <div className="text-xs text-white/80">Fundación Betania Acoge</div>
            <div className="brand-title-sm">Panel Administrador</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={`sidebar-link ${active ? "active" : ""}`}>
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="dashboard-wrapper">
        {children}
      </main>
    </div>
  );
}
