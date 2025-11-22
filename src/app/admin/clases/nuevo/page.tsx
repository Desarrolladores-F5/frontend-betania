// src/app/admin/clases/nuevo/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClaseForm, { ClaseFormValues } from "../ClaseForm";
import { ClasesAdminAPI } from "@/lib/api";

export default function NuevaClasePage() {
  const router = useRouter();
  const search = useSearchParams();
  const moduloIdParam = search.get("modulo_id");

  // Forzamos flujo: esta página debe invocarse con ?modulo_id=XX
  const moduloId = moduloIdParam ? Number(moduloIdParam) : NaN;
  const moduloIdValido = Number.isInteger(moduloId) && moduloId > 0;

  async function handleSubmit(data: ClaseFormValues) {
    // Seguridad: asegura que modulo_id se envía correctamente
    const payload: ClaseFormValues = {
      ...data,
      modulo_id: moduloIdValido ? moduloId : data.modulo_id,
    };

    await ClasesAdminAPI.create(payload);

    // Redirección post-creación: volver al listado de clases de ese módulo
    const destino = `/admin/modulos/${payload.modulo_id}/clases`;
    router.replace(destino);
  }

  if (!moduloIdValido) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <h1 className="text-lg font-semibold text-amber-800">Falta módulo</h1>
          <p className="text-sm text-amber-700 mt-1">
            Esta vista debe abrirse desde el listado de clases de un módulo o
            pasando el parámetro <code>?modulo_id=ID</code> en la URL.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nueva clase</h1>
      </header>

      <ClaseForm
        moduloId={moduloId}
        onSubmit={handleSubmit}
        submitLabel="Crear clase"
      />
    </main>
  );
}
