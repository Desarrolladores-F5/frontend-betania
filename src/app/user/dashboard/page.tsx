// src/app/user/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, PlayCircle, Trophy } from "lucide-react";

import api, { clearAuth } from "@/lib/api";
import HeroVideo from "@/components/user/HeroVideo";

/* ======================================================
 * Tipos
 * ====================================================== */
type StatItem = {
  key: "cursos_activos" | "lecciones_pendientes" | "progreso_global";
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  value: number | null;
};

/* ======================================================
 * Utils
 * ====================================================== */
function firstName(value?: string | null): string {
  const v = String(value ?? "").trim();
  return v ? v.split(/\s+/)[0] : "";
}

/* ======================================================
 * Página
 * ====================================================== */
export default function UserDashboardPage() {
  const router = useRouter();

  /* ---------------- Estado ---------------- */
  const [stats, setStats] = useState<StatItem[]>([
    {
      key: "cursos_activos",
      label: "Cursos activos",
      icon: BookOpen,
      href: "/user/mis-cursos",
      value: null,
    },
    {
      key: "lecciones_pendientes",
      label: "Lecciones pendientes",
      icon: PlayCircle,
      href: "/user/mis-cursos",
      value: null,
    },
    {
      key: "progreso_global",
      label: "Progreso global (%)",
      icon: Trophy,
      href: "/user/mis-cursos",
      value: null,
    },
  ]);

  const [userName, setUserName] = useState<string>("Usuario");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* ======================================================
   * Init
   * ====================================================== */
  useEffect(() => {
    // Fallback rápido desde cache (opcional)
    try {
      const raw = localStorage.getItem("user_display");
      if (raw) {
        const snap = JSON.parse(raw) as {
          nombres?: string | null;
          email?: string | null;
        };
        const n0 = firstName(snap?.nombres);
        if (n0) setUserName(n0);
        else if (snap?.email) setUserName(snap.email.split("@")[0]);
      }
    } catch {}

    void fetchUserName();
    void fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ======================================================
   * Usuario
   * ====================================================== */
  async function fetchUserName() {
    setLoadingUser(true);
    try {
      // 1️⃣ Fuente principal
      const meRes = await api.get("/auth/me");
      const me = meRes.data?.user ?? null;

      const fromMe =
        firstName(me?.nombres ?? me?.nombre) ||
        (me?.email ? me.email.split("@")[0] : "");

      if (fromMe) {
        setUserName(fromMe);
        localStorage.setItem(
          "user_display",
          JSON.stringify({ nombres: me?.nombres, email: me?.email }),
        );
        return;
      }

      // 2️⃣ Fallback perfil usuario
      try {
        const perfilRes = await api.get("/user/perfil");
        const perfil = perfilRes.data?.data ?? perfilRes.data ?? {};
        const fromPerfil = firstName(perfil?.nombres ?? perfil?.nombre);
        if (fromPerfil) {
          setUserName(fromPerfil);
          return;
        }
      } catch {}

      setUserName("Usuario");
    } catch (err) {
      console.warn("fetchUserName:", err);
      setUserName("Usuario");
    } finally {
      setLoadingUser(false);
    }
  }

  /* ======================================================
   * Estadísticas
   * ====================================================== */
  async function fetchCounts() {
    setLoadingCounts(true);
    setError(null);

    try {
      const res = await api.get("/user/estadisticas");
      const data = res.data?.data ?? res.data ?? {};

      setStats((prev) =>
        prev.map((s) => ({
          ...s,
          value: typeof data[s.key] === "number" ? data[s.key] : 0,
        })),
      );
    } catch (err) {
      console.warn("fetchCounts:", err);
      setError(
        "Aún no hay estadísticas disponibles. Mostrando valores iniciales.",
      );
      setStats((prev) =>
        prev.map((s) => ({
          ...s,
          value: 0,
        })),
      );
    } finally {
      setLoadingCounts(false);
    }
  }

  /* ======================================================
   * Logout (Safari + Bearer seguro)
   * ====================================================== */
  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // No bloqueamos logout si backend falla
    } finally {
      clearAuth();
      localStorage.removeItem("user_display");
      router.replace("/login");
      router.refresh();
    }
  }

  /* ======================================================
   * Render
   * ====================================================== */
  return (
    <div className="space-y-6">
      {/* Banner bienvenida */}
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
            {loadingUser ? "Cargando..." : `${userName}, ¡bienvenido!`}
          </h3>
          <p className="welcome-sub">
            Revisa tu avance, continúa tus cursos y vuelve cuando quieras.
          </p>
        </div>

        <button
          type="button"
          className="btn-logout"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Tarjetas estadísticas */}
      <section
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Indicadores de progreso"
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
                <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
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

      {error && <div className="text-sm text-amber-600">{error}</div>}

      {/* CTA rápidos */}
      <div className="section-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">
              Continuar donde lo dejaste
            </div>
            <div className="text-sm text-muted-foreground">
              Accede rápidamente a tus cursos activos y retoma la última clase.
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/user/mis-cursos" className="action-primary">
              Mis cursos
            </Link>
            <Link
              href="/user/perfil"
              className="px-3 py-2 rounded-lg border border-border hover:bg-accent/50"
            >
              Mi perfil
            </Link>
          </div>
        </div>
      </div>

      {/* Video final */}
      <HeroVideo
        youtubeId="GdS_uF_wqq8"
        poster="/betania-poster.png"
      />
    </div>
  );
}
