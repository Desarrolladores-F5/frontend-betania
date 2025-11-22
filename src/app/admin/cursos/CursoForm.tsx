'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { UploadsAPI, FILES_BASE_URL } from '@/lib/api';

/* ======================== Constantes ======================== */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/* ======================== Esquema =========================== */
// Permite: vacío (''), absoluta (http/https) o relativa que empiece con "/"
const PortadaSchema = z
  .union([
    z.string().trim().length(0),
    z.string().trim().url(),
    z.string().trim().regex(/^\/\S+$/, 'URL inválida'),
  ])
  .optional()
  .nullable();

const CursoSchema = z.object({
  titulo: z.string().trim().min(1, 'Título requerido'),
  descripcion: z.string().trim().optional().nullable(),
  portada_url: PortadaSchema,
  publicado: z.boolean().optional(),
  activo: z.boolean().optional(),
});

export type CursoFormValues = z.infer<typeof CursoSchema>;

/* ======================== Props ============================= */
type Props = {
  defaultValues?: CursoFormValues;
  submittingText?: string;
  onSubmit: (values: CursoFormValues) => Promise<void>;
  footer?: ReactNode;
};

/* ======================== Componente ======================== */
export default function CursoForm({
  defaultValues,
  onSubmit,
  submittingText = 'Guardando…',
  footer,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CursoFormValues>({
    defaultValues: {
      titulo: '',
      descripcion: '',
      portada_url: '',
      publicado: false,
      activo: true,
      ...defaultValues,
    },
    resolver: zodResolver(CursoSchema),
  });

  const rawPortadaUrl = watch('portada_url') ?? '';
  const portadaUrl =
    typeof rawPortadaUrl === 'string' && rawPortadaUrl.startsWith('/')
      ? `${FILES_BASE_URL}${rawPortadaUrl}`
      : rawPortadaUrl || '';

  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ===================== Helpers ============================ */
  const validate = (file: File) => {
    if (!ACCEPTED.includes(file.type as any))
      throw new Error('Formato no permitido. Usa JPG, PNG, WEBP o GIF.');
    if (file.size > MAX_IMAGE_BYTES)
      throw new Error('El archivo excede los 10MB permitidos.');
  };

  const doUpload = useCallback(
    async (file: File) => {
      setErr(null);
      validate(file);
      setUploading(true);
      try {
        const { url } = await UploadsAPI.uploadImagen(file);
        // Guardar tal cual lo devuelve el backend (relativa o absoluta)
        setValue('portada_url', url ?? '', { shouldDirty: true, shouldValidate: true });
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'No se pudo subir la portada');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [setValue]
  );

  const onPick = () => fileInputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (file) await doUpload(file);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await doUpload(file);
  };

  const clearPortada = () => setValue('portada_url', '', { shouldDirty: true, shouldValidate: true });

  const submit = async (values: CursoFormValues) => {
    setErr(null);
    try {
      const payload: CursoFormValues = {
        ...values,
        // Normaliza strings vacías a null antes de enviar al backend
        descripcion: values.descripcion?.trim() ? values.descripcion : null,
        portada_url: values.portada_url?.trim() ? values.portada_url : null,
      };
      await onSubmit(payload);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al guardar curso');
    }
  };

  const disabled = isSubmitting || uploading;

  /* ======================== UI ============================== */
  return (
    <form id="curso-form" onSubmit={handleSubmit(submit)} className="space-y-5" aria-busy={disabled}>
      {/* Error general */}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Título */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Título *</label>
        <input
          {...register('titulo')}
          className="w-full rounded-lg border border-input bg-background p-2 outline-none focus:ring-2 focus:ring-primary"
          placeholder="Seguridad Industrial 101"
          disabled={disabled}
          aria-invalid={!!errors.titulo}
        />
        {errors.titulo && <div className="text-xs text-red-600">{errors.titulo.message}</div>}
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          {...register('descripcion')}
          className="w-full rounded-lg border border-input bg-background p-2 min-h-28 outline-none focus:ring-2 focus:ring-primary"
          placeholder="Breve descripción del curso…"
          disabled={disabled}
        />
      </div>

      {/* Dropzone / Selector */}
      <div
        onClick={onPick} // clic abre el selector
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick()}
        className={`rounded-lg border ${
          dragActive ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-dashed'
        } p-4 transition cursor-pointer`}
        aria-label="Zona para arrastrar o seleccionar una imagen de portada"
        aria-disabled={disabled}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-medium">Arrastra y suelta la portada aquí</div>
            <div className="text-muted-foreground">o</div>
            <div className="text-xs text-muted-foreground mt-1">
              Formatos permitidos: JPG, PNG, WEBP, GIF. Máx: 10MB.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPick();
              }}
              disabled={disabled}
              className="px-3 py-2 rounded border border-border hover:bg-accent/50"
            >
              Elegir archivo…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={onFileChange}
              className="hidden"
              aria-hidden
            />
          </div>
        </div>

        {/* Preview */}
        {portadaUrl && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-1">Previsualización</div>

            <div
              className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30"
              style={{ aspectRatio: '16 / 9' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portadaUrl}
                alt="Portada del curso"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>

            <div className="text-xs mt-1 break-all">{portadaUrl}</div>
            <div className="mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearPortada();
                }}
                disabled={disabled}
                className="px-3 py-2 rounded border border-border hover:bg-muted"
              >
                Quitar portada
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-3 text-sm text-muted-foreground">Subiendo portada…</div>
        )}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap items-center gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm select-none">
          <input type="checkbox" {...register('publicado')} className="accent-primary" disabled={disabled} /> Publicado
        </label>
        <label className="flex items-center gap-2 text-sm select-none">
          <input type="checkbox" {...register('activo')} className="accent-primary" defaultChecked disabled={disabled} /> Activo
        </label>
      </div>

      {/* Footer */}
      {footer ?? (
        <div className="pt-2">
          <button
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
          >
            {isSubmitting ? submittingText : 'Guardar'}
          </button>
        </div>
      )}
    </form>
  );
}
