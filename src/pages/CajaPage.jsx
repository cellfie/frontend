"use client"

import { useEffect, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
  Wallet,
  MapPin,
  UserCircle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  MinusCircle,
  History,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { getPuntosVenta } from "@/services/puntosVentaService"
import {
  getCajaActual,
  abrirCaja,
  cerrarCaja,
  registrarMovimientoCaja,
  getSesionesCaja,
  getMovimientosCaja,
} from "@/services/cajaService"
import { useAuth } from "@/context/AuthContext"
import { PaginationControls } from "@/lib/PaginationControls"

const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numero)
}

const formatearFechaHora = (fechaString) => {
  if (!fechaString) return ""
  const fecha = new Date(fechaString)
  if (isNaN(fecha.getTime())) return ""

  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const CajaPage = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const [puntosVenta, setPuntosVenta] = useState([])
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState("")

  const [cajaActual, setCajaActualState] = useState(null)
  const [resumenTotales, setResumenTotales] = useState(null)
  const [loadingCaja, setLoadingCaja] = useState(false)

  const [montoApertura, setMontoApertura] = useState("")
  const [notasApertura, setNotasApertura] = useState("")

  const [montoCierre, setMontoCierre] = useState("")
  const [notasCierre, setNotasCierre] = useState("")

  const [tipoMovimiento, setTipoMovimiento] = useState("ingreso")
  const [conceptoMovimiento, setConceptoMovimiento] = useState("")
  const [montoMovimiento, setMontoMovimiento] = useState("")
  const [metodoMovimiento, setMetodoMovimiento] = useState("Efectivo")
  const [registrandoMovimiento, setRegistrandoMovimiento] = useState(false)

  const [mostrarDetallesResumen, setMostrarDetallesResumen] = useState(true)

  const [dialogHistorialAbierto, setDialogHistorialAbierto] = useState(false)
  const [sesiones, setSesiones] = useState([])
  const [sesionesPagination, setSesionesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  })
  const [loadingSesiones, setLoadingSesiones] = useState(false)

  const [movimientos, setMovimientos] = useState([])
  const [movimientosPagination, setMovimientosPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  })
  const [tipoFiltroMov, setTipoFiltroMov] = useState("todos")
  const [loadingMovimientos, setLoadingMovimientos] = useState(false)

  const [dialogAperturaAbierto, setDialogAperturaAbierto] = useState(false)
  const [dialogCierreAbierto, setDialogCierreAbierto] = useState(false)

  // Cargar puntos de venta y setear por defecto Trancas (igual que en ventas)
  useEffect(() => {
    const cargarPV = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)
        if (puntos.length > 0) {
          let puntoDefecto
          if (currentUser?.id === 7) {
            puntoDefecto = puntos.find((p) => p.nombre.toLowerCase() === "tala")
          } else {
            puntoDefecto = puntos.find((p) => p.nombre.toLowerCase() === "trancas")
          }
          setPuntoVentaSeleccionado(puntoDefecto ? puntoDefecto.id.toString() : puntos[0].id.toString())
        }
      } catch (error) {
        console.error("Error al cargar puntos de venta:", error)
        toast.error("Error al cargar puntos de venta")
      }
    }
    cargarPV()
  }, [currentUser])

  const cargarCajaActual = async () => {
    if (!puntoVentaSeleccionado) return
    setLoadingCaja(true)
    try {
      const data = await getCajaActual(Number(puntoVentaSeleccionado))
      if (!data) {
        setCajaActualState(null)
        setResumenTotales(null)
      } else {
        setCajaActualState(data.sesion)
        setResumenTotales(data.totales)
      }
    } catch (error) {
      console.error("Error al obtener caja actual:", error)
      toast.error(error.message || "Error al obtener caja actual")
      setCajaActualState(null)
      setResumenTotales(null)
    } finally {
      setLoadingCaja(false)
    }
  }

  useEffect(() => {
    if (puntoVentaSeleccionado) {
      cargarCajaActual()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntoVentaSeleccionado])

  const handleAbrirCaja = async () => {
    if (!puntoVentaSeleccionado) {
      toast.error("Debes seleccionar un punto de venta")
      return
    }
    try {
      const monto = Number(montoApertura || 0)
      if (isNaN(monto) || monto < 0) {
        toast.error("El monto de apertura debe ser un número válido mayor o igual a 0")
        return
      }
      const result = await abrirCaja({
        punto_venta_id: Number(puntoVentaSeleccionado),
        monto_apertura: monto,
        notas_apertura: notasApertura,
      })
      toast.success("Caja abierta correctamente")
      setCajaActualState(result.sesion)
      setResumenTotales(null)
      setMontoApertura("")
      setNotasApertura("")
    } catch (error) {
      console.error("Error al abrir caja:", error)
      toast.error(error.message || "Error al abrir caja")
    }
  }

  const handleCerrarCaja = async () => {
    if (!cajaActual) {
      toast.error("No hay caja abierta para cerrar")
      return
    }
    try {
      const monto = Number(montoCierre || 0)
      if (isNaN(monto) || monto < 0) {
        toast.error("El monto de cierre debe ser un número válido mayor o igual a 0")
        return
      }
      const result = await cerrarCaja(cajaActual.id, {
        monto_cierre: monto,
        notas_cierre: notasCierre,
      })
      toast.success("Caja cerrada correctamente")
      setCajaActualState(result.sesion)
      await cargarCajaActual()
      setMontoCierre("")
      setNotasCierre("")
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      toast.error(error.message || "Error al cerrar caja")
    }
  }

  const handleRegistrarMovimiento = async () => {
    if (!cajaActual || cajaActual.estado !== "abierta") {
      toast.error("Debes tener una caja abierta para registrar movimientos")
      return
    }
    const monto = Number(montoMovimiento || 0)
    if (isNaN(monto) || monto <= 0) {
      toast.error("El monto del movimiento debe ser mayor a 0")
      return
    }
    if (!conceptoMovimiento.trim()) {
      toast.error("Debes indicar un concepto para el movimiento")
      return
    }
    setRegistrandoMovimiento(true)
    try {
      await registrarMovimientoCaja({
        caja_sesion_id: cajaActual.id,
        tipo: tipoMovimiento,
        concepto: conceptoMovimiento.trim(),
        monto,
        metodo_pago: metodoMovimiento || "Efectivo",
      })
      toast.success("Movimiento registrado correctamente")
      setConceptoMovimiento("")
      setMontoMovimiento("")
      setMetodoMovimiento("Efectivo")
      await cargarCajaActual()
    } catch (error) {
      console.error("Error al registrar movimiento de caja:", error)
      toast.error(error.message || "Error al registrar movimiento de caja")
    } finally {
      setRegistrandoMovimiento(false)
    }
  }

  const cargarSesiones = async (page = 1) => {
    setLoadingSesiones(true)
    try {
      const data = await getSesionesCaja(page, sesionesPagination.itemsPerPage, {
        punto_venta_id: puntoVentaSeleccionado || undefined,
      })
      setSesiones(data.sesiones)
      setSesionesPagination((prev) => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error("Error al obtener sesiones de caja:", error)
      toast.error(error.message || "Error al obtener historial de caja")
    } finally {
      setLoadingSesiones(false)
    }
  }

  const cargarMovimientos = async (page = 1, tipo = tipoFiltroMov) => {
    if (!cajaActual) return
    setLoadingMovimientos(true)
    try {
      const data = await getMovimientosCaja(cajaActual.id, page, movimientosPagination.itemsPerPage, tipo)
      setMovimientos(data.movimientos)
      setMovimientosPagination((prev) => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error("Error al obtener movimientos de caja:", error)
      toast.error(error.message || "Error al obtener movimientos de caja")
    } finally {
      setLoadingMovimientos(false)
    }
  }

  useEffect(() => {
    if (dialogHistorialAbierto) {
      cargarSesiones(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogHistorialAbierto])

  useEffect(() => {
    if (cajaActual) {
      cargarMovimientos(1)
    } else {
      setMovimientos([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cajaActual])

  const handleChangeTipoMovFiltro = (nuevoTipo) => {
    setTipoFiltroMov(nuevoTipo)
    cargarMovimientos(1, nuevoTipo)
  }

  const puntoVentaNombre =
    puntosVenta.find((p) => p.id.toString() === puntoVentaSeleccionado)?.nombre || "Seleccionar"

  const totalIngresosCaja = resumenTotales?.movimientos?.ingresos || 0
  const totalEgresosCaja = resumenTotales?.movimientos?.egresos || 0

  const totalVentas = (resumenTotales?.ventas || []).reduce((sum, v) => sum + Number(v.total || 0), 0)
  const totalCompras = (resumenTotales?.compras || []).reduce((sum, v) => sum + Number(v.total || 0), 0)
  const totalReparaciones = (resumenTotales?.reparaciones || []).reduce((sum, v) => sum + Number(v.total || 0), 0)

  const saldoCajaTeorico =
    (Number(cajaActual?.monto_apertura || 0) || 0) + totalIngresosCaja - totalEgresosCaja

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-orange-600" />
            Caja
          </h1>
          <p className="text-gray-500">
            Control de caja por punto de venta. Todos los usuarios comparten la misma sesión de caja.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Select value={puntoVentaSeleccionado} onValueChange={setPuntoVentaSeleccionado}>
            <SelectTrigger className="w-[200px] h-9 bg-white shadow-sm">
              <SelectValue placeholder="Punto de venta" />
            </SelectTrigger>
            <SelectContent>
              {puntosVenta.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-9 flex items-center gap-1"
            onClick={() => setDialogHistorialAbierto(true)}
          >
            <History className="h-4 w-4" />
            Historial de caja
          </Button>
        </div>
      </div>

      {/* Panel principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de caja */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="bg-[#131321] pb-3">
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Estado de caja
            </CardTitle>
            <CardDescription className="text-gray-300">
              Punto de venta:{" "}
              <span className="font-semibold text-orange-400 inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {puntoVentaNombre}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {loadingCaja ? (
              <p className="text-gray-500 text-sm">Cargando estado de caja...</p>
            ) : cajaActual && cajaActual.estado === "abierta" ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <Badge className="bg-green-100 text-green-800 border-green-300">Caja abierta</Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      <span>
                        Abierta por{" "}
                        <span className="font-semibold">{cajaActual.usuario_apertura_nombre || "Usuario"}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>Apertura: {formatearFechaHora(cajaActual.fecha_apertura)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between gap-4">
                      <span>Monto apertura:</span>
                      <span className="font-semibold">
                        {formatearMonedaARS(cajaActual.monto_apertura || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Ingresos manuales:</span>
                      <span className="font-semibold text-green-700">
                        {formatearMonedaARS(totalIngresosCaja)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Egresos manuales:</span>
                      <span className="font-semibold text-red-700">
                        {formatearMonedaARS(totalEgresosCaja)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Saldo teórico:</span>
                      <span className="font-semibold text-orange-700">
                        {formatearMonedaARS(saldoCajaTeorico)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen de ingresos/egresos por origen */}
                <div className="mt-4 border rounded-lg bg-gray-50">
                  <button
                    type="button"
                    className="w-full flex justify-between items-center px-3 py-2 text-sm text-gray-700"
                    onClick={() => setMostrarDetallesResumen((prev) => !prev)}
                  >
                    <span className="flex items-center gap-1">
                      <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                      Resumen de movimientos vinculados a la caja (lectura)
                    </span>
                    {mostrarDetallesResumen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {mostrarDetallesResumen && (
                    <div className="px-4 pb-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span>Ventas (pagos registrados):</span>
                        <span className="font-semibold">{formatearMonedaARS(totalVentas)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Reparaciones (pagos registrados):</span>
                        <span className="font-semibold">{formatearMonedaARS(totalReparaciones)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Compras (pagos registrados):</span>
                        <span className="font-semibold">{formatearMonedaARS(totalCompras)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Estos totales son de lectura (no se suman directamente al saldo de caja, que se maneja con
                        movimientos manuales). Sirven para conciliar la caja con ventas, compras y reparaciones.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : cajaActual && cajaActual.estado === "cerrada" ? (
              <div className="space-y-2 text-sm text-gray-700">
                <Badge className="bg-gray-200 text-gray-800 border-gray-300">Caja cerrada</Badge>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-gray-500" />
                  <span>
                    Abierta por{" "}
                    <span className="font-semibold">{cajaActual.usuario_apertura_nombre || "Usuario"}</span> y cerrada
                    por{" "}
                    <span className="font-semibold">{cajaActual.usuario_cierre_nombre || "Usuario"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    Apertura: {formatearFechaHora(cajaActual.fecha_apertura)} | Cierre:{" "}
                    {formatearFechaHora(cajaActual.fecha_cierre)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Monto apertura:</span>
                  <span className="font-semibold">
                    {formatearMonedaARS(cajaActual.monto_apertura || 0)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Monto cierre:</span>
                  <span className="font-semibold">
                    {formatearMonedaARS(cajaActual.monto_cierre || 0)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Diferencia:</span>
                  <span
                    className={`font-semibold ${
                      Number(cajaActual.diferencia || 0) === 0
                        ? "text-green-700"
                        : Number(cajaActual.diferencia || 0) > 0
                          ? "text-blue-700"
                          : "text-red-700"
                    }`}
                  >
                    {formatearMonedaARS(cajaActual.diferencia || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Caja sin abrir</Badge>
                <p className="text-gray-600">
                  No hay ninguna sesión de caja abierta para este punto de venta. Pulsa el botón de abajo para abrir
                  caja y comenzar a registrar movimientos.
                </p>
                <Button
                  onClick={() => setDialogAperturaAbierto(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!puntoVentaSeleccionado}
                >
                  Abrir caja
                </Button>
              </div>
            )}

            {cajaActual && cajaActual.estado === "abierta" && (
              <div className="pt-3 flex justify-end">
                <Button
                  onClick={() => setDialogCierreAbierto(true)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={!isAdmin && currentUser?.role !== "empleado"}
                >
                  Cerrar caja
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movimientos manuales */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-[#131321] pb-3">
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Movimientos manuales
            </CardTitle>
            <CardDescription className="text-gray-300">
              Registra ingresos y egresos de caja (ej: retiros, depósitos, ajustes).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Tipo de movimiento</label>
                <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="egreso">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Monto</label>
                <Input
                  type="number"
                  min="0"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value)}
                  placeholder="Monto"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Método de pago</label>
              <Input
                value={metodoMovimiento}
                onChange={(e) => setMetodoMovimiento(e.target.value)}
                placeholder="Efectivo, Transferencia, etc."
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Concepto</label>
              <Textarea
                rows={2}
                value={conceptoMovimiento}
                onChange={(e) => setConceptoMovimiento(e.target.value)}
                placeholder="Ej: Retiro para gastos, Ingreso desde banco, etc."
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleRegistrarMovimiento}
                disabled={registrandoMovimiento || !cajaActual || cajaActual.estado !== "abierta"}
                className={tipoMovimiento === "ingreso" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {registrandoMovimiento ? "Guardando..." : tipoMovimiento === "ingreso" ? "Registrar ingreso" : "Registrar egreso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos de la sesión actual */}
      <div className="mt-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-[#131321] pb-3">
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <History className="h-5 w-5" />
              Movimientos de la sesión actual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Filtrar por tipo:</span>
                <Button
                  variant={tipoFiltroMov === "todos" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleChangeTipoMovFiltro("todos")}
                >
                  Todos
                </Button>
                <Button
                  variant={tipoFiltroMov === "ingreso" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleChangeTipoMovFiltro("ingreso")}
                >
                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                  Ingresos
                </Button>
                <Button
                  variant={tipoFiltroMov === "egreso" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleChangeTipoMovFiltro("egreso")}
                >
                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                  Egresos
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[260px]">
              <div className="divide-y">
                {loadingMovimientos ? (
                  <div className="py-8 text-center text-gray-500 text-sm">Cargando movimientos...</div>
                ) : movimientos.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No hay movimientos para esta sesión de caja.
                  </div>
                ) : (
                  movimientos.map((mov) => {
                    const esIngreso = mov.tipo === "ingreso"
                    return (
                      <div key={mov.id} className="flex items-center justify-between py-2 px-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              esIngreso ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}
                          >
                            {esIngreso ? (
                              <Plus className="h-4 w-4" />
                            ) : (
                              <MinusCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{mov.concepto}</div>
                            <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                              <span>{formatearFechaHora(mov.fecha)}</span>
                              {mov.metodo_pago && <span>Método: {mov.metodo_pago}</span>}
                              {mov.usuario_nombre && <span>Usuario: {mov.usuario_nombre}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[110px]">
                          <div
                            className={`font-semibold ${
                              esIngreso ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {esIngreso ? "+" : "-"} {formatearMonedaARS(mov.monto)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
            <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-gray-500">
              <span>
                Mostrando {movimientos.length} de {movimientosPagination.totalItems} movimientos
              </span>
              {movimientosPagination.totalPages > 1 && (
                <PaginationControls
                  currentPage={movimientosPagination.currentPage}
                  totalPages={movimientosPagination.totalPages}
                  totalItems={movimientosPagination.totalItems}
                  itemsPerPage={movimientosPagination.itemsPerPage}
                  onPageChange={(page) => cargarMovimientos(page)}
                  onItemsPerPageChange={() => {}}
                  isLoading={loadingMovimientos}
                  hidePageSizeSelector
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de historial de sesiones */}
      <Dialog open={dialogHistorialAbierto} onOpenChange={setDialogHistorialAbierto}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de sesiones de caja
            </DialogTitle>
            <DialogDescription>
              Consulta las aperturas y cierres de caja del sistema. Todos los usuarios comparten estas sesiones.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {loadingSesiones ? (
              <div className="py-8 text-center text-sm text-gray-500">Cargando historial...</div>
            ) : sesiones.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No hay sesiones de caja registradas para los filtros actuales.
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="divide-y">
                  {sesiones.map((s) => (
                    <div key={s.id} className="py-2 px-1 text-sm flex justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              s.estado === "abierta"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-gray-200 text-gray-800 border-gray-300"
                            }
                          >
                            {s.estado === "abierta" ? "Abierta" : "Cerrada"}
                          </Badge>
                          <span className="font-medium">{s.punto_venta_nombre}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Apertura: {formatearFechaHora(s.fecha_apertura)} por{" "}
                          {s.usuario_apertura_nombre}
                        </div>
                        {s.fecha_cierre && (
                          <div className="text-xs text-gray-500">
                            Cierre: {formatearFechaHora(s.fecha_cierre)} por {s.usuario_cierre_nombre}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-right min-w-[150px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-xs text-gray-500">Apertura</span>
                          <span className="font-semibold">
                            {formatearMonedaARS(s.monto_apertura || 0)}
                          </span>
                        </div>
                        {s.monto_cierre !== null && (
                          <div className="flex justify-between gap-2">
                            <span className="text-xs text-gray-500">Cierre</span>
                            <span className="font-semibold">
                              {formatearMonedaARS(s.monto_cierre || 0)}
                            </span>
                          </div>
                        )}
                        {s.diferencia !== null && (
                          <div className="flex justify-between gap-2">
                            <span className="text-xs text-gray-500">Diferencia</span>
                            <span
                              className={`font-semibold text-xs ${
                                Number(s.diferencia || 0) === 0
                                  ? "text-green-700"
                                  : Number(s.diferencia || 0) > 0
                                    ? "text-blue-700"
                                    : "text-red-700"
                              }`}
                            >
                              {formatearMonedaARS(s.diferencia || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <div className="pt-2">
            {sesionesPagination.totalPages > 1 && (
              <PaginationControls
                currentPage={sesionesPagination.currentPage}
                totalPages={sesionesPagination.totalPages}
                totalItems={sesionesPagination.totalItems}
                itemsPerPage={sesionesPagination.itemsPerPage}
                onPageChange={(page) => cargarSesiones(page)}
                onItemsPerPageChange={() => {}}
                isLoading={loadingSesiones}
                hidePageSizeSelector
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de apertura de caja */}
      <Dialog open={dialogAperturaAbierto} onOpenChange={setDialogAperturaAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Abrir caja
            </DialogTitle>
            <DialogDescription>
              Estás abriendo una nueva sesión de caja para el punto de venta <strong>{puntoVentaNombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Monto de apertura</label>
              <Input
                type="number"
                min="0"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                placeholder="Monto inicial en caja"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Notas (opcional)</label>
              <Textarea
                rows={3}
                value={notasApertura}
                onChange={(e) => setNotasApertura(e.target.value)}
                placeholder="Comentarios sobre la apertura de caja"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogAperturaAbierto(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                await handleAbrirCaja()
                setDialogAperturaAbierto(false)
              }}
              disabled={!puntoVentaSeleccionado}
            >
              Confirmar apertura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cierre de caja */}
      <Dialog open={dialogCierreAbierto} onOpenChange={setDialogCierreAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Cerrar caja
            </DialogTitle>
            <DialogDescription>
              Estás cerrando la sesión de caja actual para <strong>{puntoVentaNombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span>Monto apertura:</span>
              <span className="font-semibold">
                {formatearMonedaARS(cajaActual?.monto_apertura || 0)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Saldo teórico actual (apertura + movs):</span>
              <span className="font-semibold text-orange-700">
                {formatearMonedaARS(saldoCajaTeorico)}
              </span>
            </div>
            <Separator />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Monto contado al cierre</label>
              <Input
                type="number"
                min="0"
                value={montoCierre}
                onChange={(e) => setMontoCierre(e.target.value)}
                placeholder="Monto contado en caja"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Notas de cierre (opcional)</label>
              <Textarea
                rows={3}
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Comentarios sobre el cierre de caja"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogCierreAbierto(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await handleCerrarCaja()
                setDialogCierreAbierto(false)
              }}
              disabled={!cajaActual || cajaActual.estado !== "abierta"}
            >
              Confirmar cierre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CajaPage

