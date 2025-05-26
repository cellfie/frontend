"use client"

import React, { useState, useEffect, useCallback } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  FileText,
  RefreshCw,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/lib/DatePickerWithRange"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

import { getDevoluciones, getDevolucionById, anularDevolucion } from "@/services/devolucionesService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getMetodosPago } from "@/services/metodosPagoService"
import { useAuth } from "@/context/AuthContext"

const HistorialDevolucionesPage = () => {
  const { currentUser } = useAuth()
  const [devoluciones, setDevoluciones] = useState([])
  const [devolucionesFiltradas, setDevolucionesFiltradas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState(null)
  const [detalleDevolucionAbierto, setDetalleDevolucionAbierto] = useState(null)
  const [dialogAnularAbierto, setDialogAnularAbierto] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [devolucionAnular, setDevolucionAnular] = useState(null)
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false)
  const [puntosVenta, setPuntosVenta] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaInicio: null,
    fechaFin: null,
    puntoVentaId: "",
    metodoPagoId: "",
    clienteId: "",
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

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar puntos de venta
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        // Cargar métodos de pago
        const metodos = await getMetodosPago()
        setMetodosPago(metodos)

        // Cargar devoluciones iniciales (últimos 30 días por defecto)
        const fechaFin = new Date()
        const fechaInicio = new Date()
        fechaInicio.setDate(fechaInicio.getDate() - 30)

        setRangoFechas({
          from: fechaInicio,
          to: fechaFin,
        })

        setFiltros({
          ...filtros,
          fechaInicio: formatearFecha(fechaInicio),
          fechaFin: formatearFecha(fechaFin),
        })
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      }
    }

    cargarDatosIniciales()
  }, [])

  // Cargar devoluciones cuando cambian los filtros
  const cargarDevoluciones = async () => {
    setCargando(true)
    try {
      // Preparar parámetros para la consulta
      const params = {}
      if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin
      if (filtros.puntoVentaId) params.punto_venta_id = filtros.puntoVentaId
      if (filtros.clienteId) params.cliente_id = filtros.clienteId

      // Obtener devoluciones
      const devolucionesData = await getDevoluciones(params)
      setDevoluciones(devolucionesData)

      // Aplicar filtro de búsqueda y método de pago
      filtrarDevoluciones(devolucionesData)
    } catch (error) {
      console.error("Error al cargar devoluciones:", error)
      toast.error("Error al cargar devoluciones")
    } finally {
      setCargando(false)
    }
  }

  // Filtrar devoluciones por búsqueda y método de pago
  const filtrarDevoluciones = useCallback(
    (devolucionesAFiltrar = devoluciones) => {
      let resultado = [...devolucionesAFiltrar]

      // Filtrar por devoluciones anuladas si el checkbox está activo
      if (filtros.mostrarAnuladas) {
        resultado = resultado.filter((d) => d.anulada === 1)
      } else {
        resultado = resultado.filter((d) => d.anulada === 0)
      }

      // Filtrar por método de pago
      if (filtros.metodoPagoId) {
        resultado = resultado.filter((d) => d.tipo_pago && d.tipo_pago === filtros.metodoPagoId)
      }

      // Filtrar por término de búsqueda
      if (filtros.busqueda) {
        const termino = filtros.busqueda.toLowerCase()
        resultado = resultado.filter(
          (d) =>
            d.numero_factura?.toLowerCase().includes(termino) ||
            d.cliente_nombre?.toLowerCase().includes(termino) ||
            d.usuario_nombre?.toLowerCase().includes(termino),
        )
      }

      setDevolucionesFiltradas(resultado)
    },
    [filtros.busqueda, filtros.metodoPagoId, filtros.mostrarAnuladas, devoluciones],
  )

  // Efecto para aplicar filtros de búsqueda y método de pago
  useEffect(() => {
    filtrarDevoluciones()
  }, [filtros.busqueda, filtros.metodoPagoId, devoluciones, filtrarDevoluciones])

  // Actualizar filtros cuando cambia el rango de fechas
  useEffect(() => {
    if (rangoFechas && rangoFechas.from && rangoFechas.to) {
      setFiltros({
        ...filtros,
        fechaInicio: formatearFecha(rangoFechas.from),
        fechaFin: formatearFecha(rangoFechas.to),
      })
    } else if (rangoFechas && (!rangoFechas.from || !rangoFechas.to)) {
      // Si alguna de las fechas es null, no actualizamos los filtros
      // Esto evita que se envíen consultas con fechas incompletas
      console.log("Rango de fechas incompleto, no se actualizarán los filtros")
    }
  }, [rangoFechas])

  // Formatear fecha para la API
  const formatearFecha = (fecha) => {
    if (!fecha) return null
    return fecha.toISOString().split("T")[0]
  }

  // Formatear fecha para mostrar - SIMPLIFICADO sin conversiones manuales
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""

    // Crear la fecha a partir del string
    const fecha = new Date(fechaString)

    // Usar toLocaleString sin especificar zona horaria para usar la del sistema
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }


  // Formatear precio para mostrar
  const formatearPrecio = (precio) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(precioNumerico)
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    // Mantener solo las fechas
    const fechaFin = new Date()
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - 30)

    setRangoFechas({
      from: fechaInicio,
      to: fechaFin,
    })

    setFiltros({
      busqueda: "",
      fechaInicio: formatearFecha(fechaInicio),
      fechaFin: formatearFecha(fechaFin),
      puntoVentaId: "",
      metodoPagoId: "",
      clienteId: "",
      mostrarAnuladas: false,
    })
  }

  // Abrir detalle de devolución
  const abrirDetalleDevolucion = async (devolucionId) => {
    if (detalleDevolucionAbierto === devolucionId) {
      setDetalleDevolucionAbierto(null)
      return
    }

    try {
      setCargando(true)
      const devolucionDetallada = await getDevolucionById(devolucionId)
      setDevolucionSeleccionada(devolucionDetallada)
      setDetalleDevolucionAbierto(devolucionId)
    } catch (error) {
      console.error("Error al obtener detalle de devolución:", error)
      toast.error("Error al obtener detalle de devolución")
    } finally {
      setCargando(false)
    }
  }

  // Abrir diálogo de anulación
  const abrirDialogAnulacion = (devolucion) => {
    setDevolucionAnular(devolucion)
    setMotivoAnulacion("")
    setEstadoAnulacion({ exito: false, error: false, mensaje: "" })
    setDialogAnularAbierto(true)
  }

  // Anular devolución
  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error("El motivo de anulación es obligatorio")
      return
    }

    setProcesandoAnulacion(true)
    setEstadoAnulacion({ exito: false, error: false, mensaje: "" })

    try {
      await anularDevolucion(devolucionAnular.id, motivoAnulacion)

      // Actualizar la lista de devoluciones
      const devolucionesActualizadas = devoluciones.map((d) =>
        d.id === devolucionAnular.id
          ? { ...d, anulada: 1, fecha_anulacion: new Date().toISOString(), motivo_anulacion: motivoAnulacion }
          : d,
      )

      setDevoluciones(devolucionesActualizadas)
      filtrarDevoluciones(devolucionesActualizadas)

      // Si la devolución anulada es la que está seleccionada, actualizar su estado
      if (devolucionSeleccionada && devolucionSeleccionada.id === devolucionAnular.id) {
        setDevolucionSeleccionada({
          ...devolucionSeleccionada,
          anulada: 1,
          fecha_anulacion: new Date().toISOString(),
          motivo_anulacion: motivoAnulacion,
        })
      }

      setEstadoAnulacion({
        exito: true,
        error: false,
        mensaje: "Devolución anulada correctamente. Se ha restaurado el stock de los productos.",
      })

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setDialogAnularAbierto(false)
        toast.success("Devolución anulada correctamente")
      }, 2000)
    } catch (error) {
      console.error("Error al anular devolución:", error)
      setEstadoAnulacion({
        exito: false,
        error: true,
        mensaje: error.message || "Error al anular devolución",
      })
      toast.error(error.message || "Error al anular devolución")
    } finally {
      setProcesandoAnulacion(false)
    }
  }

  // Renderizar skeletons durante la carga
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
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20" />
        </TableCell>
      </TableRow>
    ))

  // Modificar el useEffect que carga las devoluciones
  useEffect(() => {
    // Solo cargar si tenemos fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      cargarDevoluciones()
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.puntoVentaId, filtros.clienteId])

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Devoluciones</h1>
          <p className="text-gray-500">Consulta y gestiona el historial de devoluciones realizadas</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription className="text-gray-300">
            Utiliza los filtros para encontrar devoluciones específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Búsqueda */}
            <div className="relative col-span-1 sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por factura, cliente o usuario..."
                className="pl-9"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>

            {/* Punto de venta */}
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

            {/* Método de pago */}
            <div>
              <Select
                value={filtros.metodoPagoId}
                onValueChange={(value) => setFiltros({ ...filtros, metodoPagoId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  {metodosPago.map((metodo) => (
                    <SelectItem key={metodo.id} value={metodo.nombre}>
                      {metodo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rango de fechas */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <DateRangePicker date={rangoFechas} setDate={setRangoFechas} className="w-full" align="start" />
            </div>

            {/* Controles adicionales */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-1 flex items-center justify-between gap-2">
              {/* Mostrar anuladas */}
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

              {/* Botón limpiar */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={limpiarFiltros} className="h-10 w-10 flex-shrink-0">
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

      {/* Tabla de devoluciones */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <ArrowLeftRight size={20} />
            Listado de Devoluciones
          </CardTitle>
          <CardDescription className="text-gray-300">
            {devolucionesFiltradas.length} devoluciones encontradas
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
                    <TableHead className="bg-white">Usuario</TableHead>
                    <TableHead className="bg-white">Diferencia</TableHead>
                    <TableHead className="bg-white text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargando ? (
                    renderSkeletons()
                  ) : devolucionesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ArrowLeftRight className="h-12 w-12 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-500">No hay devoluciones disponibles</h3>
                          <p className="text-sm text-gray-400">
                            No se encontraron devoluciones que coincidan con los criterios de búsqueda
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    devolucionesFiltradas.map((devolucion) => (
                      <React.Fragment key={devolucion.id}>
                        <TableRow
                          className={`group ${devolucion.anulada ? "bg-red-50" : detalleDevolucionAbierto === devolucion.id ? "bg-blue-50" : ""}`}
                        >
                          <TableCell>
                            <div className="font-medium flex items-center gap-2">
                              {devolucion.numero_factura}
                              {devolucion.anulada ? (
                                <Badge variant="destructive" className="text-xs">
                                  Anulada
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{formatearFechaHora(devolucion.fecha)}</TableCell>
                          <TableCell>{devolucion.cliente_nombre || "Cliente General"}</TableCell>
                          <TableCell>{devolucion.usuario_nombre}</TableCell>
                          <TableCell>
                            {devolucion.diferencia > 0 ? (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                Pagó: {formatearPrecio(devolucion.diferencia)}
                              </Badge>
                            ) : devolucion.diferencia < 0 ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                A favor: {formatearPrecio(Math.abs(devolucion.diferencia))}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sin diferencia</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => abrirDetalleDevolucion(devolucion.id)}
                                      className={
                                        detalleDevolucionAbierto === devolucion.id
                                          ? "bg-blue-100 text-blue-700"
                                          : "hover:bg-blue-50 hover:text-blue-600"
                                      }
                                    >
                                      {detalleDevolucionAbierto === devolucion.id ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {detalleDevolucionAbierto === devolucion.id ? "Ocultar detalles" : "Ver detalles"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {!devolucion.anulada &&
                                (currentUser?.rol === "empleado" || currentUser?.rol === "admin") && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => abrirDialogAnulacion(devolucion)}
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Anular devolución</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Detalle de devolución */}
                        <AnimatePresence>
                          {detalleDevolucionAbierto === devolucion.id && devolucionSeleccionada && (
                            <TableRow>
                              <TableCell colSpan={6} className="p-0 border-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Card className="mx-4 my-2 border border-blue-200 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Información de la devolución */}
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 text-blue-700">
                                            <FileText size={16} />
                                            <h3 className="font-medium">Información de la devolución</h3>
                                          </div>

                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Factura:</span>
                                              <span className="font-medium">
                                                {devolucionSeleccionada.numero_factura}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Fecha:</span>
                                              <span>{formatearFechaHora(devolucionSeleccionada.fecha)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Usuario:</span>
                                              <span>{devolucionSeleccionada.usuario_nombre}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Cliente:</span>
                                              <span>{devolucionSeleccionada.cliente_nombre || "Cliente General"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Método de pago:</span>
                                              <Badge variant="secondary" className="font-normal">
                                                {devolucionSeleccionada.tipo_pago || "N/A"}
                                              </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Diferencia:</span>
                                              {devolucionSeleccionada.diferencia > 0 ? (
                                                <span className="text-red-600">
                                                  Pagó: {formatearPrecio(devolucionSeleccionada.diferencia)}
                                                </span>
                                              ) : devolucionSeleccionada.diferencia < 0 ? (
                                                <span className="text-green-600">
                                                  A favor:{" "}
                                                  {formatearPrecio(Math.abs(devolucionSeleccionada.diferencia))}
                                                </span>
                                              ) : (
                                                <span className="text-gray-600">Sin diferencia</span>
                                              )}
                                            </div>
                                            {devolucionSeleccionada.anulada === 1 && (
                                              <>
                                                <Separator className="my-2" />
                                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                                  <div className="flex items-center gap-1 text-red-600 font-medium">
                                                    <AlertTriangle size={14} />
                                                    Devolución anulada
                                                  </div>
                                                  <div className="text-xs mt-1">
                                                    <div>
                                                      <span className="text-gray-500">Fecha:</span>{" "}
                                                      {formatearFechaHora(devolucionSeleccionada.fecha_anulacion)}
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-500">Motivo:</span>{" "}
                                                      {devolucionSeleccionada.motivo_anulacion}
                                                    </div>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Productos devueltos */}
                                        <div>
                                          <div className="flex items-center gap-2 text-blue-700 mb-3">
                                            <ArrowLeftRight size={16} />
                                            <h3 className="font-medium">Productos devueltos</h3>
                                          </div>

                                          <ScrollArea className="h-[200px] border rounded">
                                            {devolucionSeleccionada.productos_devueltos &&
                                              devolucionSeleccionada.productos_devueltos.length > 0 ? (
                                              <div className="p-2 space-y-2">
                                                {devolucionSeleccionada.productos_devueltos.map((producto, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex justify-between items-start p-2 bg-gray-50 rounded border text-sm"
                                                  >
                                                    <div>
                                                      <div className="font-medium">{producto.producto_nombre}</div>
                                                      <div className="text-xs text-gray-500">
                                                        Código: {producto.producto_codigo}
                                                      </div>
                                                      <Badge
                                                        className={
                                                          producto.tipo_devolucion === "defectuoso"
                                                            ? "mt-1 bg-red-100 text-red-800 border-red-300"
                                                            : "mt-1 bg-green-100 text-green-800 border-green-300"
                                                        }
                                                      >
                                                        {producto.tipo_devolucion === "defectuoso"
                                                          ? "Defectuoso"
                                                          : "Normal"}
                                                      </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                      <div>{formatearPrecio(producto.precio)}</div>
                                                      <div className="text-xs text-gray-500">
                                                        Cantidad: {producto.cantidad}
                                                      </div>
                                                      <div className="font-medium">
                                                        {formatearPrecio(producto.precio * producto.cantidad)}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-center h-full text-gray-500">
                                                No hay productos devueltos
                                              </div>
                                            )}
                                          </ScrollArea>
                                        </div>

                                        {/* Productos de reemplazo */}
                                        <div>
                                          <div className="flex items-center gap-2 text-blue-700 mb-3">
                                            <Package size={16} />
                                            <h3 className="font-medium">Productos de reemplazo</h3>
                                          </div>

                                          <ScrollArea className="h-[200px] border rounded">
                                            {devolucionSeleccionada.productos_reemplazo &&
                                              devolucionSeleccionada.productos_reemplazo.length > 0 ? (
                                              <div className="p-2 space-y-2">
                                                {devolucionSeleccionada.productos_reemplazo.map((producto, index) => (
                                                  <div
                                                    key={index}
                                                    className="flex justify-between items-start p-2 bg-green-50 rounded border text-sm"
                                                  >
                                                    <div>
                                                      <div className="font-medium">{producto.producto_nombre}</div>
                                                      <div className="text-xs text-gray-500">
                                                        Código: {producto.producto_codigo}
                                                      </div>
                                                      <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Reemplazo
                                                      </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                      <div>{formatearPrecio(producto.precio)}</div>
                                                      <div className="text-xs text-gray-500">
                                                        Cantidad: {producto.cantidad}
                                                      </div>
                                                      <div className="font-medium">
                                                        {formatearPrecio(producto.precio * producto.cantidad)}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-center h-full text-gray-500">
                                                No hay productos de reemplazo
                                              </div>
                                            )}
                                          </ScrollArea>
                                        </div>
                                      </div>

                                      {/* Resumen financiero */}
                                      <div className="mt-4 bg-gray-50 p-3 rounded border">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div>
                                            <div className="text-xs text-gray-600">Total devuelto</div>
                                            <div className="text-base font-semibold">
                                              {formatearPrecio(
                                                devolucionSeleccionada.productos_devueltos.reduce(
                                                  (total, producto) => total + producto.precio * producto.cantidad,
                                                  0,
                                                ),
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-xs text-gray-600">Total reemplazo</div>
                                            <div className="text-base font-semibold">
                                              {formatearPrecio(
                                                devolucionSeleccionada.productos_reemplazo.reduce(
                                                  (total, producto) => total + producto.precio * producto.cantidad,
                                                  0,
                                                ),
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <div className="text-xs text-gray-600">Diferencia</div>
                                            <div
                                              className={`text-base font-semibold ${devolucionSeleccionada.diferencia > 0
                                                  ? "text-red-600"
                                                  : devolucionSeleccionada.diferencia < 0
                                                    ? "text-green-600"
                                                    : ""
                                                }`}
                                            >
                                              {devolucionSeleccionada.diferencia > 0
                                                ? `A pagar: ${formatearPrecio(devolucionSeleccionada.diferencia)}`
                                                : devolucionSeleccionada.diferencia < 0
                                                  ? `A favor: ${formatearPrecio(
                                                    Math.abs(devolucionSeleccionada.diferencia),
                                                  )}`
                                                  : "Sin diferencia"}
                                            </div>
                                          </div>
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

      {/* Diálogo de anulación */}
      <Dialog open={dialogAnularAbierto} onOpenChange={setDialogAnularAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} />
              Anular Devolución
            </DialogTitle>
            <DialogDescription>
              Esta acción anulará la devolución y restaurará el stock de los productos. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 p-3 rounded border mb-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Factura:</span>
                  <span className="font-medium">{devolucionAnular?.numero_factura}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Fecha:</span>
                  <span>{devolucionAnular && formatearFechaHora(devolucionAnular.fecha)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Cliente:</span>
                  <span>{devolucionAnular?.cliente_nombre || "Cliente General"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Diferencia:</span>
                  <span className="font-medium">
                    {devolucionAnular?.diferencia > 0
                      ? `Pagó: ${formatearPrecio(devolucionAnular.diferencia)}`
                      : devolucionAnular?.diferencia < 0
                        ? `A favor: ${formatearPrecio(Math.abs(devolucionAnular.diferencia))}`
                        : "Sin diferencia"}
                  </span>
                </div>
              </div>
            </div>

            {/* Estado de anulación */}
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
                    <Trash2 size={16} /> Anular Devolución
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

export default HistorialDevolucionesPage
