import { apiClient } from "@/lib/api-client"

export interface Cita {
  id: number
  beneficiario: string
  folio: string
  especialista: string
  fecha: string
  hora: string
  estatus: "Confirmada" | "Pendiente" | "Completada" | "Cancelada"
  notas?: string
}

export interface NuevaCitaPayload {
  curp: string
  idTipoServicio: number
  especialista?: string
  fecha: string
  hora: string
  notas?: string
}

/** GET /citas */
export function getCitas() {
  return apiClient.get<Cita[]>("/citas")
}

/** POST /citas */
export function createCita(data: NuevaCitaPayload) {
  return apiClient.post<{ message: string }>("/citas", data)
}

/** PATCH /citas/:id — actualiza el estatus */
export function updateEstatusCita(id: number, estatus: Cita["estatus"]) {
  return apiClient.patch<{ message: string }>(`/citas/${id}`, { estatus })
}

/** PUT /citas/:id — actualización completa */
export function updateCita(id: number, data: Partial<NuevaCitaPayload & { estatus: string }>) {
  return apiClient.put<{ message: string }>(`/citas/${id}`, data)
}
