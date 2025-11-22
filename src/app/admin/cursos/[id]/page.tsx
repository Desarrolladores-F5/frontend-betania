"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import CursoForm, { type CursoFormValues } from "@/app/admin/cursos/CursoForm";
import { CursosAdminAPI, type CursoDetalle } from "@/lib/api";
import { ArrowLeft, Save, X } from "lucide-react";

/* ========================== util ========================== */
function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

/* ========================== UI base ========================== */
function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "success";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring";
  const byVariant: Record<typeof variant, string> = {
    primary:
      "bg-[#7b1fa2] text-white hover:bg-[#6a1b9a] transition-colors duration-150",
    outline:
      "border border-primary text-primary hover:bg-primary/10 bg-transparent",
    ghost: "bg-transparent text-foreground hover:bg-accent",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-150",
  };
  return (
    <button className={cx(base, byVariant[variant], className)} {...props}>
      {children}
    </button>
  );
}

function LinkButton({
  href,
  children,
  variant = "primary",
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "success";
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const byVariant: Record<typeof variant, string> = {
    primary:
      "bg-[#7b1fa2] text-white hover:bg-[#6a1b9a] transition-colors duration-150",
    outline:
      "border border-primary text-primary hover:bg-primary/10 bg-transparent",
    ghost: "bg-transparent text-foreground hover:bg-accent",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-150",
  };
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring",
        byVariant[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/* ========================== página ========================== */
export default function AdminCursoEditPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const router = useRouter();

  const [curso, setCurso] = React.useState<CursoDetalle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      setErr("ID de curso inválido.");
      return;
    }
    (async () => {
      try {
        const data = await CursosAdminAPI.get(id);
        setCurso(data);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar curso");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async (values: CursoFormValues) => {
    await CursosAdminAPI.update(id, values);
    router.replace(`/admin/cursos`);
  };

  const defaults: CursoFormValues | undefined = curso
    ? {
        titulo: curso.titulo,
        descripcion: curso.descripcion ?? null,
        portada_url: curso.portada_url ?? null,
        // publicado: curso.publicado,
        // activo: curso.activo,
      }
    : undefined;

  /* ===== Estados previos ===== */
  if (!Number.isFinite(id)) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-4">
          <p className="text-red-400">ID de curso inválido.</p>
          <LinkButton href="/admin/cursos" variant="primary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </LinkButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-4">
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
          <LinkButton href="/admin/cursos" variant="primary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Curso no encontrado.</p>
          <LinkButton href="/admin/cursos" variant="primary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </LinkButton>
        </div>
      </div>
    );
  }

  /* ===== UI principal ===== */
  return (
    <div className="flex justify-center items-start min-h-dvh p-6">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Editar curso #{Number.isFinite(id) ? id : "—"}
          </h1>

          {/* Volver morado */}
          <LinkButton href="/admin/cursos" variant="primary" aria-label="Volver a cursos">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </LinkButton>
        </div>

        {/* Formulario */}
        <CursoForm
          defaultValues={defaults}
          onSubmit={onSubmit}
          submittingText="Actualizando…"
          footer={
            <div className="flex gap-2 pt-4">
              {/* Actualizar (verde éxito) */}
              <Button type="submit" form="curso-form" variant="success">
                <Save className="h-4 w-4" />
                Actualizar
              </Button>

              {/* Cancelar (outline) */}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.replace("/admin/cursos")}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
