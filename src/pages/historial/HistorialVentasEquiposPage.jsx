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

import { getVentasEquipos, getVentaEquipoById, anularVentaEquipo } from "@/services/ventasEquiposService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getTiposPago } from "@/services/pagosService"
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
  const [tiposPago, setTiposPago] = useState([])
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaInicio: null,
    fechaFin: null,
    puntoVentaId: "",
    tipoPagoId: "",
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
  // Estado para el total general
  const [totalGeneral, setTotalGeneral] = useState({
    usd: 0,
    ars: 0,
    cantidadVentas: 0,
  })

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar puntos de venta
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        // Cargar tipos de pago
        const tipos = await getTiposPago()
        setTiposPago(tipos)

        // Cargar ventas iniciales (últimos 30 días por defecto)
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

  // Cargar ventas cuando cambian los filtros
  const cargarVentas = async () => {
    setCargando(true)
    try {
      // Preparar parámetros para la consulta
      const params = {}
      if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin
      if (filtros.puntoVentaId) params.punto_venta_id = filtros.puntoVentaId

      // Obtener ventas
      const ventasData = await getVentasEquipos(params)

      // Adaptar los datos para el frontend
      const ventasAdaptadas = ventasData.map((venta) => {
        return {
          id: venta.id,
          numeroFactura: venta.numero_factura || `EQ-${venta.id.toString().padStart(6, "0")}`,
          fecha: venta.fecha,
          cliente: {
            id: venta.cliente_id,
            nombre: venta.cliente_nombre,
            telefono: venta.cliente_telefono,
          },
          equipo: {
            id: venta.equipo_id,
            marca: venta.marca,
            modelo: venta.modelo,
            imei: venta.imei,
            memoria: venta.memoria,
            color: venta.color,
            bateria: venta.bateria,
            precio: venta.precio_usd || 0,
          },
          puntoVenta: {
            id: venta.punto_venta_id,
            nombre: venta.punto_venta_nombre,
          },
          tipoPago: {
            id: null,
            nombre: venta.tipo_pago,
          },
          usuario: {
            id: venta.usuario_id,
            nombre: venta.usuario_nombre,
          },
          porcentajeInteres: venta.porcentaje_interes || 0,
          porcentajeDescuento: venta.porcentaje_descuento || 0,
          montoInteres: venta.monto_interes || 0,
          montoDescuento: venta.monto_descuento || 0,
          subtotal: venta.precio_usd || 0,
          total: venta.total_usd || venta.total_ars || 0,
          tipoCambio: venta.tipo_cambio || 0,
          anulada: venta.anulada === 1,
          fechaAnulacion: venta.fecha_anulacion,
          motivoAnulacion: venta.motivo_anulacion,
        }
      })

      setVentas(ventasAdaptadas)

      // Aplicar filtro de búsqueda y tipo de pago
      filtrarVentas(ventasAdaptadas)
    } catch (error) {
      console.error("Error al cargar ventas:", error)
      toast.error("Error al cargar ventas")
    } finally {
      setCargando(false)
    }
  }

  // Filtrar ventas por búsqueda y tipo de pago
  const filtrarVentas = useCallback(
    (ventasAFiltrar = ventas) => {
      let resultado = [...ventasAFiltrar]

      // Filtrar por ventas anuladas si el checkbox está activo
      if (filtros.mostrarAnuladas) {
        resultado = resultado.filter((v) => v.anulada === true)
      } else {
        resultado = resultado.filter((v) => v.anulada === false)
      }

      // Filtrar por tipo de pago
      if (filtros.tipoPagoId) {
        resultado = resultado.filter((v) => v.tipoPago && v.tipoPago.nombre === filtros.tipoPagoId)
      }

      // Filtrar por término de búsqueda
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

      // Calcular el total general
      calcularTotalGeneral(resultado)
    },
    [filtros.busqueda, filtros.tipoPagoId, filtros.mostrarAnuladas, ventas],
  )

  // Calcular el total general de ventas
  const calcularTotalGeneral = (ventasFiltradas) => {
    // Solo considerar ventas no anuladas para el total
    const ventasValidas = ventasFiltradas.filter((v) => !v.anulada)

    const totalUSD = ventasValidas.reduce((sum, venta) => sum + Number(venta.total || 0), 0)

    // Calcular el total en ARS usando el tipo de cambio de cada venta
    const totalARS = ventasValidas.reduce((sum, venta) => {
      const tipoCambio = venta.tipoCambio || dollarPrice
      return sum + Number(venta.total || 0) * tipoCambio
    }, 0)

    setTotalGeneral({
      usd: totalUSD,
      ars: totalARS,
      cantidadVentas: ventasValidas.length,
    })
  }

  // Efecto para aplicar filtros de búsqueda y tipo de pago
  useEffect(() => {
    filtrarVentas()
  }, [filtros.busqueda, filtros.tipoPagoId, filtros.mostrarAnuladas, ventas, filtrarVentas])

  // Actualizar filtros cuando cambia el rango de fechas
  useEffect(() => {
    if (rangoFechas.from && rangoFechas.to) {
      setFiltros({
        ...filtros,
        fechaInicio: formatearFecha(rangoFechas.from),
        fechaFin: formatearFecha(rangoFechas.to),
      })
    }
  }, [rangoFechas])

  // Formatear fecha para la API
  const formatearFecha = (fecha) => {
    if (!fecha) return null
    return fecha.toISOString().split("T")[0]
  }

  // Formatear fecha para mostrar con corrección de 3 horas
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""

    // Crear la fecha a partir del string
    const fecha = new Date(fechaString)

    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) return ""

    // Sumar 3 horas para corregir el desfase
    fecha.setHours(fecha.getHours() + 3)

    // Usar toLocaleString sin especificar zona horaria para usar la del sistema
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatearPrecioUSD = (precio) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(precioNumerico)
  }

  const formatearPrecio = (precio, tipoCambio = null) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    const cambio = tipoCambio !== null ? tipoCambio : dollarPrice
    const precioARS = precioNumerico * cambio
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(precioARS)
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
      tipoPagoId: "",
      mostrarAnuladas: false,
    })
  }

  // Abrir detalle de venta
  const abrirDetalleVenta = async (ventaId) => {
    if (detalleVentaAbierto === ventaId) {
      setDetalleVentaAbierto(null)
      return
    }

    try {
      setCargando(true)
      const ventaDetallada = await getVentaEquipoById(ventaId)

      // Adaptar la venta detallada al formato del frontend
      const ventaAdaptada = {
        id: ventaDetallada.id,
        numeroFactura: ventaDetallada.numero_factura || `EQ-${ventaDetallada.id.toString().padStart(6, "0")}`,
        fecha: ventaDetallada.fecha,
        cliente: {
          id: ventaDetallada.cliente_id,
          nombre: ventaDetallada.cliente_nombre,
          telefono: ventaDetallada.cliente_telefono,
        },
        equipo: {
          id: ventaDetallada.equipo_id,
          marca: ventaDetallada.marca,
          modelo: ventaDetallada.modelo,
          imei: ventaDetallada.imei,
          memoria: ventaDetallada.memoria,
          color: ventaDetallada.color,
          bateria: ventaDetallada.bateria,
          precio: ventaDetallada.precio_usd || 0,
          tipoCambio: ventaDetallada.equipo?.tipoCambio || ventaDetallada.tipo_cambio || 0,
          tipoCambioOriginal: ventaDetallada.equipo?.tipoCambioOriginal || ventaDetallada.tipo_cambio || 0,
        },
        puntoVenta: {
          id: ventaDetallada.punto_venta_id,
          nombre: ventaDetallada.punto_venta_nombre,
        },
        tipoPago: {
          id: null,
          nombre: ventaDetallada.tipo_pago,
        },
        usuario: {
          id: ventaDetallada.usuario_id,
          nombre: ventaDetallada.usuario_nombre,
        },
        porcentajeInteres: ventaDetallada.porcentaje_interes || 0,
        porcentajeDescuento: ventaDetallada.porcentaje_descuento || 0,
        montoInteres: ventaDetallada.monto_interes || 0,
        montoDescuento: ventaDetallada.monto_descuento || 0,
        subtotal: ventaDetallada.precio_usd || 0,
        total: ventaDetallada.total_usd || ventaDetallada.total_ars || 0,
        tipoCambio: ventaDetallada.tipo_cambio || 0,
        anulada: ventaDetallada.anulada === 1,
        fechaAnulacion: ventaDetallada.fecha_anulacion,
        motivoAnulacion: ventaDetallada.motivo_anulacion,
        planCanje: ventaDetallada.plan_canje
          ? {
              marca: ventaDetallada.plan_canje.marca,
              modelo: ventaDetallada.plan_canje.modelo,
              precio: ventaDetallada.plan_canje.precio,
              memoria: ventaDetallada.plan_canje.memoria,
              color: ventaDetallada.plan_canje.color,
              imei: ventaDetallada.plan_canje.imei,
            }
          : null,
        notas: ventaDetallada.notas,
      }

      setVentaSeleccionada(ventaAdaptada)
      setDetalleVentaAbierto(ventaId)
    } catch (error) {
      console.error("Error al obtener detalle de venta:", error)
      toast.error("Error al obtener detalle de venta")
    } finally {
      setCargando(false)
    }
  }

  // Abrir diálogo de anulación
  const abrirDialogAnulacion = (venta) => {
    setVentaAnular(venta)
    setMotivoAnulacion("")
    setEstadoAnulacion({ exito: false, error: false, mensaje: "" })
    setDialogAnularAbierto(true)
  }

  // Anular venta
  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error("El motivo de anulación es obligatorio")
      return
    }

    setProcesandoAnulacion(true)
    setEstadoAnulacion({ exito: false, error: false, mensaje: "" })

    try {
      await anularVentaEquipo(ventaAnular.id, motivoAnulacion)

      // Actualizar la lista de ventas
      const ventasActualizadas = ventas.map((v) =>
        v.id === ventaAnular.id
          ? { ...v, anulada: true, fechaAnulacion: new Date().toISOString(), motivoAnulacion }
          : v,
      )

      setVentas(ventasActualizadas)
      filtrarVentas(ventasActualizadas)

      // Si la venta anulada es la que está seleccionada, actualizar su estado
      if (ventaSeleccionada && ventaSeleccionada.id === ventaAnular.id) {
        setVentaSeleccionada({
          ...ventaSeleccionada,
          anulada: true,
          fechaAnulacion: new Date().toISOString(),
          motivoAnulacion,
        })
      }

      setEstadoAnulacion({
        exito: true,
        error: false,
        mensaje: "Venta anulada correctamente. El equipo ha sido marcado como disponible nuevamente.",
      })

      // Cerrar el diálogo después de 2 segundos
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

  // Modificar el useEffect que carga las ventas
  useEffect(() => {
    // Solo cargar si tenemos fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      cargarVentas()
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.puntoVentaId])

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas de Equipos</h1>
          <p className="text-gray-500">Consulta y gestiona el historial de ventas de equipos realizadas</p>
        </div>
      </div>

      {/* Tarjeta de Total General */}
      <Card className="mb-6 border-0 shadow-md bg-gradient-to-r from-orange-500 to-orange-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                <DollarSign size={14} />
                Total en USD
              </span>
              <span className="text-white text-2xl font-bold">{formatearPrecioUSD(totalGeneral.usd)}</span>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                <DollarSign size={14} />
                Total en ARS
              </span>
              <span className="text-white text-2xl font-bold">{formatearPrecio(totalGeneral.usd)}</span>
              <span className="text-white/70 text-xs">Tipo de cambio actual: ${dollarPrice.toFixed(2)}</span>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                <Smartphone size={14} />
                Cantidad de Ventas
              </span>
              <span className="text-white text-2xl font-bold">{totalGeneral.cantidadVentas}</span>
              <span className="text-white/70 text-xs">
                {!filtros.mostrarAnuladas ? "Ventas activas" : "Ventas anuladas"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription className="text-gray-300">
            Utiliza los filtros para encontrar ventas específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Búsqueda */}
            <div className="relative col-span-1 sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por factura, cliente, IMEI..."
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

            {/* Tipo de pago */}
            <div>
              <Select
                value={filtros.tipoPagoId}
                onValueChange={(value) => setFiltros({ ...filtros, tipoPagoId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  {tiposPago.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.nombre}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rango de fechas */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <DateRangePicker date={rangoFechas} setDate={setRangoFechas} className="w-full" />
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

      {/* Tabla de ventas */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Smartphone size={20} />
            Listado de Ventas de Equipos
          </CardTitle>
          <CardDescription className="text-gray-300 flex items-center justify-between">
            <span>{ventasFiltradas.length} ventas encontradas</span>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
              Tipo de cambio actual: ${dollarPrice.toFixed(2)} ARS
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
                          <TableCell>{formatearFechaHora(venta.fecha)}</TableCell>
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
                              className={`font-normal ${
                                venta.puntoVenta.nombre === "Tala"
                                  ? "border-orange-300 bg-orange-50 text-orange-700"
                                  : "border-indigo-300 bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              {venta.puntoVenta.nombre}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {venta.tipoPago ? venta.tipoPago.nombre : "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>{formatearPrecioUSD(venta.total)}</div>
                            <div className="text-xs text-gray-500">
                              {formatearPrecio(venta.total, venta.tipoCambio)}
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

                        {/* Detalle de venta */}
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
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Información de la venta */}
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
                                              <span>{formatearFechaHora(ventaSeleccionada.fecha)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Vendedor:</span>
                                              <span>{ventaSeleccionada.usuario.nombre}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Punto de venta:</span>
                                              <Badge
                                                variant="outline"
                                                className={`font-normal ${
                                                  ventaSeleccionada.puntoVenta.nombre === "Tala"
                                                    ? "border-orange-300 bg-orange-50 text-orange-700"
                                                    : "border-indigo-300 bg-indigo-50 text-indigo-700"
                                                }`}
                                              >
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {ventaSeleccionada.puntoVenta.nombre}
                                              </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Método de pago:</span>
                                              <Badge variant="secondary" className="font-normal">
                                                {ventaSeleccionada.tipoPago ? ventaSeleccionada.tipoPago.nombre : "N/A"}
                                              </Badge>
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
                                                      {formatearFechaHora(ventaSeleccionada.fechaAnulacion)}
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

                                        {/* Detalle del equipo */}
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
                                                        className={`h-full ${
                                                          ventaSeleccionada.equipo.bateria >= 80
                                                            ? "bg-green-500"
                                                            : ventaSeleccionada.equipo.bateria >= 60
                                                              ? "bg-orange-500"
                                                              : "bg-red-500"
                                                        }`}
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
                                                    {formatearPrecioUSD(ventaSeleccionada.equipo.precio)}
                                                  </div>

                                                  {/* Precio ARS con tipo de cambio de la venta */}
                                                  <div className="flex items-center gap-1 mt-1">
                                                    <Badge
                                                      variant="outline"
                                                      className="font-normal border-blue-300 bg-blue-50 text-blue-700"
                                                    >
                                                      <Clock className="h-3 w-3 mr-1" />
                                                      Precio ARS
                                                    </Badge>
                                                    <div className="text-sm text-blue-700">
                                                      {formatearPrecio(
                                                        ventaSeleccionada.equipo.precio,
                                                        ventaSeleccionada.tipoCambio,
                                                      )}
                                                      <span className="text-xs text-gray-500 ml-1">
                                                        (TC: {Number(ventaSeleccionada.tipoCambio).toFixed(2)})
                                                      </span>
                                                    </div>
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
                                                      {formatearPrecio(
                                                        ventaSeleccionada.planCanje.precio,
                                                        ventaSeleccionada.tipoCambio,
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                {ventaSeleccionada.porcentajeInteres > 0 && (
                                                  <div>
                                                    <span className="text-gray-500 text-sm">
                                                      Interés ({ventaSeleccionada.porcentajeInteres}%)
                                                    </span>
                                                    <div className="text-orange-600 font-medium">
                                                      +{formatearPrecioUSD(ventaSeleccionada.montoInteres)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                      +
                                                      {formatearPrecio(
                                                        ventaSeleccionada.montoInteres,
                                                        ventaSeleccionada.tipoCambio,
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                {ventaSeleccionada.porcentajeDescuento > 0 && (
                                                  <div>
                                                    <span className="text-gray-500 text-sm">
                                                      Descuento ({ventaSeleccionada.porcentajeDescuento}%)
                                                    </span>
                                                    <div className="text-green-600 font-medium">
                                                      -{formatearPrecioUSD(ventaSeleccionada.montoDescuento)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                      -
                                                      {formatearPrecio(
                                                        ventaSeleccionada.montoDescuento,
                                                        ventaSeleccionada.tipoCambio,
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                <Separator />

                                                <div>
                                                  <span className="text-gray-500 text-sm">Total</span>
                                                  <div className="text-2xl font-bold text-orange-700">
                                                    {formatearPrecioUSD(ventaSeleccionada.total)}
                                                  </div>

                                                  {/* Total ARS con tipo de cambio de la venta */}
                                                  <div className="flex items-center gap-1 mt-1">
                                                    <Badge
                                                      variant="outline"
                                                      className="font-normal border-blue-300 bg-blue-50 text-blue-700"
                                                    >
                                                      <Clock className="h-3 w-3 mr-1" />
                                                      Total ARS
                                                    </Badge>
                                                    <div className="text-sm text-blue-700">
                                                      {formatearPrecio(
                                                        ventaSeleccionada.total,
                                                        ventaSeleccionada.tipoCambio,
                                                      )}
                                                      <span className="text-xs text-gray-500 ml-1">
                                                        (TC: {Number(ventaSeleccionada.tipoCambio).toFixed(2)})
                                                      </span>
                                                    </div>
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

      {/* Diálogo de anulación */}
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
                  <span>{ventaAnular && formatearFechaHora(ventaAnular.fecha)}</span>
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
                    <span className="font-medium">{ventaAnular && formatearPrecioUSD(ventaAnular.total)}</span>
                    <div className="text-xs text-gray-500">
                      {ventaAnular && formatearPrecio(ventaAnular.total, ventaAnular.tipoCambio)}
                    </div>
                  </div>
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
