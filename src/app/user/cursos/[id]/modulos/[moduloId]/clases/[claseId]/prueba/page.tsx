// src/app/user/cursos/[id]/modulos/[moduloId]/clases/[claseId]/prueba/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import api from "@/lib/api";

// Tipos según la respuesta pública del backend de pruebas
type Alternativa = {
  id: number;
  texto: string;
};

type Pregunta = {
  id: number;
  enunciado: string;
  alternativas: Alternativa[];
};

type PruebaLeccion = {
  id: number;
  titulo: string;
  instrucciones?: string | null;
  preguntas: Pregunta[];
};

export default function PruebaClaseUsuarioPage(): React.JSX.Element {
  const router = useRouter();
  const { id, moduloId, claseId } = useParams<{
    id: string;
    moduloId: string;
    claseId: string;
  }>();

  const cursoId = Number(id);
  const moduloIdNum = Number(moduloId);
  const leccionId = Number(claseId);

  const [prueba, setPrueba] = React.useState<PruebaLeccion | null>(null);
  const [respuestas, setRespuestas] = React.useState<
    Record<number, number | null>
  >({});
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const [mensajeResultado, setMensajeResultado] = React.useState<
    string | null
  >(null);

  // ---------------------------------------------------------------------------
  // Cargar prueba de la lección
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!Number.isFinite(leccionId)) {
      setError("Identificador de lección inválido.");
      setCargando(false);
      return;
    }

    let alive = true;

    async function fetchPrueba() {
      try {
        setCargando(true);
        setError(null);

        // GET /cursos/leccion/:id/prueba
        const res = await api.get(`/cursos/leccion/${leccionId}/prueba`);
        const data = (res.data ?? {}) as any;

        const preguntas: Pregunta[] = Array.isArray(data.preguntas)
          ? data.preguntas.map((p: any) => ({
              id: Number(p.id),
              enunciado: p.enunciado ?? "",
              alternativas: Array.isArray(p.alternativas)
                ? p.alternativas.map((a: any) => ({
                    id: Number(a.id),
                    texto: a.texto ?? "",
                  }))
                : [],
            }))
          : [];

        const pruebaDetalle: PruebaLeccion = {
          id: Number(data.id),
          titulo: data.titulo ?? "Evaluación de la clase",
          instrucciones:
            data.instrucciones ??
            "Responda todas las preguntas y luego envíe sus respuestas.",
          preguntas,
        };

        if (!alive) return;
        setPrueba(pruebaDetalle);

        // Inicializar respuestas en null
        const inicial: Record<number, number | null> = {};
        for (const p of preguntas) {
          inicial[p.id] = null;
        }
        setRespuestas(inicial);
      } catch (err: any) {
        console.error("[PruebaClaseUsuario] Error obteniendo prueba:", err);
        if (!alive) return;
        setError(
          err?.response?.data?.error ??
            "No fue posible cargar la evaluación de esta clase."
        );
      } finally {
        if (alive) setCargando(false);
      }
    }

    void fetchPrueba();

    return () => {
      alive = false;
    };
  }, [leccionId]);

  // ---------------------------------------------------------------------------
  // Manejo de selección de alternativas
  // ---------------------------------------------------------------------------
  function handleChange(preguntaId: number, alternativaId: number) {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: alternativaId,
    }));
  }

  const todasContestadas =
    prueba &&
    prueba.preguntas.length > 0 &&
    prueba.preguntas.every((p) => respuestas[p.id] != null);

  // ---------------------------------------------------------------------------
  // Enviar evaluación
  // ---------------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prueba) return;

    if (!todasContestadas) {
      setMensajeResultado(
        "Debe responder todas las preguntas antes de enviar la evaluación."
      );
      return;
    }

    try {
      setEnviando(true);
      setMensajeResultado(null);

      const payload = {
        leccion_id: leccionId,
        prueba_id: prueba.id,
        respuestas: prueba.preguntas.map((p) => ({
          pregunta_id: p.id,
          alternativa_id: respuestas[p.id],
        })),
      };

      // POST /cursos/leccion/:id/prueba/responder
      const res = await api.post(
        `/cursos/leccion/${leccionId}/prueba/responder`,
        payload
      );

      const body = res.data ?? {};

      // El backend devuelve: porcentaje, aprobado, etc.
      const porcentaje =
        typeof body.porcentaje === "number" ? body.porcentaje : null;

      const aprobado =
        typeof body.aprobado === "boolean"
          ? body.aprobado
          : body.aprobado === 1;

      if (aprobado) {
        // ✅ Texto motivador (Opción 4)
        setMensajeResultado(
          porcentaje != null
            ? `🌟 ¡Muy bien! Has superado esta evaluación.\n\n🚀 Has obtenido un ${porcentaje}% de respuestas correctas. La próxima clase ya está disponible. Continúa avanzando para completar el módulo.`
            : `🌟 ¡Muy bien! Has superado esta evaluación.\n\n🚀 La próxima clase ya está disponible. Continúa avanzando para completar el módulo.`
        );
      } else {
        setMensajeResultado(
          porcentaje != null
            ? `Evaluación no aprobada (obtuviste un ${porcentaje}% de respuestas correctas).\n\nPuedes revisar la clase y volver a intentarlo cuando estés listo.`
            : "Evaluación no aprobada.\n\nPuedes revisar la clase y volver a intentarlo cuando estés listo."
        );
      }
    } catch (err: any) {
      console.error("[PruebaClaseUsuario] Error enviando respuestas:", err);
      setMensajeResultado(
        err?.response?.data?.error ??
          "Ocurrió un error al enviar la evaluación. Intente nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/user/cursos/${cursoId}/modulos/${moduloIdNum}/clases/${leccionId}`
              )
            }
            className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver 
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-purple-600">
              Evaluación de la clase
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {prueba?.titulo ?? "Evaluación"}
            </h1>
          </div>
        </div>
      </header>

      {/* Estados */}
      {cargando && (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-slate-600">Cargando evaluación…</p>
        </div>
      )}

      {!cargando && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && prueba && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          {/* Instrucciones */}
          <section>
            <h2 className="text-sm font-semibold text-slate-900">
              Instrucciones
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              {prueba.instrucciones ??
                "Responda todas las preguntas y luego envíe sus respuestas."}
            </p>
          </section>

          {/* Preguntas */}
          <section className="space-y-5">
            {prueba.preguntas.map((pregunta, index) => (
              <div
                key={pregunta.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {index + 1}. {pregunta.enunciado}
                </p>

                <div className="mt-2 space-y-2">
                  {pregunta.alternativas.map((alt) => (
                    <label
                      key={alt.id}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-800"
                    >
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value={alt.id}
                        checked={respuestas[pregunta.id] === alt.id}
                        onChange={() => handleChange(pregunta.id, alt.id)}
                        className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>{alt.texto}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Resultado / mensajes */}
          {mensajeResultado && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 whitespace-pre-line">
              {mensajeResultado}
            </div>
          )}

          {/* Botón enviar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={enviando || !todasContestadas}
              className={
                "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
                (enviando || !todasContestadas
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500")
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {enviando ? "Enviando…" : "Enviar evaluación"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
