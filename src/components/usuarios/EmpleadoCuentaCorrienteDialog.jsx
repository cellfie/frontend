"use client"

import { useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

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
  onRegistrarPago,
  procesandoPago,
}) => {
  const [montoPago, setMontoPago] = useState("")
  const [notasPago, setNotasPago] = useState("")

  const saldo = Number(cuentaData?.cuenta_corriente?.saldo || 0)
  const movimientos = cuentaData?.movimientos || []

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
            <CreditCard className="h-5 w-5" />
            Cuenta corriente {usuario?.nombre ? `- ${usuario.nombre}` : ""}
          </DialogTitle>
          <DialogDescription>
            Retiros de caja pendientes de liquidar. El saldo indica cuánto tenés que pagar / liquidar a este usuario.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando cuenta corriente...
          </div>
        ) : (
          <div className="space-y-4 min-h-0 flex-1 flex flex-col">
            <div className="rounded-lg border bg-orange-50/60 p-4">
              <p className="text-xs text-gray-600">Saldo a liquidar</p>
              <p className={`text-2xl font-bold ${saldo > 0 ? "text-red-700" : "text-green-700"}`}>
                {formatearMonedaARS(saldo)}
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Registrar liquidación / pago</h3>
              <p className="text-xs text-gray-500">
                Baja el saldo sin tocar la caja (la plata ya salió en el retiro). Usalo al pagar sueldos o saldar la cuenta.
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
              <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">
                Movimientos recientes
              </div>
              <ScrollArea className="h-[280px]">
                {movimientos.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Sin movimientos</div>
                ) : (
                  <ul className="divide-y">
                    {movimientos.map((m) => (
                      <li key={m.id} className="px-4 py-2.5 flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={
                                m.tipo === "cargo"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              }
                            >
                              {m.tipo === "cargo" ? "Retiro / cargo" : "Liquidación"}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatearFecha(m.fecha)}</span>
                          </div>
                          {m.notas && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.notas}</p>}
                          {m.registrado_por?.nombre && (
                            <p className="text-[11px] text-gray-400 mt-0.5">Por: {m.registrado_por.nombre}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={`font-semibold ${m.tipo === "cargo" ? "text-red-700" : "text-green-700"}`}
                          >
                            {m.tipo === "cargo" ? "+" : "-"}
                            {formatearMonedaARS(m.monto)}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Saldo: {formatearMonedaARS(m.saldo_nuevo)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EmpleadoCuentaCorrienteDialog
