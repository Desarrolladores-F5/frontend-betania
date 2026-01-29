// src/app/admin/clases/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClasesAdminAPI, type LeccionBase } from "@/lib/api";

export default function AdminClasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?modulo_id=123 (opcional)
  const moduloIdParam = searchParams.get("modulo_id");
  const moduloId = moduloIdParam ? Number(moduloIdParam) : NaN;
  const tieneModuloValido = Number.isFinite(moduloId);

  const [clases, setClases] = useState<LeccionBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        let lista: LeccionBase[];

        if (tieneModuloValido) {
          // Clases de un módulo concreto
          lista = await ClasesAdminAPI.listByModulo(moduloId as number);
        } else {
          // Todas las clases del sistema (para la tarjeta del dashboard)
          lista = await ClasesAdminAPI.list();
        }

        if (alive) setClases(lista);
      } catch (e) {
        console.error(e);
        if (alive) setError("No fue posible obtener las clases.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchData();
    return () => {
      alive = false;
    };
  }, [tieneModuloValido, moduloId]);

  async function handleDelete(c: LeccionBase) {
    const ok = window.confirm(
      `¿Eliminar la clase “${c.titulo}”? Esta acción es irreversible.`
    );
    if (!ok) return;

    try {
      await ClasesAdminAPI.remove(c.id);
      setClases((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      console.error(e);
      alert("No fue posible eliminar la clase.");
    }
  }

  return (
    <main className="p-6 space-y-6">
      {/* Encabezado */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clases</h1>
          <p className="text-sm text-gray-600">
            {tieneModuloValido
              ? `Listado de clases del módulo #${moduloId}.`
              : "Listado de clases registradas en el sistema."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Volver (arriba a la derecha, igual que en Módulos / Pruebas) */}
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-800"
          >
            ← Volver
          </button>

          {/* Nueva clase */}
          <button
            type="button"
            onClick={() =>
              tieneModuloValido
                ? router.push(`/admin/clases/nuevo?modulo_id=${moduloId}`)
                : router.push("/admin/clases/nuevo")
            }
            className="inline-flex items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            ＋ Nueva clase
          </button>
        </div>
      </header>

      {/* Mensajes de estado */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Cargando…
        </div>
      )}

      {/* Listado (misma estructura visual que Módulos) */}
      {!loading && !error && (
        <section className="rounded-lg border border-gray-200 bg-white">
          {clases.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              {tieneModuloValido
                ? "No hay clases registradas para este módulo."
                : "No hay clases registradas en el sistema."}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {clases.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium">{c.titulo}</p>
                    {c.descripcion && (
                      <p className="text-sm text-gray-500">
                        {c.descripcion}
                      </p>
                    )}
                    {!tieneModuloValido && (
                      <p className="text-xs text-gray-400">
                        Módulo ID: {c.modulo_id}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/clases/${c.id}`)}
                      className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
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
