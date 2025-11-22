// src/app/admin/modulos/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import ModuloForm, { type ModuloFormValues } from "../ModuloForm";
import { ModulosAdminAPI, UploadsAPI } from "@/lib/api";

type ModuloRaw = Partial<{
  id: number;
  titulo: string | null;
  descripcion: string | null;
  orden: number | null;
  activo: boolean | null;
  video_intro_url: string | null;
  pdf_intro_url: string | null;
}>;

function normalizeModulo(raw: ModuloRaw): ModuloFormValues {
  return {
    titulo: (raw.titulo ?? "").toString(),
    descripcion: raw.descripcion ?? "",
    orden: typeof raw.orden === "number" ? raw.orden : 1,
    activo: typeof raw.activo === "boolean" ? raw.activo : true,
    video_intro_url: raw.video_intro_url ?? "",
    pdf_intro_url: raw.pdf_intro_url ?? "",
    // pdf_intro_file no se setea aquí (el usuario lo elige al editar)
  };
}

export default function EditModuloPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const moduloId = Number(id);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [defaults, setDefaults] = React.useState<ModuloFormValues | null>(null);

  React.useEffect(() => {
    let alive = true;

    if (!Number.isFinite(moduloId)) {
      setError("Identificador de módulo inválido.");
      setLoading(false);
      return;
    }

    async function fetchModulo() {
      setLoading(true);
      setError(null);
      try {
        const m = await ModulosAdminAPI.get(moduloId);

        if (!alive) return;

        if (m == null) {
          setError("Módulo no encontrado.");
          setDefaults(null);
          return;
        }

        const dv = normalizeModulo(m as unknown as ModuloRaw);
        setDefaults(dv);
      } catch (e: any) {
        if (!alive) return;
        setError(
          e?.response?.status === 404
            ? "Módulo no encontrado."
            : "No fue posible obtener el módulo."
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchModulo();
    return () => {
      alive = false;
    };
  }, [moduloId]);

  async function handleSubmit(data: ModuloFormValues) {
    try {
      setSaving(true);
      setError(null);

      // 1) Partimos desde lo que venga escrito en el input de URL
      let pdfUrl: string | null =
        (data.pdf_intro_url ?? "").trim().length > 0
          ? (data.pdf_intro_url ?? "").trim()
          : null;

      // 2) Si el usuario seleccionó un archivo, se sube y se usa esa URL
      const maybeFile = (data as any).pdf_intro_file as File | undefined;
      if (maybeFile && maybeFile instanceof File) {
        const { url } = await UploadsAPI.uploadPdf(maybeFile);
        pdfUrl = url;
      }

      await ModulosAdminAPI.update(
        moduloId,
        {
          titulo: data.titulo,
          descripcion: data.descripcion ?? null,
          orden: data.orden ?? 1,
          activo: data.activo ?? true,
          video_intro_url: data.video_intro_url || null,
          pdf_intro_url: pdfUrl,
        } as any
      );

      router.back();
    } catch (e) {
      console.error(e);
      setError("No fue posible guardar los cambios del módulo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold leading-tight">
              Editar módulo
            </h1>
            <p className="text-sm text-gray-600">
              Actualiza los datos del módulo seleccionado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              ← Volver
            </button>
          </div>
        </header>

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

        {!loading && !error && defaults && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <ModuloForm
              defaultValues={defaults}
              onSubmit={handleSubmit}
              submitLabel="Guardar"
              loading={saving}
            />
          </section>
        )}
      </div>
    </main>
  );
}
