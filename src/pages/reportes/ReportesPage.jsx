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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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

/** Vista de reporte: general = balance completo de la sesión; el resto = solo ese rubro + mov. de caja con el mismo origen. */
const TIPOS_REPORTE_CAJA = {
  GENERAL: "general",
  VENTAS_PRODUCTOS: "ventas_productos",
  VENTAS_EQUIPOS: "ventas_equipos",
  REPARACIONES: "reparaciones",
}

const ETIQUETA_TIPO_REPORTE = {
  [TIPOS_REPORTE_CAJA.GENERAL]: "General (sesión completa)",
  [TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS]: "Ventas de productos",
  [TIPOS_REPORTE_CAJA.VENTAS_EQUIPOS]: "Ventas de equipos",
  [TIPOS_REPORTE_CAJA.REPARACIONES]: "Reparaciones",
}

/** Campos numéricos del resumen por sesión que se acumulan en el total global */
const CLAVES_RESUMEN_ACUMULABLES = [
  "ventasProductos",
  "ventasEquipos",
  "reparaciones",
  "cobrosCuentaCorriente",
  "movIngresos",
  "movEgresos",
  "movIngresosOrigen",
  "movEgresosOrigen",
  "ingresos",
  "egresos",
  "neto",
]

const bucketMovOrigen = (movimientosPorOrigen, clave) => {
  const o = movimientosPorOrigen?.[clave]
  return {
    ingresos: Number(o?.ingresos) || 0,
    egresos: Number(o?.egresos) || 0,
  }
}

/**
 * @param {object} detalle - respuesta getSesionCajaPorId
 * @param {string} metodoFiltro - "todos" o nombre del combo (ej. "ViuMi")
 * @param {string} tipoReporte - TIPOS_REPORTE_CAJA.*
 */
const construirResumenSesion = (detalle, metodoFiltro = "todos", tipoReporte = TIPOS_REPORTE_CAJA.GENERAL) => {
  const tot = detalle?.totales || {}
  const filtrar = metodoFiltro || "todos"
  const metodoOk = filtrar === "todos"
  const mpo = tot.movimientos_por_origen

  const ventasProductos = sumarTotalesFiltrado(tot.ventas_productos, filtrar)
  const ventasEquipos = sumarTotalesFiltrado(tot.ventas_equipos, filtrar)
  const reparaciones = sumarTotalesFiltrado(tot.reparaciones, filtrar)
  const cobrosCuentaCorriente = sumarTotalesFiltrado(tot.pagos_cuenta_corriente, filtrar)

  if (tipoReporte === TIPOS_REPORTE_CAJA.GENERAL) {
    const movIngresos = metodoOk ? Number(tot.movimientos?.ingresos) || 0 : 0
    const movEgresos = metodoOk ? Number(tot.movimientos?.egresos) || 0 : 0
    const ingresos = ventasProductos + ventasEquipos + reparaciones + cobrosCuentaCorriente + movIngresos
    const egresos = movEgresos
    return {
      ventasProductos,
      ventasEquipos,
      reparaciones,
      cobrosCuentaCorriente,
      movIngresos,
      movEgresos,
      movIngresosOrigen: 0,
      movEgresosOrigen: 0,
      ingresos,
      egresos,
      neto: ingresos - egresos,
      tipoReporte,
    }
  }

  const origenCaja = tipoReporte
  const { ingresos: movIngresosOrigen, egresos: movEgresosOrigen } = metodoOk ? bucketMovOrigen(mpo, origenCaja) : { ingresos: 0, egresos: 0 }

  let cobrosRubro = 0
  if (tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS) cobrosRubro = ventasProductos
  if (tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_EQUIPOS) cobrosRubro = ventasEquipos
  if (tipoReporte === TIPOS_REPORTE_CAJA.REPARACIONES) cobrosRubro = reparaciones

  const ingresos = cobrosRubro + movIngresosOrigen
  const egresos = movEgresosOrigen
  const neto = ingresos - egresos

  return {
    ventasProductos,
    ventasEquipos,
    reparaciones,
    cobrosCuentaCorriente,
    movIngresos: 0,
    movEgresos: 0,
    movIngresosOrigen,
    movEgresosOrigen,
    ingresos,
    egresos,
    neto,
    tipoReporte,
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
  const [tipoReporte, setTipoReporte] = useState(TIPOS_REPORTE_CAJA.GENERAL)
  /** Compras de productos: en General por defecto no restan; en Ventas de productos por defecto sí. */
  const [contemplarEgresoCompras, setContemplarEgresoCompras] = useState(false)

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

  useEffect(() => {
    if (tipoReporte === TIPOS_REPORTE_CAJA.GENERAL) {
      setContemplarEgresoCompras(false)
    } else if (tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS) {
      setContemplarEgresoCompras(true)
    } else {
      setContemplarEgresoCompras(false)
    }
  }, [tipoReporte])

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

  /** Total compras del rango como egreso y resta en el neto (solo General o Ventas de productos, con interruptor y método «todos»). */
  const comprasAfectanNeto = useMemo(() => {
    if (selectedMetodoPago !== "todos") return false
    if (!contemplarEgresoCompras) return false
    return (
      tipoReporte === TIPOS_REPORTE_CAJA.GENERAL || tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS
    )
  }, [selectedMetodoPago, contemplarEgresoCompras, tipoReporte])

  const descripcionIngresosResumen = () => {
    if (tipoReporte === TIPOS_REPORTE_CAJA.GENERAL) {
      return selectedMetodoPago === "todos"
        ? "Productos + equipos + reparaciones + cobros CC + ingresos de caja"
        : `Solo cobros con método: ${selectedMetodoPago}`
    }
    const rubro = ETIQUETA_TIPO_REPORTE[tipoReporte] || tipoReporte
    if (selectedMetodoPago === "todos") {
      return `Cobros del rubro «${rubro}» + ingresos manuales de caja con ese origen`
    }
    return `Cobros «${rubro}» con método ${selectedMetodoPago} (sin mov. manuales: no tienen método de venta)`
  }

  const tituloEgresosResumen = () => {
    if (comprasAfectanNeto) return "Egresos (Compras)"
    if (tipoReporte !== TIPOS_REPORTE_CAJA.GENERAL && selectedMetodoPago === "todos") return "Egresos de caja (origen)"
    if (selectedMetodoPago !== "todos") return "Egresos"
    return "Egresos de caja"
  }

  const descripcionEgresosResumen = () => {
    if (comprasAfectanNeto) return "Total de compras de productos en el rango (resta en el neto)"
    if (selectedMetodoPago !== "todos") return "No aplica al filtrar por método de cobro"
    if (tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_EQUIPOS || tipoReporte === TIPOS_REPORTE_CAJA.REPARACIONES) {
      return "Solo egresos manuales con el origen del rubro (las compras son de productos y no aplican aquí)"
    }
    if (tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS) {
      return "Egresos manuales de caja con origen ventas de productos (activá «Restar compras…» para incluir compras del rango)"
    }
    return contemplarEgresoCompras === false
      ? "Suma de egresos de caja por sesión (activá «Restar compras…» para restar compras de productos)"
      : "Compras del rango (opción activada)"
  }

  const descripcionNetoResumen = () => {
    if (comprasAfectanNeto) {
      return tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS
        ? "Suma de netos (vista productos) − compras del rango"
        : "Suma de netos por sesión − compras del rango"
    }
    if (tipoReporte !== TIPOS_REPORTE_CAJA.GENERAL) {
      return "Suma del neto por rubro y sesión (sin restar compras)"
    }
    return "Suma de netos por sesión (sin restar compras mientras la opción esté desactivada)"
  }

  const resumenGlobal = useMemo(() => {
    const base = {
      ventasProductos: 0,
      ventasEquipos: 0,
      reparaciones: 0,
      cobrosCuentaCorriente: 0,
      movIngresos: 0,
      movEgresos: 0,
      movIngresosOrigen: 0,
      movEgresosOrigen: 0,
      ingresos: 0,
      egresos: 0,
      neto: 0,
      sesiones: 0,
    }
    const ids = Object.keys(detallesPorSesion)
    base.sesiones = ids.length
    ids.forEach((id) => {
      const det = detallesPorSesion[id]
      const r = construirResumenSesion(det, selectedMetodoPago, tipoReporte)
      CLAVES_RESUMEN_ACUMULABLES.forEach((k) => {
        base[k] += Number(r[k]) || 0
      })
    })

    const totalCompras = (compras || []).reduce((acc, c) => acc + (Number(c.total) || 0), 0)
    const aplicarCompras =
      selectedMetodoPago === "todos" &&
      contemplarEgresoCompras &&
      (tipoReporte === TIPOS_REPORTE_CAJA.GENERAL || tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS)

    if (aplicarCompras) {
      base.egresos = totalCompras
      base.neto = base.neto - totalCompras
    } else if (selectedMetodoPago !== "todos") {
      base.egresos = 0
    }

    return base
  }, [detallesPorSesion, compras, selectedMetodoPago, tipoReporte, contemplarEgresoCompras])

  const sesionesConResumen = useMemo(() => {
    return sesiones.map((s) => {
      const det = detallesPorSesion[s.id]
      const r = det ? construirResumenSesion(det, selectedMetodoPago, tipoReporte) : null
      return { ...s, _resumen: r }
    })
  }, [sesiones, detallesPorSesion, selectedMetodoPago, tipoReporte])

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end">
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
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">Tipo de reporte</div>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Vista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TIPOS_REPORTE_CAJA.GENERAL}>{ETIQUETA_TIPO_REPORTE[TIPOS_REPORTE_CAJA.GENERAL]}</SelectItem>
                  <SelectItem value={TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS}>{ETIQUETA_TIPO_REPORTE[TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS]}</SelectItem>
                  <SelectItem value={TIPOS_REPORTE_CAJA.VENTAS_EQUIPOS}>{ETIQUETA_TIPO_REPORTE[TIPOS_REPORTE_CAJA.VENTAS_EQUIPOS]}</SelectItem>
                  <SelectItem value={TIPOS_REPORTE_CAJA.REPARACIONES}>{ETIQUETA_TIPO_REPORTE[TIPOS_REPORTE_CAJA.REPARACIONES]}</SelectItem>
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

          {tipoReporte !== TIPOS_REPORTE_CAJA.GENERAL ? (
            <p className="text-xs text-slate-800 bg-slate-100 border border-slate-200 rounded-md px-3 py-2">
              Vista por rubro: el <strong>neto por sesión</strong> usa solo cobros de{" "}
              <strong>{ETIQUETA_TIPO_REPORTE[tipoReporte]}</strong> más ingresos/egresos manuales de caja registrados con el mismo{" "}
              <strong>origen</strong>. No incluye cobros de cuenta corriente ni otros rubros.
              {tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS ? (
                <>
                  {" "}
                  {comprasAfectanNeto ? (
                    <>
                      Con <strong>«Restar compras del rango»</strong> activo y método «todos», el <strong>neto global</strong> también resta las compras de
                      productos del listado inferior.
                    </>
                  ) : (
                    <>
                      Podés activar <strong>«Restar compras del rango»</strong> (por defecto activo en esta vista) para que las compras de productos resten en
                      el neto del resumen.
                    </>
                  )}
                </>
              ) : (
                <> Las compras de productos no aplican al neto en este tipo de reporte.</>
              )}
            </p>
          ) : null}

          {(tipoReporte === TIPOS_REPORTE_CAJA.GENERAL || tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS) && (
            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border px-3 py-3 ${
                selectedMetodoPago !== "todos" ? "border-amber-200 bg-amber-50/80" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  id="contemplar-compras"
                  checked={contemplarEgresoCompras}
                  onCheckedChange={setContemplarEgresoCompras}
                  disabled={selectedMetodoPago !== "todos"}
                  className="data-[state=checked]:bg-orange-600"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="contemplar-compras" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Restar compras de productos del rango en el neto
                  </Label>
                  <p className="text-xs text-gray-500">
                    {tipoReporte === TIPOS_REPORTE_CAJA.GENERAL
                      ? "Por defecto desactivado: el resumen no resta compras. Activá para ver el impacto de las compras de mercadería (egreso global del período)."
                      : "Por defecto activado en ventas de productos: el neto resta las compras del rango. Desactivalo para ver solo cobros y movimientos de caja con origen «ventas de productos»."}
                  </p>
                </div>
              </div>
              {selectedMetodoPago !== "todos" ? (
                <p className="text-xs text-amber-900 sm:max-w-xs">Elegí «Todos los métodos» para poder incluir o excluir compras en el cálculo.</p>
              ) : null}
            </div>
          )}

          {selectedMetodoPago !== "todos" ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Estás viendo solo cobros con método <strong>{selectedMetodoPago}</strong>. Los movimientos manuales de caja no se filtran por método; en
              vista general las <strong>compras</strong> no se muestran como egreso si el método no es «todos».
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
            <p className="text-xs text-gray-500 mt-1">{descripcionIngresosResumen()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">{tituloEgresosResumen()}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-40" /> : <div className="text-2xl font-bold text-red-700">{formatearMonedaARS(resumenGlobal.egresos)}</div>}
            <p className="text-xs text-gray-500 mt-1">{descripcionEgresosResumen()}</p>
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
            <p className="text-xs text-gray-500 mt-1">{descripcionNetoResumen()}</p>
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
          <CardDescription className="text-gray-300">
            {tipoReporte === TIPOS_REPORTE_CAJA.GENERAL
              ? "Balance por sesión según filtros; se acumula en el resumen superior."
              : `Neto por sesión = cobros de ${ETIQUETA_TIPO_REPORTE[tipoReporte]} + movimientos de caja con origen «${ETIQUETA_TIPO_REPORTE[tipoReporte]}» (ingresos − egresos).`}
          </CardDescription>
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
                        <div className="text-xs text-gray-500">
                          {tipoReporte === TIPOS_REPORTE_CAJA.GENERAL ? "Neto sesión" : "Neto (vista rubro)"}
                        </div>
                        <div className={`font-bold ${s._resumen?.neto >= 0 ? "text-orange-600" : "text-red-700"}`}>
                          {formatearMonedaARS(s._resumen?.neto || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                    <div
                      className={
                        tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_PRODUCTOS ? "rounded-md ring-2 ring-orange-200 bg-orange-50/50 p-2 -m-0.5" : ""
                      }
                    >
                      <div className="text-xs text-gray-500">Ventas productos</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.ventasProductos || 0)}</div>
                    </div>
                    <div
                      className={
                        tipoReporte === TIPOS_REPORTE_CAJA.VENTAS_EQUIPOS ? "rounded-md ring-2 ring-orange-200 bg-orange-50/50 p-2 -m-0.5" : ""
                      }
                    >
                      <div className="text-xs text-gray-500">Ventas equipos</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.ventasEquipos || 0)}</div>
                    </div>
                    <div
                      className={
                        tipoReporte === TIPOS_REPORTE_CAJA.REPARACIONES ? "rounded-md ring-2 ring-orange-200 bg-orange-50/50 p-2 -m-0.5" : ""
                      }
                    >
                      <div className="text-xs text-gray-500">Reparaciones</div>
                      <div className="font-semibold">{formatearMonedaARS(s._resumen?.reparaciones || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Cobros cuenta corriente</div>
                      <div className="font-semibold text-gray-700">{formatearMonedaARS(s._resumen?.cobrosCuentaCorriente || 0)}</div>
                      {tipoReporte !== TIPOS_REPORTE_CAJA.GENERAL ? (
                        <div className="text-[10px] text-gray-400 mt-0.5">Referencia (no suma al neto del rubro)</div>
                      ) : null}
                    </div>
                    {tipoReporte === TIPOS_REPORTE_CAJA.GENERAL ? (
                      <div>
                        <div className="text-xs text-gray-500">Egresos caja (total sesión)</div>
                        <div className="font-semibold text-red-800">{formatearMonedaARS(s._resumen?.movEgresos || 0)}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-gray-500">Mov. caja (mismo origen)</div>
                        <div className="font-semibold text-green-800 tabular-nums">
                          +{formatearMonedaARS(s._resumen?.movIngresosOrigen || 0)}
                        </div>
                        <div className="font-semibold text-red-800 tabular-nums">
                          −{formatearMonedaARS(s._resumen?.movEgresosOrigen || 0)}
                        </div>
                      </div>
                    )}
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
            {comprasAfectanNeto
              ? "Estas compras de productos restan en el neto del resumen superior (egreso global del rango, no por sesión)."
              : "Listado del rango. El neto superior solo resta compras si el tipo es General o Ventas de productos, método «todos» y tenés activada «Restar compras del rango»."}
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

