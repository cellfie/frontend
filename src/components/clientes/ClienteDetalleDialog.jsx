"use client"

import { useEffect, useState } from "react"
import {
  User,
  Phone,
  IdCard,
  CreditCard,
  Edit,
  Trash2,
  Plus,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  DollarSign,
  Settings,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DateRangePicker } from "@/lib/DatePickerWithRange"

const ClienteDetalleDialog = ({
  open,
  onOpenChange,
  clienteSeleccionado,
  cargandoDetalle,
  formatearFechaHora,
  formatearPrecio,
  cargandoCuentaCorriente,
  movimientosCuenta,
  rangoFechasMovimientos,
  setRangoFechasMovimientos,
  abrirDialogCliente,
  abrirDialogEliminar,
  abrirDialogCuentaCorriente,
  abrirDialogPago,
  abrirDialogAjuste,
  cargarMovimientosPorFecha,
}) => {
  const [mostrarTodosMovimientos, setMostrarTodosMovimientos] = useState(false)

  useEffect(() => {
    if (!open) setMostrarTodosMovimientos(false)
  }, [open])

  const cuenta = clienteSeleccionado?.cuentaCorriente
  const saldo = Number(cuenta?.saldo) || 0
  const tieneSaldo = saldo > 0
  const movimientosVisibles = mostrarTodosMovimientos ? movimientosCuenta : movimientosCuenta.slice(0, 8)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-[#131321] to-[#1a1a2e] text-left space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-orange-500 text-xl sm:text-2xl flex items-center gap-2">
                <User className="h-6 w-6 shrink-0" />
                <span className="truncate">{clienteSeleccionado?.nombre || "Detalle del cliente"}</span>
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-1">
                Datos del cliente, cuenta corriente y movimientos
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>

          {!cargandoDetalle && clienteSeleccionado && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                onClick={() => abrirDialogCliente(clienteSeleccionado)}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-500/10 border-red-400/40 text-red-200 hover:bg-red-500/20 hover:text-red-100"
                onClick={abrirDialogEliminar}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {cargandoDetalle || !clienteSeleccionado ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
              <div className="flex justify-center py-8 text-gray-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando detalle...
              </div>
            </div>
          ) : (
            <>
              {/* Datos + resumen CC */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="rounded-xl border bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    Datos del cliente
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-gray-50 border px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nombre</p>
                      <p className="text-lg font-semibold text-gray-900 mt-0.5 break-words">
                        {clienteSeleccionado.nombre}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 border px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                          <IdCard className="h-3.5 w-3.5" />
                          DNI
                        </p>
                        <p className="text-base font-medium text-gray-900 mt-0.5">
                          {clienteSeleccionado.dni || "No registrado"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 border px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Teléfono
                        </p>
                        <p className="text-base font-medium text-gray-900 mt-0.5">
                          {clienteSeleccionado.telefono || "No registrado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Cuenta corriente
                    </h3>
                    {cuenta ? (
                      <Badge
                        className={
                          cuenta.activo
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {cuenta.activo ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activa
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactiva
                          </>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Sin cuenta
                      </Badge>
                    )}
                  </div>

                  {cuenta ? (
                    <>
                      <div className="rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-4 mb-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-orange-900/70">
                          Saldo actual
                        </p>
                        <p
                          className={`text-3xl font-bold mt-1 tabular-nums ${
                            tieneSaldo ? "text-red-700" : "text-green-700"
                          }`}
                        >
                          {formatearPrecio(saldo)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {tieneSaldo ? "Saldo pendiente a cobrar" : "Cuenta al día"}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-gray-50 px-4 py-3 mb-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Límite de crédito
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-0.5">
                          {cuenta.limiteCredito > 0 ? formatearPrecio(cuenta.limiteCredito) : "Sin límite"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={abrirDialogCuentaCorriente}
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Settings className="h-3.5 w-3.5 mr-1.5" />
                          Configurar
                        </Button>
                        {tieneSaldo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={abrirDialogPago}
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                            Registrar pago
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={abrirDialogAjuste}
                          className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Ajustes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 px-2">
                      <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h4 className="text-base font-medium text-gray-700 mb-1">Sin cuenta corriente</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Este cliente aún no tiene una cuenta corriente configurada
                      </p>
                      <Button
                        variant="outline"
                        onClick={abrirDialogCuentaCorriente}
                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Crear cuenta corriente
                      </Button>
                    </div>
                  )}
                </section>
              </div>

              {/* Movimientos */}
              {cuenta && (
                <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b bg-gray-50/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Movimientos
                        {movimientosCuenta.length > 0 && (
                          <Badge variant="outline" className="font-normal">
                            {movimientosCuenta.length}
                          </Badge>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <DateRangePicker
                          date={rangoFechasMovimientos}
                          setDate={setRangoFechasMovimientos}
                          className="w-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            cargarMovimientosPorFecha(cuenta.id, rangoFechasMovimientos)
                          }
                          className="h-9"
                        >
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Filtrar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {cargandoCuentaCorriente ? (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div key={idx} className="rounded-lg border p-4 flex justify-between">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : movimientosCuenta.length === 0 ? (
                      <div className="text-center py-10">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h4 className="text-base font-medium text-gray-700 mb-1">Sin movimientos</h4>
                        <p className="text-sm text-gray-500">
                          No hay movimientos registrados en el período seleccionado
                        </p>
                      </div>
                    ) : (
                      <>
                        <ScrollArea className={mostrarTodosMovimientos ? "h-[380px]" : "max-h-none"}>
                          <div className="space-y-2.5 pr-3">
                            {movimientosVisibles.map((movimiento) => {
                              const esCargo = movimiento.tipo === "cargo"
                              return (
                                <div
                                  key={movimiento.id}
                                  className="rounded-lg border bg-white p-4 hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {esCargo ? (
                                          <ArrowUpRight className="h-4 w-4 text-red-600 shrink-0" />
                                        ) : (
                                          <ArrowDownRight className="h-4 w-4 text-green-600 shrink-0" />
                                        )}
                                        <span className="font-semibold text-gray-900">
                                          {esCargo ? "Cargo" : "Pago"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatearFechaHora(movimiento.fecha)}
                                        </span>
                                      </div>
                                      {movimiento.notas && (
                                        <p className="text-sm text-gray-600 mt-1.5 break-words">
                                          {movimiento.notas}
                                        </p>
                                      )}
                                    </div>
                                    <div
                                      className={`text-lg font-bold tabular-nums shrink-0 ${
                                        esCargo ? "text-red-600" : "text-green-600"
                                      }`}
                                    >
                                      {esCargo ? "+" : "−"}
                                      {formatearPrecio(movimiento.monto)}
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2 border-t text-xs text-gray-500 flex flex-wrap justify-between gap-2">
                                    <span>
                                      Saldo anterior: {formatearPrecio(Number(movimiento.saldo_anterior) || 0)}
                                    </span>
                                    <span>
                                      Saldo nuevo: {formatearPrecio(Number(movimiento.saldo_nuevo) || 0)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>

                        {movimientosCuenta.length > 8 && (
                          <div className="text-center mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMostrarTodosMovimientos(!mostrarTodosMovimientos)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {mostrarTodosMovimientos
                                ? "Ver menos"
                                : `Ver todos (${movimientosCuenta.length})`}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClienteDetalleDialog
