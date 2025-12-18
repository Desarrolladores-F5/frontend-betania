// src/app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, BookOpen, Layers, PlayCircle, FileText } from "lucide-react";
import api, {
  UsuariosAPI,
  CursosAdminAPI,
  ModulosAdminAPI,
  PruebasAdminAPI,
  ReportesAdminAPI,
} from "@/lib/api";

type StatKey = "usuarios" | "cursos" | "modulos" | "pruebas" | "reportes";

type StatItem = {
  key: StatKey;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  value: number | null;
};

export default function AdminHome() {
  const [stats, setStats] = useState<StatItem[]>([
    {
      key: "usuarios",
      label: "Usuarios",
      icon: Users,
      href: "/admin/usuarios",
      value: null,
    },
    {
      key: "cursos",
      label: "Cursos",
      icon: BookOpen,
      href: "/admin/cursos",
      value: null,
    },
    {
      key: "modulos",
      label: "Módulos",
      icon: Layers,
      href: "/admin/modulos",
      value: null,
    },
    {
      key: "pruebas",
      label: "Pruebas",
      icon: PlayCircle,
      href: "/admin/pruebas",
      value: null,
    },
    {
      key: "reportes",
      label: "Reportes",
      icon: FileText,
      href: "/admin/reportes",
      value: null,
    },
  ]);

  const [userName, setUserName] = useState<string>("Usuario");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchUserName();
    void fetchCounts();
  }, []);

  async function fetchUserName() {
    setLoadingUser(true);
    try {
      const meRes = await api.get("/auth/me"); // { user: { id, ... } }
      const userId: number | null = meRes.data?.user?.id ?? null;

      let display = "Usuario";

      if (userId != null) {
        const listRes = await api.get("/admin/usuarios");
        const rows: any[] = Array.isArray(listRes.data)
          ? listRes.data
          : (listRes.data?.data ?? []);
        const found = rows.find((u: any) => u.id === userId);

        const nombres = String(found?.nombres ?? "").trim();
        const email = String(found?.email ?? "").trim();

        if (nombres.length > 0) {
          display = nombres.split(" ")[0];
        } else if (email.length > 0) {
          display = email.split("@")[0];
        }
      }

      setUserName(display);
    } catch (err) {
      console.error("fetchUserName error:", err);
      setUserName("Usuario");
    } finally {
      setLoadingUser(false);
    }
  }

  async function fetchCounts() {
    setLoadingCounts(true);
    setError(null);
    try {
      const [
        usuariosRes,
        cursosRes,
        modulosRes,
        pruebasRes,
        reportesRes,
      ] = await Promise.allSettled([
        UsuariosAPI.list(),
        CursosAdminAPI.list(),
        ModulosAdminAPI.listAll(),
        PruebasAdminAPI.list(),
        ReportesAdminAPI.list(),
      ]);

      const nextValues: Partial<Record<StatKey, number>> = {};

      if (usuariosRes.status === "fulfilled") {
        nextValues.usuarios = Array.isArray(usuariosRes.value)
          ? usuariosRes.value.length
          : 0;
      }

      if (cursosRes.status === "fulfilled") {
        nextValues.cursos = Array.isArray(cursosRes.value)
          ? cursosRes.value.length
          : 0;
      }

      if (modulosRes.status === "fulfilled") {
        nextValues.modulos = Array.isArray(modulosRes.value)
          ? modulosRes.value.length
          : 0;
      }

      if (pruebasRes.status === "fulfilled") {
        nextValues.pruebas = Array.isArray(pruebasRes.value)
          ? pruebasRes.value.length
          : 0;
      }

      if (reportesRes.status === "fulfilled") {
        nextValues.reportes = Array.isArray(reportesRes.value)
          ? reportesRes.value.length
          : 0;
      }

      setStats((prev) =>
        prev.map((s) => ({
          ...s,
          value: nextValues[s.key] ?? s.value,
        })),
      );
    } catch (err) {
      console.error("fetchCounts error:", err);
      setError(
        "No se pudieron cargar las estadísticas. Visualizando valores en caché.",
      );
    } finally {
      setLoadingCounts(false);
    }
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <div className="space-y-6">
      {/* Banner encabezado */}
      <div
        className="section-card banner-welcome"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
        }}
      >
        <div>
          <h3 className="welcome-title">
            {loadingUser ? "Cargando..." : `${userName}, ¡Bienvenido!`}
          </h3>
          <p className="welcome-sub">
            Gestiona usuarios, cursos, módulos, pruebas y reportes desde aquí.
          </p>
        </div>
        <div>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Tarjetas estadísticas */}
      <section
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-label="Tarjetas estadísticas"
      >
        {stats.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.key}
              href={t.href ?? "#"}
              className="tile-link"
              aria-label={t.label}
            >
              <article
                className="stat-card custom-card"
                aria-label={`${t.label} - ${t.value ?? "cargando"}`}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    alignItems: "center",
                  }}
                >
                  <div className="card-icon-wrap" aria-hidden>
                    <Icon width={36} height={36} className="card-icon stat-icon" />
                  </div>
                  <div>
                    <div className="stat-label">{t.label}</div>
                    <div className="stat-value">
                      {t.value === null
                        ? loadingCounts
                          ? "..."
                          : "—"
                        : t.value}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </section>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
