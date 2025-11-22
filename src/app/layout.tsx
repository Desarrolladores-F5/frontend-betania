// src/app/layout.tsx
import "./../styles/globals.css";
import { ReactNode } from "react";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

export const metadata = {
  title: "Plataforma Betania",
  description: "Sistema integral de educación",
};

/**
 * RootLayout
 * - Valida sesión (ClientLayoutWrapper)
 * - Proporciona contexto de React Query
 * - Mantiene estructura base HTML y estilos globales
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ReactQueryProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
