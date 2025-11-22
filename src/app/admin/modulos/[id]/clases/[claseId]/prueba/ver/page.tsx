// src/app/admin/modulos/[id]/clases/[claseId]/prueba/ver/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LeccionesAdminAPI,
  PruebasAdminAPI,
  type PruebaClaseDetalle,
} from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function VerPruebaClasePage(): React.JSX.Element {
  const router = useRouter();
  const { id, claseId } = useParams<{ id: string; claseId: string }>();

  const moduloId = Number(id);
  const leccionId = Number(claseId);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tituloClase, setTituloClase] = React.useState("");
  const [prueba, setPrueba] = React.useState<PruebaClaseDetalle | null>(null);

  React.useEffect(() => {
    let alive = true;

    if (!Number.isFinite(moduloId) || !Number.isFinite(leccionId)) {
      setError("Parámetros de ruta inválidos.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Obtener datos de la clase (solo para mostrar el título)
        const clase = await LeccionesAdminAPI.get(leccionId);
        if (!alive) return;
        setTituloClase(clase?.titulo ?? `Clase #${leccionId}`);

        // 2) Obtener la prueba asociada a la clase
        const detalle = await PruebasAdminAPI.getByClase(leccionId);
        if (!alive) return;

        setPrueba(detalle);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("No fue posible obtener la prueba asociada a la clase.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [moduloId, leccionId]);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* 📌 Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Vista de prueba</h1>
            <p className="text-sm text-slate-600">
              Prueba asociada a la clase{" "}
              <span className="font-semibold">“{tituloClase}”</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6a1b9a] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>

        {/* 🔍 Estados */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Cargando prueba…
          </div>
        )}

        {!loading && !error && !prueba && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Esta clase aún no tiene una prueba asociada.
          </div>
        )}

        {/* 📚 Contenido de la prueba */}
        {!loading && !error && prueba && (
          <section className="space-y-4">
            {/* Información general */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <h2 className="text-lg font-semibold">
                {prueba.titulo || "Prueba sin título"}
              </h2>
              {prueba.instrucciones && (
                <p className="text-sm text-slate-700">{prueba.instrucciones}</p>
              )}
            </div>

            {/* Preguntas */}
            <div className="space-y-4">
              {prueba.preguntas.length === 0 ? (
                <p className="text-sm text-slate-500">
                  La prueba no tiene preguntas configuradas.
                </p>
              ) : (
                prueba.preguntas.map((pregunta, indexPregunta) => (
                  <article
                    key={indexPregunta}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-800">
                      Pregunta {indexPregunta + 1}:{" "}
                      <span className="font-normal">{pregunta.enunciado}</span>
                    </h3>

                    <ul className="space-y-1 text-sm">
                      {pregunta.alternativas.map((alternativa, indexAlt) => (
                        <li
                          key={indexAlt}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                            alternativa.es_correcta
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span className="font-mono text-xs">
                            {String.fromCharCode(65 + indexAlt)}.
                          </span>
                          <span>{alternativa.texto}</span>
                          {alternativa.es_correcta && (
                            <span className="ml-auto text-xs font-semibold">
                              Correcta
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
