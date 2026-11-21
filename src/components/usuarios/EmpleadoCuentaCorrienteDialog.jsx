"use client"

import { useMemo, useState } from "react"
import { Wallet, Loader2, Filter, FilterX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const formatearMonedaARS = (valor) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(valor) || 0)

const formatearFecha = (fecha) => {
  if (!fecha) return "-"
  try {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
    })
  } catch {
    return String(fecha)
  }
}

const EmpleadoCuentaCorrienteDialog = ({
  open,
  onOpenChange,
  usuario,
  cuentaData,
  loading,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  onFiltrarMovimientos,
  onLimpiarFiltros,
  onRegistrarPago,
  procesandoPago,
}) => {
  const [montoPago, setMontoPago] = useState("")
  const [notasPago, setNotasPago] = useState("")

  const saldo = Number(cuentaData?.cuenta_corriente?.saldo || 0)
  const movimientos = cuentaData?.movimientos || []
  const hayFiltroFechas = Boolean(fechaInicio || fechaFin)

  const totalesPeriodo = useMemo(() => {
    return movimientos.reduce(
      (acc, m) => {
        const monto = Number(m.monto) || 0
        if (m.tipo === "cargo") acc.retiros += monto
        else if (m.tipo === "pago") acc.liquidaciones += monto
        return acc
      },
      { retiros: 0, liquidaciones: 0 },
    )
  }, [movimientos])

  const handlePagar = async () => {
    const ok = await onRegistrarPago?.({ monto: montoPago, notas: notasPago })
    if (ok) {
      setMontoPago("")
      setNotasPago("")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setMontoPago("")
          setNotasPago("")
        }
        onOpenChange?.(v)
      }}
    >
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Sueldos / Retiros {usuario?.nombre ? `– ${usuario.nombre}` : ""}
          </DialogTitle>
          <DialogDescription>
            Historial de retiros de caja y liquidaciones. El saldo indica cuánto falta liquidar a este empleado.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando sueldos / retiros...
          </div>
        ) : (
          <div className="space-y-4 min-h-0 flex-1 flex flex-col overflow-y-auto pr-0.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-4 sm:col-span-1">
                <p className="text-xs font-medium text-orange-900/70 uppercase tracking-wide">
                  Saldo a liquidar
                </p>
                <p className={`text-2xl font-bold mt-1 ${saldo > 0 ? "text-red-700" : "text-green-700"}`}>
                  {formatearMonedaARS(saldo)}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Actual (no depende del filtro)</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Retiros {hayFiltroFechas ? "en el período" : "listados"}
                </p>
                <p className="text-xl font-bold text-red-700 mt-1 tabular-nums">
                  {formatearMonedaARS(totalesPeriodo.retiros)}
                </p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Liquidaciones {hayFiltroFechas ? "en el período" : "listadas"}
                </p>
                <p className="text-xl font-bold text-green-700 mt-1 tabular-nums">
                  {formatearMonedaARS(totalesPeriodo.liquidaciones)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Registrar liquidación / pago</h3>
              <p className="text-xs text-gray-500">
                Baja el saldo sin tocar la caja (la plata ya salió en el retiro). Usalo al pagar sueldos o saldar la
                cuenta.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder="0,00"
                    disabled={saldo <= 0 || procesandoPago}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Notas (opcional)</Label>
                  <Input
                    value={notasPago}
                    onChange={(e) => setNotasPago(e.target.value)}
                    placeholder="Ej: Liquidación quincena"
                    disabled={saldo <= 0 || procesandoPago}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handlePagar}
                  disabled={saldo <= 0 || procesandoPago || !montoPago}
                >
                  {procesandoPago ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Registrar liquidación"
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border flex-1 min-h-0 flex flex-col">
              <div className="px-4 py-3 border-b bg-gray-50 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    Historial de movimientos
                  </h3>
                  {hayFiltroFechas && (
                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-800 border-sky-200">
                      Filtro activo
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Desde</Label>
                    <Input
                      type="date"
                      value={fechaInicio || ""}
                      onChange={(e) => setFechaInicio?.(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hasta</Label>
                    <Input
                      type="date"
                      value={fechaFin || ""}
                      onChange={(e) => setFechaFin?.(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={onFiltrarMovimientos} className="h-9">
                    Filtrar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onLimpiarFiltros}
                    className="h-9 text-gray-600"
                    disabled={!hayFiltroFechas}
                  >
                    <FilterX className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[280px]">
                {movimientos.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    {hayFiltroFechas
                      ? "Sin movimientos en el rango seleccionado."
                      : "Sin movimientos registrados."}
                  </div>
                ) : (
                  <ul className="divide-y">
                    {movimientos.map((m) => (
                      <li key={m.id} className="px-4 py-3 flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={
                                m.tipo === "cargo"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              }
                            >
                              {m.tipo === "cargo" ? "Retiro" : "Liquidación"}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatearFecha(m.fecha)}</span>
                          </div>
                          {m.notas && <p className="text-xs text-gray-600 line-clamp-2">{m.notas}</p>}
                          {m.registrado_por?.nombre && (
                            <p className="text-[11px] text-gray-400">Registrado por: {m.registrado_por.nombre}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={`font-semibold tabular-nums ${
                              m.tipo === "cargo" ? "text-red-700" : "text-green-700"
                            }`}
                          >
                            {m.tipo === "cargo" ? "+" : "−"}
                            {formatearMonedaARS(m.monto)}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Saldo: {formatearMonedaARS(m.saldo_nuevo)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
              {movimientos.length > 0 && (
                <>
                  <Separator />
                  <div className="px-4 py-2 text-[11px] text-gray-500 bg-gray-50">
                    {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}
                    {hayFiltroFechas ? " en el rango" : ""}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EmpleadoCuentaCorrienteDialog
