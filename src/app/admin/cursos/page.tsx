"use client";

import * as React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CursoListItem } from "@/lib/api";
import { CursosAdminAPI, FILES_BASE_URL } from "@/lib/api";
import { Image as ImageIcon, PencilLine, Plus, ArrowLeft, Trash2, BookOpen } from "lucide-react";

/* ========================== utils ========================== */
function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function normalizeCover(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${FILES_BASE_URL}${url}` : url;
}

/* ========================== UI base ========================== */
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
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring";
  const byVariant: Record<Required<NonNullable<typeof variant>>, string> = {
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
      className={cx(base, byVariant[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

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
  const byVariant: Record<Required<NonNullable<typeof variant>>, string> = {
    primary:
      "bg-[#7b1fa2] text-white hover:bg-[#6a1b9a] transition-colors duration-150",
    outline:
      "border border-primary text-primary hover:bg-primary/10 bg-transparent",
    ghost: "bg-transparent text-foreground hover:bg-accent",
    danger:
      "bg-red-500 text-white hover:bg-red-600 transition-colors duration-150",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 transition-colors duration-150",
  };
  return (
    <button className={cx(base, byVariant[variant], className)} {...props}>
      {children}
    </button>
  );
}

/* ========================== badges / skeleton ========================== */
function Badge({
  children,
  variant = "secondary",
}: {
  children: React.ReactNode;
  variant?: "secondary" | "warning";
}) {
  const classes =
    variant === "warning"
      ? "bg-amber-600/15 text-amber-400 ring-1 ring-amber-500/30"
      : "bg-black/30 text-white/90 ring-1 ring-white/10";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <div className="relative h-64 w-full bg-muted animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
        <div className="flex gap-3 pt-2">
          <div className="h-9 w-28 rounded bg-muted animate-pulse" />
          <div className="h-9 w-36 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ========================== página ========================== */
export default function Page() {
  const [rows, setRows] = useState<CursoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await CursosAdminAPI.list();
        setRows(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Error al cargar cursos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id: number) {
    if (
      !confirm(
        "¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await CursosAdminAPI.remove(id);
      setRows((prev) => prev.filter((c) => c.id !== id));
      alert("Curso eliminado correctamente.");
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al eliminar el curso.");
    }
  }

  const haveCourses = rows.length > 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <Header />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <Header />
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-6">
      <Header />

      {!haveCourses ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-card/60 shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Aún no hay cursos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primer curso para comenzar a poblar el catálogo.
          </p>
          <div className="mt-4">
            <LinkButton href="/admin/cursos/nuevo" variant="success">
              <Plus className="h-4 w-4" />
              Crear curso
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rows.map((c) => {
            const cover = normalizeCover(c.portada_url);
            const activo = c.activo ?? true;
            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              >
                <div className="relative h-64 w-full bg-muted">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={`Portada del curso ${c.titulo}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-sm">Sin portada</span>
                      </div>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute left-4 top-4 flex gap-2">
                    {!activo && <Badge variant="warning">Inactivo</Badge>}
                    <Badge>#{c.id}</Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold leading-tight">
                    {c.titulo}
                  </h3>
                  {c.descripcion ? (
                    <p className="mt-3 line-clamp-3 text-base text-muted-foreground">
                      {c.descripcion}
                    </p>
                  ) : (
                    <p className="mt-3 text-base text-muted-foreground italic">
                      Sin descripción.
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {/* Editar */}
                    <LinkButton
                      href={`/admin/cursos/${c.id}`}
                      variant="outline"
                    >
                      <PencilLine className="h-4 w-4" />
                      Editar
                    </LinkButton>

                    {/* Módulos */}
                    <LinkButton
                      href={`/admin/cursos/${c.id}/modulos`}
                      variant="primary"
                    >
                      <BookOpen className="h-4 w-4" />
                      Módulos
                    </LinkButton>

                    {/* Eliminar */}
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================== Header ========================== */
function Header() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LinkButton
          href="/admin/dashboard"
          variant="primary"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </LinkButton>
        <h2 className="text-2xl font-bold tracking-tight">Cursos</h2>
      </div>

      <LinkButton
        href="/admin/cursos/nuevo"
        variant="success"
        aria-label="Crear un nuevo curso"
      >
        <Plus className="h-4 w-4" />
        Nuevo curso
      </LinkButton>
    </div>
  );
}
