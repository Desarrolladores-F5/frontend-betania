// src/app/admin/modulos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModulosAdminAPI, type ModuloBase } from "@/lib/api";

export default function AdminModulosPage() {
  const router = useRouter();

  const [modulos, setModulos] = useState<ModuloBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const lista = await ModulosAdminAPI.listAll();
        if (alive) setModulos(lista);
      } catch (e) {
        console.error(e);
        if (alive) setError("No fue posible obtener los módulos.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchData();
    return () => {
      alive = false;
    };
  }, []);

  async function handleDelete(m: ModuloBase) {
    const ok = window.confirm(
      `¿Eliminar el módulo “${m.titulo}”? Esta acción es irreversible.`
    );
    if (!ok) return;

    try {
      await ModulosAdminAPI.remove(m.id);
      setModulos((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      console.error(e);
      alert("No fue posible eliminar el módulo.");
    }
  }

  return (
    <main className="p-6 space-y-6">
      {/* Encabezado con título a la izquierda y botones a la derecha */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Módulos</h1>
          <p className="text-sm text-gray-600">
            Listado de módulos registrados en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón Volver (arriba a la derecha, estilo pruebas) */}
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-800"
          >
            ← Volver
          </button>

          {/* Botón Nuevo módulo */}
          <button
            type="button"
            onClick={() => router.push("/admin/modulos/nuevo")}
            className="inline-flex items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            ＋ Nuevo módulo
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cargando */}
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Cargando…
        </div>
      )}

      {/* Listado */}
      {!loading && !error && (
        <section className="rounded-lg border border-gray-200 bg-white">
          {modulos.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No hay módulos registrados.
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
                      <p className="text-sm text-gray-500">
                        {m.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/modulos/${m.id}`)}
                      className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/admin/modulos/${m.id}/clases`)
                      }
                      className="inline-flex items-center rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
                    >
                      Clases
                    </button>

                    <button
                      type="button"
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
