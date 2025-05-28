"use client"

import React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
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
  ShoppingBag,
  Package,
  CheckCircle,
  XCircle,
  ArrowLeftRight,
  Plus,
  DollarSign,
  Tag,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getVentas, getVentaById, anularVenta, adaptVentaToFrontend } from "@/services/ventasService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getMetodosPago } from "@/services/metodosPagoService"
import { getDevolucionesByVenta } from "@/services/devolucionesService"
import { searchProductos } from "@/services/productosService"
import { useAuth } from "@/context/AuthContext"

import DevolucionDialog from "@/components/devoluciones/DevolucionDialog"
import DevolucionesList from "@/components/devoluciones/DevolucionesList"

const HistorialVentasProductosPage = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const [ventas, setVentas] = useState([])
  const [ventasFiltradas, setVentasFiltradas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [detalleVentaAbierto, setDetalleVentaAbierto] = useState(null)
  const [dialogAnularAbierto, setDialogAnularAbierto] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [ventaAnular, setVentaAnular] = useState(null)
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false)
  const [estadoAnulacion, setEstadoAnulacion] = useState({
    exito: false,
    error: false,
    mensaje: "",
  })
  const [puntosVenta, setPuntosVenta] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaInicio: null,
    fechaFin: null,
    puntoVentaId: "",
    metodoPagoId: "",
    mostrarAnuladas: false,
    productoId: "",
  })
  const [rangoFechas, setRangoFechas] = useState({
    from: null,
    to: null,
  })

  // Estados para devoluciones
  const [dialogDevolucionAbierto, setDialogDevolucionAbierto] = useState(false)
  const [devolucionesVenta, setDevolucionesVenta] = useState([])
  const [cargandoDevoluciones, setCargandoDevoluciones] = useState(false)
  const [tabActiva, setTabActiva] = useState("detalles")

  // Estados para búsqueda de productos
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  // Calcular el total de ventas filtradas
  const totalVentasFiltradas = useMemo(() => {
    return ventasFiltradas.reduce((sum, venta) => {
      const ventaTotal = typeof venta.total === "number" ? venta.total : Number.parseFloat(venta.total) || 0
      return sum + ventaTotal
    }, 0)
  }, [ventasFiltradas])

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        const metodos = await getMetodosPago()
        setMetodosPago(metodos)

        const fechaFin = new Date()
        let fechaInicio

        if (isAdmin) {
          fechaInicio = new Date()
          fechaInicio.setDate(fechaInicio.getDate() - 30)
        } else {
          fechaInicio = new Date()
          fechaInicio.setDate(fechaInicio.getDate() - 7)
        }

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
      const params = {}
      if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin
      if (filtros.puntoVentaId) params.punto_venta_id = filtros.puntoVentaId

      const ventasData = await getVentas(params)
      const ventasAdaptadas = ventasData.map(adaptVentaToFrontend)

      for (const venta of ventasAdaptadas) {
        try {
          const devoluciones = await getDevolucionesByVenta(venta.id)
          venta.tieneDevoluciones = devoluciones && devoluciones.length > 0
        } catch (error) {
          console.error(`Error al verificar devoluciones para venta ${venta.id}:`, error)
          venta.tieneDevoluciones = false
        }
      }

      if (filtros.productoId) {
        for (const venta of ventasAdaptadas) {
          try {
            const ventaDetallada = await getVentaById(venta.id)
            venta.detalles = ventaDetallada.detalles || []
          } catch (error) {
            console.error(`Error al obtener detalles de venta ${venta.id}:`, error)
            venta.detalles = []
          }
        }
      }

      setVentas(ventasAdaptadas)
      filtrarVentas(ventasAdaptadas)
    } catch (error) {
      console.error("Error al cargar ventas:", error)
      toast.error("Error al cargar ventas")
    } finally {
      setCargando(false)
    }
  }

  // Filtrar ventas por búsqueda y método de pago
  const filtrarVentas = useCallback(
    (ventasAFiltrar = ventas) => {
      let resultado = [...ventasAFiltrar]

      if (filtros.mostrarAnuladas) {
        resultado = resultado.filter((v) => v.anulada === true)
      } else {
        resultado = resultado.filter((v) => v.anulada === false)
      }

      if (filtros.metodoPagoId) {
        resultado = resultado.filter((v) => v.tipoPago && v.tipoPago.nombre === filtros.metodoPagoId)
      }

      if (filtros.busqueda) {
        const termino = filtros.busqueda.toLowerCase()
        resultado = resultado.filter(
          (v) =>
            v.numeroFactura?.toLowerCase().includes(termino) ||
            v.cliente?.nombre?.toLowerCase().includes(termino) ||
            v.usuario?.nombre?.toLowerCase().includes(termino),
        )
      }

      if (filtros.productoId) {
        const productoId = Number.parseInt(filtros.productoId)
        resultado = resultado.filter((venta) => {
          if (!venta.detalles || venta.detalles.length === 0) return false
          return venta.detalles.some(
            (detalle) => detalle.producto_id === productoId || detalle.producto?.id === productoId,
          )
        })
      }

      setVentasFiltradas(resultado)
    },
    [filtros.busqueda, filtros.metodoPagoId, filtros.mostrarAnuladas, filtros.productoId, ventas],
  )

  useEffect(() => {
    if (!filtros.productoId) {
      filtrarVentas()
    }
  }, [filtros.busqueda, filtros.metodoPagoId, filtros.mostrarAnuladas, ventas, filtrarVentas])

  useEffect(() => {
    if (rangoFechas && rangoFechas.from && rangoFechas.to) {
      setFiltros({
        ...filtros,
        fechaInicio: formatearFecha(rangoFechas.from),
        fechaFin: formatearFecha(rangoFechas.to),
      })
    } else if (rangoFechas && (!rangoFechas.from || !rangoFechas.to)) {
      console.log("Rango de fechas incompleto, no se actualizarán los filtros")
    }
  }, [rangoFechas])

  // Buscar productos
  const buscarProductos = async (query) => {
    if (!query || query.length < 3) {
      setProductos([])
      return
    }

    setCargandoProductos(true)
    try {
      const productosData = await searchProductos(query)
      setProductos(productosData)
    } catch (error) {
      console.error("Error al buscar productos:", error)
      toast.error("Error al buscar productos")
      setProductos([])
    } finally {
      setCargandoProductos(false)
    }
  }

  const handleBusquedaProductoChange = (value) => {
    setBusquedaProducto(value)
    buscarProductos(value)
  }

  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto)
    setFiltros({
      ...filtros,
      productoId: producto ? producto.id.toString() : "",
    })
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return null
    return fecha.toISOString().split("T")[0]
  }

  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""

    const fecha = new Date(fechaString)
    if (isNaN(fecha.getTime())) return ""

    // SOLUCIÓN: Sumar 3 horas para corregir el desfase
    fecha.setHours(fecha.getHours() + 3)

    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatearPrecio = (precio) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(precioNumerico)
  }

  const limpiarFiltros = () => {
    const fechaFin = new Date()
    let fechaInicio

    if (isAdmin) {
      fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - 30)
    } else {
      fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - 7)
    }

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
      mostrarAnuladas: false,
      productoId: "",
    })

    setProductoSeleccionado(null)
    setBusquedaProducto("")
  }

  // Abrir detalle de venta
  const abrirDetalleVenta = async (ventaId) => {
    if (detalleVentaAbierto === ventaId) {
      setDetalleVentaAbierto(null)
      setTabActiva("detalles")
      return
    }

    try {
      setCargando(true)
      const ventaDetallada = await getVentaById(ventaId)

      if (ventaDetallada.detalles) {
        const devoluciones = await getDevolucionesByVenta(ventaId)
        const productosDevueltos = new Map()
        const productosReemplazo = []

        devoluciones
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .forEach((devolucion) => {
            if (devolucion.anulada === 1) return

            devolucion.productos_devueltos.forEach((prod) => {
              const key = `${prod.producto_id}_${prod.detalle_venta_id}`
              const actual = productosDevueltos.get(key) || 0
              productosDevueltos.set(key, actual + prod.cantidad)

              if (prod.es_reemplazo) {
                const index = productosReemplazo.findIndex(
                  (p) => p.id === prod.producto_id && p.detalleVentaId === prod.detalle_venta_id,
                )
                if (index !== -1) {
                  if (prod.cantidad >= productosReemplazo[index].cantidad) {
                    productosReemplazo.splice(index, 1)
                  } else {
                    productosReemplazo[index].cantidad -= prod.cantidad
                  }
                }
              }
            })

            devolucion.productos_reemplazo.forEach((prod) => {
              productosReemplazo.push({
                id: prod.producto_id,
                nombre: prod.producto_nombre,
                codigo: prod.producto_codigo,
                cantidad: prod.cantidad,
                precio: prod.precio,
                esReemplazo: true,
                devolucionId: devolucion.id,
                fechaDevolucion: devolucion.fecha,
                detalleVentaId: null,
              })
            })
          })

        ventaDetallada.detalles = ventaDetallada.detalles.map((detalle) => {
          const key = `${detalle.producto_id}_${detalle.id}`
          const cantidadDevuelta = productosDevueltos.get(key) || 0
          detalle.cantidadDevuelta = cantidadDevuelta

          if (cantidadDevuelta >= detalle.cantidad) {
            detalle.devuelto = true
          } else if (cantidadDevuelta > 0) {
            detalle.devueltoParcial = true
          }

          if (detalle.es_reemplazo) {
            const reemplazo = productosReemplazo.find((r) => r.id === detalle.producto_id && !r.detalleVentaId)
            if (reemplazo) {
              reemplazo.detalleVentaId = detalle.id
            }
          }

          return detalle
        })

        ventaDetallada.productosReemplazo = productosReemplazo
      }

      setVentaSeleccionada(adaptVentaToFrontend(ventaDetallada))
      setDetalleVentaAbierto(ventaId)
      setTabActiva("detalles")

      cargarDevolucionesVenta(ventaId)
    } catch (error) {
      console.error("Error al obtener detalle de venta:", error)
      toast.error("Error al obtener detalle de venta")
    } finally {
      setCargando(false)
    }
  }

  const cargarDevolucionesVenta = async (ventaId) => {
    setCargandoDevoluciones(true)
    try {
      const devoluciones = await getDevolucionesByVenta(ventaId)
      setDevolucionesVenta(devoluciones)
    } catch (error) {
      console.error("Error al cargar devoluciones:", error)
      setDevolucionesVenta([])
    } finally {
      setCargandoDevoluciones(false)
    }
  }

  const abrirDialogDevolucion = () => {
    setDialogDevolucionAbierto(true)
  }

  const handleDevolucionCompleta = () => {
    if (ventaSeleccionada) {
      cargarDevolucionesVenta(ventaSeleccionada.id)
      abrirDetalleVenta(ventaSeleccionada.id)
    }

    cargarVentas()

    toast.success("Devolución procesada correctamente", {
      position: "bottom-center",
    })
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
      await anularVenta(ventaAnular.id, motivoAnulacion)

      const ventasActualizadas = ventas.map((v) =>
        v.id === ventaAnular.id
          ? { ...v, anulada: true, fechaAnulacion: new Date().toISOString(), motivoAnulacion }
          : v,
      )

      setVentas(ventasActualizadas)
      filtrarVentas(ventasActualizadas)

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
        mensaje: "Venta anulada correctamente. Se ha restaurado el stock de los productos.",
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
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.puntoVentaId])

  useEffect(() => {
    if (filtros.productoId) {
      cargarVentas()
    }
  }, [filtros.productoId])

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas de Productos</h1>
          <p className="text-gray-500">Consulta y gestiona el historial de ventas de productos realizadas</p>
        </div>
      </div>

      {/* Tarjeta de Total General - Solo visible para administradores */}
      {isAdmin && (
        <Card className="mb-6 border-0 shadow-md bg-gradient-to-r from-orange-500 to-orange-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
                <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                  <DollarSign size={14} />
                  Total en ARS
                </span>
                <span className="text-white text-2xl font-bold">{formatearPrecio(totalVentasFiltradas)}</span>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
                <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                  <ShoppingBag size={14} />
                  Cantidad de Ventas
                </span>
                <span className="text-white text-2xl font-bold">{ventasFiltradas.length}</span>
                <span className="text-white/70 text-xs">
                  {!filtros.mostrarAnuladas ? "Ventas activas" : "Ventas anuladas"}
                </span>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
                <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                  <ArrowLeftRight size={14} />
                  Devoluciones
                </span>
                <span className="text-white text-2xl font-bold">
                  {ventasFiltradas.filter((v) => v.tieneDevoluciones).length}
                </span>
                <span className="text-white/70 text-xs">Ventas con devoluciones registradas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                placeholder="Buscar por factura, cliente o vendedor..."
                className="pl-9"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>

            {/* Búsqueda por producto */}
            <div className="col-span-1 sm:col-span-2 xl:col-span-1">
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por producto..."
                  className="pl-9"
                  value={busquedaProducto}
                  onChange={(e) => handleBusquedaProductoChange(e.target.value)}
                />
                {busquedaProducto && busquedaProducto.length > 0 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => {
                        setBusquedaProducto("")
                        setProductos([])
                        setProductoSeleccionado(null)
                        setFiltros({
                          ...filtros,
                          productoId: "",
                        })
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {busquedaProducto && busquedaProducto.length > 0 && (
                <div className="relative mt-1">
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {cargandoProductos ? (
                      <div className="p-2 text-center text-gray-500">Buscando productos...</div>
                    ) : productos.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">No se encontraron productos</div>
                    ) : (
                      <ul className="py-1">
                        {productos.map((producto) => (
                          <li
                            key={producto.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                              productoSeleccionado?.id === producto.id ? "bg-orange-50" : ""
                            }`}
                            onClick={() => {
                              handleSeleccionarProducto(producto)
                              setBusquedaProducto(producto.nombre)
                            }}
                          >
                            <div className="font-medium">{producto.nombre}</div>
                            <div className="text-xs text-gray-500">Código: {producto.codigo}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {productoSeleccionado && (
                <div className="mt-1">
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    <Tag className="h-3 w-3 mr-1" />
                    {productoSeleccionado.nombre}
                  </Badge>
                </div>
              )}
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
              <DateRangePicker
                date={rangoFechas}
                setDate={setRangoFechas}
                className="w-full"
                align="start"
                disableBefore={!isAdmin ? new Date(new Date().setDate(new Date().getDate() - 7)) : undefined}
              />
              {!isAdmin && (
                <div className="text-xs text-amber-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Solo puedes ver los últimos 7 días
                </div>
              )}
            </div>

            {/* Controles adicionales */}
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
            <FileText size={20} />
            Listado de Ventas de Productos
          </CardTitle>
          <CardDescription className="text-gray-300">{ventasFiltradas.length} ventas encontradas</CardDescription>
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
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
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
                          className={`group ${venta.anulada ? "bg-red-50" : venta.tieneDevoluciones ? "bg-blue-50" : detalleVentaAbierto === venta.id ? "bg-orange-50" : ""}`}
                        >
                          <TableCell>
                            <div className="font-medium flex items-center gap-2">
                              {venta.numeroFactura}
                              {venta.anulada && (
                                <Badge variant="destructive" className="text-xs">
                                  Anulada
                                </Badge>
                              )}
                              {venta.tieneDevoluciones && (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 text-xs">
                                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                                  Con devoluciones
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatearFechaHora(venta.fecha)}</TableCell>
                          <TableCell>{venta.cliente ? venta.cliente.nombre : "Cliente General"}</TableCell>
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
                          <TableCell className="font-medium">{formatearPrecio(venta.total)}</TableCell>
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

                              {!venta.anulada && isAdmin && (
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
                              <TableCell colSpan={7} className="p-0 border-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Card className="mx-4 my-2 border border-orange-200 shadow-sm">
                                    <CardContent className="p-4">
                                      <Tabs value={tabActiva} onValueChange={setTabActiva}>
                                        <TabsList className="mb-4">
                                          <TabsTrigger value="detalles" className="flex items-center gap-1">
                                            <Package className="h-4 w-4" />
                                            Detalles de la venta
                                          </TabsTrigger>
                                          <TabsTrigger value="devoluciones" className="flex items-center gap-1">
                                            <ArrowLeftRight className="h-4 w-4" />
                                            Devoluciones
                                            {ventaSeleccionada.tieneDevoluciones && (
                                              <Badge className="ml-1 bg-blue-100 text-blue-800 border-blue-300">
                                                {devolucionesVenta.length}
                                              </Badge>
                                            )}
                                          </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="detalles">
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
                                                    {ventaSeleccionada.tipoPago
                                                      ? ventaSeleccionada.tipoPago.nombre
                                                      : "N/A"}
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

                                            {/* Detalle de productos */}
                                            <div className="md:col-span-2">
                                              <div className="flex items-center gap-2 text-orange-700 mb-3">
                                                <Package size={16} />
                                                <h3 className="font-medium">Productos</h3>
                                              </div>

                                              <div className="rounded border overflow-hidden">
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead>Producto</TableHead>
                                                      <TableHead className="text-right">Precio</TableHead>
                                                      <TableHead className="text-center">Cantidad</TableHead>
                                                      <TableHead className="text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {ventaSeleccionada.detalles
                                                      .filter((detalle) => !detalle.devuelto)
                                                      .map((detalle) => (
                                                        <TableRow
                                                          key={detalle.id}
                                                          className={detalle.devueltoParcial ? "bg-blue-50/50" : ""}
                                                        >
                                                          <TableCell>
                                                            <div>
                                                              <div className="font-medium">
                                                                {detalle.producto.nombre}
                                                              </div>
                                                              <div className="text-xs text-gray-500">
                                                                Código: {detalle.producto.codigo}
                                                              </div>
                                                              {detalle.es_reemplazo && (
                                                                <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                                                  <Plus className="h-3 w-3 mr-1" />
                                                                  Producto de reemplazo
                                                                </Badge>
                                                              )}
                                                              {detalle.devueltoParcial && (
                                                                <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-300">
                                                                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                                                                  Devuelto parcial ({detalle.cantidadDevuelta}/
                                                                  {detalle.cantidad})
                                                                </Badge>
                                                              )}
                                                            </div>
                                                          </TableCell>
                                                          <TableCell className="text-right">
                                                            {detalle.precioUnitario !== detalle.precioConDescuento ? (
                                                              <div>
                                                                <div className="text-orange-600">
                                                                  {formatearPrecio(detalle.precioConDescuento)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 line-through">
                                                                  {formatearPrecio(detalle.precioUnitario)}
                                                                </div>
                                                              </div>
                                                            ) : (
                                                              <span>{formatearPrecio(detalle.precioUnitario)}</span>
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-center">
                                                            {detalle.cantidad - (detalle.cantidadDevuelta || 0)}
                                                          </TableCell>
                                                          <TableCell className="text-right font-medium">
                                                            {formatearPrecio(
                                                              (detalle.cantidad - (detalle.cantidadDevuelta || 0)) *
                                                                detalle.precioConDescuento,
                                                            )}
                                                          </TableCell>
                                                        </TableRow>
                                                      ))}

                                                    {ventaSeleccionada.productosReemplazo &&
                                                      ventaSeleccionada.productosReemplazo.length > 0 && (
                                                        <>
                                                          <TableRow>
                                                            <TableCell colSpan={4} className="bg-gray-100 py-1">
                                                              <div className="text-xs font-medium text-gray-600 flex items-center">
                                                                <ArrowLeftRight className="h-3 w-3 mr-1" />
                                                                Productos de reemplazo
                                                              </div>
                                                            </TableCell>
                                                          </TableRow>

                                                          {ventaSeleccionada.productosReemplazo.map(
                                                            (producto, index) => (
                                                              <TableRow
                                                                key={`reemplazo-${index}`}
                                                                className="bg-green-50"
                                                              >
                                                                <TableCell>
                                                                  <div>
                                                                    <div className="font-medium">{producto.nombre}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                      Código: {producto.codigo}
                                                                    </div>
                                                                    <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                                                      <Plus className="h-3 w-3 mr-1" />
                                                                      Producto de reemplazo
                                                                    </Badge>
                                                                  </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                  {formatearPrecio(producto.precio)}
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                  {producto.cantidad}
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium">
                                                                  {formatearPrecio(producto.precio * producto.cantidad)}
                                                                </TableCell>
                                                              </TableRow>
                                                            ),
                                                          )}
                                                        </>
                                                      )}
                                                  </TableBody>
                                                </Table>
                                              </div>

                                              {/* Resumen de totales */}
                                              <div className="mt-4 bg-gray-50 p-3 rounded border">
                                                <div className="space-y-1">
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-500">Subtotal:</span>
                                                    <span>{formatearPrecio(ventaSeleccionada.subtotal)}</span>
                                                  </div>

                                                  {ventaSeleccionada.porcentajeInteres > 0 && (
                                                    <div className="flex justify-between">
                                                      <span className="text-gray-500">
                                                        Interés ({ventaSeleccionada.porcentajeInteres}%):
                                                      </span>
                                                      <span className="text-orange-600">
                                                        +{formatearPrecio(ventaSeleccionada.montoInteres)}
                                                      </span>
                                                    </div>
                                                  )}

                                                  {ventaSeleccionada.porcentajeDescuento > 0 && (
                                                    <div className="flex justify-between">
                                                      <span className="text-gray-500">
                                                        Descuento ({ventaSeleccionada.porcentajeDescuento}%):
                                                      </span>
                                                      <span className="text-green-600">
                                                        -{formatearPrecio(ventaSeleccionada.montoDescuento)}
                                                      </span>
                                                    </div>
                                                  )}

                                                  <Separator className="my-1" />
                                                  <div className="flex justify-between font-bold">
                                                    <span>Total:</span>
                                                    <span className="text-orange-600">
                                                      {formatearPrecio(ventaSeleccionada.total)}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              {!ventaSeleccionada.anulada && (
                                                <div className="mt-4 flex justify-end">
                                                  <Button
                                                    onClick={abrirDialogDevolucion}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                  >
                                                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                                                    Registrar devolución
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="devoluciones">
                                          {cargandoDevoluciones ? (
                                            <div className="flex justify-center py-8">
                                              <div className="animate-spin">
                                                <svg
                                                  className="h-8 w-8 text-blue-600"
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                  />
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                          ) : (
                                            <DevolucionesList
                                              devoluciones={devolucionesVenta}
                                              formatearPrecio={formatearPrecio}
                                              formatearFechaHora={formatearFechaHora}
                                            />
                                          )}

                                          {!ventaSeleccionada.anulada && (
                                            <div className="mt-4 flex justify-end">
                                              <Button
                                                onClick={abrirDialogDevolucion}
                                                className="bg-blue-600 hover:bg-blue-700"
                                              >
                                                <ArrowLeftRight className="h-4 w-4 mr-2" />
                                                Registrar nueva devolución
                                              </Button>
                                            </div>
                                          )}
                                        </TabsContent>
                                      </Tabs>
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
              Esta acción anulará la venta y restaurará el stock de los productos. No se puede deshacer.
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium">{ventaAnular && formatearPrecio(ventaAnular.total)}</span>
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

      {/* Diálogo de devolución */}
      <DevolucionDialog
        open={dialogDevolucionAbierto}
        setOpen={setDialogDevolucionAbierto}
        venta={ventaSeleccionada}
        cliente={ventaSeleccionada?.cliente}
        onDevolucionCompleta={handleDevolucionCompleta}
        formatearPrecio={formatearPrecio}
      />
    </div>
  )
}

export default HistorialVentasProductosPage
