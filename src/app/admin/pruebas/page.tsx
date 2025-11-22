// src/app/admin/pruebas/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type PruebaItem = {
  id: number;
  titulo: string;
  curso: string;
  modulo: string;
  clase: string;
};

export default function PruebasListadoPage(): React.JSX.Element {
  const router = useRouter();

  const [pruebas, setPruebas] = React.useState<PruebaItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // -------------------------------------------------
  // Carga inicial desde backend: GET /api/admin/examenes
  // -------------------------------------------------
  React.useEffect(() => {
    let alive = true;

    async function fetchPruebas() {
      try {
        setLoading(true);
        setError(null);

        // Con api baseURL "/api" => llama a /api/admin/examenes (proxy a backend:3001)
        const res = await api.get("/admin/examenes");

        const rows: any[] = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];

        const normalizados: PruebaItem[] = rows.map((ex: any) => ({
          id: ex.id,
          titulo: String(ex.titulo ?? `Examen #${ex.id}`),
          // El backend devuelve { curso: { titulo } }
          curso: String(ex.curso?.titulo ?? `Curso #${ex.curso_id ?? "-"}`),
          // De momento no hay relación directa examen → módulo / clase en el modelo
          modulo: "-",
          clase: "-",
        }));

        if (!alive) return;
        setPruebas(normalizados);
      } catch (e) {
        console.error("Error al cargar exámenes:", e);
        if (!alive) return;
        setError("No fue posible obtener el listado de pruebas.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchPruebas();
    return () => {
      alive = false;
    };
  }, []);

  // -------------------------------------------------
  // Eliminar examen: DELETE /api/admin/examenes/:id
  // -------------------------------------------------
  async function handleDelete(item: PruebaItem) {
    const ok = window.confirm(
      `¿Eliminar la prueba “${item.titulo}”? Esta acción es irreversible.`
    );
    if (!ok) return;

    try {
      // Llamamos al backend para eliminar
      await api.delete(`/admin/examenes/${item.id}`);

      // Actualizamos estado local
      setPruebas((prev) => prev.filter((p) => p.id !== item.id));
    } catch (e) {
      console.error("Error al eliminar examen:", e);
      alert("No fue posible eliminar la prueba.");
    }
  }

  return (
    <main className="p-6 space-y-6">
      {/* Encabezado */}
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Pruebas</h1>
          <p className="text-sm text-gray-600">
            Listado general de pruebas registradas en el sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="inline-flex items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          ← Volver
        </button>
      </header>

      {/* Estado de carga / error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Cargando pruebas…
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <section className="rounded-lg border border-gray-200 bg-white">
          {pruebas.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No hay pruebas registradas.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pruebas.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{p.titulo}</p>
                    <p className="text-sm text-gray-500">
                      {p.curso} → {p.modulo} → {p.clase}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/pruebas/${p.id}`)}
                      className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
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
