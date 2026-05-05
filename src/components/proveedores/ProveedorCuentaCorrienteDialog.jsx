"use client"

import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

const formatearMonedaARS = (valor) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(valor) || 0)

const ProveedorCuentaCorrienteDialog = ({
  open,
  onOpenChange,
  proveedor,
  cuentaData,
  loading,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  onFiltrarMovimientos,
  comprasProveedor,
  puntosVenta,
  tiposPago,
  formPago,
  setFormPago,
  onRegistrarPago,
  procesandoPago,
}) => {
  const saldo = Number(cuentaData?.cuenta_corriente?.saldo || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cuenta corriente proveedor {proveedor?.nombre ? `- ${proveedor.nombre}` : ""}
          </DialogTitle>
          <DialogDescription>
            Consultá deuda pendiente, movimientos y registrá pagos imputados a compras.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando cuenta corriente...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-orange-50/60 p-4">
              <p className="text-xs text-gray-600">Saldo pendiente actual</p>
              <p className={`text-2xl font-bold ${saldo > 0 ? "text-red-700" : "text-green-700"}`}>
                {formatearMonedaARS(saldo)}
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Registrar pago al proveedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Compra a imputar</Label>
                  <Select
                    value={formPago.compra_id}
                    onValueChange={(value) => setFormPago((prev) => ({ ...prev, compra_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {comprasProveedor.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.numero_comprobante}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Punto de venta</Label>
                  <Select
                    value={formPago.punto_venta_id}
                    onValueChange={(value) => setFormPago((prev) => ({ ...prev, punto_venta_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar punto" />
                    </SelectTrigger>
                    <SelectContent>
                      {puntosVenta.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Método de pago</Label>
                  <Select
                    value={formPago.tipo_pago}
                    onValueChange={(value) => setFormPago((prev) => ({ ...prev, tipo_pago: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPago.map((t) => (
                        <SelectItem key={t.id} value={t.nombre}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPago.monto}
                    onChange={(e) => setFormPago((prev) => ({ ...prev, monto: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notas (opcional)</Label>
                <Input
                  value={formPago.notas}
                  onChange={(e) => setFormPago((prev) => ({ ...prev, notas: e.target.value }))}
                  placeholder="Ej: Pago parcial de deuda"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={onRegistrarPago} disabled={procesandoPago} className="bg-orange-600 hover:bg-orange-700">
                  {procesandoPago ? "Registrando..." : "Registrar pago"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Movimientos de cuenta corriente</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                <Button variant="outline" onClick={onFiltrarMovimientos}>
                  Filtrar
                </Button>
              </div>
              <ScrollArea className="h-[320px] border rounded-md">
                <div className="divide-y">
                  {(cuentaData?.movimientos || []).length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">Sin movimientos para el filtro seleccionado.</div>
                  ) : (
                    cuentaData.movimientos.map((mov) => (
                      <div key={mov.id} className="py-2 px-3 text-sm flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-800">
                            {mov.tipo === "cargo" ? "Cargo por compra" : "Pago al proveedor"}
                          </p>
                          <p className="text-xs text-gray-500">{mov.notas || "-"}</p>
                          <p className="text-xs text-gray-500">
                            Saldo: {formatearMonedaARS(mov.saldo_anterior)} -> {formatearMonedaARS(mov.saldo_nuevo)}
                          </p>
                        </div>
                        <div className={`font-semibold ${mov.tipo === "cargo" ? "text-red-700" : "text-green-700"}`}>
                          {mov.tipo === "cargo" ? "+" : "-"} {formatearMonedaARS(mov.monto)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProveedorCuentaCorrienteDialog

