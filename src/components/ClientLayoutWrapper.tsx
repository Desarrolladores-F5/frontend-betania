// src/components/ClientLayoutWrapper.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

interface Props {
  children: ReactNode;
}

function resolveRole(user: any): "admin" | "supervisor" | "user" {
  const r = (user?.rol ?? user?.role ?? "").toString().toLowerCase();
  if (r === "admin") return "admin";
  if (r === "supervisor") return "supervisor";
  if (r === "usuario" || r === "user") return "user";

  const rid = Number(user?.rol_id ?? user?.role_id);
  if (rid === 1) return "admin";
  if (rid === 2) return "user";

  return "user";
}

export default function ClientLayoutWrapper({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    const verificarSesion = async () => {
      try {
        const res = await api.get("/auth/me"); // '/api/auth/me' vía proxy
        const u = res.data?.user ?? null;

        if (!alive) return;

        // Si NO hay sesión y no estás ya en /login -> te mando a /login
        if (!u) {
          setUser(null);
          if (pathname !== "/login") router.replace("/login");
          return;
        }

        setUser(u);

        // Si SÍ hay sesión y estás en /login -> redirige según rol
        if (pathname === "/login") {
          const role = resolveRole(u);
          if (role === "admin") {
            router.replace("/admin/dashboard");
          } else if (role === "supervisor") {
            router.replace("/supervisor/dashboard"); // crea esta ruta si la usarás
          } else {
            router.replace("/user/dashboard"); // ✅ CORRECTO (antes /dashboard)
          }
        }
      } catch (error) {
        // Error consultando sesión: trata como no logueado
        setUser(null);
        if (pathname !== "/login") router.replace("/login");
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    verificarSesion();
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Verificando sesión...</p>
      </div>
    );
  }

  // /login es pública (si hay sesión, arriba ya redirigimos)
  if (pathname === "/login") return <>{children}</>;

  // Para rutas protegidas, renderiza solo si hay user
  return <>{user && children}</>;
}