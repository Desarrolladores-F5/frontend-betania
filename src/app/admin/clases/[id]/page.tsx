"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClasesAdminAPI, type ClaseListItem } from "@/lib/api";
import { ArrowLeft, Plus, PencilLine, Trash2 } from "lucide-react";

/* ========================== utils ========================== */
function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
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

/* ========================== Página ========================== */
export default function ClasesByModuloPage() {
  const params = useParams<{ id: string }>();
  const moduloId = Number(params?.id);

  const [rows, setRows] = useState<ClaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // formulario alta rápida
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<"video" | "pdf" | "html" | "link">("video");
  const [contenidoUrl, setContenidoUrl] = useState("");
  const [duracion, setDuracion] = useState<number | "">("");
  const [orden, setOrden] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      try {
        const data = await ClasesAdminAPI.listByModulo(moduloId);
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar clases");
      } finally {
        setLoading(false);
      }
    })();
  }, [moduloId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }
    try {
      const nueva = await ClasesAdminAPI.create({
        modulo_id: moduloId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        contenido_url: contenidoUrl.trim() || null,
        duracion_segundos: typeof duracion === "number" ? duracion : null,
        orden: typeof orden === "number" ? orden : null,
        activo: true,
      });
      setRows((prev) =>
        [...prev, nueva].sort(
          (a, b) =>
            (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id
        )
      );
      setTitulo("");
      setDescripcion("");
      setContenidoUrl("");
      setDuracion("");
      setOrden("");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear la clase");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta clase? Esta acción no se puede deshacer.")) return;
    try {
      await ClasesAdminAPI.remove(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la clase");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkButton href={`/admin/cursos`} variant="primary">
            <ArrowLeft className="h-4 w-4" />
            Volver a Cursos
          </LinkButton>
          <h2 className="text-2xl font-bold tracking-tight">
            Clases del módulo #{moduloId}
          </h2>
        </div>
      </div>

      {/* Formulario alta rápida */}
      <form onSubmit={handleCreate} className="rounded-xl border p-4 bg-card shadow-sm space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nueva clase
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la clase"
            className="border rounded-lg px-3 py-2"
          />
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="html">HTML</option>
            <option value="link">Link</option>
          </select>
          <input
            value={contenidoUrl}
            onChange={(e) => setContenidoUrl(e.target.value)}
            placeholder="URL del contenido (opcional)"
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Duración (seg) opcional"
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            value={orden}
            onChange={(e) => setOrden(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Orden (opcional)"
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div className="pt-2">
          <Button type="submit" variant="success">
            <Plus className="h-4 w-4" />
            Crear clase
          </Button>
        </div>
      </form>

      {/* Listado */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : err ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center bg-card/60 shadow-lg">
            No hay clases. Crea la primera arriba.
          </div>
        ) : (
          rows
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id)
            .map((c) => (
              <div
                key={c.id}
                className="rounded-xl border p-4 bg-card shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{c.titulo}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.tipo?.toUpperCase()}
                    {c.contenido_url ? ` · ${c.contenido_url}` : ""}
                    {typeof c.duracion_segundos === "number" ? ` · ${c.duracion_segundos}s` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Orden: {c.orden ?? 0} · ID: {c.id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LinkButton href={`/admin/clases/${c.id}`} variant="outline">
                    <PencilLine className="h-4 w-4" />
                    Editar
                  </LinkButton>
                  <Button variant="danger" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
