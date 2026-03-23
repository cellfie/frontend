"use client"

import {
  Plus,
  MinusCircle,
  FilterX,
  Wallet,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Scale,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatearMonedaARS, formatearFechaHora, interpretarCierreCaja } from "@/lib/cajaHistorialUtils"
import { PaginationControls } from "@/lib/PaginationControls"

/**
 * Modal de detalle de una sesión de caja (totales, cierre, movimientos filtrados).
 */
export function CajaSesionDetalleModal({
  open,
  onOpenChange,
  sesionDetalle,
  loadingDetalle,
  historialMovimientos,
  loadingHistorialMovimientos,
  historialMovimientosPagination,
  historialFiltroOrigen,
  setHistorialFiltroOrigen,
  historialFiltroTipo,
  setHistorialFiltroTipo,
  historialTabDesglose,
  setHistorialTabDesglose,
  cargarHistorialMovimientos,
}) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideCloseButton className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {loadingDetalle ? (
            <div className="space-y-4 py-4">
              <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
              <div className="grid grid-cols-4 gap-3 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            </div>
          ) : sesionDetalle?.sesion ? (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <DialogTitle className="text-orange-600 flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Sesión de caja — {sesionDetalle.sesion.punto_venta_nombre}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Apertura: {formatearFechaHora(sesionDetalle.sesion.fecha_apertura)}
                      {sesionDetalle.sesion.fecha_cierre && (
                        <> · Cierre: {formatearFechaHora(sesionDetalle.sesion.fecha_cierre)}</>
                      )}
                    </DialogDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => onOpenChange(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al listado
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Quién abrió / quién cerró / duración */}
                <Card className="border border-gray-200 bg-gray-50/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Abierta por</p>
                        <p className="font-medium text-gray-900">{sesionDetalle.sesion.usuario_apertura_nombre}</p>
                        <p className="text-xs text-gray-600">{formatearFechaHora(sesionDetalle.sesion.fecha_apertura)}</p>
                      </div>
                      {sesionDetalle.sesion.fecha_cierre ? (
                        <>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Cerrada por</p>
                            <p className="font-medium text-gray-900">{sesionDetalle.sesion.usuario_cierre_nombre || "—"}</p>
                            <p className="text-xs text-gray-600">{formatearFechaHora(sesionDetalle.sesion.fecha_cierre)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Duración</p>
                            <p className="font-medium text-gray-900">
                              {(() => {
                                const a = new Date(sesionDetalle.sesion.fecha_apertura)
                                const b = new Date(sesionDetalle.sesion.fecha_cierre)
                                const min = Math.round((b - a) / 60000)
                                const h = Math.floor(min / 60)
                                const m = min % 60
                                return h > 0 ? `${h} h ${m} min` : `${m} min`
                              })()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">Estado</p>
                          <p className="font-medium text-green-700 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Sesión en curso
                          </p>
                          <p className="text-xs text-gray-600">
                            Abierta hace{" "}
                            {(() => {
                              const a = new Date(sesionDetalle.sesion.fecha_apertura)
                              const b = new Date()
                              const min = Math.round((b - a) / 60000)
                              const h = Math.floor(min / 60)
                              const m = min % 60
                              return h > 0 ? `${h} h ${m} min` : `${m} min`
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cierre de caja: arqueo, diferencia, notas */}
                {(() => {
                  const s = sesionDetalle.sesion
                  const tot = sesionDetalle.totales
                  const vp = (tot?.ventas_productos || []).reduce((acc, v) => acc + Number(v.total || 0), 0)
                  const ve = (tot?.ventas_equipos || []).reduce((acc, v) => acc + Number(v.total || 0), 0)
                  const rep = (tot?.reparaciones || []).reduce((acc, v) => acc + Number(v.total || 0), 0)
                  const pcc = (tot?.pagos_cuenta_corriente || []).reduce((acc, v) => acc + Number(v.total || 0), 0)
                  const manual = tot?.movimientos_por_origen?.general || { ingresos: 0, egresos: 0 }
                  const ingManual = Number(manual.ingresos) || 0
                  const egrManual = Number(manual.egresos) || 0
                  const montoApertura = Number(s.monto_apertura) || 0
                  // Mismo criterio que "Balance total" y que el cierre en pantalla (Caja).
                  const saldoTeoricoArqueo = montoApertura + vp + ve + rep + pcc + ingManual - egrManual
                  const montoCierre =
                    s.monto_cierre != null && s.monto_cierre !== "" ? Number(s.monto_cierre) : null
                  const diferencia =
                    s.diferencia != null && s.diferencia !== "" ? Number(s.diferencia) : null
                  const cierreRegistrado =
                    s.estado === "cerrada" &&
                    s.fecha_cierre &&
                    montoCierre != null &&
                    !Number.isNaN(montoCierre) &&
                    diferencia != null &&
                    !Number.isNaN(diferencia)
                  const cierreAutoSinArqueo =
                    s.estado === "cerrada" &&
                    s.fecha_cierre &&
                    (montoCierre == null || Number.isNaN(montoCierre) || diferencia == null || Number.isNaN(diferencia))

                  if (s.estado === "abierta" || !s.fecha_cierre) {
                    return (
                      <Card className="border border-amber-200 bg-amber-50/60">
                        <CardContent className="p-4 flex gap-3">
                          <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-900">Sesión en curso</p>
                            <p className="text-sm text-amber-900/90 mt-1">
                              El cierre de caja (dinero contado, diferencia y notas) se registra cuando cerrás la caja
                              desde el botón <strong>Cerrar caja</strong>.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  if (cierreAutoSinArqueo) {
                    return (
                      <Card className="border border-gray-300 bg-gray-50/80">
                        <CardContent className="p-4 flex gap-3">
                          <Info className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Cierre sin arqueo</p>
                            <p className="text-sm text-gray-700 mt-1">
                              Esta sesión figura como cerrada pero no hay monto de cierre ni diferencia registrados
                              (por ejemplo, cierre automático al abrir otra sesión). No se puede evaluar sobrante ni
                              faltante.
                            </p>
                            {s.notas_cierre && (
                              <p className="text-sm text-gray-600 mt-2 italic border-t pt-2">
                                Notas: {s.notas_cierre}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  if (!cierreRegistrado) {
                    return null
                  }

                  const diferenciaCoherente = Number(montoCierre) - saldoTeoricoArqueo
                  const diferenciaRegistrada = Number(diferencia)
                  const legacyMismatch =
                    Number.isFinite(diferenciaRegistrada) &&
                    Number.isFinite(diferenciaCoherente) &&
                    Math.abs(diferenciaRegistrada - diferenciaCoherente) > 0.02

                  const interp = interpretarCierreCaja(diferenciaCoherente)
                  const absDif = Math.abs(Number(diferenciaCoherente) || 0)
                  const borderClass =
                    interp.tipo === "perfecto"
                      ? "border-emerald-300 bg-emerald-50/50"
                      : interp.tipo === "sobrante"
                        ? "border-sky-300 bg-sky-50/50"
                        : "border-rose-300 bg-rose-50/50"

                  return (
                    <Card className={`border-2 ${borderClass}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                          <Scale className="h-5 w-5 text-gray-700" />
                          Cierre de caja
                        </CardTitle>
                        <CardDescription>
                          Arqueo al cerrar. El saldo teórico es el mismo <strong>balance total</strong> de la sesión:
                          apertura + ventas (productos, equipos, reparaciones) + pagos cuenta corriente + ingresos
                          manuales generales − egresos manuales generales.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="rounded-lg border bg-white/80 p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase">Cerrada el</p>
                            <p className="font-semibold text-gray-900">{formatearFechaHora(s.fecha_cierre)}</p>
                            {s.usuario_cierre_nombre && (
                              <p className="text-xs text-gray-600 mt-1">Por {s.usuario_cierre_nombre}</p>
                            )}
                          </div>
                          <div className="rounded-lg border bg-white/80 p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase">Dinero contado</p>
                            <p className="text-lg font-bold text-gray-900">{formatearMonedaARS(montoCierre)}</p>
                            <p className="text-xs text-gray-500 mt-1">Monto físico declarado al cerrar</p>
                          </div>
                          <div className="rounded-lg border bg-white/80 p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase">Saldo teórico (balance total)</p>
                            <p className="text-lg font-bold text-violet-800">
                              {formatearMonedaARS(saldoTeoricoArqueo)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 leading-snug">
                              Apertura {formatearMonedaARS(montoApertura)} + ventas prod. {formatearMonedaARS(vp)} + equipos{" "}
                              {formatearMonedaARS(ve)} + rep. {formatearMonedaARS(rep)} + pagos CC {formatearMonedaARS(pcc)} + ing. manual{" "}
                              {formatearMonedaARS(ingManual)} − egresos manual {formatearMonedaARS(egrManual)}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-white/80 p-3 flex flex-col justify-center">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Resultado</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {interp.tipo === "perfecto" && (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {interp.label}
                                </Badge>
                              )}
                              {interp.tipo === "sobrante" && (
                                <Badge className="bg-sky-600 text-white hover:bg-sky-600 gap-1">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {interp.label}: +{formatearMonedaARS(absDif)}
                                </Badge>
                              )}
                              {interp.tipo === "faltante" && (
                                <Badge className="bg-rose-600 text-white hover:bg-rose-600 gap-1">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  {interp.label}: −{formatearMonedaARS(absDif)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-2">{interp.descripcion}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-3 text-sm">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Diferencia (contado − balance total)</p>
                          <p className="font-mono font-semibold text-gray-900">
                            {formatearMonedaARS(montoCierre)} − {formatearMonedaARS(saldoTeoricoArqueo)} ={" "}
                            {formatearMonedaARS(diferenciaCoherente)}
                          </p>
                          {legacyMismatch && (
                            <p className="text-xs text-amber-800 mt-2">
                              Valor almacenado al cierre (cálculo anterior): {formatearMonedaARS(diferenciaRegistrada)}. Las
                              nuevas sesiones guardan la diferencia con la misma fórmula que este balance.
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Un valor cercano a cero indica arqueo alineado con ventas y movimientos de la sesión.
                          </p>
                        </div>
                        {s.notas_cierre ? (
                          <div className="rounded-lg border bg-white/80 p-3">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notas al cerrar</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{s.notas_cierre}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Sin notas de cierre registradas.</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Tarjetas de montos */}
                {(() => {
                  const tot = sesionDetalle.totales
                  const vp = (tot?.ventas_productos || []).reduce((s, v) => s + Number(v.total || 0), 0)
                  const ve = (tot?.ventas_equipos || []).reduce((s, v) => s + Number(v.total || 0), 0)
                  const rep = (tot?.reparaciones || []).reduce((s, v) => s + Number(v.total || 0), 0)
                  const pcc = (tot?.pagos_cuenta_corriente || []).reduce((s, v) => s + Number(v.total || 0), 0)
                  const manual = tot?.movimientos_por_origen?.general || { ingresos: 0, egresos: 0 }
                  const totalIngresos = vp + ve + rep + pcc + (manual.ingresos || 0)
                  const totalEgresos = manual.egresos || 0
                  const montoInicial = Number(sesionDetalle.sesion.monto_apertura || 0)
                  const balance = montoInicial + totalIngresos - totalEgresos
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Card className="border border-gray-200">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500">Monto inicial</p>
                          <p className="text-lg font-semibold text-gray-900">{formatearMonedaARS(montoInicial)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-green-200 bg-green-50/50">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-600">Ingresos</p>
                          <p className="text-lg font-semibold text-green-700">{formatearMonedaARS(totalIngresos)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-red-200 bg-red-50/50">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-600">Egresos</p>
                          <p className="text-lg font-semibold text-red-700">{formatearMonedaARS(totalEgresos)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-2 border-orange-200 bg-orange-50/50">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-700 font-medium">Balance total</p>
                          <p className="text-lg font-bold text-orange-700">{formatearMonedaARS(balance)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* Tabs desglose por método de pago */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Desglose por tipo y método de pago</CardTitle>
                    <CardDescription>Totales por categoría y forma de pago.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={historialTabDesglose} onValueChange={setHistorialTabDesglose}>
                      <TabsList className="grid grid-cols-4 w-full mb-3">
                        <TabsTrigger value="ventas_productos">Ventas productos</TabsTrigger>
                        <TabsTrigger value="ventas_equipos">Ventas equipos</TabsTrigger>
                        <TabsTrigger value="reparaciones">Reparaciones</TabsTrigger>
                        <TabsTrigger value="general">General</TabsTrigger>
                      </TabsList>
                      {["ventas_productos", "ventas_equipos", "reparaciones", "general"].map((tab) => {
                        const arr =
                          tab === "ventas_productos"
                            ? sesionDetalle.totales?.ventas_productos || []
                            : tab === "ventas_equipos"
                              ? sesionDetalle.totales?.ventas_equipos || []
                              : tab === "reparaciones"
                                ? sesionDetalle.totales?.reparaciones || []
                                : []
                        const manualIng = tab === "general" ? (sesionDetalle.totales?.movimientos_por_origen?.general?.ingresos || 0) : 0
                        const manualEgr = tab === "general" ? (sesionDetalle.totales?.movimientos_por_origen?.general?.egresos || 0) : 0
                        const totalTab =
                          tab === "general"
                            ? manualIng +
                              (sesionDetalle.totales?.ventas_productos || []).reduce((s, v) => s + Number(v.total || 0), 0) +
                              (sesionDetalle.totales?.ventas_equipos || []).reduce((s, v) => s + Number(v.total || 0), 0) +
                              (sesionDetalle.totales?.reparaciones || []).reduce((s, v) => s + Number(v.total || 0), 0) +
                              (sesionDetalle.totales?.pagos_cuenta_corriente || []).reduce((s, v) => s + Number(v.total || 0), 0) -
                              manualEgr
                            : arr.reduce((s, v) => s + Number(v.total || 0), 0)
                        return (
                          <TabsContent key={tab} value={tab} className="space-y-2 mt-0">
                            {tab === "general" ? (
                              <div className="space-y-2 text-sm">
                                <p className="font-medium text-gray-700">Resumen general (todas las categorías + movimientos manuales)</p>
                                <ul className="space-y-1">
                                  {(sesionDetalle.totales?.ventas_productos || []).map((v) => (
                                    <li key={`vp-${v.tipo_pago}`} className="flex justify-between">
                                      <span className="text-gray-600">Ventas productos · {v.tipo_pago}</span>
                                      <span className="font-medium">{formatearMonedaARS(v.total)}</span>
                                    </li>
                                  ))}
                                  {(sesionDetalle.totales?.ventas_equipos || []).map((v) => (
                                    <li key={`ve-${v.tipo_pago}`} className="flex justify-between">
                                      <span className="text-gray-600">Ventas equipos · {v.tipo_pago}</span>
                                      <span className="font-medium">{formatearMonedaARS(v.total)}</span>
                                    </li>
                                  ))}
                                  {(sesionDetalle.totales?.reparaciones || []).map((v) => (
                                    <li key={`rep-${v.tipo_pago}`} className="flex justify-between">
                                      <span className="text-gray-600">Reparaciones · {v.tipo_pago}</span>
                                      <span className="font-medium">{formatearMonedaARS(v.total)}</span>
                                    </li>
                                  ))}
                                  {(sesionDetalle.totales?.pagos_cuenta_corriente || []).map((v) => (
                                    <li key={`pcc-${v.tipo_pago}`} className="flex justify-between">
                                      <span className="text-gray-600">Pagos cuenta corriente · {v.tipo_pago}</span>
                                      <span className="font-medium">{formatearMonedaARS(v.total)}</span>
                                    </li>
                                  ))}
                                  {manualIng > 0 && (
                                    <li className="flex justify-between text-green-700">
                                      <span>Ingresos manuales</span>
                                      <span className="font-medium">{formatearMonedaARS(manualIng)}</span>
                                    </li>
                                  )}
                                  {manualEgr > 0 && (
                                    <li className="flex justify-between text-red-700">
                                      <span>Egresos manuales</span>
                                      <span className="font-medium">{formatearMonedaARS(manualEgr)}</span>
                                    </li>
                                  )}
                                </ul>
                                <p className="pt-2 font-semibold text-gray-900 border-t">
                                  Total ingresos (categorías + manual) − Egresos: {formatearMonedaARS(totalTab)}
                                </p>
                                <p className="text-orange-700 font-bold">
                                  Balance total sesión (inicial + ingresos − egresos):{" "}
                                  {formatearMonedaARS(
                                    Number(sesionDetalle.sesion?.monto_apertura || 0) + totalTab,
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1 text-sm">
                                {arr.length === 0 ? (
                                  <p className="text-gray-500">Sin movimientos en esta categoría.</p>
                                ) : (
                                  <>
                                    {arr.map((v) => (
                                      <div key={v.tipo_pago} className="flex justify-between py-1">
                                        <span className="text-gray-700">{v.tipo_pago}</span>
                                        <span className="font-semibold text-green-700">{formatearMonedaARS(v.total)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between pt-2 font-semibold border-t">
                                      <span>Total</span>
                                      <span className="text-green-700">{formatearMonedaARS(arr.reduce((s, v) => s + Number(v.total || 0), 0))}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </TabsContent>
                        )
                      })}
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Tabla de movimientos con filtros */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      Movimientos de la sesión
                      {!loadingHistorialMovimientos && (
                        <span className="text-sm font-normal text-gray-500">
                          ({historialMovimientosPagination.totalItems} resultado{historialMovimientosPagination.totalItems !== 1 ? "s" : ""})
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>Filtrar por tipo de movimiento y por categoría.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Origen:</span>
                        <Select value={historialFiltroOrigen} onValueChange={setHistorialFiltroOrigen}>
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">Todos</SelectItem>
                            <SelectItem value="ventas_productos">Ventas productos</SelectItem>
                            <SelectItem value="ventas_equipos">Ventas equipos</SelectItem>
                            <SelectItem value="reparaciones">Reparaciones</SelectItem>
                            <SelectItem value="manual">Ingresos/egresos manuales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Tipo:</span>
                        <Select value={historialFiltroTipo} onValueChange={setHistorialFiltroTipo}>
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="ingreso">Solo ingresos</SelectItem>
                            <SelectItem value="egreso">Solo egresos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ScrollArea className="h-[320px] rounded-md border">
                      <div className="divide-y">
                        {loadingHistorialMovimientos ? (
                          <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                            <span className="text-sm">Cargando movimientos...</span>
                          </div>
                        ) : historialMovimientos.length === 0 ? (
                          <div className="py-10 px-4 text-center">
                            <FilterX className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No hay movimientos para este filtro.</p>
                            {(historialFiltroOrigen !== "general" || historialFiltroTipo !== "todos") && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3 gap-1"
                                onClick={() => {
                                  setHistorialFiltroOrigen("general")
                                  setHistorialFiltroTipo("todos")
                                }}
                              >
                                <FilterX className="h-3 w-3" />
                                Limpiar filtros
                              </Button>
                            )}
                          </div>
                        ) : (
                          historialMovimientos.map((mov) => {
                            const esIngreso = mov.tipo === "ingreso" || mov.tipo === "venta"
                            return (
                              <div
                                key={`${mov.tipo}-${mov.id}`}
                                className="flex items-center justify-between py-2 px-4 text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                      esIngreso ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {esIngreso ? <Plus className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{mov.concepto}</div>
                                    <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                                      <span>{formatearFechaHora(mov.fecha)}</span>
                                      {mov.tipo_pago && <span>Método: {mov.tipo_pago}</span>}
                                      {mov.usuario_nombre && <span>Usuario: {mov.usuario_nombre}</span>}
                                      {mov.tipo === "venta" && (
                                        <span className="bg-blue-100 text-blue-800 px-1 rounded text-[10px]">Venta</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className={`font-semibold ${esIngreso ? "text-green-700" : "text-red-700"}`}>
                                  {esIngreso ? "+" : "-"} {formatearMonedaARS(mov.monto)}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                    {historialMovimientosPagination.totalPages > 1 && (
                      <div className="flex justify-end">
                        <PaginationControls
                          currentPage={historialMovimientosPagination.currentPage}
                          totalPages={historialMovimientosPagination.totalPages}
                          totalItems={historialMovimientosPagination.totalItems}
                          itemsPerPage={historialMovimientosPagination.itemsPerPage}
                          onPageChange={(page) => cargarHistorialMovimientos(page)}
                          onItemsPerPageChange={() => {}}
                          isLoading={loadingHistorialMovimientos}
                          hidePageSizeSelector
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

  )
}
