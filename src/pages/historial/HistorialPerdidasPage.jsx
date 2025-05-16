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
import { getProductos } from "@/services/productosService"
import { getRepuestos, getRepuestosByPuntoVenta } from "@/services/repuestosService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { useAuth } from "@/context/AuthContext"

const HistorialPerdidasPage = () => {
  const { currentUser } = useAuth()
  const [perdidas, setPerdidas] = useState([])
  const [perdidasFiltradas, setPerdidasFiltradas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [productos, setProductos] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [repuestos, setRepuestos] = useState([])
  const [repuestosFiltrados, setRepuestosFiltrados] = useState([])
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
    tipo: "producto", // 'producto' o 'repuesto'
    producto_id: "",
    repuesto_id: "",
    cantidad: 1,
    motivo: "",
    punto_venta_id: "",
  })
  const [busquedaItem, setBusquedaItem] = useState("")
  const [procesandoCreacion, setProcesandoCreacion] = useState(false)
  const [cargandoItems, setCargandoItems] = useState(false)

  // Estados para el diálogo de confirmación de eliminación
  const [dialogConfirmacionAbierto, setDialogConfirmacionAbierto] = useState(false)
  const [perdidaEliminar, setPerdidaEliminar] = useState(null)
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar puntos de venta
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        // Cargar productos
        const productosData = await getProductos()
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

  // Cargar pérdidas cuando cambian los filtros
  const cargarPerdidas = async () => {
    setCargando(true)
    try {
      // Preparar parámetros para la consulta
      const params = {}
      if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin
      if (filtros.productoId) params.producto_id = filtros.productoId

      // Obtener pérdidas
      const perdidasData = await getPerdidas(params)
      setPerdidas(perdidasData)

      // Aplicar filtro de búsqueda y punto de venta
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

      // Filtrar por punto de venta
      if (filtros.puntoVentaId && filtros.puntoVentaId !== "all") {
        resultado = resultado.filter((p) => p.punto_venta_id === Number.parseInt(filtros.puntoVentaId))
      }

      // Filtrar por término de búsqueda
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

  // Filtrar productos o repuestos para el diálogo de nueva pérdida
  useEffect(() => {
    if (!nuevaPerdida.punto_venta_id) {
      setProductosFiltrados([])
      setRepuestosFiltrados([])
      return
    }

    const cargarItemsPorPuntoVenta = async () => {
      setCargandoItems(true)
      try {
        if (nuevaPerdida.tipo === "producto") {
          // Filtrar productos por punto de venta y término de búsqueda
          const productosPuntoVenta = productos.filter(
            (p) => p.punto_venta_id === Number.parseInt(nuevaPerdida.punto_venta_id),
          )

          if (busquedaItem.trim() === "") {
            setProductosFiltrados(productosPuntoVenta)
          } else {
            const termino = busquedaItem.toLowerCase()
            const filtrados = productosPuntoVenta.filter(
              (p) =>
                p.nombre?.toLowerCase().includes(termino) ||
                p.codigo?.toLowerCase().includes(termino) ||
                p.descripcion?.toLowerCase().includes(termino),
            )
            setProductosFiltrados(filtrados)
          }
        } else if (nuevaPerdida.tipo === "repuesto") {
          // Cargar repuestos por punto de venta
          try {
            const repuestosPuntoVenta = await getRepuestosByPuntoVenta(nuevaPerdida.punto_venta_id)

            if (busquedaItem.trim() === "") {
              setRepuestosFiltrados(repuestosPuntoVenta)
            } else {
              const termino = busquedaItem.toLowerCase()
              const filtrados = repuestosPuntoVenta.filter(
                (r) =>
                  r.nombre?.toLowerCase().includes(termino) ||
                  r.codigo?.toLowerCase().includes(termino) ||
                  r.descripcion?.toLowerCase().includes(termino) ||
                  r.marca?.toLowerCase().includes(termino) ||
                  r.modelo?.toLowerCase().includes(termino),
              )
              setRepuestosFiltrados(filtrados)
            }
          } catch (error) {
            console.error("Error al cargar repuestos por punto de venta:", error)
            toast.error("Error al cargar repuestos")
          }
        }
      } catch (error) {
        console.error("Error al filtrar items:", error)
      } finally {
        setCargandoItems(false)
      }
    }

    cargarItemsPorPuntoVenta()
  }, [busquedaItem, productos, repuestos, nuevaPerdida.punto_venta_id, nuevaPerdida.tipo])

  // Efecto para aplicar filtros de búsqueda y punto de venta
  useEffect(() => {
    filtrarPerdidas()
  }, [filtros.busqueda, filtros.puntoVentaId, perdidas, filtrarPerdidas])

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
      // console.log("Rango de fechas incompleto, no se actualizarán los filtros")
    }
  }, [rangoFechas])

  // Modificar el useEffect que carga las pérdidas
  useEffect(() => {
    // Solo cargar si tenemos fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      cargarPerdidas()
    }
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.productoId])

  // Formatear fecha para la API
  const formatearFecha = (fecha) => {
    if (!fecha) return null
    return fecha.toISOString().split("T")[0]
  }

  // Formatear fecha para mostrar
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""
    const fecha = new Date(fechaString)
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
      productoId: "",
      puntoVentaId: "",
    })
  }

  // Abrir diálogo de nueva pérdida
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
    setProductosFiltrados([])
    setRepuestosFiltrados([])
    setDialogNuevaPerdidaAbierto(true)
  }

  // Seleccionar producto para la nueva pérdida
  const seleccionarProducto = (producto) => {
    setNuevaPerdida({
      ...nuevaPerdida,
      producto_id: producto.id.toString(),
      repuesto_id: "", // Limpiar el repuesto si se selecciona un producto
    })
    setBusquedaItem("") // Limpiar el campo de búsqueda
  }

  // Seleccionar repuesto para la nueva pérdida
  const seleccionarRepuesto = (repuesto) => {
    setNuevaPerdida({
      ...nuevaPerdida,
      repuesto_id: repuesto.id.toString(),
      producto_id: "", // Limpiar el producto si se selecciona un repuesto
    })
    setBusquedaItem("") // Limpiar el campo de búsqueda
  }

  // Cambiar tipo de pérdida (producto o repuesto)
  const cambiarTipoPerdida = (tipo) => {
    setNuevaPerdida({
      ...nuevaPerdida,
      tipo,
      producto_id: "",
      repuesto_id: "",
    })
    setBusquedaItem("")
  }

  // Crear nueva pérdida
  const crearNuevaPerdida = async () => {
    // Validar datos
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
      // Preparar datos para enviar al servidor
      const perdidaData = {
        tipo: nuevaPerdida.tipo,
        producto_id: nuevaPerdida.tipo === "producto" ? Number.parseInt(nuevaPerdida.producto_id) : null,
        repuesto_id: nuevaPerdida.tipo === "repuesto" ? Number.parseInt(nuevaPerdida.repuesto_id) : null,
        cantidad: Number.parseInt(nuevaPerdida.cantidad),
        motivo: nuevaPerdida.motivo,
        punto_venta_id: Number.parseInt(nuevaPerdida.punto_venta_id),
      }

      // Enviar al servidor
      const resultado = await createPerdidaManual(perdidaData)

      // Cerrar diálogo y mostrar mensaje de éxito
      setDialogNuevaPerdidaAbierto(false)
      toast.success("Pérdida registrada correctamente")

      // Recargar pérdidas
      cargarPerdidas()
    } catch (error) {
      console.error("Error al crear pérdida:", error)
      toast.error(error.message || "Error al registrar la pérdida")
    } finally {
      setProcesandoCreacion(false)
    }
  }

  // Abrir diálogo de confirmación de eliminación
  const confirmarEliminarPerdida = (perdida) => {
    setPerdidaEliminar(perdida)
    setDialogConfirmacionAbierto(true)
  }

  // Eliminar pérdida
  const eliminarPerdida = async () => {
    if (!perdidaEliminar) return

    setProcesandoEliminacion(true)

    try {
      await deletePerdida(perdidaEliminar.id)

      // Actualizar lista de pérdidas
      setPerdidas(perdidas.filter((p) => p.id !== perdidaEliminar.id))
      setPerdidasFiltradas(perdidasFiltradas.filter((p) => p.id !== perdidaEliminar.id))

      // Cerrar diálogo y mostrar mensaje de éxito
      setDialogConfirmacionAbierto(false)
      toast.success("Pérdida eliminada correctamente")
    } catch (error) {
      console.error("Error al eliminar pérdida:", error)
      toast.error(error.message || "Error al eliminar la pérdida")
    } finally {
      setProcesandoEliminacion(false)
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
                        <TableCell>{formatearFechaHora(perdida.fecha)}</TableCell>
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

      {/* Diálogo de nueva pérdida */}
      <Dialog open={dialogNuevaPerdidaAbierto} onOpenChange={setDialogNuevaPerdidaAbierto}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Registrar Nueva Pérdida
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 py-2 space-y-3 max-h-[70vh] overflow-y-auto">
            {/* Punto de venta y tipo en la misma fila */}
            <div className="grid grid-cols-2 gap-3">
              {/* Punto de venta */}
              <div>
                <Label htmlFor="puntoVenta" className="text-xs font-medium">
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
                    setBusquedaItem("")
                  }}
                >
                  <SelectTrigger id="puntoVenta" className="h-8 mt-1 text-sm">
                    <SelectValue placeholder="Seleccionar" />
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

              {/* Tipo de pérdida */}
              {nuevaPerdida.punto_venta_id ? (
                <div>
                  <Label className="text-xs font-medium">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex rounded-md overflow-hidden border mt-1">
                    <Button
                      type="button"
                      variant={nuevaPerdida.tipo === "producto" ? "default" : "outline"}
                      className={`flex-1 h-8 text-xs rounded-none border-0 ${
                        nuevaPerdida.tipo === "producto" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-gray-100"
                      }`}
                      onClick={() => cambiarTipoPerdida("producto")}
                    >
                      <Package className="h-3 w-3 mr-1" /> Producto
                    </Button>
                    <Button
                      type="button"
                      variant={nuevaPerdida.tipo === "repuesto" ? "default" : "outline"}
                      className={`flex-1 h-8 text-xs rounded-none border-0 ${
                        nuevaPerdida.tipo === "repuesto" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-gray-100"
                      }`}
                      onClick={() => cambiarTipoPerdida("repuesto")}
                    >
                      <Wrench className="h-3 w-3 mr-1" /> Repuesto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="opacity-50">
                  <Label className="text-xs font-medium">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex rounded-md overflow-hidden border mt-1 bg-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-8 text-xs rounded-none border-0 cursor-not-allowed"
                      disabled
                    >
                      <Package className="h-3 w-3 mr-1" /> Producto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-8 text-xs rounded-none border-0 cursor-not-allowed"
                      disabled
                    >
                      <Wrench className="h-3 w-3 mr-1" /> Repuesto
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Selección de producto o repuesto */}
            {nuevaPerdida.punto_venta_id && (
              <div>
                <Label className="text-xs font-medium">
                  {nuevaPerdida.tipo === "producto" ? "Producto" : "Repuesto"} <span className="text-red-500">*</span>
                </Label>

                {/* Mostrar el ítem seleccionado o el campo de búsqueda */}
                {(nuevaPerdida.tipo === "producto" && nuevaPerdida.producto_id) ||
                (nuevaPerdida.tipo === "repuesto" && nuevaPerdida.repuesto_id) ? (
                  <div className="flex items-center justify-between p-1.5 border rounded-md bg-gray-50 mt-1 text-sm">
                    <div className="flex items-center gap-1.5 truncate">
                      {nuevaPerdida.tipo === "producto" ? (
                        <Package className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Wrench className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">
                        {nuevaPerdida.tipo === "producto"
                          ? productos.find((p) => p.id.toString() === nuevaPerdida.producto_id)?.nombre
                          : repuestos.find((r) => r.id.toString() === nuevaPerdida.repuesto_id)?.nombre}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (nuevaPerdida.tipo === "producto") {
                          setNuevaPerdida({ ...nuevaPerdida, producto_id: "" })
                        } else {
                          setNuevaPerdida({ ...nuevaPerdida, repuesto_id: "" })
                        }
                        setBusquedaItem("")
                      }}
                      className="h-6 px-2 text-xs text-gray-500 hover:text-red-600"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 mt-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                      <Input
                        placeholder={`Buscar ${nuevaPerdida.tipo === "producto" ? "producto" : "repuesto"}...`}
                        className="pl-7 h-8 text-sm"
                        value={busquedaItem}
                        onChange={(e) => setBusquedaItem(e.target.value)}
                      />
                    </div>

                    {/* Resultados de búsqueda */}
                    <div className="border rounded-md max-h-[120px] overflow-y-auto text-sm">
                      {cargandoItems ? (
                        <div className="flex justify-center items-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      ) : nuevaPerdida.tipo === "producto" ? (
                        productosFiltrados.length > 0 ? (
                          <div className="divide-y">
                            {productosFiltrados.map((producto) => (
                              <div
                                key={producto.id}
                                className="p-1.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                onClick={() => seleccionarProducto(producto)}
                              >
                                <div className="truncate mr-2">
                                  <div className="font-medium truncate">{producto.nombre}</div>
                                  <div className="text-xs text-gray-500">Código: {producto.codigo}</div>
                                </div>
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  Stock: {producto.stock || 0}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 text-center text-gray-500 text-xs">
                            {busquedaItem ? "No se encontraron productos" : "Ingrese un término de búsqueda"}
                          </div>
                        )
                      ) : repuestosFiltrados.length > 0 ? (
                        <div className="divide-y">
                          {repuestosFiltrados.map((repuesto) => (
                            <div
                              key={repuesto.id}
                              className="p-1.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                              onClick={() => seleccionarRepuesto(repuesto)}
                            >
                              <div className="truncate mr-2">
                                <div className="font-medium truncate">{repuesto.nombre}</div>
                                <div className="text-xs text-gray-500 truncate">
                                  Código: {repuesto.codigo} | {repuesto.marca} {repuesto.modelo}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs py-0 h-5">
                                Stock: {repuesto.stock || 0}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 text-center text-gray-500 text-xs">
                          {busquedaItem ? "No se encontraron repuestos" : "Ingrese un término de búsqueda"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cantidad y motivo en la misma fila */}
            <div className="grid grid-cols-3 gap-3">
              {/* Cantidad */}
              <div>
                <Label htmlFor="cantidad" className="text-xs font-medium">
                  Cantidad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  className="h-8 mt-1 text-sm"
                  value={nuevaPerdida.cantidad}
                  onChange={(e) => setNuevaPerdida({ ...nuevaPerdida, cantidad: Number.parseInt(e.target.value) || 1 })}
                />
              </div>

              {/* Motivo */}
              <div className="col-span-2">
                <Label htmlFor="motivo" className="text-xs font-medium">
                  Motivo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Ingrese el motivo"
                  className="h-8 min-h-[2rem] mt-1 text-sm resize-none py-1.5"
                  value={nuevaPerdida.motivo}
                  onChange={(e) => setNuevaPerdida({ ...nuevaPerdida, motivo: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-4 py-3 border-t bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogNuevaPerdidaAbierto(false)}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={crearNuevaPerdida}
              className="bg-orange-600 hover:bg-orange-700 h-8 text-xs"
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
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Registrar Pérdida"
              )}
            </Button>
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
                    <span>{formatearFechaHora(perdidaEliminar.fecha)}</span>
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
