//src/app/admin/reportes/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import {
  ReportesAdminAPI,
  type ReporteResumenAdmin,
  type ReporteAprobacionAdmin,
} from "@/lib/api";

type ResumenData = {
  modulos_aprobados: number;
  cursos_aprobados: number;
  modulos_en_progreso: number;
  cursos_en_progreso: number;
  total_aprobaciones_modulo: number;
  total_aprobaciones_curso: number;
};

function toResumenData(r: ReporteResumenAdmin | null): ResumenData {
  return {
    modulos_aprobados: r?.modulos_aprobados ?? 0,
    cursos_aprobados: r?.cursos_aprobados ?? 0,
    modulos_en_progreso: r?.modulos_en_progreso ?? 0,
    cursos_en_progreso: r?.cursos_en_progreso ?? 0,
    total_aprobaciones_modulo: r?.total_aprobaciones_modulo ?? 0,
    total_aprobaciones_curso: r?.total_aprobaciones_curso ?? 0,
  };
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminReportesPage(): React.JSX.Element {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [resumen, setResumen] = React.useState<ResumenData | null>(null);
  const [aprobacionesModulo, setAprobacionesModulo] = React.useState<
    ReporteAprobacionAdmin[]
  >([]);
  const [aprobacionesCurso, setAprobacionesCurso] = React.useState<
    ReporteAprobacionAdmin[]
  >([]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [r, mod, cur] = await Promise.all([
          ReportesAdminAPI.resumen(),
          // ✅ FIX: aprobaciones espera un objeto de filtros
          ReportesAdminAPI.aprobaciones({ tipo: "modulo" }),
          ReportesAdminAPI.aprobaciones({ tipo: "curso" }),
        ]);

        if (!alive) return;

        setResumen(toResumenData(r));
        setAprobacionesModulo(Array.isArray(mod) ? mod : []);
        setAprobacionesCurso(Array.isArray(cur) ? cur : []);
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setError("No fue posible cargar los reportes.");
        setResumen(null);
        setAprobacionesModulo([]);
        setAprobacionesCurso([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-purple-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
            <p className="text-sm text-slate-500">
              Reporte de aprobaciones por módulo y curso.
            </p>
          </div>
        </div>

        {/* Botón Volver estilo “morado” */}
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-white shadow-sm hover:bg-purple-800 active:bg-purple-900 transition"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver</span>
        </button>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Resumen de Aprobaciones
          </h2>

          {loading && <p className="mt-3 text-sm text-slate-500">Cargando…</p>}

          {!loading && error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          {!loading && !error && (
            <>
              {/* Stats */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Módulos aprobados</p>
                  <p className="mt-1 text-3xl font-semibold text-purple-700">
                    {resumen?.modulos_aprobados ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Cursos aprobados</p>
                  <p className="mt-1 text-3xl font-semibold text-purple-700">
                    {resumen?.cursos_aprobados ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Módulos en progreso</p>
                  <p className="mt-1 text-3xl font-semibold text-purple-700">
                    {resumen?.modulos_en_progreso ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Cursos en progreso</p>
                  <p className="mt-1 text-3xl font-semibold text-purple-700">
                    {resumen?.cursos_en_progreso ?? 0}
                  </p>
                </div>
              </div>

              {/* Tabla Aprobaciones por módulo */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-900">
                  Aprobaciones por módulo
                </h3>

                {aprobacionesModulo.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No existen aprobaciones registradas.
                  </p>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-slate-600">
                          <th className="px-4 py-3">Alumno</th>
                          <th className="px-4 py-3">Curso</th>
                          <th className="px-4 py-3">Módulo</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {aprobacionesModulo.map((r) => (
                          <tr key={`mod-${r.id}`} className="text-slate-700">
                            <td className="px-4 py-3">
                              {r.alumno_nombre ?? "-"}
                            </td>
                            <td className="px-4 py-3">{r.curso_titulo ?? "-"}</td>
                            <td className="px-4 py-3">
                              {r.modulo_titulo ?? "-"}
                            </td>
                            <td className="px-4 py-3">{r.estado ?? "-"}</td>
                            <td className="px-4 py-3">
                              {formatDate(r.fecha_aprobacion)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tabla Aprobaciones por curso */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-900">
                  Aprobaciones por curso
                </h3>

                {aprobacionesCurso.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No existen cursos aprobados registrados.
                  </p>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-slate-600">
                          <th className="px-4 py-3">Alumno</th>
                          <th className="px-4 py-3">Curso</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {aprobacionesCurso.map((r) => (
                          <tr key={`cur-${r.id}`} className="text-slate-700">
                            <td className="px-4 py-3">
                              {r.alumno_nombre ?? "-"}
                            </td>
                            <td className="px-4 py-3">{r.curso_titulo ?? "-"}</td>
                            <td className="px-4 py-3">
                              {r.estado ?? "aprobado"}
                            </td>
                            <td className="px-4 py-3">
                              {formatDate(r.fecha_aprobacion)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
