// src/app/admin/modulos/[id]/clases/[claseId]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { LeccionesAdminAPI, UploadsAPI } from "@/lib/api";
import { Save, ArrowLeft } from "lucide-react";

type LeccionDTO = {
  id: number;
  modulo_id: number;
  titulo: string;
  descripcion?: string | null;
  orden?: number | null;
  publicado?: boolean | null;

  youtube_id?: string | null;
  youtube_titulo?: string | null;

  youtube_id_extra?: string | null;
  youtube_titulo_extra?: string | null;

  pdf_url?: string | null;
  pdf_titulo?: string | null;
};

export default function EditarLeccionPage(): React.JSX.Element {
  const router = useRouter();
  const { id, claseId } = useParams<{ id: string; claseId: string }>();

  const moduloId = Number(id);
  const leccionId = Number(claseId);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<LeccionDTO | null>(null);

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
        const data = await LeccionesAdminAPI.get(leccionId);
        if (!alive) return;

        if (!data || data.modulo_id !== moduloId) {
          setError("Lección no encontrada en este módulo.");
          return;
        }

        setForm({
          id: data.id,
          modulo_id: data.modulo_id,
          titulo: data.titulo,
          descripcion: data.descripcion ?? "",
          orden: data.orden ?? 1,
          publicado: !!data.publicado,

          youtube_id: data.youtube_id ?? "",
          youtube_titulo: data.youtube_titulo ?? "",

          youtube_id_extra: data.youtube_id_extra ?? "",
          youtube_titulo_extra: data.youtube_titulo_extra ?? "",

          pdf_url: data.pdf_url ?? "",
          pdf_titulo: data.pdf_titulo ?? "",
        });
      } catch {
        setError("No fue posible obtener la lección.");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [moduloId, leccionId]);

  function onChange<K extends keyof LeccionDTO>(key: K, val: LeccionDTO[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  async function handlePdfFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    try {
      setUploadingPdf(true);
      const { url } = await UploadsAPI.uploadPdf(file);
      onChange("pdf_url", url);
    } catch {
      setError("No fue posible subir el PDF.");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    try {
      setSaving(true);

      await LeccionesAdminAPI.update(leccionId, {
        titulo: form.titulo,
        descripcion: form.descripcion ?? null,
        orden: form.orden ?? 1,
        publicado: !!form.publicado,

        youtube_id: form.youtube_id || null,
        youtube_titulo: form.youtube_titulo || null,

        youtube_id_extra: form.youtube_id_extra || null,
        youtube_titulo_extra: form.youtube_titulo_extra || null,

        pdf_url: form.pdf_url || null,
        pdf_titulo: form.pdf_titulo || null,
      });

      router.replace(`/admin/modulos/${moduloId}/clases`);
    } catch {
      setError("No fue posible guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-white p-6 shadow-sm">
        <header className="mb-6 flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Editar clase</h1>
            <p className="text-sm text-slate-600">Modifica los datos de la clase seleccionada.</p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6a1b9a] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </header>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}
        {loading && (
          <div className="mb-4 bg-slate-50 border border-slate-200 p-3 text-sm">Cargando…</div>
        )}

        {!loading && form && (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => onChange("titulo", e.target.value)}
                  required
                  className="rounded-lg border px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Orden</label>
                <input
                  type="number"
                  value={form.orden ?? 1}
                  onChange={(e) => onChange("orden", Number(e.target.value || 1))}
                  className="rounded-lg border px-3 py-2 w-full"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium">Contenido</label>
              <textarea
                value={form.descripcion ?? ""}
                rows={4}
                onChange={(e) => onChange("descripcion", e.target.value)}
                className="rounded-lg border px-3 py-2 w-full"
              />
            </div>

            {/* Recursos multimedia */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">YouTube principal – ID</label>
                <input
                  type="text"
                  value={form.youtube_id ?? ""}
                  onChange={(e) => onChange("youtube_id", e.target.value)}
                  placeholder="p.ej. dQw4w9WgXcQ"
                  className="rounded-lg border px-3 py-2 w-full"
                />
                <label className="text-sm mt-2 block">Título del video</label>
                <input
                  type="text"
                  value={form.youtube_titulo ?? ""}
                  onChange={(e) => onChange("youtube_titulo", e.target.value)}
                  placeholder="Título visible"
                  className="rounded-lg border px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Video adicional – ID</label>
                <input
                  type="text"
                  value={form.youtube_id_extra ?? ""}
                  onChange={(e) => onChange("youtube_id_extra", e.target.value)}
                  placeholder="p.ej. otroID"
                  className="rounded-lg border px-3 py-2 w-full"
                />
                <label className="text-sm mt-2 block">Título video adicional</label>
                <input
                  type="text"
                  value={form.youtube_titulo_extra ?? ""}
                  onChange={(e) => onChange("youtube_titulo_extra", e.target.value)}
                  className="rounded-lg border px-3 py-2 w-full"
                />
              </div>
            </div>

            {/* PDF */}
            <div>
              <label className="text-sm font-medium">PDF</label>
              <input
                type="text"
                value={form.pdf_url ?? ""}
                onChange={(e) => onChange("pdf_url", e.target.value)}
                placeholder="URL PDF"
                className="rounded-lg border px-3 py-2 w-full"
              />

              <label className="text-sm mt-2 block">Título del PDF</label>
              <input
                type="text"
                value={form.pdf_titulo ?? ""}
                onChange={(e) => onChange("pdf_titulo", e.target.value)}
                placeholder="Nombre visible del archivo"
                className="rounded-lg border px-3 py-2 w-full"
              />

              <div className="mt-2">
                <input type="file" accept="application/pdf" onChange={handlePdfFileChange} />
                {uploadingPdf && <p className="text-xs mt-1">Subiendo PDF…</p>}
              </div>
            </div>

            {/* Publicado */}
            <div className="flex gap-2">
              <input
                id="publicado"
                type="checkbox"
                checked={!!form.publicado}
                onChange={(e) => onChange("publicado", e.target.checked)}
              />
              <label htmlFor="publicado" className="text-sm">
                Publicado
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || uploadingPdf}
                className="inline-flex items-center gap-2 bg-emerald-600 px-4 py-2 text-sm text-white rounded-lg hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando…" : "Guardar"}
              </button>

              <button
                type="button"
                onClick={() => router.replace(`/admin/modulos/${moduloId}/clases`)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
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
