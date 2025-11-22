"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsuariosAPI, type UsuarioAdmin } from "@/lib/api";
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

/* ========================== página ========================== */
export default function EditUsuarioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const userId = Number(params?.id);

  const { data, isLoading, isError } = useQuery<UsuarioAdmin>({
    queryKey: ["admin-usuario", userId],
    queryFn: () => UsuariosAPI.get(userId),
    enabled: Number.isFinite(userId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UsuarioAdmin> & { password?: string }) =>
      UsuariosAPI.update(userId, payload),
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

    const rawRol = Number(fd.get("rol_id") || 2);
    const rol_id: 1 | 2 = rawRol === 1 ? 1 : 2;

    const payload: Partial<UsuarioAdmin> & { password?: string } = {
      rut: normalizarRut(String(fd.get("rut") || "")),
      telefono: (String(fd.get("telefono") || "").trim() || null) as string | null,
      nombres: String(fd.get("nombres") || "").trim(),
      apellido_paterno: (String(fd.get("apellido_paterno") || "").trim() || null) as string | null,
      apellido_materno: (String(fd.get("apellido_materno") || "").trim() || null) as string | null,
      fecha_nacimiento: (String(fd.get("fecha_nacimiento") || "").trim() || null) as string | null,
      email: String(fd.get("email") || "").trim(),
      rol_id,
      activo: fd.get("activo") === "on",
    };

    const rawPass = String(fd.get("password") || "");
    if (rawPass) payload.password = rawPass;

    updateMutation.mutate(payload);
  }

  if (!Number.isFinite(userId)) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-4">
          <p className="text-red-400">ID inválido.</p>
          <Button variant="primary" onClick={() => router.replace("/admin/usuarios")}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6">
          <p className="text-sm text-muted-foreground">Cargando usuario…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex justify-center items-start min-h-dvh p-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-4">
          <p className="text-red-400">Error al cargar el usuario.</p>
          <Button variant="primary" onClick={() => router.replace("/admin/usuarios")}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const disabled = updateMutation.isPending;

  return (
    <div className="flex justify-center items-start min-h-dvh p-6">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-lg p-6 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Usuario #{data.id}</h1>
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
          {/* RUT / Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">RUT *</label>
              <input
                name="rut"
                defaultValue={data.rut}
                className="px-3 py-2 rounded border border-border bg-card w-full"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Teléfono</label>
              <input
                name="telefono"
                defaultValue={data.telefono ?? ""}
                className="px-3 py-2 rounded border border-border bg-card w-full"
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          {/* Nombres / Apellidos / Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Nombres *</label>
              <input
                name="nombres"
                defaultValue={data.nombres}
                className="px-3 py-2 rounded border border-border bg-card w-full"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Apellido paterno</label>
              <input
                name="apellido_paterno"
                defaultValue={data.apellido_paterno ?? ""}
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Apellido materno</label>
              <input
                name="apellido_materno"
                defaultValue={data.apellido_materno ?? ""}
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Fecha de nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                defaultValue={data.fecha_nacimiento ?? ""}
                className="px-3 py-2 rounded border border-border bg-card w-full"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm">Email *</label>
            <input
              type="email"
              name="email"
              defaultValue={data.email}
              className="px-3 py-2 rounded border border-border bg-card w-full"
              required
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-sm">Contraseña</label>
            <input
              type="password"
              name="password"
              className="px-3 py-2 rounded border border-border bg-card w-full"
              placeholder="(Dejar vacío para no cambiar)"
            />
          </div>

          {/* Rol y Activo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm">Rol</label>
              <select
                name="rol_id"
                defaultValue={String(data.rol_id)}
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
                  defaultChecked={data.activo}
                  className="accent-[var(--primary)]"
                />
                Activo
              </label>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="success" disabled={disabled}>
              <Save className="h-4 w-4" />
              {disabled ? "Guardando…" : "Guardar"}
            </Button>
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

          {updateMutation.isError && (
            <p className="text-sm text-red-400">
              Error: {(updateMutation.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
