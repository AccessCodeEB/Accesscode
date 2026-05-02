"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, Check, Clock, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateEstatusCita, type Cita } from "@/services/citas"

const DIAS_SEMANA_CORTO = ["L", "M", "X", "J", "V", "S", "D"]
const DIAS_SEMANA_LARGO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfWeek(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

function getCitasForDay(list: Cita[], y: number, m: number, d: number) {
  return list.filter(c => {
    if (!c.fecha) return false
    const dt = new Date(c.fecha + "T12:00:00")
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
  })
}

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const mon = new Date(baseDate)
  mon.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

const STATUS_ICON: Record<string, typeof Check> = { Confirmada: Check, Pendiente: Clock, Completada: Check, Cancelada: X }
const STATUS_COLOR: Record<string, string> = {
  Confirmada: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Pendiente:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Completada: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Cancelada:  "bg-red-500/20 text-red-400 border-red-500/30",
}
const STATUS_DOT: Record<string, string> = {
  Confirmada: "bg-emerald-400", Pendiente: "bg-amber-400", Completada: "bg-sky-400", Cancelada: "bg-red-400"
}

interface Props {
  citas: Cita[]
  onReload: () => void
}

export function CitasCalendarView({ citas, onReload }: Props) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date>(today)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [confirmPending, setConfirmPending] = useState<{ id: number; estatus: Cita["estatus"]; name: string } | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDates = useMemo(() => {
    const base = new Date(today)
    base.setDate(today.getDate() + weekOffset * 7)
    return getWeekDates(base)
  }, [weekOffset, today])

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfWeek(calYear, calMonth)

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()

  const isSelected = (d: Date) =>
    d.getDate() === selectedDay.getDate() && d.getMonth() === selectedDay.getMonth() && d.getFullYear() === selectedDay.getFullYear()

  const citasSemana = useMemo(() => {
    return weekDates.map(d => ({
      date: d,
      citas: getCitasForDay(citas, d.getFullYear(), d.getMonth(), d.getDate())
        .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
    }))
  }, [citas, weekDates])

  // Métricas
  const totalPendiente = citas.filter(c => c.estatus === "Pendiente").length
  const totalHoy = getCitasForDay(citas, today.getFullYear(), today.getMonth(), today.getDate()).length
  const totalSemana = citasSemana.reduce((acc, d) => acc + d.citas.length, 0)

  async function doUpdateEstatus(id: number, estatus: Cita["estatus"]) {
    setUpdatingId(id)
    try {
      await updateEstatusCita(id, estatus)
      toast.success(`Cita marcada como ${estatus}`)
      onReload()
      setConfirmPending(null)
      setExpandedId(null)
    } catch {
      toast.error("No se pudo actualizar el estatus.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      {/* ── LEFT PANEL ── */}
      <div className="flex flex-col gap-4">
        {/* Mini calendario mensual */}
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="rounded-lg p-1 hover:bg-muted transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-bold text-foreground">{MESES[calMonth]} {calYear}</span>
            <button onClick={nextMonth} className="rounded-lg p-1 hover:bg-muted transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {DIAS_SEMANA_CORTO.map(d => (
              <div key={d} className="text-[10px] font-semibold text-muted-foreground pb-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dia => {
              const d = new Date(calYear, calMonth, dia)
              const hasCitas = getCitasForDay(citas, calYear, calMonth, dia).length > 0
              const sel = isSelected(d)
              const tod = isToday(d)
              return (
                <button
                  key={dia}
                  onClick={() => { setSelectedDay(d); setWeekOffset(0) }}
                  className={`relative mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-all font-medium
                    ${sel ? "bg-primary text-primary-foreground shadow-sm" : tod ? "ring-1 ring-primary/40 text-primary" : "text-foreground hover:bg-muted"}`}
                >
                  {dia}
                  {hasCitas && !sel && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary/60" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumen</p>
          {[
            { label: "Hoy", val: totalHoy, color: "text-foreground" },
            { label: "Esta semana", val: totalSemana, color: "text-primary" },
            { label: "Pendientes", val: totalPendiente, color: "text-amber-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className={`text-lg font-bold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL: Agenda semanal ── */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col">
        {/* Week nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="text-sm font-bold">
              {weekDates[0].getDate()} – {weekDates[6].getDate()} {MESES[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setWeekOffset(o => o - 1)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors">
              Hoy
            </button>
            <button onClick={() => setWeekOffset(o => o + 1)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Day columns */}
        <div className="grid grid-cols-7 divide-x divide-border/30 flex-1 overflow-y-auto">
          {citasSemana.map(({ date, citas: dayCitas }, idx) => {
            const tod = isToday(date)
            const sel = isSelected(date)
            return (
              <div key={idx} className={`flex flex-col min-h-[420px] ${tod ? "bg-primary/5" : ""}`}>
                {/* Column header */}
                <div
                  className={`sticky top-0 z-10 flex flex-col items-center py-3 border-b border-border/30 cursor-pointer
                    ${tod ? "bg-primary/10" : "bg-card"}`}
                  onClick={() => setSelectedDay(date)}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">{DIAS_SEMANA_LARGO[idx]}</span>
                  <span className={`mt-1 flex size-7 items-center justify-center rounded-full text-sm font-bold transition-all
                    ${sel ? "bg-primary text-primary-foreground" : tod ? "text-primary" : "text-foreground"}`}>
                    {date.getDate()}
                  </span>
                  {dayCitas.length > 0 && (
                    <span className="mt-1 text-[9px] font-medium text-muted-foreground">{dayCitas.length} cita{dayCitas.length > 1 ? "s" : ""}</span>
                  )}
                </div>

                {/* Citas del día */}
                <div className="flex flex-col gap-1.5 p-1.5">
                  {dayCitas.map(cita => {
                    const expanded = expandedId === cita.id
                    const dot = STATUS_DOT[cita.estatus] ?? "bg-muted-foreground"
                    const colorCls = STATUS_COLOR[cita.estatus] ?? ""
                    return (
                      <div key={cita.id} className={`rounded-lg border text-xs transition-all overflow-hidden ${colorCls}`}>
                        <button
                          className="w-full flex items-start gap-1.5 p-2 text-left"
                          onClick={() => setExpandedId(expanded ? null : cita.id)}
                        >
                          <span className={`mt-0.5 size-2 rounded-full shrink-0 ${dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate leading-tight">{cita.hora}</p>
                            <p className="truncate opacity-80 leading-tight">{cita.beneficiario}</p>
                          </div>
                          {expanded ? <ChevronUp className="size-3 shrink-0 opacity-60" /> : <ChevronDown className="size-3 shrink-0 opacity-60" />}
                        </button>

                        {/* Expanded detail */}
                        {expanded && (
                          <div className="border-t border-current/20 p-2 space-y-2 bg-background/30">
                            <p className="text-[10px] opacity-70">{cita.especialista || "Sin especialista"}</p>
                            {cita.notas && <p className="text-[10px] opacity-60 italic">"{cita.notas}"</p>}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {cita.estatus === "Pendiente" && (
                                <>
                                  <button
                                    disabled={updatingId === cita.id}
                                    onClick={() => setConfirmPending({ id: cita.id, estatus: "Confirmada", name: cita.beneficiario })}
                                    className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    disabled={updatingId === cita.id}
                                    onClick={() => setConfirmPending({ id: cita.id, estatus: "Cancelada", name: cita.beneficiario })}
                                    className="rounded-md bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {cita.estatus === "Confirmada" && (
                                <>
                                  <button
                                    disabled={updatingId === cita.id}
                                    onClick={() => setConfirmPending({ id: cita.id, estatus: "Completada", name: cita.beneficiario })}
                                    className="rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 text-[10px] font-semibold hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                                  >
                                    Completar
                                  </button>
                                  <button
                                    disabled={updatingId === cita.id}
                                    onClick={() => setConfirmPending({ id: cita.id, estatus: "Cancelada", name: cita.beneficiario })}
                                    className="rounded-md bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Confirm dialog simple */}
      {confirmPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-border/60 bg-card shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-bold text-foreground mb-2">Confirmar cambio</h3>
            <p className="text-sm text-muted-foreground mb-5">
              ¿Marcar la cita de <strong className="text-foreground">{confirmPending.name}</strong> como{" "}
              <strong className="text-foreground">{confirmPending.estatus}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmPending(null)} disabled={updatingId !== null}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant={confirmPending.estatus === "Cancelada" ? "destructive" : "default"}
                disabled={updatingId !== null}
                onClick={() => doUpdateEstatus(confirmPending.id, confirmPending.estatus)}
              >
                {updatingId !== null ? "Guardando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
