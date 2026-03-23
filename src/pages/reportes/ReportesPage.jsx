"use client"

import { useEffect, useMemo, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { BarChart3, Calendar, Clock, Filter } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/lib/DatePickerWithRange"

import { getSesionesCaja, getSesionCajaPorId } from "@/services/cajaService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getComprasPaginadas } from "@/services/comprasService"
import { getMetodosPagoVentas } from "@/services/ventasService"

const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(numero)
}

const formatLocalDate = (date) => {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const calcularRango = (preset) => {
  const hoy = startOfDay(new Date())
  if (preset === "hoy") return { from: hoy, to: hoy }
  if (preset === "ayer") {
    const a = addDays(hoy, -1)
    return { from: a, to: a }
  }
  if (preset === "semana") {
    // Últimos 7 días incluyendo hoy
    return { from: addDays(hoy, -6), to: hoy }
  }
  if (preset === "mes") {
    // Últimos 30 días incluyendo hoy
    return { from: addDays(hoy, -29), to: hoy }
  }
  return { from: addDays(hoy, -6), to: hoy }
}

const sumarTotales = (rows = []) => rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0)

const sumarTotalesVentasEquipos = (rows = []) => rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0)

/** Normaliza etiquetas de método (ventas "Tarjeta de crédito" vs reparación "tarjeta", cuentaCorriente, etc.) */
const sinDiacriticos = (s) => String(s).normalize("NFD").replace(/\u0300-\u036f/g, "")

const comparableMetodoPagoKey = (raw) => {
  const t = String(raw ?? "").trim()
  if (!t) return ""
  if (t === "cuentaCorriente") return "cuenta corriente"
  const n = sinDiacriticos(t).toLowerCase().replace(/\s+/g, " ").trim()
  if (n === "tarjeta") return "tarjeta de credito"
  return n
}

const filaCoincideMetodo = (tipoPagoFila, filtroMetodo) => {
  if (!filtroMetodo || filtroMetodo === "todos") return true
  return comparableMetodoPagoKey(tipoPagoFila) === comparableMetodoPagoKey(filtroMetodo)
}

const sumarTotalesFiltrado = (rows = [], filtroMetodo) => {
  if (!filtroMetodo || filtroMetodo === "todos") return sumarTotales(rows)
  return (rows || []).reduce((acc, r) => acc + (filaCoincideMetodo(r.tipo_pago, filtroMetodo) ? Number(r.total) || 0 : 0), 0)
}

/**
 * @param {object} detalle - respuesta getSesionCajaPorId
 * @param {string} metodoFiltro - "todos" o nombre exacto del combo (ej. "ViuMi")
 */
const construirResumenSesion = (detalle, metodoFiltro = "todos") => {
  const tot = detalle?.totales || {}
  const filtrar = metodoFiltro || "todos"
  const ventasProductos = sumarTotalesFiltrado(tot.ventas_productos, filtrar)
  const ventasEquipos = sumarTotalesFiltrado(tot.ventas_equipos, filtrar)
  const reparaciones = sumarTotalesFiltrado(tot.reparaciones, filtrar)
  const cobrosCuentaCorriente = sumarTotalesFiltrado(tot.pagos_cuenta_corriente, filtrar)

  const movIngresos = filtrar === "todos" ? Number(tot.movimientos?.ingresos) || 0 : 0
  const movEgresos = filtrar === "todos" ? Number(tot.movimientos?.egresos) || 0 : 0

  const ingresos = ventasProductos + ventasEquipos + reparaciones + cobrosCuentaCorriente + movIngresos
  const egresos = movEgresos
  const neto = ingresos - egresos

  return {
    ventasProductos,
    ventasEquipos,
    reparaciones,
    cobrosCuentaCorriente,
    movIngresos,
    movEgresos,
    ingresos,
    egresos,
    neto,
  }
}

export default function ReportesPage() {
  const [preset, setPreset] = useState("semana")
  const [dateRange, setDateRange] = useState(() => calcularRango("semana"))

  const [puntosVenta, setPuntosVenta] = useState([])
  const [selectedPuntoVenta, setSelectedPuntoVenta] = useState("todos")
  const [estadoSesion, setEstadoSesion] = useState("cerrada") // cerrada | abierta | todos
  const [metodosPago, setMetodosPago] = useState([])
  const [selectedMetodoPago, setSelectedMetodoPago] = useState("todos")

  const [loading, setLoading] = useState(true)
  const [sesiones, setSesiones] = useState([])
  const [detallesPorSesion, setDetallesPorSesion] = useState({})
  const [compras, setCompras] = useState([])

  useEffect(() => {
    const cargarPV = async () => {
      try {
        const pv = await getPuntosVenta()
        setPuntosVenta(pv || [])
      } catch (e) {
        console.error(e)
      }
    }
    cargarPV()
  }, [])

  useEffect(() => {
    const cargarMetodos = async () => {
      try {
        const list = await getMetodosPagoVentas()
        setMetodosPago(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error(e)
      }
    }
    cargarMetodos()
  }, [])

  useEffect(() => {
    // si cambian presets, ajustamos rango automáticamente (pero permitir manual cuando preset === "manual")
    if (preset !== "manual") setDateRange(calcularRango(preset))
  }, [preset])

  const filtros = useMemo(() => {
    const f = {}
    if (selectedPuntoVenta !== "todos") f.punto_venta_id = selectedPuntoVenta
    if (estadoSesion !== "todos") f.estado = estadoSesion
    if (dateRange?.from) f.fecha_inicio = formatLocalDate(dateRange.from)
    if (dateRange?.to) f.fecha_fin = formatLocalDate(dateRange.to)
    return f
  }, [selectedPuntoVenta, estadoSesion, dateRange])

  const cargar = async () => {
    setLoading(true)
    try {
      // traer muchas (semana/mes suele ser pocas). Si tenés más, subimos a 500.
      const data = await getSesionesCaja(1, 500, filtros)
      const list = data?.sesiones || []
      setSesiones(list)

      // Compras del rango (egreso global): usar mismos filtros de fechas y punto de venta
      const filtrosCompras = {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
      }
      if (selectedPuntoVenta !== "todos") filtrosCompras.punto_venta_id = selectedPuntoVenta

      const comprasData = await getComprasPaginadas(1, 500, filtrosCompras)
      setCompras(comprasData?.compras || [])

      // Para resumen financiero necesitamos los totales por sesión (endpoint detalle)
      const detalles = await Promise.all(
        list.map(async (s) => {
          try {
            const det = await getSesionCajaPorId(s.id)
            return [s.id, det]
          } catch (e) {
            console.error("Error detalle sesión", s.id, e)
            return [s.id, null]
          }
        }),
      )

      const map = {}
      detalles.forEach(([id, det]) => {
        if (det) map[id] = det
      })
      setDetallesPorSesion(map)
    } catch (error) {
      console.error("Error al cargar reportes:", error)
      toast.error(error.message || "Error al cargar reportes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros])

  const resumenGlobal = useMemo(() => {
    const base = {
      ventasProductos: 0,
      ventasEquipos: 0,
      reparaciones: 0,
      cobrosCuentaCorriente: 0,
      movIngresos: 0,
      movEgresos: 0,
      ingresos: 0,
      egresos: 0,
      neto: 0,
      sesiones: 0,
    }
    const ids = Object.keys(detallesPorSesion)
    base.sesiones = ids.length
    ids.forEach((id) => {
      const det = detallesPorSesion[id]
      const r = construirResumenSesion(det, selectedMetodoPago)
      Object.keys(r).forEach((k) => {
        base[k] += r[k]
      })
    })

    const totalCompras = (compras || []).reduce((acc, c) => acc + (Number(c.total) || 0), 0)
    if (selectedMetodoPago === "todos") {
      base.egresos = totalCompras
      base.neto = base.neto - totalCompras
    } else {
      // Las compras no se asignan a un método de cobro de ventas: no restan en vistas filtradas
      base.egresos = 0
    }

    return base
  }, [detallesPorSesion, compras, selectedMetodoPago])

  const sesionesConResumen = useMemo(() => {
    return sesiones.map((s) => {
      const det = detallesPorSesion[s.id]
      const r = det ? construirResumenSesion(det, selectedMetodoPago) : null
      return { ...s, _resumen: r }
    })
  }, [sesiones, detallesPorSesion, selectedMetodoPago])

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-600" /> Reportes
          </h1>
          <p className="text-gray-500">Resumen financiero basado en sesiones de caja</p>
        </div>
      </div>

      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            Filtros
          </CardTitle>
          <CardDescription className="text-gray-300">
            Seleccioná un rango rápido (por defecto Semana) o elegí fechas manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={preset === "hoy" ? "default" : "outline"}
              className={preset === "hoy" ? "bg-orange-600 hover:bg-orange-700" : ""}
              onClick={() => setPreset("hoy")}
              size="sm"
            >
              Hoy
            </Button>
            <Button
              variant={preset === "ayer" ? "default" : "outline"}
              className={preset === "ayer" ? "bg-orange-600 hover:bg-orange-700" : ""}
              onClick={() => setPreset("ayer")}
              size="sm"
            >
              Ayer
            </Button>
            <Button
              variant={preset === "semana" ? "default" : "outline"}
              className={preset === "semana" ? "bg-orange-600 hover:bg-orange-700" : ""}
              onClick={() => setPreset("semana")}
              size="sm"
            >
              Semana
            </Button>
            <Button
              variant={preset === "mes" ? "default" : "outline"}
              className={preset === "mes" ? "bg-orange-600 hover:bg-orange-700" : ""}
              onClick={() => setPreset("mes")}
              size="sm"
            >
              Mes
            </Button>
            <Button
              variant={preset === "manual" ? "default" : "outline"}
              className={preset === "manual" ? "bg-orange-600 hover:bg-orange-700" : ""}
              onClick={() => setPreset("manual")}
              size="sm"
            >
              Manual
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Rango de fechas
              </div>
              <DateRangePicker date={dateRange} setDate={setDateRange} className="w-full" />
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Estado de sesión
              </div>
              <Select value={estadoSesion} onValueChange={setEstadoSesion}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cerrada">Cerradas</SelectItem>
                  <SelectItem value="abierta">Abiertas</SelectItem>
                  <SelectItem value="todos">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">Punto de venta</div>
              <Select value={selectedPuntoVenta} onValueChange={setSelectedPuntoVenta}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {puntosVenta.map((pv) => (
                    <SelectItem key={pv.id} value={pv.id.toString()}>
                      {pv.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">Método de pago</div>
              <Select value={selectedMetodoPago} onValueChange={setSelectedMetodoPago}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los métodos</SelectItem>
                  {metodosPago.map((m) => (
                    <SelectItem key={m.id} value={m.nombre}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedMetodoPago !== "todos" ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Estás viendo solo ingresos cobrados con <strong>{selectedMetodoPago}</strong>. Los movimientos manuales de caja y las{" "}
              <strong>compras</strong> no se filtran por método (en esta vista el egreso por compras se muestra en $0).
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-40" /> : <div className="text-2xl font-bold text-green-700">{formatearMonedaARS(resumenGlobal.ingresos)}</div>}
            <p className="text-xs text-gray-500 mt-1">
              {selectedMetodoPago === "todos"
                ? "Productos + equipos + reparaciones + cobros CC + ingresos de caja"
                : `Solo montos con método: ${selectedMetodoPago}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Egresos (Compras)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-40" /> : <div className="text-2xl font-bold text-red-700">{formatearMonedaARS(resumenGlobal.egresos)}</div>}
            <p className="text-xs text-gray-500 mt-1">
              {selectedMetodoPago === "todos" ? "Compras realizadas en el rango" : "No aplica al filtrar por método de cobro"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Neto</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <div className={`text-2xl font-bold ${resumenGlobal.neto >= 0 ? "text-orange-600" : "text-red-700"}`}>
                {formatearMonedaARS(resumenGlobal.neto)}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {selectedMetodoPago === "todos" ? "Sumatoria sesiones − compras del rango" : "Suma de netos por sesión (sin restar compras)"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-gray-900">{resumenGlobal.sesiones}</div>}
            <p className="text-xs text-gray-500 mt-1">Sesiones en el rango</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalle por sesión */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <BarChart3 size={20} />
            Sesiones incluidas
          </CardTitle>
          <CardDescription className="text-gray-300">Se calcula el balance por sesión y se suma al resumen.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sesionesConResumen.length === 0 ? (
            <div className="text-sm text-gray-600">No hay sesiones para el rango seleccionado.</div>
          ) : (
            <div className="space-y-3">
              {sesionesConResumen.map((s) => (
                <div key={s.id} className="border rounded-lg bg-white p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                        #{s.id}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{s.punto_venta_nombre}</div>
                        <div className="text-xs text-gray-500">
                          Apertura:{" "}
                          {s.fecha_apertura
                            ? new Date(s.fecha_apertura).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                          {s.fecha_cierre ? (
                            <>
                              {" "}
                              | Cierre:{" "}
                              {new Date(s.fecha_cierre).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      <Badge
                        variant="outline"
                        className={
                          s.estado === "cerrada"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-blue-300 bg-blue-50 text-blue-700"
                        }
                      >
                        {s.estado}
                      </Badge>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Neto sesión</div>
                        <div className={`font-bold ${s._resumen?.neto >= 0 ? "text-orange-600" : "text-red-700"}`}>
                          {formatearMonedaARS(s._resumen?.neto || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Ventas productos</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.ventasProductos || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Ventas equipos</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.ventasEquipos || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Reparaciones</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.reparaciones || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Cobros cuenta corriente</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.cobrosCuentaCorriente || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Egresos (sesión)</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.movEgresos || 0)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compras incluidas (egreso global del rango) */}
      <Card className="border-0 shadow-md mt-6">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <BarChart3 size={20} />
            Compras incluidas en el rango
          </CardTitle>
          <CardDescription className="text-gray-300">
            Estas compras se consideran egreso global del rango (no se reparten por sesión).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : compras.length === 0 ? (
            <div className="text-sm text-gray-600">No hay compras en el rango seleccionado.</div>
          ) : (
            <div className="space-y-3">
              {compras.map((c) => (
                <div key={c.id} className="border rounded-lg bg-white p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{c.numero_comprobante}</div>
                      <div className="text-xs text-gray-500">
                        {c.fecha
                          ? new Date(c.fecha).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                        {"  "}·{"  "}
                        {c.proveedor_nombre || "Proveedor"}
                        {"  "}·{"  "}
                        {c.punto_venta_nombre || "Punto de venta"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      {c.anulada ? (
                        <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                          Anulada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                          Vigente
                        </Badge>
                      )}
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total compra</div>
                        <div className="font-bold text-red-700">{formatearMonedaARS(c.total || 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

