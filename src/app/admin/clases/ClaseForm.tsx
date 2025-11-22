// src/app/admin/clases/ClaseForm.tsx
"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * Nuevo esquema de validación para reflejar 100% la BD
 */
const ClaseSchema = z.object({
  modulo_id: z.number().int().positive(),
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().optional().nullable(),

  youtube_id: z.string().max(64).optional().or(z.literal("")).or(z.null()),
  youtube_titulo: z.string().max(255).optional().or(z.literal("")).or(z.null()),

  youtube_id_extra: z.string().max(64).optional().or(z.literal("")).or(z.null()),
  youtube_titulo_extra: z.string().max(255).optional().or(z.literal("")).or(z.null()),

  pdf_url: z.string().max(1024).optional().or(z.literal("")).or(z.null()),
  pdf_titulo: z.string().max(255).optional().or(z.literal("")).or(z.null()),

  orden: z.number().int().nullable().optional(),
  activo: z.boolean().optional(),
});

export type ClaseFormValues = z.infer<typeof ClaseSchema>;

type ModuloOption = { id: number; titulo: string };

type Props = {
  moduloId?: number;
  moduloTitulo?: string;
  moduloOptions?: ModuloOption[];
  defaultValues?: Partial<ClaseFormValues>;
  onSubmit: (data: ClaseFormValues) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
};

export default function ClaseForm({
  moduloId,
  moduloTitulo,
  moduloOptions = [],
  defaultValues,
  onSubmit,
  submitLabel = "Guardar",
  loading = false,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClaseFormValues>({
    resolver: zodResolver(ClaseSchema),
    defaultValues: {
      modulo_id:
        typeof moduloId === "number"
          ? moduloId
          : typeof defaultValues?.modulo_id === "number"
          ? defaultValues.modulo_id
          : (undefined as unknown as number),
      titulo: defaultValues?.titulo ?? "",
      descripcion: defaultValues?.descripcion ?? "",
      youtube_id: defaultValues?.youtube_id ?? "",
      youtube_titulo: defaultValues?.youtube_titulo ?? "",
      youtube_id_extra: defaultValues?.youtube_id_extra ?? "",
      youtube_titulo_extra: defaultValues?.youtube_titulo_extra ?? "",
      pdf_url: defaultValues?.pdf_url ?? "",
      pdf_titulo: defaultValues?.pdf_titulo ?? "",
      orden: typeof defaultValues?.orden === "number" ? defaultValues.orden : 1,
      activo: defaultValues?.activo ?? true,
    },
  });

  const disabled = loading || isSubmitting;
  const onValidSubmit: SubmitHandler<ClaseFormValues> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
      {/* Información general */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Módulo */}
          {typeof moduloId === "number" ? (
            <>
              <input
                type="hidden"
                {...register("modulo_id", { setValueAs: () => moduloId })}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Módulo</label>
                <div className="px-3 py-2 border rounded-lg bg-muted">
                  {moduloTitulo ? `“${moduloTitulo}”` : `#${moduloId}`}
                </div>
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Módulo <span className="text-red-600">*</span>
              </label>
              <select
                {...register("modulo_id", {
                  setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
                })}
                className="w-full border rounded-lg px-3 py-2"
                disabled={disabled}
                defaultValue={defaultValues?.modulo_id ?? ""}
              >
                <option value="">Seleccione un módulo…</option>
                {moduloOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} — {m.titulo}
                  </option>
                ))}
              </select>
              {errors.modulo_id && (
                <p className="mt-1 text-sm text-red-600">{errors.modulo_id.message}</p>
              )}
            </div>
          )}

          {/* Título */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Título de la lección <span className="text-red-600">*</span>
            </label>
            <input
              {...register("titulo")}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Ej: Introducción al curso"
              disabled={disabled}
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          {/* Contenido */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Contenido / resumen</label>
            <textarea
              {...register("descripcion")}
              className="w-full border rounded-lg px-3 py-2 min-h-[160px]"
              placeholder="Descripción de la clase…"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* 📦 Recursos de la lección */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium mb-4">Recursos de la lección</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video principal */}
          <div>
            <label className="block text-sm font-medium mb-1">Título video principal</label>
            <input {...register("youtube_titulo")} className="w-full border rounded-lg px-3 py-2" />
            <input
              {...register("youtube_id")}
              className="w-full mt-2 border rounded-lg px-3 py-2"
              placeholder="ID o URL del video"
            />
          </div>

          {/* Video adicional */}
          <div>
            <label className="block text-sm font-medium mb-1">Título video adicional</label>
            <input {...register("youtube_titulo_extra")} className="w-full border rounded-lg px-3 py-2" />
            <input
              {...register("youtube_id_extra")}
              className="w-full mt-2 border rounded-lg px-3 py-2"
              placeholder="ID o URL del video extra"
            />
          </div>

          {/* PDF */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Título del PDF</label>
            <input {...register("pdf_titulo")} className="w-full border rounded-lg px-3 py-2" />
            <input
              {...register("pdf_url")}
              className="w-full mt-2 border rounded-lg px-3 py-2"
              placeholder="https://ruta/archivo.pdf"
            />
          </div>
        </div>
      </div>

      {/* Orden y estado */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Orden</label>
            <input
              type="number"
              {...register("orden", { setValueAs: (v) => (v === "" || v === undefined ? 1 : Number(v)) })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="activo" type="checkbox" {...register("activo")} className="h-4 w-4" />
            <label htmlFor="activo" className="text-sm">Activo</label>
          </div>
        </div>
      </div>

      {/* Botón */}
      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:opacity-95"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
