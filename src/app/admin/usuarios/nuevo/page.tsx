"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsuariosAPI } from "@/lib/api";
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
    <a
      href={href}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring",
        byVariant[variant],
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

/* ========================== página ========================== */
export default function NewUsuarioPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: {
      rut: string;
      telefono?: string | null;
      nombres: string;
      apellido_paterno?: string | null;
      apellido_materno?: string | null;
      fecha_nacimiento?: string | null; // 'YYYY-MM-DD'
      email: string;
      password: string;
      rol_id: number;
      activo?: boolean;
    }) => UsuariosAPI.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      router.replace("/admin/usuarios");
    },
  });

  function normalizarRut(raw: string): string {
    return raw.replace(/\s+/g, "").toUpperCase();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rut = normalizarRut(String(fd.get("rut") || ""));
    const telefono = String(fd.get("telefono") || "").trim();
    const nombres = String(fd.get("nombres") || "").trim();
    const apellido_paterno = String(fd.get("apellido_paterno") || "").trim();
    const apellido_materno = String(fd.get("apellido_materno") || "").trim();
    const fecha_nacimiento = String(fd.get("fecha_nacimiento") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const rol_id = Number(fd.get("rol_id") || 2);
    const activo = fd.get("activo") === "on";

    if (!rut || !nombres || !email || !password) {
      alert("Campos obligatorios: RUT, nombres, email y contraseña.");
      return;
    }
    if (rut.length < 7) {
      alert("RUT inválido.");
      return;
    }

    createMutation.mutate({
      rut,
      telefono: telefono || null,
      nombres,
      apellido_paterno: apellido_paterno || null,
      apellido_materno: apellido_materno || null,
      fecha_nacimiento: fecha_nacimiento || null,
      email,
      password,
      rol_id,
      activo,
    });
  }

  const disabled = createMutation.isPending;

  return (
    <div className="flex justify-center items-start min-h-dvh p-6">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nuevo Usuario</h1>

          {/* Volver (morado) */}
          <Button
            variant="primary"
            onClick={() => router.replace("/admin/usuarios")}
            aria-label="Volver a la lista de usuarios"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        {/* formulario */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">RUT *</label>
              <input
                name="rut"
                placeholder="12.345.678-9"
                className="px-3 py-2 rounded border border-border bg-card w-full"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Teléfono</label>
              <input
                name="telefono"
                placeholder="+56 9 1234 5678"
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Nombres *</label>
              <input
                name="nombres"
                placeholder="Juan Carlos"
                className="px-3 py-2 rounded border border-border bg-card w-full"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Apellido paterno</label>
              <input
                name="apellido_paterno"
                placeholder="Pérez"
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Apellido materno</label>
              <input
                name="apellido_materno"
                placeholder="González"
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Fecha de nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Email *</label>
            <input
              type="email"
              name="email"
              placeholder="usuario@correo.com"
              className="px-3 py-2 rounded border border-border bg-card w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Contraseña *</label>
            <input
              type="password"
              name="password"
              className="px-3 py-2 rounded border border-border bg-card w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Rol</label>
              <select
                name="rol_id"
                defaultValue="2"
                className="px-3 py-2 rounded border border-border bg-card w-full"
              >
                <option value="1">Administrador</option>
                <option value="2">Usuario</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked
                  className="accent-[var(--primary)]"
                />
                Activo
              </label>
            </div>
          </div>

          {/* acciones */}
          <div className="flex gap-2 pt-4">
            {/* Guardar (verde éxito) */}
            <Button type="submit" variant="success" disabled={disabled}>
              <Save className="h-4 w-4" />
              {disabled ? "Guardando…" : "Guardar"}
            </Button>

            {/* Cancelar (outline) */}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace("/admin/usuarios")}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-400">
              Error: {(createMutation.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
