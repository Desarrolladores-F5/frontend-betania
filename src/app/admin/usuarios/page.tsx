"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsuariosAPI, type UsuarioAdmin } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users as UsersIcon,
  Shield,
  User,
} from "lucide-react";

/* ========================== UTILIDAD ========================== */
function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

/* ========================== COMPONENTES UI ========================== */
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "primary";
}) {
  const tones: Record<typeof tone, string> = {
    neutral: "bg-muted text-foreground/80",
    success: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    danger: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
    primary: "bg-primary/15 text-primary ring-1 ring-primary/30",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-ring";
  const byVariant: Record<typeof variant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-primary text-primary hover:bg-primary/10 bg-transparent",
    ghost: "bg-transparent text-foreground hover:bg-accent",
    danger: "bg-red-500 text-white hover:bg-red-600",
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

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background overflow-hidden">
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              "px-3 py-2 text-sm inline-flex items-center gap-2 font-medium",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground",
              i !== options.length - 1 && "border-r border-border/70"
            )}
            aria-pressed={active}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ========================== PÁGINA PRINCIPAL ========================== */
export default function UsuariosPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<UsuarioAdmin[]>({
    queryKey: ["usuarios"],
    queryFn: UsuariosAPI.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => UsuariosAPI.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const [q, setQ] = React.useState("");
  const [rol, setRol] = React.useState<"all" | "1" | "2">("all");

  const filtered = React.useMemo(() => {
    const items = data ?? [];
    const byText = q
      ? items.filter((u) => {
          const nombreCompleto = `${u.nombres} ${u.apellido_paterno ?? ""} ${u.apellido_materno ?? ""}`
            .replace(/\s+/g, " ")
            .trim();
          const hay = `${nombreCompleto} ${u.email} ${u.rut} ${u.telefono ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase());
          return hay;
        })
      : items;
    return rol === "all" ? byText : byText.filter((u) => String(u.rol_id) === rol);
  }, [data, q, rol]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <HeaderBar count={0} q={q} setQ={setQ} rol={rol} setRol={setRol} />
        <SkeletonTable rows={5} cols={11} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <HeaderBar count={0} q={q} setQ={setQ} rol={rol} setRol={setRol} />
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-red-400 text-sm">Error cargando usuarios.</p>
          <Button variant="ghost" className="mt-3" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!filtered || filtered.length === 0) {
    return (
      <div className="space-y-4">
        <HeaderBar count={0} q={q} setQ={setQ} rol={rol} setRol={setRol} />
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted">No hay usuarios que coincidan con el filtro.</p>
          <LinkButton href="/admin/usuarios/nuevo" variant="success" className="mt-4">
            <Plus className="h-4 w-4" /> Crear primer usuario
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HeaderBar count={filtered.length} q={q} setQ={setQ} rol={rol} setRol={setRol} />

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr className="text-left">
                <Th>ID</Th>
                <Th>RUT</Th>
                <Th>Teléfono</Th>
                <Th>Nombres</Th>
                <Th>Apellido paterno</Th>
                <Th>Apellido materno</Th>
                <Th>F. nacimiento</Th>
                <Th>Email</Th>
                <Th>Rol</Th>
                <Th>Activo</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  className={cx(
                    "border-t border-border",
                    idx % 2 === 0 ? "bg-card" : "bg-card/60"
                  )}
                >
                  <Td>{u.id}</Td>
                  <Td>{u.rut}</Td>
                  <Td>{u.telefono ?? "—"}</Td>
                  <Td>
                    <div className="font-medium">{u.nombres}</div>
                    <div className="text-xs text-muted">
                      Creado: {u.created_at?.slice(0, 10) ?? "—"}
                    </div>
                  </Td>
                  <Td>{u.apellido_paterno ?? "—"}</Td>
                  <Td>{u.apellido_materno ?? "—"}</Td>
                  <Td>{u.fecha_nacimiento ?? "—"}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge tone={u.rol_id === 1 ? "primary" : "neutral"}>
                      {u.rol_id === 1 ? "Admin" : "Usuario"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={u.activo ? "success" : "danger"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-2">
                      <LinkButton
                        href={`/admin/usuarios/${u.id}`}
                        variant="outline"
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </LinkButton>
                      <Button
                        variant="danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (!confirm(`¿Eliminar al usuario #${u.id}?`)) return;
                          deleteMutation.mutate(u.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />{" "}
                        {deleteMutation.isPending ? "..." : "Eliminar"}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ========================== HEADER BAR ========================== */
function HeaderBar({
  count,
  q,
  setQ,
  rol,
  setRol,
}: {
  count: number;
  q: string;
  setQ: (v: string) => void;
  rol: "all" | "1" | "2";
  setRol: (v: "all" | "1" | "2") => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-sm text-muted">Total: {count}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por RUT, teléfono, nombres, apellidos o email…"
            className="pl-8 pr-3 py-2 rounded-lg border border-border bg-background w-80"
          />
        </div>

        {/* Filtro */}
        <Segmented
          value={rol}
          onChange={(v) => setRol(v as "all" | "1" | "2")}
          options={[
            { value: "all", label: "Todos", icon: <UsersIcon className="h-4 w-4" /> },
            { value: "1", label: "Admin", icon: <Shield className="h-4 w-4" /> },
            { value: "2", label: "Usuario", icon: <User className="h-4 w-4" /> },
          ]}
        />

        {/* Botones */}
        <div className="flex gap-2">
          <LinkButton href="/admin/dashboard" variant="primary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </LinkButton>

          <LinkButton href="/admin/usuarios/nuevo" variant="success">
            <Plus className="h-4 w-4" /> Nuevo Usuario
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

/* ========================== TABLA Y PLACEHOLDERS ========================== */
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cx("p-3 text-xs font-semibold uppercase tracking-wide text-muted", className)}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={cx("p-3 align-middle", className)}>{children}</td>;
}

function SkeletonTable({ rows = 5, cols = 11 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted h-10" />
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((__, c) => (
              <div key={c} className="p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
