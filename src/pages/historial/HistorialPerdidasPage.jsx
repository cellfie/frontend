"use client"

import { useState, useEffect, useCallback } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Search, Filter, RefreshCw, AlertTriangle, Package, Plus, Trash2, Info, Loader2, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

import { getPerdidas, createPerdidaManual, deletePerdida } from "@/services/perdidasService"
import { searchProductosRapido } from "@/services/productosService"
import { getRepuestos, getRepuestosByPuntoVenta } from "@/services/repuestosService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { useAuth } from "@/context/AuthContext"
import { formatearFechaArgentinaPerdidas } from "@/services/perdidasService"

// Hook personalizado para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const HistorialPerdidasPage = () => {
  const { currentUser } = useAuth()
  const [perdidas, setPerdidas] = useState([])
  const [perdidasFiltradas, setPerdidasFiltradas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [productos, setProductos] = useState([]) // Para el filtro principal
  const [repuestos, setRepuestos] = useState([])
  const [puntosVenta, setPuntosVenta] = useState([])
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaInicio: null,
    fechaFin: null,
    productoId: "",
    puntoVentaId: "",
  })
  const [rangoFechas, setRangoFechas] = useState({
    from: null,
    to: null,
  })

  // Estados para el diálogo de nueva pérdida
  const [dialogNuevaPerdidaAbierto, setDialogNuevaPerdidaAbierto] = useState(false)
  const [nuevaPerdida, setNuevaPerdida] = useState({
    tipo: "producto",
    producto_id: "",
    repuesto_id: "",
    cantidad: 1,
    motivo: "",
    punto_venta_id: "",
  })

  // Estados mejorados para búsqueda de productos/repuestos
  const [busquedaItem, setBusquedaItem] = useState("")
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)

  const [procesandoCreacion, setProcesandoCreacion] = useState(false)

  // Estados para el diálogo de confirmación de eliminación
  const [dialogConfirmacionAbierto, setDialogConfirmacionAbierto] = useState(false)
  const [perdidaEliminar, setPerdidaEliminar] = useState(null)
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false)

  // Debounce para la búsqueda
  const busquedaDebounced = useDebounce(busquedaItem, 300)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar puntos de venta
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        // Cargar productos básicos para el filtro principal (sin stock detallado)
        const productosData = await searchProductosRapido("")
        setProductos(productosData)

        // Cargar repuestos
        const repuestosData = await getRepuestos()
        setRepuestos(repuestosData)

        // Cargar pérdidas iniciales (últimos 30 días por defecto)
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

  // Búsqueda mejorada de productos/repuestos
  useEffect(() => {
    const buscarItems = async () => {
      if (!nuevaPerdida.punto_venta_id || busquedaDebounced.length < 2) {
        setResultadosBusqueda([])
        return
      }

      setCargandoBusqueda(true)
      try {
        if (nuevaPerdida.tipo === "producto") {
          // El backend validará el stock al crear la pérdida
          const productos = await searchProductosRapido(busquedaDebounced)
          setResultadosBusqueda(productos.slice(0, 10)) // Limitar a 10 resultados
        } else if (nuevaPerdida.tipo === "repuesto") {
          // Para repuestos, usar la función existente que ya filtra por punto de venta
          const repuestosPuntoVenta = await getRepuestosByPuntoVenta(nuevaPerdida.punto_venta_id)

          const filtrados = repuestosPuntoVenta
            .filter(
              (r) =>
                r.nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
                r.codigo?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
                r.descripcion?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
                r.marca?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
                r.modelo?.toLowerCase().includes(busquedaDebounced.toLowerCase()),
            )
            .slice(0, 10)

          setResultadosBusqueda(filtrados)
        }
      } catch (error) {
        console.error("Error al buscar items:", error)
        toast.error("Error al buscar items")
        setResultadosBusqueda([])
      } finally {
        setCargandoBusqueda(false)
      }
    }

    buscarItems()
  }, [busquedaDebounced, nuevaPerdida.punto_venta_id, nuevaPerdida.tipo])

  // Limpiar búsqueda cuando cambia el tipo o punto de venta
  useEffect(() => {
    setBusquedaItem("")
    setResultadosBusqueda([])
    setItemSeleccionado(null)
    setNuevaPerdida((prev) => ({
      ...prev,
      producto_id: "",
      repuesto_id: "",
    }))
  }, [nuevaPerdida.tipo, nuevaPerdida.punto_venta_id])

  // Cargar pérdidas cuando cambian los filtros
  const cargarPerdidas = async () => {
    setCargando(true)
    try {
      const params = {}
      if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin
      if (filtros.productoId) params.producto_id = filtros.productoId

      const perdidasData = await getPerdidas(params)
      setPerdidas(perdidasData)
      filtrarPerdidas(perdidasData)
    } catch (error) {
      console.error("Error al cargar pérdidas:", error)
      toast.error("Error al cargar pérdidas")
    } finally {
      setCargando(false)
    }
  }

  // Filtrar pérdidas por búsqueda y punto de venta
  const filtrarPerdidas = useCallback(
    (perdidasAFiltrar = perdidas) => {
      let resultado = [...perdidasAFiltrar]

      if (filtros.puntoVentaId && filtros.puntoVentaId !== "all") {
        resultado = resultado.filter((p) => p.punto_venta_id === Number.parseInt(filtros.puntoVentaId))
      }

      if (filtros.busqueda) {
        const termino = filtros.busqueda.toLowerCase()
        resultado = resultado.filter(
          (p) =>
            p.producto_nombre?.toLowerCase().includes(termino) ||
            p.producto_codigo?.toLowerCase().includes(termino) ||
            p.repuesto_nombre?.toLowerCase().includes(termino) ||
            p.repuesto_codigo?.toLowerCase().includes(termino) ||
            p.motivo?.toLowerCase().includes(termino) ||
            p.usuario_nombre?.toLowerCase().includes(termino),
        )
      }

      setPerdidasFiltradas(resultado)
    },
    [filtros.busqueda, filtros.puntoVentaId, perdidas],
  )

  // Efectos para aplicar filtros
  useEffect(() => {
    filtrarPerdidas()
  }, [filtros.busqueda, filtros.puntoVentaId, perdidas, filtrarPerdidas])

  useEffect(() => {
    if (rangoFechas && rangoFechas.from && rangoFechas.to) {
      setFiltros({
        ...filtros,
        fechaInicio: formatearFecha(rangoFechas.from),
        fechaFin: formatearFecha(rangoFechas.to),
      })
    }
  }, [rangoFechas])

  useEffect(() => {
    if (filtros.fechaInicio && filtros.fechaFin) {
      cargarPerdidas()
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.productoId])

  // Funciones utilitarias
  const formatearFecha = (fecha) => {
    if (!fecha) return null
    return fecha.toISOString().split("T")[0]
  }

  const formatearFechaHora = (fechaString) => {
    return formatearFechaArgentinaPerdidas(fechaString)
  }

  const limpiarFiltros = () => {
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
      productoId: "",
      puntoVentaId: "",
    })
  }

  // Funciones del diálogo de nueva pérdida
  const abrirDialogNuevaPerdida = () => {
    setNuevaPerdida({
      tipo: "producto",
      producto_id: "",
      repuesto_id: "",
      cantidad: 1,
      motivo: "",
      punto_venta_id: "",
    })
    setBusquedaItem("")
    setResultadosBusqueda([])
    setItemSeleccionado(null)
    setDialogNuevaPerdidaAbierto(true)
  }

  const seleccionarItem = (item) => {
    if (nuevaPerdida.tipo === "producto") {
      setNuevaPerdida({
        ...nuevaPerdida,
        producto_id: item.id.toString(),
        repuesto_id: "",
      })
    } else {
      setNuevaPerdida({
        ...nuevaPerdida,
        repuesto_id: item.id.toString(),
        producto_id: "",
      })
    }

    setItemSeleccionado(item)
    setBusquedaItem("")
    setResultadosBusqueda([])
  }

  const cambiarTipoPerdida = (tipo) => {
    setNuevaPerdida({
      ...nuevaPerdida,
      tipo,
      producto_id: "",
      repuesto_id: "",
    })
    setBusquedaItem("")
    setResultadosBusqueda([])
    setItemSeleccionado(null)
  }

  const crearNuevaPerdida = async () => {
    // Validaciones
    if (nuevaPerdida.tipo === "producto" && !nuevaPerdida.producto_id) {
      toast.error("Debe seleccionar un producto")
      return
    }

    if (nuevaPerdida.tipo === "repuesto" && !nuevaPerdida.repuesto_id) {
      toast.error("Debe seleccionar un repuesto")
      return
    }

    if (!nuevaPerdida.punto_venta_id) {
      toast.error("Debe seleccionar un punto de venta")
      return
    }

    if (nuevaPerdida.cantidad < 1) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    if (!nuevaPerdida.motivo.trim()) {
      toast.error("Debe ingresar un motivo")
      return
    }

    setProcesandoCreacion(true)

    try {
      const perdidaData = {
        tipo: nuevaPerdida.tipo,
        producto_id: nuevaPerdida.tipo === "producto" ? Number.parseInt(nuevaPerdida.producto_id) : null,
        repuesto_id: nuevaPerdida.tipo === "repuesto" ? Number.parseInt(nuevaPerdida.repuesto_id) : null,
        cantidad: Number.parseInt(nuevaPerdida.cantidad),
        motivo: nuevaPerdida.motivo,
        punto_venta_id: Number.parseInt(nuevaPerdida.punto_venta_id),
      }

      await createPerdidaManual(perdidaData)
      setDialogNuevaPerdidaAbierto(false)
      toast.success("Pérdida registrada correctamente")
      cargarPerdidas()
    } catch (error) {
      console.error("Error al crear pérdida:", error)
      toast.error(error.message || "Error al registrar la pérdida")
    } finally {
      setProcesandoCreacion(false)
    }
  }

  // Funciones de eliminación
  const confirmarEliminarPerdida = (perdida) => {
    setPerdidaEliminar(perdida)
    setDialogConfirmacionAbierto(true)
  }

  const eliminarPerdida = async () => {
    if (!perdidaEliminar) return

    setProcesandoEliminacion(true)

    try {
      await deletePerdida(perdidaEliminar.id)
      setPerdidas(perdidas.filter((p) => p.id !== perdidaEliminar.id))
      setPerdidasFiltradas(perdidasFiltradas.filter((p) => p.id !== perdidaEliminar.id))
      setDialogConfirmacionAbierto(false)
      toast.success("Pérdida eliminada correctamente")
    } catch (error) {
      console.error("Error al eliminar pérdida:", error)
      toast.error(error.message || "Error al eliminar la pérdida")
    } finally {
      setProcesandoEliminacion(false)
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
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20" />
        </TableCell>
      </TableRow>
    ))

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Pérdidas</h1>
          <p className="text-gray-500">Consulta y gestiona el historial de productos y repuestos perdidos</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
            onClick={abrirDialogNuevaPerdida}
          >
            <Plus size={16} />
            Nueva Pérdida
          </Button>
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
            Utiliza los filtros para encontrar pérdidas específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Búsqueda */}
            <div className="relative col-span-1 sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por producto, código o motivo..."
                className="pl-9"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>

            {/* Producto */}
            <div>
              <Select
                value={filtros.productoId}
                onValueChange={(value) => setFiltros({ ...filtros, productoId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      {producto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Rango de fechas */}
            <div>
              <DateRangePicker date={rangoFechas} setDate={setRangoFechas} className="w-full" align="start" />
            </div>

            {/* Botón limpiar */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-1 flex justify-end">
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

      {/* Tabla de pérdidas */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <AlertTriangle size={20} />
            Listado de Pérdidas
          </CardTitle>
          <CardDescription className="text-gray-300">{perdidasFiltradas.length} pérdidas encontradas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative max-h-[600px] overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-white">
                  <TableRow className="border-b after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-border">
                    <TableHead className="bg-white">Ítem</TableHead>
                    <TableHead className="bg-white">Fecha</TableHead>
                    <TableHead className="bg-white">Cantidad</TableHead>
                    <TableHead className="bg-white">Motivo</TableHead>
                    <TableHead className="bg-white">Usuario</TableHead>
                    <TableHead className="bg-white text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargando ? (
                    renderSkeletons()
                  ) : perdidasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertTriangle className="h-12 w-12 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-500">No hay pérdidas disponibles</h3>
                          <p className="text-sm text-gray-400">
                            No se encontraron pérdidas que coincidan con los criterios de búsqueda
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    perdidasFiltradas.map((perdida) => (
                      <TableRow key={perdida.id} className="group">
                        <TableCell>
                          <div className="font-medium flex flex-col">
                            <div className="flex items-center gap-1">
                              {perdida.tipo === "repuesto" ? (
                                <Wrench className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <Package className="h-3.5 w-3.5 text-green-600" />
                              )}
                              <span>
                                {perdida.tipo === "repuesto" ? perdida.repuesto_nombre : perdida.producto_nombre}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Código: {perdida.tipo === "repuesto" ? perdida.repuesto_codigo : perdida.producto_codigo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatearFechaArgentinaPerdidas(perdida.fecha)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="font-normal">
                            {perdida.cantidad} unidad{perdida.cantidad !== 1 ? "es" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={perdida.motivo}>
                            {perdida.motivo}
                          </div>
                        </TableCell>
                        <TableCell>{perdida.usuario_nombre}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-red-50 hover:text-red-600"
                                    onClick={() => confirmarEliminarPerdida(perdida)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar pérdida</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogNuevaPerdidaAbierto} onOpenChange={setDialogNuevaPerdidaAbierto}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-orange-50 to-white">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-gray-900">Registrar Nueva Pérdida</div>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  Complete los datos para registrar una pérdida de inventario
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
            {/* Punto de venta y tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="puntoVenta" className="text-sm font-semibold text-gray-700">
                  Punto de Venta <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={nuevaPerdida.punto_venta_id}
                  onValueChange={(value) => {
                    setNuevaPerdida({
                      ...nuevaPerdida,
                      punto_venta_id: value,
                      producto_id: "",
                      repuesto_id: "",
                    })
                    setItemSeleccionado(null)
                  }}
                >
                  <SelectTrigger id="puntoVenta" className="h-11">
                    <SelectValue placeholder="Seleccionar punto de venta" />
                  </SelectTrigger>
                  <SelectContent>
                    {puntosVenta.map((punto) => (
                      <SelectItem key={punto.id} value={punto.id.toString()}>
                        {punto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {nuevaPerdida.punto_venta_id ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Tipo de Ítem <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
                    <Button
                      type="button"
                      variant={nuevaPerdida.tipo === "producto" ? "default" : "outline"}
                      className={`flex-1 h-11 rounded-none border-0 ${
                        nuevaPerdida.tipo === "producto"
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => cambiarTipoPerdida("producto")}
                    >
                      <Package className="h-4 w-4 mr-2" /> Producto
                    </Button>
                    <Button
                      type="button"
                      variant={nuevaPerdida.tipo === "repuesto" ? "default" : "outline"}
                      className={`flex-1 h-11 rounded-none border-0 ${
                        nuevaPerdida.tipo === "repuesto"
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => cambiarTipoPerdida("repuesto")}
                    >
                      <Wrench className="h-4 w-4 mr-2" /> Repuesto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 opacity-50">
                  <Label className="text-sm font-semibold text-gray-700">
                    Tipo de Ítem <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 rounded-none border-0 cursor-not-allowed bg-transparent"
                      disabled
                    >
                      <Package className="h-4 w-4 mr-2" /> Producto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 rounded-none border-0 cursor-not-allowed bg-transparent"
                      disabled
                    >
                      <Wrench className="h-4 w-4 mr-2" /> Repuesto
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Primero seleccione un punto de venta</p>
                </div>
              )}
            </div>

            {/* Búsqueda mejorada de productos/repuestos */}
            {nuevaPerdida.punto_venta_id && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {nuevaPerdida.tipo === "producto" ? "Producto" : "Repuesto"} <span className="text-red-500">*</span>
                </Label>

                {itemSeleccionado ? (
                  <div className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-3 truncate">
                      {nuevaPerdida.tipo === "producto" ? (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-5 w-5 text-green-600 flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Wrench className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-gray-900 truncate">{itemSeleccionado.nombre}</div>
                        <div className="text-sm text-gray-600">
                          Código: {itemSeleccionado.codigo}
                          {itemSeleccionado.stock !== undefined && (
                            <span className="ml-3 text-gray-500">Stock disponible: {itemSeleccionado.stock}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setItemSeleccionado(null)
                        setNuevaPerdida({
                          ...nuevaPerdida,
                          producto_id: "",
                          repuesto_id: "",
                        })
                      }}
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder={`Buscar ${nuevaPerdida.tipo === "producto" ? "producto" : "repuesto"}... (mínimo 2 caracteres)`}
                        className="pl-10 h-11 text-base"
                        value={busquedaItem}
                        onChange={(e) => setBusquedaItem(e.target.value)}
                      />
                    </div>

                    {/* Resultados de búsqueda mejorados */}
                    <div className="border-2 border-gray-200 rounded-lg max-h-[250px] overflow-y-auto bg-white">
                      {cargandoBusqueda ? (
                        <div className="flex justify-center items-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                          <span className="ml-3 text-gray-600">Buscando...</span>
                        </div>
                      ) : resultadosBusqueda.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {resultadosBusqueda.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 hover:bg-orange-50 cursor-pointer flex items-center justify-between transition-colors"
                              onClick={() => seleccionarItem(item)}
                            >
                              <div className="flex items-center gap-3 truncate mr-4">
                                {nuevaPerdida.tipo === "producto" ? (
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  </div>
                                ) : (
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Wrench className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  </div>
                                )}
                                <div className="truncate">
                                  <div className="font-medium text-gray-900 truncate">{item.nombre}</div>
                                  <div className="text-sm text-gray-500 truncate">
                                    Código: {item.codigo}
                                    {nuevaPerdida.tipo === "repuesto" && item.marca && item.modelo && (
                                      <span className="ml-2">
                                        | {item.marca} {item.modelo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {item.stock !== undefined && (
                                <Badge variant="outline" className="flex-shrink-0">
                                  Stock: {item.stock}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : busquedaItem.length >= 2 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="font-medium">No se encontraron resultados</p>
                          <p className="text-sm mt-1">
                            No hay {nuevaPerdida.tipo === "producto" ? "productos" : "repuestos"} que coincidan con tu
                            búsqueda
                          </p>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-400">
                          <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Ingrese al menos 2 caracteres para buscar</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cantidad y motivo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cantidad" className="text-sm font-semibold text-gray-700">
                  Cantidad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  className="h-11 text-base"
                  value={nuevaPerdida.cantidad}
                  onChange={(e) => setNuevaPerdida({ ...nuevaPerdida, cantidad: Number.parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="motivo" className="text-sm font-semibold text-gray-700">
                  Motivo de la Pérdida <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Describa el motivo de la pérdida (ej: producto dañado, vencido, etc.)"
                  className="min-h-[88px] text-base resize-none"
                  value={nuevaPerdida.motivo}
                  onChange={(e) => setNuevaPerdida({ ...nuevaPerdida, motivo: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
              <Button
                variant="outline"
                onClick={() => setDialogNuevaPerdidaAbierto(false)}
                className="h-11 px-6 order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={crearNuevaPerdida}
                className="bg-orange-600 hover:bg-orange-700 h-11 px-6 order-1 sm:order-2"
                disabled={
                  procesandoCreacion ||
                  !nuevaPerdida.punto_venta_id ||
                  (nuevaPerdida.tipo === "producto" && !nuevaPerdida.producto_id) ||
                  (nuevaPerdida.tipo === "repuesto" && !nuevaPerdida.repuesto_id) ||
                  nuevaPerdida.cantidad < 1 ||
                  !nuevaPerdida.motivo.trim()
                }
              >
                {procesandoCreacion ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Registrar Pérdida
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={dialogConfirmacionAbierto} onOpenChange={setDialogConfirmacionAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar esta pérdida? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {perdidaEliminar && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded border mb-4">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Ítem:</span>
                    <span className="font-medium">
                      {perdidaEliminar.tipo === "repuesto"
                        ? perdidaEliminar.repuesto_nombre
                        : perdidaEliminar.producto_nombre}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Cantidad:</span>
                    <span className="font-medium">{perdidaEliminar.cantidad}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Fecha:</span>
                    <span>{formatearFechaArgentinaPerdidas(perdidaEliminar.fecha)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Motivo:</span>
                    <span className="font-medium">{perdidaEliminar.motivo}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded border text-yellow-800 flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-medium">Importante</p>
                  <p className="text-sm">
                    Al eliminar esta pérdida, se restaurará el stock del{" "}
                    {perdidaEliminar.tipo === "repuesto" ? "repuesto" : "producto"} en el inventario.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogConfirmacionAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminarPerdida} disabled={procesandoEliminacion} className="gap-1">
              {procesandoEliminacion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HistorialPerdidasPage
