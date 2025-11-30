// src/components/user/CursoCard.tsx
"use client";

import Link from "next/link";

export type CursoUsuario = {
  id: number;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
};

type Props = {
  curso: CursoUsuario;
};

export function CursoCard({ curso }: Props): React.JSX.Element {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {curso.imagenUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={curso.imagenUrl}
            alt={curso.titulo}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col px-6 py-5">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          {curso.titulo}
        </h2>

        <p className="flex-1 text-sm leading-relaxed text-slate-600">
          {curso.descripcion}
        </p>

        <div className="mt-4">
          <Link
            href={`/user/cursos/${curso.id}`}
            className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            Ver curso
          </Link>
        </div>
      </div>
    </article>
  );
}
