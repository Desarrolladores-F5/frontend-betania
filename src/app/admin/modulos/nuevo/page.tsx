// src/app/admin/modulos/nuevo/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save } from "lucide-react";
import ModuloForm, {
  type ModuloFormValues,
} from "@/app/admin/modulos/ModuloForm";
import {
  CursosAdminAPI,
  ModulosAdminAPI,
  UploadsAPI,
  type CursoDetalle,
} from "@/lib/api";

export default function NuevoModuloPage() {
  const router = useRouter();
  const qs = useSearchParams();

  // Lee curso_id del query (?curso_id=123) y fuerzalo a number
  const cursoId = useMemo(() => {
    const raw = qs.get("curso_id");
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [qs]);

  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [loadingCurso, setLoadingCurso] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (cursoId == null) {
        setError("Falta el parámetro curso_id en la URL.");
        setLoadingCurso(false);
        return;
      }
      try {
        setLoadingCurso(true);
        const c = await CursosAdminAPI.get(cursoId);
        if (alive) setCurso(c);
      } catch {
        if (alive)
          setError("No fue posible obtener los datos del curso asociado.");
      } finally {
        if (alive) setLoadingCurso(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [cursoId]);

  /**
   * Maneja la creación del módulo:
   * 1. Si viene pdf_intro_file, se sube primero a /api/admin/uploads/pdf.
   * 2. Con la URL devuelta, se llama a ModulosAdminAPI.create.
   */
  async function handleCreate(data: ModuloFormValues) {
    if (cursoId == null) {
      setError("curso_id inválido.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // ------------------------------------------------------------
      // 1) Resolver URL del PDF:
      //    - Si el usuario cargó archivo, se sube al backend.
      //    - Si no hay archivo, se usa (si existe) la url escrita en pdf_intro_url.
      // ------------------------------------------------------------
      let pdfUrlToSave: string | undefined;

      // Valor de texto (URL manual) si viene y no es cadena vacía
      if (data.pdf_intro_url && data.pdf_intro_url.trim().length > 0) {
        pdfUrlToSave = data.pdf_intro_url.trim();
      }

      // Leer archivo desde RHF: puede venir como FileList o File
      const rawFile = (data as any).pdf_intro_file as
        | FileList
        | File
        | null
        | undefined;

      const file: File | undefined =
        rawFile && (rawFile as any).length
          ? (rawFile as FileList)[0]
          : (rawFile as File | undefined);

      // Si hay archivo, se sube al backend y se usa la URL resultante
      if (file) {
        const { url } = await UploadsAPI.uploadPdf(file);
        pdfUrlToSave = url;
      }

      // ------------------------------------------------------------
      // 2) Crear módulo en el backend con los campos nuevos
      // ------------------------------------------------------------
      await ModulosAdminAPI.create({
        curso_id: cursoId,
        titulo: data.titulo,
        descripcion: data.descripcion ?? null,
        orden: data.orden ?? undefined,
        activo: data.activo ?? true,
        video_intro_url:
          data.video_intro_url && data.video_intro_url.trim().length > 0
            ? data.video_intro_url.trim()
            : undefined,
        pdf_intro_url: pdfUrlToSave,
      } as any); // cuando actualices tipos de ModulosAdminAPI puedes quitar el "as any"

      // Redirige de vuelta al listado de módulos del curso
      router.replace(`/admin/cursos/${cursoId}/modulos`);
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        e?.message ??
        "No fue posible crear el módulo.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const tituloCurso = curso?.titulo
    ? `“${curso.titulo}”`
    : cursoId != null
    ? `#${cursoId}`
    : "—";

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header estilo tarjeta */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Nuevo módulo</h1>
            <p className="text-sm text-slate-600">
              Curso asociado: {tituloCurso}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6a1b9a] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            ← Volver
          </button>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loadingCurso && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Cargando datos del curso…
          </div>
        )}

        {/* Formulario */}
        <ModuloForm
          onSubmit={handleCreate}
          loading={saving}
          actionsSlot={
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save size={16} />
                Guardar
              </button>

              <button
                type="button"
                onClick={() =>
                  cursoId != null
                    ? router.push(`/admin/cursos/${cursoId}/modulos`)
                    : router.back()
                }
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          }
        />
      </div>
    </main>
  );
}
