// src/app/admin/modulos/[id]/clases/nuevo/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ClasesAdminAPI, ModulosAdminAPI, UploadsAPI } from "@/lib/api";
import { Save, ArrowLeft } from "lucide-react";

type ClaseCreateDTO = {
  modulo_id: number;
  titulo: string;
  descripcion: string | null; // en UI: "Contenido"
  orden: number;
  activo: boolean;

  youtube_id?: string | null;
  youtube_titulo?: string | null;
  youtube_id_extra?: string | null;
  youtube_titulo_extra?: string | null;

  pdf_url?: string | null;
  pdf_titulo?: string | null;

  publicado?: boolean;
};

export default function NuevaClasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const moduloId = Number(id);

  // Encabezado: nombre del módulo
  const [moduloNombre, setModuloNombre] = React.useState<string>("");
  const [loadingModulo, setLoadingModulo] = React.useState<boolean>(true);

  // Form – campos básicos
  const [titulo, setTitulo] = React.useState<string>("");
  const [contenido, setContenido] = React.useState<string>("");
  const [orden, setOrden] = React.useState<number>(1);
  const [activo, setActivo] = React.useState<boolean>(true);

  // Videos
  const [youtubeId, setYoutubeId] = React.useState<string>("");
  const [youtubeTitulo, setYoutubeTitulo] = React.useState<string>("");

  const [youtubeIdExtra, setYoutubeIdExtra] = React.useState<string>("");
  const [youtubeTituloExtra, setYoutubeTituloExtra] = React.useState<string>("");

  // PDF
  const [pdfUrl, setPdfUrl] = React.useState<string>("");
  const [pdfTitulo, setPdfTitulo] = React.useState<string>("");

  // Estado de publicación
  const [publicado, setPublicado] = React.useState<boolean>(true);

  // Estado UI
  const [saving, setSaving] = React.useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    if (!Number.isFinite(moduloId)) {
      setError("Identificador de módulo inválido.");
      setLoadingModulo(false);
      return;
    }

    (async () => {
      try {
        setLoadingModulo(true);
        const m = await ModulosAdminAPI.get(moduloId);
        if (!alive) return;
        setModuloNombre((m?.titulo ?? `#${moduloId}`).toString());
      } catch {
        if (!alive) return;
        setModuloNombre(`#${moduloId}`);
      } finally {
        if (alive) setLoadingModulo(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [moduloId]);

  function toIntOr(defaultVal: number, v: string): number {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultVal;
  }

  /** Subida de PDF → usa UploadsAPI.uploadPdf y rellena pdfUrl */
  async function handlePdfFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
      setError(null);
      const { url } = await UploadsAPI.uploadPdf(file);
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
      setError("No fue posible subir el PDF.");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      const payload: ClaseCreateDTO = {
        modulo_id: moduloId,
        titulo: titulo.trim(),
        descripcion: contenido.trim() ? contenido.trim() : null,
        orden: Number.isFinite(orden) && orden > 0 ? orden : 1,
        activo,

        youtube_id: youtubeId.trim() ? youtubeId.trim() : null,
        youtube_titulo: youtubeTitulo.trim() ? youtubeTitulo.trim() : null,
        youtube_id_extra: youtubeIdExtra.trim() ? youtubeIdExtra.trim() : null,
        youtube_titulo_extra: youtubeTituloExtra.trim()
          ? youtubeTituloExtra.trim()
          : null,

        pdf_url: pdfUrl.trim() ? pdfUrl.trim() : null,
        pdf_titulo: pdfTitulo.trim() ? pdfTitulo.trim() : null,

        publicado,
      };

      await ClasesAdminAPI.create(payload);
      router.replace(`/admin/modulos/${moduloId}/clases`);
    } catch (err) {
      console.error(err);
      setError("No fue posible crear la clase.");
    } finally {
      setSaving(false);
    }
  }

  const tituloModulo = loadingModulo ? `#${moduloId}` : `“${moduloNombre}”`;

  return (
    <main className="p-6">
      {/* Tarjeta principal */}
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Nueva clase</h1>
            <p className="text-sm text-slate-600">
              Crea una clase asociada al módulo {tituloModulo}.
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

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loadingModulo && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Cargando datos del módulo…
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título y Orden */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Introducción al curso"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Orden</label>
              <input
                type="number"
                min={1}
                step={1}
                value={orden}
                onChange={(e) => setOrden(toIntOr(1, e.target.value))}
                placeholder="Ej: 1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600 sm:w-48"
              />
            </div>
          </div>

          {/* Contenido / descripción */}
          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm font-medium text-slate-700">
              Contenido
            </label>
            <textarea
              rows={8}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Resumen o material de la clase…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>

          {/* YouTube principal y adicional */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                YouTube principal – ID
              </label>
              <input
                type="text"
                value={youtubeId}
                onChange={(e) => setYoutubeId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                placeholder="https://www.youtube.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Video adicional – ID
              </label>
              <input
                type="text"
                value={youtubeIdExtra}
                onChange={(e) => setYoutubeIdExtra(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                placeholder="p.ej. otroID"
              />
            </div>
          </div>

          {/* Títulos de los videos */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Título del video
              </label>
              <input
                type="text"
                value={youtubeTitulo}
                onChange={(e) => setYoutubeTitulo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                placeholder="Título visible"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Título video adicional
              </label>
              <input
                type="text"
                value={youtubeTituloExtra}
                onChange={(e) => setYoutubeTituloExtra(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                placeholder="Título visible para el segundo video"
              />
            </div>
          </div>

          {/* PDF URL + título + publicado */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                PDF
              </label>
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                placeholder="http://localhost:3001/uploads/pdfs/..."
              />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Título del PDF
                </label>
                <input
                  type="text"
                  value={pdfTitulo}
                  onChange={(e) => setPdfTitulo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-600"
                  placeholder="Nombre visible del archivo"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-gray-700">
                Publicado
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="publicado"
                  type="checkbox"
                  checked={publicado}
                  onChange={(e) => setPublicado(e.target.checked)}
                />
                <label htmlFor="publicado" className="text-sm text-gray-700">
                  Publicado
                </label>
              </div>
            </div>
          </div>

          {/* Subida de PDF */}
          <div className="grid grid-cols-1 gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Subir PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfFileChange}
              disabled={saving || uploadingPdf}
              className="mt-1 block w-full text-sm text-slate-700"
            />
            {uploadingPdf && (
              <p className="mt-1 text-xs text-slate-500">Subiendo PDF…</p>
            )}
            {pdfUrl && (
              <p className="mt-1 text-xs text-emerald-700 break-all">
                PDF actual: {pdfUrl}
              </p>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Activo
            </label>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || uploadingPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
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
      </div>
    </main>
  );
}
