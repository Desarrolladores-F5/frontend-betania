// src/app/user/ayuda/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, BookOpen, PlayCircle, Mail } from "lucide-react";
import Link from "next/link";

export default function AyudaUsuarioPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Botón Volver (mismo estilo que Mis cursos / Perfil) */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-purple-300/60 transition hover:bg-[#6D28D9] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>

        {/* Encabezado */}
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Ayuda
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Aquí encontrarás una guía rápida para usar la plataforma, resolver
            dudas frecuentes y los datos de contacto en caso de que necesites
            soporte adicional.
          </p>
        </header>

        {/* Bloques principales de ayuda */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Guía rápida para comenzar */}
          <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </span>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Guía rápida
                </h2>
                <p className="text-base font-semibold text-slate-900">
                  ¿Cómo empiezo a usar la plataforma?
                </p>
              </div>
            </div>

            <ol className="mt-2 space-y-2 text-sm text-slate-700">
              <li>
                <span className="font-semibold">1.</span> Ve al menú{" "}
                <span className="font-semibold">“Mis cursos”</span> y selecciona
                el curso disponible.
              </li>
              <li>
                <span className="font-semibold">2.</span> Ingresa al curso y
                recorre los <span className="font-semibold">módulos</span> en
                orden, revisando cada contenido.
              </li>
              <li>
                <span className="font-semibold">3.</span> Visualiza los videos o
                materiales PDF completos antes de avanzar.
              </li>
              <li>
                <span className="font-semibold">4.</span> Cuando corresponda,
                responde las evaluaciones o pruebas asociadas.
              </li>
              <li>
                <span className="font-semibold">5.</span> Tu progreso se irá
                guardando automáticamente en la plataforma.
              </li>
            </ol>

            <div className="mt-3">
              <Link
                href="/user/mis-cursos"
                className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                Ir a Mis cursos
              </Link>
            </div>
          </article>

          {/* Consejos de uso */}
          <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50">
                <PlayCircle className="h-5 w-5 text-purple-600" />
              </span>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Recomendaciones
                </h2>
                <p className="text-base font-semibold text-slate-900">
                  Para aprovechar mejor tus cursos
                </p>
              </div>
            </div>

            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              <li>Utiliza un navegador actualizado (Chrome, Edge o Firefox).</li>
              <li>Conéctate desde un lugar con buena conexión a Internet.</li>
              <li>
                Ten a mano un cuaderno o notas para registrar lo más importante.
              </li>
              <li>
                Si algo no carga, recarga la página o vuelve a ingresar desde
                “Mis cursos”.
              </li>
              <li>
                Si el problema persiste, comunícalo al equipo de soporte
                indicando tu correo y una captura de pantalla.
              </li>
            </ul>
          </article>
        </section>

        {/* Preguntas frecuentes + contacto */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* FAQ básicas */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50">
                <HelpCircle className="h-5 w-5 text-purple-600" />
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Preguntas frecuentes
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">
                  ¿No veo ningún curso en “Mis cursos”?
                </p>
                <p className="mt-1">
                  Es posible que aún no tengas cursos asignados. Comunícate con
                  la institución para confirmar tu inscripción.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  ¿Perderé mi progreso si cierro la sesión?
                </p>
                <p className="mt-1">
                  No. El progreso se guarda en la plataforma. Solo asegúrate de
                  completar las actividades antes de cerrar la ventana.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  El video o el PDF no se cargan correctamente.
                </p>
                <p className="mt-1">
                  Prueba actualizar la página, cambiar de navegador o revisar tu
                  conexión. Si el problema continúa, escribe a soporte.
                </p>
              </div>
            </div>
          </article>

          {/* Contacto de soporte */}
          <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50">
                  <Mail className="h-5 w-5 text-purple-600" />
                </span>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Soporte y contacto
                </h2>
              </div>

              <p className="text-sm text-slate-700">
                Si después de revisar esta sección aún tienes problemas, puedes
                contactar al equipo de la plataforma indicando tu nombre,
                correo, curso y una breve descripción del problema.
              </p>

              <div className="mt-4 space-y-1 text-sm">
                <p className="font-semibold text-slate-900">Correo de soporte</p>
                <p className="text-slate-700">
                  {/* Cambia este correo por el institucional real cuando lo tengas */}
                  soporte@fundacionbetania.cl
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
