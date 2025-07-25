"use client"

import React from "react"
import { useState, useEffect, useCallback, useContext } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  FileText,
  MapPin,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  CheckCircle,
  XCircle,
  Battery,
  Clock,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  BookOpen,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/lib/DatePickerWithRange"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  getVentasEquipos,
  getVentaEquipoById,
  anularVentaEquipo,
  adaptVentaEquipoToFrontend,
  formatearFechaArgentina,
} from "@/services/ventasEquiposService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { useAuth } from "@/context/AuthContext"
import { DollarContext } from "@/context/DollarContext"

const HistorialVentasEquiposPage = () => {
  const { currentUser } = useAuth()
  const { dollarPrice } = useContext(DollarContext)
  const [ventas, setVentas] = useState([])
  const [ventasFiltradas, setVentasFiltradas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [detalleVentaAbierto, setDetalleVentaAbierto] = useState(null)
  const [dialogAnularAbierto, setDialogAnularAbierto] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [ventaAnular, setVentaAnular] = useState(null)
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false)
  const [puntosVenta, setPuntosVenta] = useState([])
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaInicio: null,
    fechaFin: null,
    puntoVentaId: "",
    mostrarAnuladas: false,
  })
  const [rangoFechas, setRangoFechas] = useState({
    from: null,
    to: null,
  })
  const [estadoAnulacion, setEstadoAnulacion] = useState({
    exito: false,
    error: false,
    mensaje: "",
  })
  const [totalGeneral, setTotalGeneral] = useState({
    usd: 0,
    ars: 0,
    cantidadVentas: 0,
  })

  const getIconoMetodoPago = (nombreTipoPago) => {
    const nombreLower = nombreTipoPago.toLowerCase()
    if (nombreLower.includes("transferencia")) return <ArrowUpRight className="h-4 w-4 text-blue-500" />
    if (nombreLower.includes("tarjeta")) return <CreditCard className="h-4 w-4 text-green-500" />
    if (nombreLower.includes("cuenta")) return <BookOpen className="h-4 w-4 text-purple-500" />
    return <DollarSign className="h-4 w-4 text-yellow-500" />
  }

  const getBadgeMetodoPago = (metodoPago) => {
    if (metodoPago === "Múltiple") {
      return (
        <Badge variant="outline" className="font-normal border-purple-300 bg-purple-50 text-purple-700">
          <CreditCard className="h-3 w-3 mr-1" />
          Múltiple
        </Badge>
      )
    }

    const nombreLower = metodoPago.toLowerCase()
    if (nombreLower.includes("transferencia")) {
      return (
        <Badge variant="outline" className="font-normal border-blue-300 bg-blue-50 text-blue-700">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          Transferencia
        </Badge>
      )
    }
    if (nombreLower.includes("tarjeta")) {
      return (
        <Badge variant="outline" className="font-normal border-green-300 bg-green-50 text-green-700">
          <CreditCard className="h-3 w-3 mr-1" />
          Tarjeta
        </Badge>
      )
    }
    if (nombreLower.includes("cuenta")) {
      return (
        <Badge variant="outline" className="font-normal border-purple-300 bg-purple-50 text-purple-700">
          <BookOpen className="h-3 w-3 mr-1" />
          Cuenta Corriente
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="font-normal border-yellow-300 bg-yellow-50 text-yellow-700">
        <DollarSign className="h-3 w-3 mr-1" />
        {metodoPago}
      </Badge>
    )
  }

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        const fechaFin = new Date()
        const fechaInicio = new Date()
        fechaInicio.setDate(fechaInicio.getDate() - 30)

        setRangoFechas({
          from: fechaInicio,
          to: fechaFin,
        })

        setFiltros((prevFiltros) => ({
          ...prevFiltros,
          fechaInicio: formatearFecha(fechaInicio),
          fechaFin: formatearFecha(fechaFin),
        }))
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      }
    }
    cargarDatosIniciales()
  }, [])

  const cargarVentas = useCallback(async () => {
    if (!filtros.fechaInicio || !filtros.fechaFin) return
    setCargando(true)
    try {
      const params = {}
      if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin
      if (filtros.puntoVentaId && filtros.puntoVentaId !== "all") params.punto_venta_id = filtros.puntoVentaId

      const ventasData = await getVentasEquipos(params)
      const ventasAdaptadas = ventasData.map(adaptVentaEquipoToFrontend)
      setVentas(ventasAdaptadas)
    } catch (error) {
      console.error("Error al cargar ventas:", error)
      toast.error("Error al cargar ventas")
    } finally {
      setCargando(false)
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.puntoVentaId])

  const filtrarVentasLocalmente = useCallback(() => {
    let resultado = [...ventas]
    if (filtros.mostrarAnuladas) {
      resultado = resultado.filter((v) => v.anulada === true)
    } else {
      resultado = resultado.filter((v) => v.anulada === false)
    }
    if (filtros.busqueda) {
      const termino = filtros.busqueda.toLowerCase()
      resultado = resultado.filter(
        (v) =>
          v.numeroFactura?.toLowerCase().includes(termino) ||
          v.cliente?.nombre?.toLowerCase().includes(termino) ||
          v.usuario?.nombre?.toLowerCase().includes(termino) ||
          v.equipo?.marca?.toLowerCase().includes(termino) ||
          v.equipo?.modelo?.toLowerCase().includes(termino) ||
          v.equipo?.imei?.toLowerCase().includes(termino),
      )
    }
    setVentasFiltradas(resultado)
    calcularTotalGeneral(resultado)
  }, [filtros.busqueda, filtros.mostrarAnuladas, ventas])

  const calcularTotalGeneral = (ventasParaCalcular) => {
    const ventasValidas = ventasParaCalcular.filter((v) => !v.anulada)
    const totalUSD = ventasValidas.reduce((sum, venta) => sum + Number(venta.totalUSD || 0), 0)
    const totalARS = ventasValidas.reduce((sum, venta) => sum + Number(venta.totalARS || 0), 0)
    setTotalGeneral({
      usd: totalUSD,
      ars: totalARS,
      cantidadVentas: ventasValidas.length,
    })
  }

  useEffect(() => {
    filtrarVentasLocalmente()
  }, [filtrarVentasLocalmente])

  useEffect(() => {
    if (rangoFechas.from && rangoFechas.to) {
      setFiltros((prevFiltros) => ({
        ...prevFiltros,
        fechaInicio: formatearFecha(rangoFechas.from),
        fechaFin: formatearFecha(rangoFechas.to),
      }))
    }
  }, [rangoFechas])

  const formatearFecha = (fecha) => {
    if (!fecha) return null
    return fecha.toISOString().split("T")[0]
  }

  const formatearPrecioUSD = (precio) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(precioNumerico)
  }

  const formatearPrecioARS = (precio) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(precioNumerico)
  }

  const limpiarFiltros = () => {
    const fechaFin = new Date()
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - 30)
    setRangoFechas({ from: fechaInicio, to: fechaFin })
    setFiltros({
      busqueda: "",
      fechaInicio: formatearFecha(fechaInicio),
      fechaFin: formatearFecha(fechaFin),
      puntoVentaId: "",
      mostrarAnuladas: false,
    })
  }

  const abrirDetalleVenta = async (ventaId) => {
    if (detalleVentaAbierto === ventaId) {
      setDetalleVentaAbierto(null)
      setVentaSeleccionada(null)
      return
    }
    const ventaExistente = ventas.find((v) => v.id === ventaId)
    if (ventaExistente && ventaExistente.pagos && ventaExistente.pagos.length > 0) {
      setVentaSeleccionada(ventaExistente)
      setDetalleVentaAbierto(ventaId)
      return
    }
    setCargando(true)
    try {
      const ventaDetalladaData = await getVentaEquipoById(ventaId)
      const ventaAdaptada = adaptVentaEquipoToFrontend(ventaDetalladaData)
      setVentaSeleccionada(ventaAdaptada)
      setDetalleVentaAbierto(ventaId)
    } catch (error) {
      console.error("Error al obtener detalle de venta:", error)
      toast.error("Error al obtener detalle de venta")
    } finally {
      setCargando(false)
    }
  }

  const abrirDialogAnulacion = (venta) => {
    setVentaAnular(venta)
    setMotivoAnulacion("")
    setEstadoAnulacion({ exito: false, error: false, mensaje: "" })
    setDialogAnularAbierto(true)
  }

  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error("El motivo de anulación es obligatorio")
      return
    }
    setProcesandoAnulacion(true)
    setEstadoAnulacion({ exito: false, error: false, mensaje: "" })
    try {
      await anularVentaEquipo(ventaAnular.id, motivoAnulacion)
      setVentas((prevVentas) =>
        prevVentas.map((v) =>
          v.id === ventaAnular.id
            ? { ...v, anulada: true, fechaAnulacion: new Date().toISOString(), motivoAnulacion }
            : v,
        ),
      )
      if (ventaSeleccionada && ventaSeleccionada.id === ventaAnular.id) {
        setVentaSeleccionada((prev) => ({
          ...prev,
          anulada: true,
          fechaAnulacion: new Date().toISOString(),
          motivoAnulacion,
        }))
      }
      setEstadoAnulacion({
        exito: true,
        error: false,
        mensaje: "Venta anulada correctamente. El equipo ha sido marcado como disponible nuevamente.",
      })
      setTimeout(() => {
        setDialogAnularAbierto(false)
        toast.success("Venta anulada correctamente")
      }, 2000)
    } catch (error) {
      console.error("Error al anular venta:", error)
      setEstadoAnulacion({
        exito: false,
        error: true,
        mensaje: error.message || "Error al anular venta",
      })
      toast.error(error.message || "Error al anular venta")
    } finally {
      setProcesandoAnulacion(false)
    }
  }

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, idx) => (
      <TableRow key={idx}>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20" />
        </TableCell>
      </TableRow>
    ))

  useEffect(() => {
    if (filtros.fechaInicio && filtros.fechaFin) {
      cargarVentas()
    }
  }, [cargarVentas])

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas de Equipos</h1>
          <p className="text-gray-500">Consulta y gestiona el historial de ventas de equipos realizadas</p>
        </div>
      </div>
      <Card className="mb-6 border-0 shadow-md bg-gradient-to-r from-orange-500 to-orange-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                <DollarSign size={14} /> Total en USD
              </span>
              <span className="text-white text-2xl font-bold">{formatearPrecioUSD(totalGeneral.usd)}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                <DollarSign size={14} /> Total en ARS
              </span>
              <span className="text-white text-2xl font-bold">{formatearPrecioARS(totalGeneral.ars)}</span>
              <span className="text-white/70 text-xs">TC promedio de ventas</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                <Smartphone size={14} /> Cantidad de Ventas
              </span>
              <span className="text-white text-2xl font-bold">{totalGeneral.cantidadVentas}</span>
              <span className="text-white/70 text-xs">
                {!filtros.mostrarAnuladas ? "Ventas activas" : "Ventas anuladas"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} /> Filtros de Búsqueda
          </CardTitle>
          <CardDescription className="text-gray-300">
            Utiliza los filtros para encontrar ventas específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <div className="relative col-span-1 sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por factura, cliente, IMEI..."
                className="pl-9"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>
            <div>
              <Select
                value={filtros.puntoVentaId}
                onValueChange={(value) => setFiltros({ ...filtros, puntoVentaId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Punto de venta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los puntos</SelectItem>
                  {puntosVenta.map((punto) => (
                    <SelectItem key={punto.id} value={punto.id.toString()}>
                      {punto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <DateRangePicker date={rangoFechas} setDate={setRangoFechas} className="w-full" />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border flex-1">
                <Checkbox
                  id="mostrarAnuladas"
                  checked={filtros.mostrarAnuladas}
                  onCheckedChange={(checked) => setFiltros({ ...filtros, mostrarAnuladas: checked })}
                />
                <label
                  htmlFor="mostrarAnuladas"
                  className="text-sm font-medium leading-none cursor-pointer select-none"
                >
                  Mostrar anuladas
                </label>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={limpiarFiltros}
                      className="h-10 w-10 flex-shrink-0 bg-transparent"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Limpiar filtros</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Smartphone size={20} /> Listado de Ventas de Equipos
          </CardTitle>
          <CardDescription className="text-gray-300 flex items-center justify-between">
            <span>{ventasFiltradas.length} ventas encontradas</span>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
              TC Actual: ${dollarPrice.toFixed(2)} ARS
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative max-h-[600px] overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-white">
                  <TableRow className="border-b after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-border">
                    <TableHead className="bg-white">Factura</TableHead>
                    <TableHead className="bg-white">Fecha</TableHead>
                    <TableHead className="bg-white">Cliente</TableHead>
                    <TableHead className="bg-white">Equipo</TableHead>
                    <TableHead className="bg-white">Punto de Venta</TableHead>
                    <TableHead className="bg-white">Método de Pago</TableHead>
                    <TableHead className="bg-white">Total</TableHead>
                    <TableHead className="bg-white text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargando ? (
                    renderSkeletons()
                  ) : ventasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Smartphone className="h-12 w-12 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-500">No hay ventas disponibles</h3>
                          <p className="text-sm text-gray-400">
                            No se encontraron ventas que coincidan con los criterios de búsqueda
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventasFiltradas.map((venta) => (
                      <React.Fragment key={venta.id}>
                        <TableRow
                          className={`group ${venta.anulada ? "bg-red-50" : detalleVentaAbierto === venta.id ? "bg-orange-50" : ""}`}
                        >
                          <TableCell>
                            <div className="font-medium flex items-center gap-2">
                              {venta.numeroFactura}
                              {venta.anulada && (
                                <Badge variant="destructive" className="text-xs">
                                  Anulada
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{venta.fecha}</TableCell>
                          <TableCell>{venta.cliente ? venta.cliente.nombre : "Cliente General"}</TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {venta.equipo.marca} {venta.equipo.modelo}
                            </div>
                            <div className="text-xs text-gray-500">IMEI: {venta.equipo.imei}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`font-normal ${venta.puntoVenta.nombre === "Tala" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-indigo-300 bg-indigo-50 text-indigo-700"}`}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              {venta.puntoVenta.nombre}
                            </Badge>
                          </TableCell>
                          <TableCell>{getBadgeMetodoPago(venta.metodoPagoTabla)}</TableCell>
                          <TableCell className="font-medium">
                            <div>{formatearPrecioUSD(venta.totalUSD)}</div>
                            <div className="text-xs text-gray-500">
                              {formatearPrecioARS(venta.totalARS)}
                              {venta.tipoCambio && (
                                <span className="text-xs text-gray-400 ml-1">
                                  (TC: {Number(venta.tipoCambio).toFixed(2)})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => abrirDetalleVenta(venta.id)}
                                      className={
                                        detalleVentaAbierto === venta.id
                                          ? "bg-orange-100 text-orange-700"
                                          : "hover:bg-orange-50 hover:text-orange-600"
                                      }
                                    >
                                      {detalleVentaAbierto === venta.id ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{detalleVentaAbierto === venta.id ? "Ocultar detalles" : "Ver detalles"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {!venta.anulada &&
                                (currentUser?.role === "admin" || currentUser?.role === "empleado") && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => abrirDialogAnulacion(venta)}
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                          disabled={venta.anulada}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Anular venta</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                        <AnimatePresence>
                          {detalleVentaAbierto === venta.id && ventaSeleccionada && (
                            <TableRow>
                              <TableCell colSpan={8} className="p-0 border-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Card className="mx-4 my-2 border border-orange-200 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 text-orange-700">
                                            <FileText size={16} />
                                            <h3 className="font-medium">Información de la venta</h3>
                                          </div>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Factura:</span>
                                              <span className="font-medium">{ventaSeleccionada.numeroFactura}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Fecha:</span>
                                              <span>{ventaSeleccionada.fecha}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Vendedor:</span>
                                              <span>{ventaSeleccionada.usuario.nombre}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Punto de venta:</span>
                                              <Badge
                                                variant="outline"
                                                className={`font-normal ${ventaSeleccionada.puntoVenta.nombre === "Tala" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-indigo-300 bg-indigo-50 text-indigo-700"}`}
                                              >
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {ventaSeleccionada.puntoVenta.nombre}
                                              </Badge>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Métodos de pago:</span>
                                              {ventaSeleccionada.pagos && ventaSeleccionada.pagos.length > 0 ? (
                                                <ul className="mt-1 space-y-1">
                                                  {ventaSeleccionada.pagos.map((pago) => (
                                                    <li
                                                      key={pago.id || pago.fecha}
                                                      className="flex justify-between items-center text-xs"
                                                    >
                                                      <div className="flex items-center gap-1">
                                                        {getIconoMetodoPago(pago.tipoPago.nombre)}
                                                        <span>{pago.tipoPago.nombre}:</span>
                                                      </div>
                                                      <Badge variant="secondary" className="font-normal">
                                                        {formatearPrecioARS(pago.monto)}
                                                      </Badge>
                                                    </li>
                                                  ))}
                                                </ul>
                                              ) : (
                                                <Badge variant="secondary" className="font-normal">
                                                  N/A
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Cliente:</span>
                                              <span>
                                                {ventaSeleccionada.cliente
                                                  ? ventaSeleccionada.cliente.nombre
                                                  : "Cliente General"}
                                              </span>
                                            </div>
                                            {ventaSeleccionada.cliente?.telefono && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500">Teléfono:</span>
                                                <span>{ventaSeleccionada.cliente.telefono}</span>
                                              </div>
                                            )}
                                            {ventaSeleccionada.anulada && (
                                              <>
                                                <Separator className="my-2" />
                                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                                  <div className="flex items-center gap-1 text-red-600 font-medium">
                                                    <AlertTriangle size={14} />
                                                    Venta anulada
                                                  </div>
                                                  <div className="text-xs mt-1">
                                                    <div>
                                                      <span className="text-gray-500">Fecha:</span>{" "}
                                                      {formatearFechaArgentina(ventaSeleccionada.fechaAnulacion)}
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-500">Motivo:</span>{" "}
                                                      {ventaSeleccionada.motivoAnulacion}
                                                    </div>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="md:col-span-2">
                                          <div className="flex items-center gap-2 text-orange-700 mb-3">
                                            <Smartphone size={16} />
                                            <h3 className="font-medium">Detalle del Equipo</h3>
                                          </div>
                                          <div className="bg-gray-50 p-4 rounded-lg border">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div className="space-y-3">
                                                <div>
                                                  <span className="text-gray-500 text-sm">Marca / Modelo</span>
                                                  <div className="font-medium text-lg">
                                                    {ventaSeleccionada.equipo.marca} {ventaSeleccionada.equipo.modelo}
                                                  </div>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 text-sm">IMEI</span>
                                                  <div className="font-medium">{ventaSeleccionada.equipo.imei}</div>
                                                </div>
                                                <div className="flex gap-4">
                                                  <div>
                                                    <span className="text-gray-500 text-sm">Memoria</span>
                                                    <div className="font-medium">
                                                      {ventaSeleccionada.equipo.memoria || "N/A"}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500 text-sm">Color</span>
                                                    <div className="font-medium">
                                                      {ventaSeleccionada.equipo.color || "N/A"}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 text-sm">Batería</span>
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-16 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                      <div
                                                        className={`h-full ${ventaSeleccionada.equipo.bateria >= 80 ? "bg-green-500" : ventaSeleccionada.equipo.bateria >= 60 ? "bg-orange-500" : "bg-red-500"}`}
                                                        style={{ width: `${ventaSeleccionada.equipo.bateria}%` }}
                                                      ></div>
                                                    </div>
                                                    <Badge
                                                      variant={
                                                        ventaSeleccionada.equipo.bateria >= 80
                                                          ? "outline"
                                                          : ventaSeleccionada.equipo.bateria >= 60
                                                            ? "secondary"
                                                            : "destructive"
                                                      }
                                                      className="font-normal"
                                                    >
                                                      <Battery className="h-3 w-3 mr-1" />
                                                      {ventaSeleccionada.equipo.bateria}%
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="space-y-3">
                                                {ventaSeleccionada.planCanje && (
                                                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-3">
                                                    <div className="flex items-center gap-1 text-blue-700 font-medium mb-1">
                                                      <RefreshCw size={14} />
                                                      Plan Canje Aplicado
                                                    </div>
                                                    <div className="text-sm">
                                                      <div>
                                                        <span className="text-gray-500">Equipo entregado:</span>{" "}
                                                        {ventaSeleccionada.planCanje.marca}{" "}
                                                        {ventaSeleccionada.planCanje.modelo}
                                                      </div>
                                                      {ventaSeleccionada.planCanje.memoria && (
                                                        <div>
                                                          <span className="text-gray-500">Memoria:</span>{" "}
                                                          {ventaSeleccionada.planCanje.memoria}
                                                        </div>
                                                      )}
                                                      {ventaSeleccionada.planCanje.color && (
                                                        <div>
                                                          <span className="text-gray-500">Color:</span>{" "}
                                                          {ventaSeleccionada.planCanje.color}
                                                        </div>
                                                      )}
                                                      <div>
                                                        <span className="text-gray-500">Valor de canje:</span>{" "}
                                                        <span className="font-medium text-blue-700">
                                                          {formatearPrecioUSD(ventaSeleccionada.planCanje.precio)}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                <div>
                                                  <span className="text-gray-500 text-sm">Precio del equipo</span>
                                                  <div className="text-xl font-bold text-orange-700">
                                                    {formatearPrecioUSD(ventaSeleccionada.precioUSD)}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                  <Badge
                                                    variant="outline"
                                                    className="font-normal border-blue-300 bg-blue-50 text-blue-700"
                                                  >
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Precio ARS
                                                  </Badge>
                                                  <div className="text-sm text-blue-700">
                                                    {formatearPrecioARS(ventaSeleccionada.precioARS)}
                                                    <span className="text-xs text-gray-500 ml-1">
                                                      (TC: {Number(ventaSeleccionada.tipoCambio).toFixed(2)})
                                                    </span>
                                                  </div>
                                                </div>
                                                {ventaSeleccionada.planCanje && (
                                                  <div>
                                                    <span className="text-gray-500 text-sm">Descuento por canje</span>
                                                    <div className="text-green-600 font-medium">
                                                      -{formatearPrecioUSD(ventaSeleccionada.planCanje.precio)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                      -
                                                      {formatearPrecioARS(
                                                        ventaSeleccionada.planCanje.precio *
                                                          ventaSeleccionada.tipoCambio,
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                                <Separator />
                                                <div>
                                                  <span className="text-gray-500 text-sm">Total Venta</span>
                                                  <div className="text-2xl font-bold text-orange-700">
                                                    {formatearPrecioUSD(ventaSeleccionada.totalUSD)}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                  <Badge
                                                    variant="outline"
                                                    className="font-normal border-blue-300 bg-blue-50 text-blue-700"
                                                  >
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Total ARS
                                                  </Badge>
                                                  <div className="text-sm text-blue-700">
                                                    {formatearPrecioARS(ventaSeleccionada.totalARS)}
                                                    <span className="text-xs text-gray-500 ml-1">
                                                      (TC: {Number(ventaSeleccionada.tipoCambio).toFixed(2)})
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {ventaSeleccionada.notas && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                                              <div className="text-gray-500 text-sm mb-1">Notas</div>
                                              <p className="text-sm">{ventaSeleccionada.notas}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogAnularAbierto} onOpenChange={setDialogAnularAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} />
              Anular Venta
            </DialogTitle>
            <DialogDescription>
              Esta acción anulará la venta y marcará el equipo como disponible nuevamente. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-3 rounded border mb-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Factura:</span>
                  <span className="font-medium">{ventaAnular?.numeroFactura}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Fecha:</span>
                  <span>{ventaAnular?.fecha}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Cliente:</span>
                  <span>{ventaAnular?.cliente ? ventaAnular.cliente.nombre : "Cliente General"}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Equipo:</span>
                  <span>
                    {ventaAnular?.equipo.marca} {ventaAnular?.equipo.modelo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total:</span>
                  <div>
                    <span className="font-medium">{ventaAnular && formatearPrecioUSD(ventaAnular.totalUSD)}</span>
                    <div className="text-xs text-gray-500">
                      {ventaAnular && formatearPrecioARS(ventaAnular.totalARS)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {estadoAnulacion.exito && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Anulación exitosa</p>
                  <p className="text-sm">{estadoAnulacion.mensaje}</p>
                </div>
              </div>
            )}
            {estadoAnulacion.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-2">
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error al anular</p>
                  <p className="text-sm">{estadoAnulacion.mensaje}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="motivo">
                Motivo de anulación <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Ingrese el motivo de la anulación"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                className="resize-none"
                rows={3}
                disabled={estadoAnulacion.exito || procesandoAnulacion}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAnularAbierto(false)} disabled={procesandoAnulacion}>
              {estadoAnulacion.exito ? "Cerrar" : "Cancelar"}
            </Button>
            {!estadoAnulacion.exito && (
              <Button
                variant="destructive"
                onClick={confirmarAnulacion}
                disabled={!motivoAnulacion.trim() || procesandoAnulacion}
                className="gap-1"
              >
                {procesandoAnulacion ? (
                  <>
                    <span className="mr-1">Procesando</span>
                    <span className="animate-spin">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Anular Venta
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HistorialVentasEquiposPage
