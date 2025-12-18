// src/lib/api.ts
import axios from "axios";

/* ======================================================================
 * Configuración global de API
 * ====================================================================== */
export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const FILES_BASE_URL =
  process.env.NEXT_PUBLIC_FILES_BASE_URL ?? API_URL;

/**
 * Cliente Axios
 * - baseURL: `${API_URL}/api` → apunta directamente al backend
 * - withCredentials: true → envío/recepción de cookies HttpOnly.
 */
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
export { api };

/* ======================================================================
 * Utilidades comunes
 * ====================================================================== */

/** Normaliza URL de archivo (relativa o absoluta) */
export function resolveFileUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    const base = FILES_BASE_URL || API_URL;
    return base ? new URL(url.replace(/^\/+/, "/"), base).toString() : url;
  }
}

/** Limpia los datos de autenticación local */
export function clearAuth() {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();
  } catch (err) {
    console.warn("Error limpiando autenticación:", err);
  }
}

/* ======================================================================
 * Normalizadores genéricos
 * ====================================================================== */
function unwrapList<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function unwrapItem<T = any>(payload: any): T | null {
  if (!payload) return null;
  return payload?.data ?? payload;
}

/* ======================================================================
 * Usuarios (Admin)
 * ====================================================================== */
export type UsuarioAdmin = {
  id: number;
  rut: string;
  telefono: string | null;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  email: string;
  rol_id: 1 | 2;
  activo: boolean;
  created_at?: string;
};

type UsuariosListResponse =
  | { ok: boolean; data: UsuarioAdmin[] }
  | UsuarioAdmin[];
type UsuarioItemResponse = { ok: boolean; data: UsuarioAdmin } | UsuarioAdmin;

export const UsuariosAPI = {
  async list(): Promise<UsuarioAdmin[]> {
    const res = await api.get<UsuariosListResponse>("/admin/usuarios");
    const p = res.data as any;
    return Array.isArray(p) ? p : p?.data ?? [];
  },

  async get(id: number): Promise<UsuarioAdmin> {
    const res = await api.get<UsuarioItemResponse>(`/admin/usuarios/${id}`);
    return unwrapItem<UsuarioAdmin>(res.data)!;
  },

  async create(payload: {
    rut: string;
    telefono?: string | null;
    nombres: string;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
    fecha_nacimiento?: string | null;
    email: string;
    password: string;
    rol_id: number;
    activo?: boolean;
  }): Promise<UsuarioAdmin> {
    const res = await api.post<UsuarioItemResponse>(
      "/admin/usuarios",
      payload
    );
    return unwrapItem<UsuarioAdmin>(res.data)!;
  },

  async update(
    id: number,
    payload: Partial<UsuarioAdmin> & { password?: string }
  ): Promise<UsuarioAdmin> {
    const res = await api.put<UsuarioItemResponse>(
      `/admin/usuarios/${id}`,
      payload
    );
    return unwrapItem<UsuarioAdmin>(res.data)!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/usuarios/${id}`);
  },
};

/* ======================================================================
 * Cursos (Admin)
 * ====================================================================== */
export type CursoBase = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  portada_url?: string | null;
  publicado?: boolean;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CursoListItem = CursoBase;
export type CursoDetalle = CursoBase;

type CursosListResponse =
  | { ok: boolean; data: CursoListItem[] }
  | CursoListItem[];
type CursoItemResponse = { ok: boolean; data: CursoDetalle } | CursoDetalle;

export const CursosAdminAPI = {
  async list(): Promise<CursoListItem[]> {
    const res = await api.get<CursosListResponse>("/admin/cursos");
    return unwrapList<CursoListItem>(res.data);
  },

  async get(id: number): Promise<CursoDetalle | null> {
    const res = await api.get<CursoItemResponse>(`/admin/cursos/${id}`);
    return unwrapItem<CursoDetalle>(res.data);
  },

  async create(payload: {
    titulo: string;
    descripcion?: string | null;
    portada_url?: string | null;
    publicado?: boolean;
    activo?: boolean;
  }): Promise<CursoDetalle> {
    const res = await api.post<CursoItemResponse>("/admin/cursos", payload);
    return unwrapItem<CursoDetalle>(res.data)!;
  },

  async update(
    id: number,
    payload: Partial<CursoBase>
  ): Promise<CursoDetalle> {
    const res = await api.put<CursoItemResponse>(
      `/admin/cursos/${id}`,
      payload
    );
    return unwrapItem<CursoDetalle>(res.data)!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/cursos/${id}`);
  },
};

/* ======================================================================
 * Subidas de archivos (imágenes y PDFs)
 * ====================================================================== */
export const UploadsAPI = {
  async uploadImagen(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await api.post<{ url: string }>("/admin/uploads/imagen", fd, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.data?.url) {
      throw new Error("Respuesta inválida del uploader de imágenes");
    }
    return res.data;
  },

  async uploadPdf(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await api.post<{ url: string }>("/admin/uploads/pdf", fd, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.data?.url) {
      throw new Error("Respuesta inválida del uploader de PDF");
    }
    return res.data;
  },
};

/* ======================================================================
 * Estadísticas Admin
 * ====================================================================== */
export type AdminStats = {
  usuarios?: number;
  cursos?: number;
  modulos?: number;
  lecciones?: number;
  reportes?: number;
};
type AdminStatsResponse = { ok: boolean; data: AdminStats } | AdminStats;

export const AdminStatsAPI = {
  async get(): Promise<AdminStats> {
    const res = await api.get<AdminStatsResponse>("/admin/estadisticas");
    const payload = res.data as any;
    return payload?.data ?? payload ?? {};
  },
};

/* ======================================================================
 * Módulos (Admin)
 * ====================================================================== */
export type ModuloBase = {
  id: number;
  curso_id: number;
  titulo: string;
  descripcion?: string | null;
  video_intro_url?: string | null;
  pdf_intro_url?: string | null;
  orden?: number | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ModuloListItem = ModuloBase;
export type ModuloDetalle = ModuloBase;

type ModulosListResponse =
  | { ok: boolean; data: ModuloListItem[] }
  | ModuloListItem[];
type ModuloItemResponse =
  | { ok: boolean; data: ModuloDetalle }
  | ModuloDetalle;

export const ModulosAdminAPI = {
  /** Lista módulos de un curso concreto */
  async listByCurso(cursoId: number): Promise<ModuloListItem[]> {
    const res = await api.get<any>(`/admin/cursos/${cursoId}/modulos`);
    const payload = res.data;
    if (Array.isArray(payload?.modulos)) return payload.modulos;
    return unwrapList<ModuloListItem>(payload);
  },

  /** ✅ Nuevo: lista todos los módulos (para el dashboard) */
  async listAll(): Promise<ModuloListItem[]> {
    const res = await api.get<any>("/admin/modulos");
    return unwrapList<ModuloListItem>(res.data);
  },

  async get(id: number): Promise<ModuloDetalle | null> {
    const res = await api.get<ModuloItemResponse>(`/admin/modulos/${id}`);
    return unwrapItem<ModuloDetalle>(res.data);
  },

  async create(payload: {
    curso_id: number;
    titulo: string;
    descripcion?: string | null;
    orden?: number | null;
    activo?: boolean;
    video_intro_url?: string | null;
    pdf_intro_url?: string | null;
  }): Promise<ModuloDetalle> {
    const res = await api.post<ModuloItemResponse>(`/admin/modulos`, payload);
    return unwrapItem<ModuloDetalle>(res.data)!;
  },

  async update(
    id: number,
    payload: Partial<Omit<ModuloBase, "id" | "curso_id">>
  ): Promise<ModuloDetalle> {
    const res = await api.put<ModuloItemResponse>(
      `/admin/modulos/${id}`,
      payload
    );
    return unwrapItem<ModuloDetalle>(res.data)!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/modulos/${id}`);
  },
};

/* ======================================================================
 * Lecciones (Admin) — reemplazo de Clases
 * ====================================================================== */
export type LeccionBase = {
  id: number;
  modulo_id: number;
  titulo: string;
  descripcion?: string | null;

  // Video principal
  youtube_id?: string | null;
  youtube_titulo?: string | null;

  // Video adicional
  youtube_id_extra?: string | null;
  youtube_titulo_extra?: string | null;

  // 📄 PDF con contenido principal de la clase
  contenido_pdf_url?: string | null;
  contenido_pdf_titulo?: string | null;

  // 📄 PDF de recursos / complementario
  pdf_url?: string | null;
  pdf_titulo?: string | null;

  // Compatibilidad con vistas antiguas
  tipo?: "video" | "pdf" | "html" | "link";
  contenido_url?: string | null;
  duracion_segundos?: number | null;

  // Metadatos
  orden?: number | null;
  publicado?: boolean;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;

  // ID de examen asociado (si la clase tiene prueba)
  examen_id?: number | null;
};

export type LeccionListItem = LeccionBase;
export type LeccionDetalle = LeccionBase;

/** Alias de compatibilidad para código antiguo que usa "ClaseListItem" */
export type ClaseListItem = LeccionListItem;
export type ClaseDetalle = LeccionDetalle;

type LeccionesListResponse =
  | { ok: boolean; data: LeccionListItem[] }
  | LeccionListItem[];
type LeccionItemResponse =
  | { ok: boolean; data: LeccionDetalle }
  | LeccionDetalle;

export const LeccionesAdminAPI = {
  async listByModulo(moduloId: number): Promise<LeccionListItem[]> {
    try {
      const res = await api.get<any>(`/admin/modulos/${moduloId}/lecciones`);
      const p = res.data;
      if (Array.isArray(p?.lecciones)) return p.lecciones;
      return unwrapList<LeccionListItem>(p);
    } catch {
      const res = await api.get<LeccionesListResponse>(`/admin/lecciones`, {
        params: { modulo_id: moduloId },
      });
      return unwrapList<LeccionListItem>(res.data);
    }
  },

  async get(id: number): Promise<LeccionDetalle | null> {
    const res = await api.get<LeccionItemResponse>(`/admin/lecciones/${id}`);
    return unwrapItem<LeccionDetalle>(res.data);
  },

  async create(payload: {
    modulo_id: number;
    titulo: string;
    descripcion?: string | null;

    youtube_id?: string | null;
    youtube_titulo?: string | null;

    youtube_id_extra?: string | null;
    youtube_titulo_extra?: string | null;

    contenido_pdf_url?: string | null;
    contenido_pdf_titulo?: string | null;

    pdf_url?: string | null;
    pdf_titulo?: string | null;

    tipo?: "video" | "pdf" | "html" | "link";
    contenido_url?: string | null;
    duracion_segundos?: number | null;
    orden?: number | null;
    publicado?: boolean;
    activo?: boolean;

    examen_id?: number | null;
  }): Promise<LeccionDetalle> {
    const res = await api.post<LeccionItemResponse>(
      `/admin/lecciones`,
      payload
    );
    return unwrapItem<LeccionDetalle>(res.data)!;
  },

  async update(
    id: number,
    payload: Partial<Omit<LeccionBase, "id" | "modulo_id">>
  ): Promise<LeccionDetalle> {
    const res = await api.put<LeccionItemResponse>(
      `/admin/lecciones/${id}`,
      payload
    );
    return unwrapItem<LeccionDetalle>(res.data)!;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/lecciones/${id}`);
  },
};

/** Alias de compatibilidad: ClasesAdminAPI → LeccionesAdminAPI */
export const ClasesAdminAPI = LeccionesAdminAPI;

/* ======================================================================
 * Pruebas / Exámenes (Admin)
 * ====================================================================== */

export type AlternativaAdmin = {
  id: number;
  pregunta_id: number;
  texto: string;
  es_correcta: boolean;
};

export type PreguntaAdmin = {
  id: number;
  examen_id: number;
  enunciado: string;
  puntaje: number | string;
  orden?: number | null;
  alternativas?: AlternativaAdmin[];
};

export type ExamenAdmin = {
  id: number;
  curso_id: number;
  titulo: string;
  tiempo_limite_seg?: number | null;
  intento_max?: number | null;
  publicado?: boolean;
  instrucciones?: string | null;
  curso?: { id: number; titulo: string };
  preguntas?: PreguntaAdmin[];
};

/** Prueba asociada a una clase (vista desde admin/ver) */
export type PruebaClaseDetalle = {
  id?: number;
  clase_id?: number;
  titulo: string;
  instrucciones?: string;
  preguntas: {
    enunciado: string;
    alternativas: {
      texto: string;
      es_correcta: boolean;
    }[];
  }[];
};

type ExamenListResponse = ExamenAdmin[] | { data: ExamenAdmin[] };
type ExamenItemResponse = ExamenAdmin | { data: ExamenAdmin };

export const PruebasAdminAPI = {
  /** Lista todos los exámenes (pruebas) */
  async list(): Promise<ExamenAdmin[]> {
    const r = await api.get<ExamenListResponse>("/admin/examenes");
    return unwrapList<ExamenAdmin>(r.data);
  },

  /** Obtiene un examen completo (con preguntas y alternativas) */
  async get(id: number): Promise<ExamenAdmin | null> {
    const r = await api.get<ExamenItemResponse>(`/admin/examenes/${id}`);
    const examen = unwrapItem<ExamenAdmin>(r.data);
    return examen;
  },

  /** 🔹 Obtiene la prueba asociada a una clase (si existe) */
  async getByClase(claseId: number): Promise<PruebaClaseDetalle | null> {
    try {
      // 1) Primero obtenemos la lección para saber si tiene examen asociado
      const leccion = await LeccionesAdminAPI.get(claseId);
      const examenId = leccion?.examen_id;

      if (!examenId) {
        // La clase aún no tiene examen vinculado
        return null;
      }

      // 2) Obtenemos el examen completo (con preguntas y alternativas)
      const examen = await PruebasAdminAPI.get(examenId);
      if (!examen) return null;

      return {
        id: examen.id,
        clase_id: claseId,
        titulo: examen.titulo ?? "",
        instrucciones: examen.instrucciones ?? "",
        preguntas: Array.isArray(examen.preguntas)
          ? examen.preguntas.map((p: any) => ({
              enunciado: p.enunciado ?? "",
              alternativas: Array.isArray(p.alternativas)
                ? p.alternativas.map((a: any) => ({
                    texto: a.texto ?? "",
                    es_correcta: Boolean(a.es_correcta),
                  }))
                : [],
            }))
          : [],
      };
    } catch (err) {
      console.error("Error obteniendo prueba por clase", err);
      return null;
    }
  },

  /** Crea un examen */
  async create(payload: {
    curso_id: number;
    titulo: string;
    tiempo_limite_seg?: number | null;
    intento_max?: number | null;
    publicado?: boolean;
  }): Promise<ExamenAdmin> {
    const r = await api.post<ExamenItemResponse>("/admin/examenes", payload);
    return unwrapItem<ExamenAdmin>(r.data)!;
  },

  /** Actualiza un examen (solo datos generales) */
  async update(
    id: number,
    payload: Partial<Omit<ExamenAdmin, "id" | "curso_id" | "preguntas">>
  ): Promise<ExamenAdmin> {
    const r = await api.put<ExamenItemResponse>(
      `/admin/examenes/${id}`,
      payload
    );
    return unwrapItem<ExamenAdmin>(r.data)!;
  },

  /** Elimina un examen */
  async remove(id: number): Promise<void> {
    await api.delete(`/admin/examenes/${id}`);
  },

  /** Actualiza examen completo (examen + preguntas + alternativas) */
  async updateFull(
    id: number,
    payload: {
      titulo: string;
      tiempo_limite_seg?: number | null;
      intento_max?: number | null;
      publicado?: boolean;
      preguntas: {
        enunciado: string;
        puntaje?: number;
        orden?: number;
        alternativas: { texto: string; es_correcta: boolean }[];
      }[];
    }
  ): Promise<ExamenAdmin> {
    const r = await api.put<ExamenItemResponse>(
      `/admin/examenes/${id}/full`,
      payload
    );
    return unwrapItem<ExamenAdmin>(r.data)!;
  },

  // Preguntas
  async createPregunta(
    examenId: number,
    payload: {
      enunciado: string;
      puntaje?: number;
      orden?: number;
    }
  ): Promise<PreguntaAdmin> {
    const r = await api.post<PreguntaAdmin>(
      `/admin/examenes/${examenId}/preguntas`,
      payload
    );
    return r.data;
  },

  async updatePregunta(
    id: number,
    payload: Partial<PreguntaAdmin>
  ): Promise<PreguntaAdmin> {
    const r = await api.put<PreguntaAdmin>(
      `/admin/examenes/preguntas/${id}`,
      payload
    );
    return r.data;
  },

  async deletePregunta(id: number): Promise<void> {
    await api.delete(`/admin/examenes/preguntas/${id}`);
  },

  // Alternativas
  async createAlternativa(
    preguntaId: number,
    payload: { texto: string; es_correcta: boolean }
  ): Promise<AlternativaAdmin> {
    const r = await api.post<AlternativaAdmin>(
      `/admin/examenes/preguntas/${preguntaId}/alternativas`,
      payload
    );
    return r.data;
  },

  async updateAlternativa(
    id: number,
    payload: Partial<AlternativaAdmin>
  ): Promise<AlternativaAdmin> {
    const r = await api.put<AlternativaAdmin>(
      `/admin/examenes/alternativas/${id}`,
      payload
    );
    return r.data;
  },

  async deleteAlternativa(id: number): Promise<void> {
    await api.delete(`/admin/examenes/alternativas/${id}`);
  },
};

/* ======================================================================
 * Reportes (Admin) — Aprobaciones (módulo / curso)
 * ====================================================================== */

export type ReporteResumenAdmin = {
  modulos_aprobados?: number;
  cursos_aprobados?: number;
  modulos_en_progreso?: number;
  cursos_en_progreso?: number;
  total_aprobaciones_modulo?: number;
  total_aprobaciones_curso?: number;
};

type ReporteResumenResponse =
  | { ok: boolean; data: ReporteResumenAdmin }
  | ReporteResumenAdmin;

export type AprobacionTipo = "modulo" | "curso";

export type ReporteAprobacionAdmin = {
  // Identificadores
  id: number;

  tipo: AprobacionTipo;

  // Alumno
  usuario_id: number;
  alumno_nombre?: string | null;
  alumno_email?: string | null;

  // Curso / Módulo
  curso_id?: number | null;
  curso_titulo?: string | null;
  modulo_id?: number | null;
  modulo_titulo?: string | null;

  // Resultado
  estado?: "aprobado" | "reprobado" | "en_progreso" | string;
  nota_final?: number | null;

  // Fechas
  fecha_aprobacion?: string | null;
  created_at?: string;
};

type AprobacionesListResponse =
  | { ok: boolean; data: ReporteAprobacionAdmin[] }
  | ReporteAprobacionAdmin[];

/** (Opcional) Mantengo compatibilidad con tu list() original */
export type ReporteAdmin = {
  id: number;
  titulo?: string | null;
  estado?: string | null;
};
type ReportesListResponse =
  | { ok: boolean; data: ReporteAdmin[] }
  | ReporteAdmin[];

export const ReportesAdminAPI = {
  /** ✅ Resumen para tarjeta(s) del dashboard */
  async resumen(): Promise<ReporteResumenAdmin> {
    const res = await api.get<ReporteResumenResponse>("/admin/reportes/resumen");
    const payload = res.data as any;
    return payload?.data ?? payload ?? {};
  },

  /** ✅ Aprobaciones por módulo o curso */
  async aprobaciones(params?: {
    tipo?: AprobacionTipo; // "modulo" | "curso"
    desde?: string; // YYYY-MM-DD
    hasta?: string; // YYYY-MM-DD
    usuario_id?: number;
    curso_id?: number;
    modulo_id?: number;
    estado?: string; // aprobado / en_progreso / reprobado
  }): Promise<ReporteAprobacionAdmin[]> {
    const res = await api.get<AprobacionesListResponse>(
      "/admin/reportes/aprobaciones",
      { params }
    );
    return unwrapList<ReporteAprobacionAdmin>(res.data);
  },

  /** 🧩 Mantengo el list() existente por si hoy tu backend lo usa para otra cosa */
  async list(): Promise<ReporteAdmin[]> {
    const res = await api.get<ReportesListResponse>("/admin/reportes");
    return unwrapList<ReporteAdmin>(res.data);
  },
};
