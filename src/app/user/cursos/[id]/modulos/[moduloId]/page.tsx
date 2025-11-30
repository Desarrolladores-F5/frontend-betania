// src/app/user/cursos/[id]/modulos/[moduloId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";

type LeccionUsuario = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  orden?: number | null;
  estado?: "bloqueada" | "disponible" | "completada";
  aprobado?: boolean;
};

type ModuloUsuario = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  orden?: number | null;
  // ✅ Nuevo: recursos a nivel de módulo
  video_intro_url?: string | null;
  pdf_intro_url?: string | null;
  lecciones: LeccionUsuario[];
};

type CursoModuloDetalle = {
  cursoId: number;
  cursoTitulo: string;
  modulo: ModuloUsuario | null;
};

// Tipo de respuesta real del backend para GET /cursos/:cursoId/modulos/:moduloId
type ModuloAlumnoRespuesta = {
  id: number;
  curso_id: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
  estado: "disponible" | "completado";

  // ✅ Debe venir desde tu endpoint obtenerModuloAlumno
  video_intro_url?: string | null;
  pdf_intro_url?: string | null;

  lecciones: Array<{
    id: number;
    titulo: string;
    descripcion: string | null;
    orden: number | null;
    youtube_id: string | null;
    pdf_url: string | null;
    publicado: boolean;
    estado: "bloqueada" | "disponible" | "completada";
    aprobado: boolean;
    nota_ultima_prueba: number | null;
  }>;
};

/**
 * Normaliza un ID o URL de YouTube en URL de embed.
 */
function getYoutubeEmbedUrl(youtube_id?: string | null): string | null {
  if (!youtube_id) return null;

  if (youtube_id.startsWith("http://") || youtube_id.startsWith("https://")) {
    try {
      const url = new URL(youtube_id);
      if (
        url.hostname.includes("youtube.com") ||
        url.hostname.includes("youtu.be")
      ) {
        const v = url.searchParams.get("v");
        const idFromUrl = v || url.pathname.split("/").filter(Boolean).pop();
        if (idFromUrl) {
          return `https://www.youtube.com/embed/${idFromUrl}`;
        }
      }
    } catch {
      // Si falla, tratamos youtube_id como un ID
    }
  }

  return `https://www.youtube.com/embed/${youtube_id}`;
}

export default function ModuloDetalleUsuarioPage(): React.JSX.Element {
  const { id, moduloId } = useParams<{ id: string; moduloId: string }>();
  const router = useRouter();

  const cursoId = Number(id);
  const moduloIdNum = Number(moduloId);

  const [data, setData] = React.useState<CursoModuloDetalle | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(cursoId) || !Number.isFinite(moduloIdNum)) {
      setError("Identificadores inválidos.");
      setCargando(false);
      return;
    }

    let alive = true;

    async function fetchModulo() {
      setCargando(true);
      setError(null);

      try {
        // ✅ Endpoint con progreso y filtro de lecciones
        const res = await api.get<ModuloAlumnoRespuesta>(
          `/cursos/${cursoId}/modulos/${moduloIdNum}`
        );
        const payload = res.data;

        const lecciones: LeccionUsuario[] = Array.isArray(payload.lecciones)
          ? payload.lecciones
              .map((l) => ({
                id: Number(l.id),
                titulo: l.titulo ?? "Clase sin título",
                descripcion: l.descripcion ?? null,
                orden:
                  typeof l.orden === "number"
                    ? l.orden
                    : l.orden != null
                    ? Number(l.orden)
                    : null,
                estado:
                  (l.estado as
                    | "bloqueada"
                    | "disponible"
                    | "completada"
                    | undefined) ?? "bloqueada",
                aprobado: typeof l.aprobado === "boolean" ? l.aprobado : false,
              }))
              .sort((a, b) => {
                const ao = a.orden ?? 9999;
                const bo = b.orden ?? 9999;
                if (ao !== bo) return ao - bo;
                return a.id - b.id;
              })
          : [];

        const modulo: ModuloUsuario = {
          id: Number(payload.id),
          titulo: payload.titulo ?? "Módulo sin título",
          descripcion: payload.descripcion ?? null,
          orden:
            typeof payload.orden === "number"
              ? payload.orden
              : payload.orden != null
              ? Number(payload.orden)
              : null,
          // ✅ Mapear recursos del módulo
          video_intro_url: payload.video_intro_url ?? null,
          pdf_intro_url: payload.pdf_intro_url ?? null,
          lecciones,
        };

        const detalle: CursoModuloDetalle = {
          cursoId,
          // Más adelante podemos traer el título real del curso
          cursoTitulo: "Curso",
          modulo,
        };

        if (!alive) return;
        setData(detalle);
      } catch (e) {
        console.error("[UserModuloDetalle] Error obteniendo módulo:", e);
        if (!alive) return;
        setError(
          "No fue posible cargar la información del módulo. Intente nuevamente."
        );
        setData(null);
      } finally {
        if (alive) setCargando(false);
      }
    }

    void fetchModulo();

    return () => {
      alive = false;
    };
  }, [cursoId, moduloIdNum]);

  const modulo = data?.modulo ?? null;

  // ✅ URL de embed del video introductorio del módulo
  const moduloVideoEmbedUrl = getYoutubeEmbedUrl(modulo?.video_intro_url || null);
  const moduloPdfUrl = modulo?.pdf_intro_url || null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Encabezado con botón Volver */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/user/cursos/${cursoId}`)}
            className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </button>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-purple-600">
              {data?.cursoTitulo ?? "Curso"}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {modulo ? modulo.titulo : "Módulo"}
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

      {!cargando && !error && modulo && (
        <div className="space-y-4">
          {/* Descripción del módulo */}
          {modulo.descripcion && (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Descripción del módulo
              </h2>
              <p className="mt-1 text-sm text-slate-700">
                {modulo.descripcion}
              </p>
            </section>
          )}

          {/* ✅ Material introductorio del módulo: video + PDF */}
          {(moduloVideoEmbedUrl || moduloPdfUrl) && (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Material introductorio del módulo
              </h2>

              {/* Video */}
              {moduloVideoEmbedUrl && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
                  <div className="relative w-full pt-[56.25%]">
                    <iframe
                      src={moduloVideoEmbedUrl}
                      title={`Video módulo ${modulo.titulo}`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* PDF */}
              {moduloPdfUrl && (
                <div className="mt-4 flex justify-start">
                  <a
                    href={moduloPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Ver PDF del módulo
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Listado de lecciones con bloqueo/desbloqueo visual */}
          <section className="space-y-2">
            {modulo.lecciones.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Aún no hay clases disponibles para este módulo.
              </div>
            )}

            {modulo.lecciones.map((leccion, indexLeccion) => {
              const isBlocked = leccion.estado === "bloqueada";
              const isCompleted = leccion.estado === "completada";

              const badgeText = isBlocked
                ? "Bloqueada"
                : isCompleted
                ? "Completada"
                : "Disponible";

              const badgeClass = isBlocked
                ? "bg-slate-100 text-slate-500"
                : isCompleted
                ? "bg-emerald-50 text-emerald-700"
                : "bg-purple-50 text-purple-700";

              const buttonLabel = isBlocked
                ? "Bloqueada"
                : isCompleted
                ? "Revisar lección"
                : "Comenzar lección";

              const buttonClass = isBlocked
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : isCompleted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white";

              return (
                <article
                  key={leccion.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="pr-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {indexLeccion + 1}. {leccion.titulo}
                    </h3>
                    {leccion.descripcion && (
                      <p className="mt-1 text-xs text-slate-600">
                        {leccion.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                        badgeClass
                      }
                    >
                      {badgeText}
                    </span>

                    <button
                      type="button"
                      disabled={isBlocked}
                      className={
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
                        (isBlocked
                          ? buttonClass
                          : buttonClass +
                            " focus-visible:ring-purple-500")
                      }
                      onClick={() => {
                        if (isBlocked) return;
                        router.push(
                          `/user/cursos/${cursoId}/modulos/${moduloIdNum}/clases/${leccion.id}`
                        );
                      }}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
