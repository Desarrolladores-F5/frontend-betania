// src/components/auth/LoginForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

const LoginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
  remember: z.boolean().optional(),
});
type LoginData = z.infer<typeof LoginSchema>;

function resolveRole(user: any): "admin" | "supervisor" | "user" {
  const r = (user?.rol ?? user?.role ?? "").toString().toLowerCase();
  if (r === "admin" || r === "supervisor" || r === "user" || r === "usuario") {
    return r === "usuario" ? "user" : (r as any);
  }

  const rid = Number(user?.rol_id ?? user?.role_id);
  if (Number.isFinite(rid)) {
    if (rid === 1) return "admin";
    if (rid === 2) return "user";
  }

  return "user";
}

export default function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(raw: LoginData) {
    setErrorMsg(null);

    const payload = {
      email: raw.email.trim().toLowerCase(),
      password: raw.password.trim(),
      remember: !!raw.remember,
    };

    try {
      // Esperado (nuevo): { token: string, user: { ... } }
      const res = await api.post("/auth/login", payload);

      const user = res.data?.user;
      const token = res.data?.token; // ✅ 1) tomar token

      if (!user) throw new Error("Respuesta inválida: falta 'user'");
      if (!token || typeof token !== "string") {
        throw new Error("Respuesta inválida: falta 'token'");
      }

      // ✅ 2) Guardar token para Safari (Bearer)
      // (mínimo viable; luego lo usaremos en api.ts con interceptor)
      localStorage.setItem("token", token);

      const role = resolveRole(user);

      // ✅ 3) Redirección según rol
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "supervisor") {
        router.replace("/supervisor/dashboard");
      } else {
        router.replace("/user/dashboard");
      }
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.error ?? err?.response?.data?.message;

      setErrorMsg(
        backendMsg
          ? String(backendMsg)
          : "Credenciales inválidas o error de conexión."
      );

      console.error("Error autenticación:", err);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-stack" noValidate>
      {errorMsg && (
        <div role="alert" className="text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="email" className="field-label">
          Beneficiario (email)
        </label>
        <input
          id="email"
          {...register("email")}
          type="email"
          placeholder="usuario@ejemplo.com"
          className="input-field input-pill"
          aria-invalid={!!errors.email}
          autoComplete="username"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Contraseña
        </label>
        <div className="input-wrap">
          <input
            id="password"
            {...register("password")}
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            className="input-field input-with-icon"
            aria-invalid={!!errors.password}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="button-face"
            title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPass ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="form-row mt-2">
        <input {...register("remember")} type="checkbox" id="remember" />
        <label htmlFor="remember" className="text-sm">
          Recuérdame
        </label>
      </div>

      <div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}
