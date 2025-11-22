"use client";

import React from "react";

export default function AdminClasesPage() {
  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Clases</h1>
        <p className="text-gray-600 text-sm">Listado de clases registradas en el sistema.</p>
      </header>

      <section>
        {/* Aquí luego agregaremos la tabla con datos reales */}
        <div className="border border-gray-300 rounded-lg p-4 text-gray-500 text-sm">
          (El listado de clases se mostrará aquí)
        </div>
      </section>
    </main>
  );
}
