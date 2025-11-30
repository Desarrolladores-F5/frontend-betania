// src/app/user/mis-cursos/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CursoCard, type CursoUsuario } from "@/components/user/CursoCard";
import api from "@/lib/api";

export default function MisCursosPage(): React.JSX.Element {
  const [cursos, setCursos] = React.useState<CursoUsuario[]>([]);
  const [cargando, setCargando] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    async function fetchCursos() {
      setCargando(true);
      setError(null);

      try {
        // Cursos visibles para el alumno: GET /api/cursos (proxy /cursos)
        const res = await api.get("/cursos");
        const payload = res.data ?? [];

        console.log("[MisCursos] respuesta /cursos ->", payload);

        const rows: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as any).data)
          ? (payload as any).data
          : [];

        const mapped: CursoUsuario[] = rows.map((row) => ({
          id: Number(row.id),
          titulo: row.titulo ?? row.nombre ?? "Curso sin título",
          descripcion: row.descripcion ?? "",
          imagenUrl:
            row.portada_url ??
            row.imagen_portada_url ??
            row.imagenUrl ??
            null,
        }));

        if (!alive) return;
        setCursos(mapped);
      } catch (err) {
        console.error("[MisCursos] error obteniendo cursos:", err);
        if (!alive) return;
        setError(
          "No fue posible obtener la lista de cursos. Intente nuevamente."
        );
        setCursos([]);
      } finally {
        if (alive) {
          setCargando(false);
        }
      }
    }

    void fetchCursos();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Encabezado con botón Volver (misma línea visual que admin) */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis cursos</h1>
          </div>
        </div>
      </header>

      {cargando && (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-slate-600">Cargando cursos…</p>
        </div>
      )}

      {!cargando && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && cursos.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No hay cursos disponibles en este momento. Cuando se publiquen cursos,
          aparecerán listados en esta sección.
        </div>
      )}

      {!cargando && !error && cursos.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((curso) => (
            <CursoCard key={curso.id} curso={curso} />
          ))}
        </section>
      )}
    </div>
  );
}
