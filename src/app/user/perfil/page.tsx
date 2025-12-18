//src/app/user/perfil/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type UsuarioPerfil = {
  id: number;
  email: string;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  rol?: string | null;
};

export default function PerfilUsuarioPage(): React.JSX.Element {
  const router = useRouter();
  const [user, setUser] = React.useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function cargarUsuario() {
      try {
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!cancelled) {
              setUser({
                id: parsed.id ?? parsed.user?.id ?? 0,
                email: parsed.email ?? parsed.user?.email ?? "",
                nombres: parsed.nombres ?? parsed.user?.nombres ?? "",
                apellido_paterno:
                  parsed.apellido_paterno ?? parsed.user?.apellido_paterno ?? "",
                apellido_materno:
                  parsed.apellido_materno ?? parsed.user?.apellido_materno ?? "",
                rol: parsed.rol ?? parsed.user?.rol ?? null,
              });
              setLoading(false);
              return;
            }
          }
        }

        const res = await api.get("/auth/me");
        const payload = res.data ?? {};
        const u = payload.user ?? payload;

        if (!cancelled) {
          setUser({
            id: u.id ?? 0,
            email: u.email ?? "",
            nombres: u.nombres ?? "",
            apellido_paterno: u.apellido_paterno ?? "",
            apellido_materno: u.apellido_materno ?? "",
            rol: u.rol ?? null,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
        if (!cancelled) setLoading(false);
      }
    }

    cargarUsuario();
    return () => {
      cancelled = true;
    };
  }, []);

  const nombreCompleto = React.useMemo(() => {
    if (!user) return "";
    const partes = [
      user.nombres ?? "",
      user.apellido_paterno ?? "",
      user.apellido_materno ?? "",
    ]
      .map((v) => v.trim())
      .filter(Boolean);

    return partes.join(" ");
  }, [user]);

  const rolLegible = React.useMemo(() => {
    if (!user?.rol) return "No especificado";
    switch (user.rol) {
      case "admin":
        return "Administrador";
      case "alumno":
      case "user":
        return "Alumno";
      default:
        return user.rol;
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Botón Volver con el color correcto */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-purple-300/60 transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
        >
          <span className="text-lg">←</span>
          Volver
        </button>

        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Mi perfil
          </h1>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Datos personales
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando datos...</p>
          ) : !user ? (
            <p className="text-sm text-red-500">
              No fue posible obtener la información del usuario.
            </p>
          ) : (
            <dl className="grid gap-y-6 gap-x-12 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Nombre completo
                </dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">
                  {nombreCompleto || "No especificado"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Correo electrónico
                </dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">
                  {user.email || "No especificado"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Rol
                </dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">
                  {rolLegible}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  ID de usuario
                </dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">
                  {user.id || "#"}
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
