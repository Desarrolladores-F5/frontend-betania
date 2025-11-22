// src/app/admin/pruebas/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PruebasAdminAPI, type ExamenAdmin } from "@/lib/api";
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

/** Convierte alternativas del backend al modelo del formulario (tipos simples) */
function mapAlternativasFromBackend(
  alternativas: any[] | null | undefined
): AlternativaForm[] {
  const list = (alternativas ?? []) as any[];

  if (!list || list.length === 0) {
    return crearAlternativasIniciales();
  }

  const mapped: AlternativaForm[] = list.map((alt: any) => ({
    texto: String(alt?.texto ?? ""),
    es_correcta: Boolean(alt?.es_correcta),
  }));

  // Si ninguna viene marcada como correcta, marcamos la primera
  if (!mapped.some((a) => a.es_correcta) && mapped.length > 0) {
    mapped[0].es_correcta = true;
  }

  return mapped;
}

/** Convierte un examen del backend al modelo del formulario */
function mapExamenToForm(ex: ExamenAdmin): PruebaForm {
  const preguntasBackend: any[] = (ex.preguntas ?? []) as any[];

  if (preguntasBackend.length === 0) {
    return {
      titulo: ex.titulo ?? "",
      instrucciones: ex.instrucciones ?? "",
      preguntas: crearPreguntasIniciales(5),
    };
  }

  return {
    titulo: ex.titulo ?? "",
    instrucciones: ex.instrucciones ?? "",
    preguntas: preguntasBackend.map((p: any) => ({
      enunciado: String(p?.enunciado ?? ""),
      alternativas: mapAlternativasFromBackend(p?.alternativas),
    })),
  };
}

/**
 * Editor de prueba a nivel de curso.
 * Ruta: /admin/pruebas/[id]
 */
export default function EditPruebaAdminPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const examenId = Number(params.id);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [cursoTitulo, setCursoTitulo] = React.useState<string>("");
  const [form, setForm] = React.useState<PruebaForm>({
    titulo: "",
    instrucciones: "",
    preguntas: crearPreguntasIniciales(1),
  });

  React.useEffect(() => {
    let alive = true;

    if (!Number.isFinite(examenId)) {
      setError("ID de examen inválido.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const examen = await PruebasAdminAPI.get(examenId);
        if (!alive) return;

        console.log("Examen recibido en frontend:", examen);

        if (!examen) {
          setError("Examen no encontrado.");
          setLoading(false);
          return;
        }

        setCursoTitulo(
          examen.curso?.titulo ?? `Curso #${examen.curso_id ?? "?"}`
        );

        const mapped = mapExamenToForm(examen);
        console.log("Formulario mapeado para la UI:", mapped);

        setForm(mapped);
      } catch (e) {
        console.error("Error cargando examen:", e);
        if (!alive) return;
        setError("No fue posible obtener la información de la prueba.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [examenId]);

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

    // Validaciones mínimas
    if (!form.titulo.trim()) {
      setError("El título de la prueba es obligatorio.");
      return;
    }

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

      // Payload que espera el endpoint PUT /admin/examenes/:id/full
      const payload = {
        titulo: form.titulo.trim(),
        instrucciones: form.instrucciones.trim(),
        preguntas: form.preguntas.map((p, index) => ({
          enunciado: p.enunciado.trim(),
          orden: index + 1,
          alternativas: p.alternativas.map((a) => ({
            texto: a.texto.trim(),
            es_correcta: a.es_correcta,
          })),
        })),
      };

      console.log("Payload final enviado al backend:", payload);

      const examenActualizado = await PruebasAdminAPI.updateFull(
        examenId,
        payload
      );

      console.log("Respuesta backend (examen actualizado):", examenActualizado);

      router.replace("/admin/pruebas");
    } catch (e) {
      console.error("Error guardando examen completo:", e);
      setError("No fue posible guardar los cambios en el examen.");
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
            <h1 className="text-2xl font-semibold">Editar prueba</h1>
            <p className="text-sm text-slate-600">
              Modifica el contenido de la prueba asociada al curso.
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
                  placeholder="Ej: Evaluación inicial del curso"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Curso
                </label>
                <input
                  type="text"
                  value={cursoTitulo}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
              </div>
            </div>

            {/* Preguntas */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800">
                Preguntas
              </h2>

              {form.preguntas.map((preg, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
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
                onClick={() => router.replace("/admin/pruebas")}
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
