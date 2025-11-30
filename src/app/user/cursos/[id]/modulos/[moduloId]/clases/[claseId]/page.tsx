// src/app/user/cursos/[id]/modulos/[moduloId]/clases/[claseId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";

type ProgresoLeccionUI = {
  estado: "bloqueada" | "disponible" | "completada";
  aprobado: boolean;
  nota_ultima_prueba: number | null;
};

type LeccionDetalle = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  contenido_html?: string | null;

  // Video principal / complementario
  youtube_id?: string | null;
  youtube_id_extra?: string | null;
  youtube_titulo_extra?: string | null;

  // PDF complementario existente
  pdf_url?: string | null;
  pdf_titulo?: string | null;

  // PDF con contenido principal
  contenido_pdf_url?: string | null;
  contenido_pdf_titulo?: string | null;

  // Examen asociado
  examen_id?: number | null;
  orden?: number | null;

  // Progreso para el alumno
  progreso?: ProgresoLeccionUI | null;
};

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
      // si falla, lo tratamos como ID
    }
  }

  return `https://www.youtube.com/embed/${youtube_id}`;
}

function getYoutubeWatchUrl(youtube_id?: string | null): string | null {
  if (!youtube_id) return null;

  if (youtube_id.startsWith("http://") || youtube_id.startsWith("https://")) {
    return youtube_id;
  }

  return `https://www.youtube.com/watch?v=${youtube_id}`;
}

export default function VerClaseUsuarioPage(): React.JSX.Element {
  const router = useRouter();
  const { id, moduloId, claseId } = useParams<{
    id: string;
    moduloId: string;
    claseId: string;
  }>();

  const cursoId = Number(id);
  const moduloIdNum = Number(moduloId);
  const leccionId = Number(claseId);

  const [leccion, setLeccion] = React.useState<LeccionDetalle | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Control de “Ver más / Ver menos” para el texto
  const [expanded, setExpanded] = React.useState(false);

  const textoLargo = React.useMemo(() => {
    if (!leccion) return 0;
    return (
      (leccion.descripcion ?? "").length +
      (leccion.contenido_html ?? "").length
    );
  }, [leccion]);

  const isLong = textoLargo > 600;

  React.useEffect(() => {
    if (!Number.isFinite(leccionId)) {
      setError("Identificador de la clase inválido.");
      setCargando(false);
      return;
    }

    let alive = true;

    async function fetchLeccion() {
      try {
        setCargando(true);
        setError(null);

        const res = await api.get(`/cursos/leccion/${leccionId}`);
        const data = (res.data ?? {}) as any;

        const progresoRaw = data.progreso ?? null;
        const progreso: ProgresoLeccionUI | null = progresoRaw
          ? {
              estado: progresoRaw.estado as
                | "bloqueada"
                | "disponible"
                | "completada",
              aprobado: !!progresoRaw.aprobado,
              nota_ultima_prueba:
                progresoRaw.nota_ultima_prueba != null
                  ? Number(progresoRaw.nota_ultima_prueba)
                  : null,
            }
          : null;

        const detalle: LeccionDetalle = {
          id: Number(data.id),
          titulo: data.titulo ?? "Clase",
          descripcion: data.descripcion ?? null,
          contenido_html: data.contenido_html ?? null,

          youtube_id: data.youtube_id ?? null,
          youtube_id_extra: data.youtube_id_extra ?? null,
          youtube_titulo_extra: data.youtube_titulo_extra ?? null,

          // PDF complementario
          pdf_url: data.pdf_url ?? null,
          pdf_titulo: data.pdf_titulo ?? null,

          // PDF de contenido principal
          contenido_pdf_url: data.contenido_pdf_url ?? null,
          contenido_pdf_titulo: data.contenido_pdf_titulo ?? null,

          examen_id: data.examen_id != null ? Number(data.examen_id) : null,
          orden:
            typeof data.orden === "number"
              ? data.orden
              : data.orden != null
              ? Number(data.orden)
              : null,

          progreso,
        };

        if (!alive) return;
        setLeccion(detalle);
      } catch (err: any) {
        console.error("[VerClaseUsuario] Error obteniendo clase:", err);
        if (!alive) return;
        setError(
          err?.response?.data?.error ??
            "No fue posible cargar la información de la clase."
        );
      } finally {
        if (alive) setCargando(false);
      }
    }

    void fetchLeccion();

    return () => {
      alive = false;
    };
  }, [leccionId]);

  const embedUrl = getYoutubeEmbedUrl(leccion?.youtube_id);
  const extraVideoUrl = getYoutubeWatchUrl(leccion?.youtube_id_extra);

  // Ruta de evaluación
  const examRoute =
    leccion && leccion.examen_id != null
      ? `/user/cursos/${cursoId}/modulos/${moduloIdNum}/clases/${leccionId}/prueba`
      : null;

  // Datos del PDF principal
  const contenidoPdfUrl = leccion?.contenido_pdf_url || null;
  const contenidoPdfTitulo =
    leccion?.contenido_pdf_titulo ||
    leccion?.titulo ||
    "Contenido de la clase";

  // Progreso y estado de evaluación
  const progreso = leccion?.progreso ?? null;
  const evaluacionAprobada =
    !!progreso && (progreso.aprobado || progreso.estado === "completada");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Header con volver */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(`/user/cursos/${cursoId}/modulos/${moduloIdNum}`)
            }
            className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-purple-600">
              Clase del módulo
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {leccion?.titulo ?? "Lección"}
            </h1>
          </div>
        </div>
      </header>

      {/* Loading / error */}
      {cargando && (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-slate-600">Cargando clase…</p>
        </div>
      )}

      {!cargando && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && leccion && (
        <div className="space-y-6">
          {/* Video principal */}
          {embedUrl && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  src={embedUrl}
                  title={leccion.titulo}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Contenido de la clase + PDF principal */}
          {(leccion.descripcion || leccion.contenido_html || contenidoPdfUrl) && (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Texto / HTML con Ver más / Ver menos */}
                {(leccion.descripcion || leccion.contenido_html) && (
                  <div className="md:flex-1">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Contenido de la clase
                    </h2>

                    <div
                      className={[
                        "relative mt-2 text-sm leading-relaxed text-slate-700",
                        !expanded && isLong
                          ? "max-h-64 overflow-hidden pr-2"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {leccion.descripcion && (
                        <p className="mb-3">{leccion.descripcion}</p>
                      )}

                      {leccion.contenido_html && (
                        <div
                          className="prose prose-sm max-w-none text-slate-800"
                          dangerouslySetInnerHTML={{
                            __html: leccion.contenido_html,
                          }}
                        />
                      )}

                      {!expanded && isLong && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                      )}
                    </div>

                    {isLong && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => !prev)}
                          className="text-xs font-semibold text-purple-600 underline-offset-2 hover:underline"
                        >
                          {expanded ? "Ver menos" : "Ver más"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bloque lateral de material principal */}
                {contenidoPdfUrl && (
                  <div className="mt-4 border-t border-slate-200 pt-4 md:mt-0 md:w-56 md:border-t-0 md:border-l md:pl-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Material principal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {contenidoPdfTitulo}
                    </p>
                    <a
                      href={contenidoPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      Ver contenido
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recursos complementarios: video extra + PDF complementario */}
          {(extraVideoUrl || leccion.pdf_url) && (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Recursos complementarios
              </h2>

              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {extraVideoUrl && (
                  <li>
                    <span className="font-semibold">Video:</span>{" "}
                    {leccion.youtube_titulo_extra || "Video complementario"}
                  </li>
                )}
                {leccion.pdf_url && (
                  <li>
                    <span className="font-semibold">PDF:</span>{" "}
                    {leccion.pdf_titulo ||
                      (leccion.pdf_url as string).split("/").pop()}
                  </li>
                )}
              </ul>

              <div className="mt-3 flex flex-wrap gap-3">
                {extraVideoUrl && (
                  <a
                    href={extraVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                  >
                    Ver video
                  </a>
                )}

                {leccion.pdf_url && (
                  <a
                    href={leccion.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  >
                    Abrir PDF
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Evaluación de la clase */}
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-slate-900">
                  Evaluación de la clase
                </h2>

                {examRoute ? (
                  <>
                    {evaluacionAprobada ? (
                      <>
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="mr-1" role="img" aria-hidden="true">
                            🌟
                          </span>
                          Has aprobado esta evaluación. La siguiente clase del
                          módulo ya se encuentra desbloqueada. Puedes revisar
                          nuevamente la evaluación o continuar con tu progreso
                          en el curso.
                        </p>
                        {progreso?.nota_ultima_prueba != null && (
                          <p className="mt-1 text-xs text-slate-500">
                            Último resultado registrado:{" "}
                            <span className="font-semibold">
                              {progreso.nota_ultima_prueba}%
                            </span>
                            .
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-slate-600">
                        Cuando apruebes esta evaluación con el puntaje
                        requerido, se desbloqueará la siguiente clase del
                        módulo.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Esta clase aún no tiene una evaluación asociada.
                  </p>
                )}
              </div>

              {examRoute && (
                <div className="mt-3 flex flex-col items-end">
                  {evaluacionAprobada && (
                    <span className="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      ✅ Evaluación aprobada
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push(examRoute)}
                    className={
                      "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
                      (evaluacionAprobada
                        ? "bg-white text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50 focus-visible:ring-emerald-500"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500")
                    }
                  >
                    {evaluacionAprobada
                      ? "Revisar evaluación"
                      : "Realizar evaluación"}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
