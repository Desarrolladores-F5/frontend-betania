// src/app/admin/modulos/[id]/clases/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { LeccionesAdminAPI, ModulosAdminAPI } from "@/lib/api";

type ClaseListItem = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  orden?: number | null;
  publicado?: boolean | null;

  // Videos
  youtube_id?: string | null;
  youtube_titulo?: string | null;
  youtube_id_extra?: string | null;
  youtube_titulo_extra?: string | null;

  // PDF
  pdf_url?: string | null;
  pdf_titulo?: string | null;
};

/**
 * Extrae el ID de YouTube desde:
 * - Solo ID: "dQw4w9WgXcQ"
 * - URL completa: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 * - URL corta: "https://youtu.be/dQw4w9WgXcQ"
 */
function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;

  // Si no parece URL (no empieza con http), asumimos que es un ID
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value;
  }

  try {
    const url = new URL(value);

    // Caso estándar: https://www.youtube.com/watch?v=XXXX
    const vParam = url.searchParams.get("v");
    if (vParam) return vParam;

    // Caso share link: https://youtu.be/XXXX
    if (url.hostname.includes("youtu.be")) {
      const path = url.pathname.replace("/", "").trim();
      return path || null;
    }

    return null;
  } catch {
    return null;
  }
}

export default function ClasesPorModuloPage(): React.JSX.Element {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const moduloId = React.useMemo(() => Number(id), [id]);

  const [moduloTitulo, setModuloTitulo] = React.useState<string>("");
  const [clases, setClases] = React.useState<ClaseListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    if (!Number.isFinite(moduloId)) {
      setError("Identificador de módulo inválido.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 1) Datos del módulo
        const modulo = await ModulosAdminAPI.get(moduloId);
        if (!alive) return;
        setModuloTitulo(modulo?.titulo ?? `Módulo #${moduloId}`);

        // 2) Clases del módulo
        const lista = await LeccionesAdminAPI.listByModulo(moduloId);
        if (!alive) return;

        setClases((lista ?? []) as ClaseListItem[]);
      } catch (e: any) {
        if (!alive) return;
        setError("No fue posible obtener las clases del módulo.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchData();
    return () => {
      alive = false;
    };
  }, [moduloId]);

  async function handleDelete(clase: ClaseListItem) {
    if (
      !confirm(
        `¿Eliminar la clase “${clase.titulo}”? Esta acción es irreversible.`
      )
    ) {
      return;
    }

    try {
      await LeccionesAdminAPI.remove(clase.id);
      setClases((prev) => prev.filter((c) => c.id !== clase.id));
    } catch {
      alert("No fue posible eliminar la clase.");
    }
  }

  const baseBtn =
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-semibold shadow-sm";

  return (
    <main className="p-6 space-y-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Clases de <span className="italic">“{moduloTitulo}”</span>
          </h1>
          <p className="text-sm text-gray-600">
            Listado de clases (lecciones) asociadas a este módulo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className={`${baseBtn} bg-violet-700 text-white hover:opacity-95`}
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/modulos/${moduloId}/clases/nuevo`)
            }
            className={`${baseBtn} bg-violet-700 text-white hover:opacity-95`}
          >
            ＋ Nueva clase
          </button>
        </div>
      </header>

      {/* Estados */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      {loading && <div className="p-4 text-sm text-gray-700">Cargando…</div>}

      {/* Listado */}
      {!loading && !error && (
        <section className="rounded-lg border border-gray-200 bg-white">
          {clases.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No hay clases registradas para este módulo.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {clases.map((c) => {
                const youtubeId = extractYouTubeId(c.youtube_id);
                const youtubeIdExtra = extractYouTubeId(c.youtube_id_extra);

                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between p-4"
                  >
                    {/* Datos de la clase */}
                    <div>
                      <p className="font-medium">{c.titulo}</p>

                      {c.descripcion && (
                        <p className="text-sm text-gray-500">
                          {c.descripcion}
                        </p>
                      )}

                      <div className="mt-1 text-xs text-gray-500">
                        {c.youtube_titulo && `🎬 ${c.youtube_titulo}`}
                        {c.youtube_titulo_extra &&
                          ` · ➕ ${c.youtube_titulo_extra}`}
                        {c.pdf_titulo && ` · 📄 ${c.pdf_titulo}`}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Orden: {c.orden ?? 0} · ID: {c.id}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      {/* Video principal */}
                      {youtubeId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${baseBtn} bg-blue-600 text-white hover:bg-blue-700`}
                        >
                          Video principal
                        </a>
                      )}

                      {/* Video adicional */}
                      {youtubeIdExtra && (
                        <a
                          href={`https://www.youtube.com/watch?v=${youtubeIdExtra}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${baseBtn} bg-indigo-600 text-white hover:bg-indigo-700`}
                        >
                          Video adicional
                        </a>
                      )}

                      {/* PDF */}
                      {c.pdf_url && (
                        <a
                          href={c.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${baseBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                          Ver PDF
                        </a>
                      )}

                      {/* Editar clase */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/admin/modulos/${moduloId}/clases/${c.id}`
                          )
                        }
                        className={`${baseBtn} bg-white border hover:bg-gray-50`}
                      >
                        Editar
                      </button>

                      {/* Configurar / crear la prueba asociada a la clase */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/admin/modulos/${moduloId}/clases/${c.id}/prueba`
                          )
                        }
                        className={`${baseBtn} bg-amber-500 text-white hover:bg-amber-600`}
                      >
                        Prueba
                      </button>

                      {/* Ver prueba (nueva página dedicada) */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/admin/modulos/${moduloId}/clases/${c.id}/prueba/ver`
                          )
                        }
                        className={`${baseBtn} bg-white border border-amber-500 text-amber-600 hover:bg-amber-50`}
                      >
                        Ver prueba
                      </button>

                      {/* Eliminar clase */}
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className={`${baseBtn} bg-red-600 text-white hover:bg-red-700`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
