// src/app/admin/cursos/[id]/modulos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CursosAdminAPI,
  ModulosAdminAPI,
  type CursoDetalle,
  type ModuloListItem,
} from "@/lib/api";

export default function ModulosPorCursoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const cursoId = useMemo(() => Number(id), [id]);

  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [modulos, setModulos] = useState<ModuloListItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setCargando(true);
      setError(null);
      try {
        // 1) Datos del curso
        const c = await CursosAdminAPI.get(cursoId);
        if (alive) setCurso(c);

        // 2) Módulos del curso
        try {
          const ms = await ModulosAdminAPI.listByCurso(cursoId);
          if (alive) setModulos(ms);
        } catch (err: any) {
          if (alive) {
            setError(
              err?.response?.status === 404
                ? null
                : "No fue posible obtener los módulos."
            );
          }
        }
      } catch {
        if (alive) setError("No fue posible obtener los datos del curso.");
      } finally {
        if (alive) setCargando(false);
      }
    }

    if (!Number.isFinite(cursoId)) {
      setError("Identificador de curso inválido.");
      setCargando(false);
      return;
    }

    fetchData();
    return () => {
      alive = false;
    };
  }, [cursoId]);

  async function handleDelete(modulo: ModuloListItem) {
    const ok = window.confirm(
      `¿Eliminar el módulo “${modulo.titulo}”? Esta acción es irreversible.`
    );
    if (!ok) return;

    try {
      await ModulosAdminAPI.remove(modulo.id);
      setModulos((prev) => prev.filter((m) => m.id !== modulo.id));
    } catch (e) {
      console.error(e);
      alert("No fue posible eliminar el módulo.");
    }
  }

  const tituloCurso = curso?.titulo ?? `Curso #${cursoId}`;

  return (
    <main className="p-6 space-y-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900/90 px-2 text-xs font-semibold text-white">
              #{cursoId}
            </span>
            <h1 className="text-2xl font-semibold leading-tight">
              Módulos de <span className="italic">“{tituloCurso}”</span>
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Listado de módulos asociados a este curso.
          </p>
        </div>

        {/* Botonera superior */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            aria-label="Volver"
          >
            ← Volver
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(`/admin/modulos/nuevo?curso_id=${cursoId}`)
            }
            className="inline-flex items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            ＋ Nuevo módulo
          </button>
        </div>
      </header>

      {/* Mensajes de estado */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {cargando && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Cargando…
        </div>
      )}

      {/* Listado de módulos */}
      {!cargando && !error && (
        <section className="rounded-lg border border-gray-200 bg-white">
          {modulos.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No hay módulos registrados para este curso.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {modulos.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <div>
                    <p className="font-medium">{m.titulo}</p>
                    {m.descripcion && (
                      <p className="text-sm text-gray-500">{m.descripcion}</p>
                    )}
                  </div>

                  {/* Botones por módulo */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1️⃣ Ver video */}
                    {m.video_intro_url && (
                      <a
                        href={m.video_intro_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        Ver video
                      </a>
                    )}

                    {/* 2️⃣ Ver PDF */}
                    {m.pdf_intro_url && (
                      <a
                        href={m.pdf_intro_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        Ver PDF
                      </a>
                    )}

                    {/* 3️⃣ Editar */}
                    <button
                      onClick={() => router.push(`/admin/modulos/${m.id}`)}
                      className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    {/* 4️⃣ Clases */}
                    <button
                      onClick={() =>
                        router.push(`/admin/modulos/${m.id}/clases`)
                      }
                      className="inline-flex items-center rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
                    >
                      Clases
                    </button>

                    {/* 5️⃣ Eliminar */}
                    <button
                      onClick={() => handleDelete(m)}
                      className="inline-flex items-center rounded-xl bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
