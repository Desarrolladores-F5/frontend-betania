"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CursoForm, { type CursoFormValues } from "@/app/admin/cursos/CursoForm";
import { CursosAdminAPI } from "@/lib/api";
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
export default function AdminCursoNuevoPage() {
  const router = useRouter();

  const onSubmit = async (values: CursoFormValues) => {
    const created = await CursosAdminAPI.create(values);
    const id = (created as any)?.id ?? created?.id;
    router.replace(id ? `/admin/cursos/${id}` : "/admin/cursos");
  };

  return (
    <div className="flex justify-center items-start min-h-dvh p-6">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nuevo curso</h1>

          {/* Volver (morado) */}
          <LinkButton href="/admin/cursos" variant="primary" aria-label="Volver a cursos">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </LinkButton>
        </div>

        {/* Formulario */}
        <CursoForm
          submittingText="Creando…"
          onSubmit={onSubmit}
          footer={
            <div className="flex gap-2 pt-4">
              {/* Guardar (verde éxito) */}
              <Button type="submit" form="curso-form" variant="success">
                <Save className="h-4 w-4" />
                Guardar
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
