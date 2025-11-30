// src/app/user/cursos/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

type ModuloUsuario = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  orden?: number | null;
};

type CursoDetalleUsuario = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  portada_url?: string | null;
  modulos: ModuloUsuario[];
};

export default function CursoDetalleUsuarioPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const cursoId = Number(id);

  const [curso, setCurso] = React.useState<CursoDetalleUsuario | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(cursoId)) {
      setError("Identificador de curso inválido.");
      setCargando(false);
      return;
    }

    let alive = true;

    async function fetchCurso() {
      setCargando(true);
      setError(null);

      try {
        // Backend: GET /api/cursos/:id (proxy /cursos/:id)
        const res = await api.get(`/cursos/${cursoId}`);
        const payload = res.data ?? {};

        const modulosRaw: any[] = Array.isArray((payload as any).modulos)
          ? (payload as any).modulos
          : [];

        // Normalizar y ordenar módulos por 'orden' y luego por id
        const modulos: ModuloUsuario[] = modulosRaw
          .map((m) => ({
            id: Number(m.id),
            titulo: m.titulo ?? "Módulo sin título",
            descripcion: m.descripcion ?? null,
            orden:
              typeof m.orden === "number"
                ? m.orden
                : m.orden != null
                ? Number(m.orden)
                : null,
          }))
          .sort((a, b) => {
            const ao = a.orden ?? 9999;
            const bo = b.orden ?? 9999;
            if (ao !== bo) return ao - bo;
            return a.id - b.id;
          });

        const detalle: CursoDetalleUsuario = {
          id: Number(payload.id),
          titulo: (payload as any).titulo ?? "Curso sin título",
          descripcion: (payload as any).descripcion ?? null,
          portada_url: (payload as any).portada_url ?? null,
          modulos,
        };

        if (!alive) return;
        setCurso(detalle);
      } catch (e) {
        console.error("[UserCursoDetalle] Error obteniendo curso:", e);
        if (!alive) return;
        setError(
          "No fue posible cargar la información del curso. Intente nuevamente."
        );
        setCurso(null);
      } finally {
        if (alive) setCargando(false);
      }
    }

    void fetchCurso();

    return () => {
      alive = false;
    };
  }, [cursoId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Encabezado con botón Volver */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/user/mis-cursos")}
            className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {curso ? curso.titulo : "Curso"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Revise el contenido del curso y avance módulo por módulo.
            </p>
          </div>
        </div>
      </header>

      {/* Estado de carga / error */}
      {cargando && (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-slate-600">Cargando información…</p>
        </div>
      )}

      {!cargando && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && curso && (
        <div className="space-y-6">
          {/* Tarjeta principal del curso */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {curso.portada_url && (
              <div className="relative h-56 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={curso.portada_url}
                  alt={curso.titulo}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">
                {curso.titulo}
              </h2>
              {curso.descripcion && (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {curso.descripcion}
                </p>
              )}
            </div>
          </section>

          {/* Lista de módulos (cada uno con botón Ver módulo) */}
          <section className="space-y-4">
            {curso.modulos.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Aún no hay módulos publicados para este curso.
              </div>
            )}

            {curso.modulos.map((modulo, indexModulo) => (
              <article
                key={modulo.id}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Módulo {indexModulo + 1}: {modulo.titulo}
                  </h3>
                  {modulo.descripcion && (
                    <p className="mt-1 text-xs text-slate-600">
                      {modulo.descripcion}
                    </p>
                  )}
                  {modulo.orden != null && (
                    <span className="mt-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                      Orden {modulo.orden}
                    </span>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Link
                    href={`/user/cursos/${cursoId}/modulos/${modulo.id}`}
                    className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  >
                    Ver módulo
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
