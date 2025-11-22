// src/app/admin/modulos/ModuloForm.tsx
"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ModuloSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().optional().nullable(),
  orden: z.number().int().nullable().optional(),
  activo: z.boolean().optional(),
  video_intro_url: z
    .union([z.string().url("URL inválida"), z.literal(""), z.null()])
    .optional(),
  pdf_intro_url: z
    .union([z.string().url("URL inválida"), z.literal(""), z.null()])
    .optional(),
  pdf_intro_file: z.any().optional(),
});

export type ModuloFormValues = z.infer<typeof ModuloSchema>;

type Props = {
  defaultValues?: Partial<ModuloFormValues>;
  onSubmit: (data: ModuloFormValues) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
  actionsSlot?: React.ReactNode;
};

export default function ModuloForm({
  defaultValues,
  onSubmit,
  submitLabel = "Guardar cambios",
  loading = false,
  actionsSlot,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ModuloFormValues>({
    resolver: zodResolver(ModuloSchema),
    defaultValues: {
      titulo: defaultValues?.titulo ?? "",
      descripcion: defaultValues?.descripcion ?? "",
      orden: typeof defaultValues?.orden === "number" ? defaultValues.orden : null,
      activo: defaultValues?.activo ?? true,
      video_intro_url: defaultValues?.video_intro_url ?? "",
      pdf_intro_url: defaultValues?.pdf_intro_url ?? "",
    },
  });

  const disabled = loading || isSubmitting;
  const onValidSubmit: SubmitHandler<ModuloFormValues> = (data) => onSubmit(data);

  return (
    <form
      onSubmit={handleSubmit(onValidSubmit)}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Título <span className="text-red-600">*</span>
          </label>
          <input
            {...register("titulo")}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Ej: Introducción a la Seguridad"
            disabled={disabled}
          />
          {errors.titulo && <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Orden</label>
          <input
            type="number"
            {...register("orden", {
              setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
            })}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Ej: 1"
            disabled={disabled}
          />
          {errors.orden && <p className="mt-1 text-sm text-red-600">{errors.orden.message as string}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <input
            {...register("descripcion")}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Opcional"
            disabled={disabled}
          />
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-600">{errors.descripcion.message as string}</p>
          )}
        </div>

        <div className="md:col-span-2 mt-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Recursos iniciales del módulo (opcionales)
          </h2>
          <p className="text-xs text-slate-500">
            Estos serán los primeros recursos que verá el beneficiario al ingresar al módulo.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Video  (YouTube)</label>
          <input
            type="url"
            {...register("video_intro_url")}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={disabled}
          />
          {errors.video_intro_url && (
            <p className="mt-1 text-sm text-red-600">{errors.video_intro_url.message as string}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PDF  (URL)</label>
          <input
            type="url"
            {...register("pdf_intro_url")}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="URL del PDF (ej: https://tusarchivos.com/intro.pdf)"
            disabled={disabled}
          />
          {errors.pdf_intro_url && (
            <p className="mt-1 text-sm text-red-600">{errors.pdf_intro_url.message as string}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Subir PDF</label>
          <input
            type="file"
            accept="application/pdf"
            {...register("pdf_intro_file")}
            className="w-full rounded-lg border px-3 py-2"
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="activo"
            type="checkbox"
            {...register("activo")}
            className="h-4 w-4"
            disabled={disabled}
          />
          <label htmlFor="activo" className="text-sm">
            Activo
          </label>
        </div>
      </div>

      <div className="pt-2">
        {actionsSlot ? (
          actionsSlot
        ) : (
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7b1fa2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6a1b9a]"
          >
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
