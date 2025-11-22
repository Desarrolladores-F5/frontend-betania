// src/app/admin/modulos/[id]/clases/[claseId]/prueba/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LeccionesAdminAPI,
  ModulosAdminAPI,
  PruebasAdminAPI,
  type ExamenAdmin,
  type LeccionDetalle,
} from "@/lib/api";
import { Save, ArrowLeft } from "lucide-react";

type AlternativaForm = {
  texto: string;
  es_correcta: boolean;
};

type PreguntaForm = {
  enunciado: string;
  alternativas: AlternativaForm[];
};

type PruebaForm = {
  titulo: string;
  instrucciones: string;
  preguntas: PreguntaForm[];
};

function crearAlternativasIniciales(): AlternativaForm[] {
  return [
    { texto: "", es_correcta: true }, // por defecto la primera correcta
    { texto: "", es_correcta: false },
    { texto: "", es_correcta: false },
    { texto: "", es_correcta: false },
  ];
}

function crearPreguntasIniciales(n: number): PreguntaForm[] {
  return Array.from({ length: n }, () => ({
    enunciado: "",
    alternativas: crearAlternativasIniciales(),
  }));
}

/** Mapea un ExamenAdmin existente al formulario de prueba de clase */
function examenToForm(examen: ExamenAdmin): PruebaForm {
  return {
    titulo: examen.titulo ?? "",
    instrucciones: examen.instrucciones ?? "",
    preguntas: Array.isArray(examen.preguntas)
      ? examen.preguntas.map((p) => ({
          enunciado: p.enunciado ?? "",
          alternativas: Array.isArray(p.alternativas)
            ? p.alternativas.map((a) => ({
                texto: a.texto ?? "",
                es_correcta: Boolean(a.es_correcta),
              }))
            : crearAlternativasIniciales(),
        }))
      : crearPreguntasIniciales(5),
  };
}

/**
 * Editor de prueba asociada a una clase (lección).
 * Ruta: /admin/modulos/[id]/clases/[claseId]/prueba
 *
 * - 1 prueba por clase
 * - Se almacena como un Examen en /admin/examenes
 * - La lección guarda el examen_id vinculado
 */
export default function EditPruebaClasePage(): React.JSX.Element {
  const router = useRouter();
  const { id, claseId } = useParams<{ id: string; claseId: string }>();

  const moduloId = Number(id);
  const leccionId = Number(claseId);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [tituloClase, setTituloClase] = React.useState<string>("");
  const [form, setForm] = React.useState<PruebaForm>({
    titulo: "",
    instrucciones: "",
    preguntas: crearPreguntasIniciales(5),
  });

  const [cursoId, setCursoId] = React.useState<number | null>(null);
  const [examenId, setExamenId] = React.useState<number | null>(null);

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

        // 1) Obtenemos la lección
        const leccion = (await LeccionesAdminAPI.get(
          leccionId
        )) as LeccionDetalle | null;
        if (!alive) return;

        setTituloClase(leccion?.titulo ?? `Clase #${leccionId}`);
        setExamenId(leccion?.examen_id ?? null);

        // 2) Obtenemos el módulo para saber a qué curso pertenece
        const modulo = await ModulosAdminAPI.get(leccion?.modulo_id ?? moduloId);
        if (!alive) return;

        if (!modulo?.curso_id) {
          setError(
            "No fue posible determinar el curso asociado al módulo de esta clase."
          );
        } else {
          setCursoId(modulo.curso_id);
        }

        // 3) Si la lección ya tiene examen, lo cargamos
        if (leccion?.examen_id) {
          const examen = await PruebasAdminAPI.get(leccion.examen_id);
          if (!alive) return;
          if (examen) {
            setForm(examenToForm(examen));
          }
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError("No fue posible obtener los datos de la clase.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [moduloId, leccionId]);

  function updatePregunta(
    index: number,
    updater: (p: PreguntaForm) => PreguntaForm
  ) {
    setForm((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => (i === index ? updater(p) : p)),
    }));
  }

  function updateAlternativa(
    indexPregunta: number,
    indexAlt: number,
    updater: (a: AlternativaForm) => AlternativaForm
  ) {
    setForm((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => {
        if (i !== indexPregunta) return p;
        return {
          ...p,
          alternativas: p.alternativas.map((a, j) =>
            j === indexAlt ? updater(a) : a
          ),
        };
      }),
    }));
  }

  function marcarComoCorrecta(indexPregunta: number, indexAltCorrecta: number) {
    setForm((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => {
        if (i !== indexPregunta) return p;
        return {
          ...p,
          alternativas: p.alternativas.map((a, j) => ({
            ...a,
            es_correcta: j === indexAltCorrecta,
          })),
        };
      }),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.titulo.trim()) {
      setError("El título de la prueba es obligatorio.");
      return;
    }

    if (!cursoId) {
      setError(
        "No se pudo determinar el curso asociado a la clase. No se puede guardar la prueba."
      );
      return;
    }

    // Validaciones básicas por pregunta
    for (const [idx, pregunta] of form.preguntas.entries()) {
      if (!pregunta.enunciado.trim()) {
        setError(`La pregunta ${idx + 1} debe tener enunciado.`);
        return;
      }
      if (!pregunta.alternativas.some((a) => a.texto.trim())) {
        setError(
          `La pregunta ${idx + 1} debe tener al menos una alternativa con texto.`
        );
        return;
      }
      if (!pregunta.alternativas.some((a) => a.es_correcta)) {
        setError(`La pregunta ${idx + 1} debe tener una alternativa correcta.`);
        return;
      }
    }

    try {
      setSaving(true);

      // Normalizamos preguntas al formato esperado por updateFull
      const preguntasPayload = form.preguntas.map((p, index) => ({
        enunciado: p.enunciado.trim(),
        puntaje: 1,
        orden: index + 1,
        alternativas: p.alternativas.map((a) => ({
          texto: a.texto.trim(),
          es_correcta: a.es_correcta,
        })),
      }));

      let currentExamenId = examenId;

      // 1) Si la clase aún no tiene examen, lo creamos
      if (!currentExamenId) {
        const base = await PruebasAdminAPI.create({
          curso_id: cursoId,
          titulo: form.titulo.trim() || `Prueba de ${tituloClase}`,
          publicado: true,
        });

        currentExamenId = base.id;
        setExamenId(base.id);

        // Vinculamos el examen a la lección
        await LeccionesAdminAPI.update(leccionId, {
          examen_id: base.id,
        });
      } else {
        // Actualizamos título/publicación del examen existente
        await PruebasAdminAPI.update(currentExamenId, {
          titulo: form.titulo.trim(),
          publicado: true,
        });
      }

      // 2) Actualizamos el contenido completo del examen
      await PruebasAdminAPI.updateFull(currentExamenId!, {
        titulo: form.titulo.trim(),
        publicado: true,
        preguntas: preguntasPayload,
      });

      alert("Prueba de clase guardada correctamente.");
      router.replace(`/admin/modulos/${moduloId}/clases`);
    } catch (e) {
      console.error(e);
      setError("No fue posible guardar la prueba.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Prueba de la clase</h1>
            <p className="text-sm text-slate-600">
              Configura las preguntas de la clase:{" "}
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

        {/* Estados */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Cargando datos…
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos generales de la prueba */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Título de la prueba <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                  placeholder="Ej: Evaluación clase 1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Instrucciones
                </label>
                <input
                  type="text"
                  value={form.instrucciones}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      instrucciones: e.target.value,
                    }))
                  }
                  placeholder="Ej: Debes responder correctamente todas las preguntas…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>

            {/* Preguntas */}
            <div className="space-y-4">
              {form.preguntas.map((preg, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex items-center justify_between">
                    <span className="text-sm font-semibold text-slate-700">
                      Pregunta {idx + 1}
                    </span>
                  </div>

                  {/* Enunciado */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Enunciado
                    </label>
                    <input
                      type="text"
                      value={preg.enunciado}
                      onChange={(e) =>
                        updatePregunta(idx, (p) => ({
                          ...p,
                          enunciado: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                      placeholder="Escribe la pregunta…"
                    />
                  </div>

                  {/* Alternativas */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Alternativas (marca una como correcta)
                    </label>
                    <div className="space-y-2">
                      {preg.alternativas.map((alt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`preg-${idx}-correcta`}
                            checked={alt.es_correcta}
                            onChange={() => marcarComoCorrecta(idx, j)}
                          />
                          <input
                            type="text"
                            value={alt.texto}
                            onChange={(e) =>
                              updateAlternativa(idx, j, (a) => ({
                                ...a,
                                texto: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                            placeholder={`Alternativa ${j + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando…" : "Guardar"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.replace(`/admin/modulos/${moduloId}/clases`)
                }
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
