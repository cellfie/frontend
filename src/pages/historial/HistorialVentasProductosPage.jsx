"use client"

import React, { useRef } from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, FileText, MapPin, Trash2, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, ShoppingBag, Package, CheckCircle, XCircle, ArrowLeftRight, Plus, DollarSign, Calendar, Loader2, X, Star, TrendingUp, Eye, EyeOff, CreditCard, Landmark, University, Wallet } from 'lucide-react'

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
import { PaginationControls } from "@/lib/PaginationControls"

import {
  getVentasPaginadas,
  getVentaById,
  anularVenta,
  adaptVentaToFrontend,
  clearVentasCache,
  getCacheInfo,
  cleanExpiredCache,
  getMetodosPagoVentas, // NUEVO: Importar función para métodos de pago
  buildVentasFilters,
  validateVentasFilters,
} from "@/services/ventasService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getDevolucionesByVenta } from "@/services/devolucionesService"
import { searchProductosRapido } from "@/services/productosService"
import { useAuth } from "@/context/AuthContext"

import DevolucionDialog from "@/components/devoluciones/DevolucionDialog"
import DevolucionesList from "@/components/devoluciones/DevolucionesList"

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

// Función para formatear fecha local sin conversión a UTC (mejorada)
const formatLocalDate = (date) => {
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

// CORREGIDO: Función para obtener icono de método de pago
const getPaymentIcon = (paymentMethodName) => {
  if (!paymentMethodName) return Wallet
  const lowerCaseName = paymentMethodName.toLowerCase()
  if (lowerCaseName.includes("efectivo")) return Wallet
  if (lowerCaseName.includes("tarjeta")) return CreditCard
  if (lowerCaseName.includes("transferencia")) return Landmark
  if (lowerCaseName.includes("cuenta corriente") || lowerCaseName.includes("cuenta")) return University
  if (lowerCaseName.includes("múltiple")) return ArrowLeftRight
  return DollarSign
}

// NUEVA: Función para determinar si una venta tiene múltiples métodos de pago
const hasMultiplePaymentMethods = (venta) => {
  // Verificar si tiene múltiples pagos registrados
  if (venta.pagos && venta.pagos.length > 1) return true
  
  // Verificar si el tipo de pago es "Múltiple"
  if (venta.tipoPago?.nombre === "Múltiple") return true
  
  // Verificar si tiene métodos de pago reales múltiples
  if (venta.metodosPagoReales && venta.metodosPagoReales.includes(',')) return true
  
  return false
}

// NUEVA: Función para obtener los métodos de pago de una venta
const getVentaPaymentMethods = (venta) => {
  // Si tiene pagos individuales registrados, usar esos
  if (venta.pagos && venta.pagos.length > 0) {
    return venta.pagos.map(pago => ({
      nombre: pago.tipo_pago_nombre,
      monto: pago.monto,
      anulado: pago.anulado
    }))
  }
  
  // Si tiene métodos de pago reales del backend
  if (venta.metodosPagoReales) {
    const metodos = venta.metodosPagoReales.split(', ').filter(m => m.trim())
    return metodos.map(metodo => ({
      nombre: metodo.trim(),
      monto: null, // No tenemos el monto individual
      anulado: false
    }))
  }
  
  // Fallback al tipo de pago general
  if (venta.tipoPago?.nombre) {
    return [{
      nombre: venta.tipoPago.nombre,
      monto: venta.total,
      anulado: false
    }]
  }
  
  return [{
    nombre: "N/A",
    monto: venta.total,
    anulado: false
  }]
}

const HistorialVentas = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  // Ref para el scroll automático
  const ventaRefs = useRef({})

  // Estados principales
  const [ventas, setVentas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [detalleVentaAbierto, setDetalleVentaAbierto] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // CORREGIDO: Estados de paginación mejorados
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [startItem, setStartItem] = useState(1)
  const [endItem, setEndItem] = useState(0)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPuntoVenta, setSelectedPuntoVenta] = useState("todos")
  const [selectedMetodoPago, setSelectedMetodoPago] = useState("todos") // CORREGIDO: Estado para método de pago
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  })

  // Estados para búsqueda de productos MEJORADOS
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [mostrarDropdownProductos, setMostrarDropdownProductos] = useState(false)
  const [productosFocused, setProductosFocused] = useState(false)

  // NUEVO: Estado para controlar la visibilidad de la búsqueda de productos
  const [mostrarBusquedaProductos, setMostrarBusquedaProductos] = useState(false)

  // Estados de datos auxiliares
  const [puntosVenta, setPuntosVenta] = useState([])
  const [metodosPago, setMetodosPago] = useState([]) // CORREGIDO: Para métodos de pago reales

  // Estados para devoluciones
  const [dialogDevolucionAbierto, setDialogDevolucionAbierto] = useState(false)
  const [devolucionesVenta, setDevolucionesVenta] = useState([])
  const [cargandoDevoluciones, setCargandoDevoluciones] = useState(false)
  const [tabActiva, setTabActiva] = useState("detalles")

  // Estados para anulación
  const [dialogAnularAbierto, setDialogAnularAbierto] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [ventaAnular, setVentaAnular] = useState(null)
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false)
  const [estadoAnulacion, setEstadoAnulacion] = useState({
    exito: false,
    error: false,
    mensaje: "",
  })

  // NUEVO: Estados para debugging y monitoreo
  const [debugInfo, setDebugInfo] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [loadingMetodosPago, setLoadingMetodosPago] = useState(false) // NUEVO: Loading para métodos de pago

  // Debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const debouncedBusquedaProducto = useDebounce(busquedaProducto, 300)

  // Calcular el total de ventas filtradas
  const totalVentasFiltradas = useMemo(() => {
    return ventas.reduce((sum, venta) => {
      const ventaTotal = typeof venta.total === "number" ? venta.total : Number.parseFloat(venta.total) || 0
      return sum + ventaTotal
    }, 0)
  }, [ventas])

  // Función para hacer scroll suave al elemento
  const scrollToVenta = useCallback((ventaId) => {
    const element = ventaRefs.current[ventaId]
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }, 100)
    }
  }, [])

  // NUEVO: Función para limpiar cache expirado automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredCache()
    }, 5 * 60 * 1000) // Cada 5 minutos

    return () => clearInterval(interval)
  }, [])

  // CORREGIDO: Cargar datos iniciales incluyendo métodos de pago
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoadingMetodosPago(true)
        
        // CORREGIDO: Cargar métodos de pago reales desde ventas
        const [puntosData, metodosData] = await Promise.all([
          getPuntosVenta(), 
          getMetodosPagoVentas() // NUEVO: Usar la nueva función
        ])

        setPuntosVenta(puntosData)
        setMetodosPago(metodosData)

        console.log("Métodos de pago cargados:", metodosData)

        // Configurar rango de fechas inicial
        const fechaFin = new Date()
        let fechaInicio

        if (isAdmin) {
          fechaInicio = new Date()
          fechaInicio.setDate(fechaInicio.getDate() - 30)
        } else {
          fechaInicio = new Date()
          fechaInicio.setDate(fechaInicio.getDate() - 7)
        }

        setDateRange({
          from: fechaInicio,
          to: fechaFin,
        })
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales: " + error.message)
      } finally {
        setLoadingMetodosPago(false)
      }
    }

    cargarDatosIniciales()
  }, [isAdmin])

  // MEJORADO: Búsqueda de productos con debounce
  useEffect(() => {
    const buscarProductos = async () => {
      if (debouncedBusquedaProducto.length < 2) {
        setProductos([])
        setMostrarDropdownProductos(false)
        return
      }

      setCargandoProductos(true)
      try {
        const productosData = await searchProductosRapido(debouncedBusquedaProducto)
        setProductos(productosData)
        setMostrarDropdownProductos(true)
      } catch (error) {
        console.error("Error al buscar productos:", error)
        toast.error("Error al buscar productos")
        setProductos([])
        setMostrarDropdownProductos(false)
      } finally {
        setCargandoProductos(false)
      }
    }

    buscarProductos()
  }, [debouncedBusquedaProducto])

  // CORREGIDO: Función para construir filtros mejorada con validación
  const buildFilters = useCallback(() => {
    const filters = {
      search: debouncedSearchTerm?.trim() || undefined,
      punto_venta_id: selectedPuntoVenta !== "todos" ? 
        puntosVenta.find(pv => pv.nombre === selectedPuntoVenta)?.id : undefined,
      tipo_pago: selectedMetodoPago !== "todos" ? selectedMetodoPago : undefined, // CORREGIDO: Filtro de método de pago
      anuladas: mostrarAnuladas,
      producto_id: productoSeleccionado?.id || undefined,
      fecha_inicio: dateRange?.from ? formatLocalDate(dateRange.from) : undefined,
      fecha_fin: dateRange?.to ? formatLocalDate(dateRange.to) : undefined,
    }

    // Validar filtros antes de enviar
    const validationErrors = validateVentasFilters(filters)
    if (validationErrors.length > 0) {
      console.warn("Errores de validación en filtros:", validationErrors)
      toast.warning("Algunos filtros tienen errores: " + validationErrors.join(", "))
    }

    return buildVentasFilters(filters)
  }, [
    debouncedSearchTerm,
    selectedPuntoVenta,
    selectedMetodoPago, // CORREGIDO: Incluir método de pago
    mostrarAnuladas,
    productoSeleccionado,
    dateRange,
    puntosVenta,
  ])

  // CORREGIDO: Cargar ventas con paginación mejorada
  const fetchVentas = useCallback(
    async (page = 1, resetPage = false) => {
      setIsLoading(true)
      setFetchError(null)
      
      try {
        const filters = buildFilters()
        const actualPage = resetPage ? 1 : page
        
        console.log("Fetching ventas:", { actualPage, itemsPerPage, filters })
        
        const startTime = Date.now()
        const result = await getVentasPaginadas(actualPage, itemsPerPage, filters)
        const endTime = Date.now()
        
        console.log("Ventas fetched successfully:", {
          ventasCount: result.ventas.length,
          pagination: result.pagination,
          fetchTime: endTime - startTime,
          debug: result.debug
        })

        // CORREGIDO: Validar que result tenga la estructura esperada
        if (!result || !result.ventas || !result.pagination) {
          throw new Error("Respuesta inválida del servidor")
        }

        // Adaptar ventas al frontend
        const ventasAdaptadas = result.ventas
          .map(adaptVentaToFrontend)
          .filter(venta => venta !== null) // Filtrar ventas que no se pudieron adaptar

        // CORREGIDO: Actualizar todos los estados de paginación
        setVentas(ventasAdaptadas)
        setCurrentPage(result.pagination.currentPage)
        setTotalPages(result.pagination.totalPages)
        setTotalItems(result.pagination.totalItems)
        setHasNextPage(result.pagination.hasNextPage)
        setHasPrevPage(result.pagination.hasPrevPage)
        setStartItem(result.pagination.startItem || 1)
        setEndItem(result.pagination.endItem || 0)

        // NUEVO: Guardar información de debug
        setDebugInfo(result.debug)
        setLastFetchTime(new Date())

        if (resetPage) {
          setCurrentPage(1)
          setDetalleVentaAbierto(null)
        }

        // NUEVO: Mostrar información útil en consola para debugging
        if (result.debug) {
          console.log("Debug info:", result.debug)
        }

      } catch (error) {
        console.error("Error al cargar ventas:", error)
        setFetchError(error.message)
        toast.error(`Error al cargar ventas: ${error.message}`)
        
        // En caso de error, resetear estados
        setVentas([])
        setTotalPages(1)
        setTotalItems(0)
        setHasNextPage(false)
        setHasPrevPage(false)
        setStartItem(1)
        setEndItem(0)
      } finally {
        setIsLoading(false)
      }
    },
    [buildFilters, itemsPerPage],
  )

  // CORREGIDO: Efecto para cargar ventas cuando cambian los filtros
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      console.log("Filters changed, fetching ventas...")
      fetchVentas(1, true)
    }
  }, [
    debouncedSearchTerm,
    selectedPuntoVenta,
    selectedMetodoPago, // CORREGIDO: Incluir método de pago
    mostrarAnuladas,
    productoSeleccionado,
    itemsPerPage,
    dateRange,
    fetchVentas
  ])

  // CORREGIDO: Efecto para cargar ventas cuando cambia la página
  useEffect(() => {
    if (currentPage > 1) {
      console.log("Page changed to:", currentPage)
      fetchVentas(currentPage, false)
    }
  }, [currentPage, fetchVentas])

  // MEJORADO: Manejar selección de producto con mejor persistencia
  const handleSeleccionarProducto = (producto) => {
    if (productoSeleccionado?.id === producto.id) {
      return
    }

    setProductoSeleccionado(producto)
    setBusquedaProducto("")
    setProductos([])
    setMostrarDropdownProductos(false)
    setProductosFocused(false)

    toast.success(`Filtrando ventas por: ${producto.nombre}`, {
      position: "bottom-right",
      autoClose: 2000,
    })
  }

  // MEJORADO: Limpiar filtro de producto
  const limpiarFiltroProducto = () => {
    setProductoSeleccionado(null)
    setBusquedaProducto("")
    setProductos([])
    setMostrarDropdownProductos(false)
    setProductosFocused(false)
  }

  // NUEVO: Toggle para mostrar/ocultar búsqueda de productos
  const toggleBusquedaProductos = () => {
    setMostrarBusquedaProductos(!mostrarBusquedaProductos)
    if (mostrarBusquedaProductos && !productoSeleccionado) {
      setBusquedaProducto("")
      setProductos([])
      setMostrarDropdownProductos(false)
    }
  }

  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""

    const fecha = new Date(fechaString)
    if (isNaN(fecha.getTime())) return ""

    // CORREGIDO: Mejor manejo de zona horaria
    return fecha.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
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

  // CORREGIDO: Limpiar filtros incluyendo método de pago
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

    setDateRange({
      from: fechaInicio,
      to: fechaFin,
    })

    setSearchTerm("")
    setSelectedPuntoVenta("todos")
    setSelectedMetodoPago("todos") // CORREGIDO: Limpiar método de pago
    setMostrarAnuladas(false)
    limpiarFiltroProducto()
    setCurrentPage(1)
    setDetalleVentaAbierto(null)
    
    // NUEVO: Limpiar cache al limpiar filtros
    clearVentasCache('ventas_paginadas')
  }

  // MEJORADO: Abrir detalle de venta con scroll automático y mejor manejo de errores
  const abrirDetalleVenta = async (ventaId) => {
    if (detalleVentaAbierto === ventaId) {
      setDetalleVentaAbierto(null)
      setTabActiva("detalles")
      return
    }

    try {
      setLoadingDetalle(true)
      setDetalleVentaAbierto(ventaId)

      const ventaDetalladaCruda = await getVentaById(ventaId)

      if (!ventaDetalladaCruda) {
        throw new Error("No se pudo obtener la información de la venta")
      }

      const ventaAdaptada = adaptVentaToFrontend(ventaDetalladaCruda)
      
      if (!ventaAdaptada) {
        throw new Error("Error al procesar los datos de la venta")
      }

      if (ventaAdaptada.detalles) {
        try {
          const devoluciones = await getDevolucionesByVenta(ventaId)
          const productosDevueltos = new Map()
          const productosReemplazo = []

          devoluciones
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .forEach((devolucion) => {
              if (devolucion.anulada === 1) return

              if (devolucion.productos_devueltos) {
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
              }

              if (devolucion.productos_reemplazo) {
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
              }
            })

          ventaAdaptada.detalles = ventaAdaptada.detalles.map((detalle) => {
            const key = `${detalle.producto.id}_${detalle.id}`
            const cantidadDevuelta = productosDevueltos.get(key) || 0
            detalle.cantidadDevuelta = cantidadDevuelta

            if (cantidadDevuelta >= detalle.cantidad) {
              detalle.devuelto = true
            } else if (cantidadDevuelta > 0) {
              detalle.devueltoParcial = true
            }

            if (detalle.es_reemplazo) {
              const reemplazo = productosReemplazo.find((r) => r.id === detalle.producto.id && !r.detalleVentaId)
              if (reemplazo) {
                reemplazo.detalleVentaId = detalle.id
              }
            }

            return detalle
          })

          ventaAdaptada.productosReemplazo = productosReemplazo
        } catch (devolucionError) {
          console.warn("Error al cargar devoluciones:", devolucionError)
        }
      }

      setVentaSeleccionada(ventaAdaptada)
      setTabActiva("detalles")

      setTimeout(() => {
        scrollToVenta(ventaId)
      }, 300)

      cargarDevolucionesVenta(ventaId)
    } catch (error) {
      console.error("Error al obtener detalle de venta:", error)
      toast.error(`Error al obtener detalle de venta: ${error.message}`)
      setDetalleVentaAbierto(null)
    } finally {
      setLoadingDetalle(false)
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

    clearVentasCache()
    fetchVentas(currentPage)

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

      clearVentasCache()
      await fetchVentas(currentPage)

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

  // CORREGIDO: Funciones de paginación mejoradas
  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setDetalleVentaAbierto(null)
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setDetalleVentaAbierto(null)
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

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas por Productos</h1>
          <p className="text-gray-500">Busca y filtra ventas por productos específicos</p>
          {/* NUEVO: Información de debug para administradores */}
          {isAdmin && debugInfo && (
            <div className="text-xs text-gray-400 mt-1">
              Última actualización: {lastFetchTime?.toLocaleTimeString()} | 
              Filtros aplicados: {Object.keys(debugInfo.appliedFilters || {}).length} |
              Cache: {getCacheInfo().totalEntries} entradas
            </div>
          )}
        </div>
      </div>

      {/* NUEVO: Mostrar errores de fetch si los hay */}
      {fetchError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Error al cargar datos:</span>
          </div>
          <p className="text-sm mt-1">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchVentas(currentPage)}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

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
                <span className="text-white text-2xl font-bold">{totalItems}</span>
                <span className="text-white/70 text-xs">{!mostrarAnuladas ? "Ventas activas" : "Ventas anuladas"}</span>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col">
                <span className="text-white/70 text-sm mb-1 flex items-center gap-1">
                  <ArrowLeftRight size={14} />
                  Página Actual
                </span>
                <span className="text-white text-2xl font-bold">
                  {currentPage} de {totalPages}
                </span>
                <span className="text-white/70 text-xs">
                  Mostrando {startItem}-{endItem} de {totalItems}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NUEVO: Botón para mostrar/ocultar búsqueda de productos */}
      <div className="mb-4">
        <Button
          onClick={toggleBusquedaProductos}
          variant={mostrarBusquedaProductos ? "default" : "outline"}
          className={`${
            mostrarBusquedaProductos
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "border-orange-300 text-orange-600 hover:bg-orange-50"
          } transition-all duration-200`}
        >
          {mostrarBusquedaProductos ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Ocultar Búsqueda por Productos
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Mostrar Búsqueda por Productos
            </>
          )}
          {productoSeleccionado && (
            <Badge className="ml-2 bg-white/20 text-white border-white/30">Activo: {productoSeleccionado.nombre}</Badge>
          )}
        </Button>
      </div>

      {/* MEJORADO: Búsqueda de productos colapsable */}
      <AnimatePresence>
        {mostrarBusquedaProductos && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 via-white to-orange-50">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Búsqueda Inteligente por Productos</h3>
                      <p className="text-orange-100 text-sm font-normal">
                        Encuentra ventas específicas filtrando por productos
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleBusquedaProductos}
                    className="text-white hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Campo de búsqueda mejorado */}
                  <div className="relative">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Search className="h-5 w-5 text-orange-500" />
                        <span className="text-gray-400 text-sm">|</span>
                      </div>
                      <Input
                        placeholder="Buscar productos por nombre o código..."
                        className="pl-16 pr-12 py-4 text-lg border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-white shadow-sm rounded-xl transition-all duration-200"
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        onFocus={() => {
                          setProductosFocused(true)
                          if (productos.length > 0) setMostrarDropdownProductos(true)
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setProductosFocused(false)
                            setMostrarDropdownProductos(false)
                          }, 200)
                        }}
                      />

                      {/* Indicadores en el input */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        {cargandoProductos && <Loader2 className="h-5 w-5 animate-spin text-orange-500" />}
                        {busquedaProducto && !cargandoProductos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                            onClick={limpiarFiltroProducto}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Dropdown de resultados mejorado */}
                    <AnimatePresence>
                      {mostrarDropdownProductos && productos.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute z-50 mt-2 w-full bg-white border-2 border-orange-200 rounded-xl shadow-2xl overflow-hidden"
                        >
                          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2">
                            <div className="flex items-center justify-between text-white">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                {productos.length} productos encontrados
                              </span>
                              <Badge className="bg-white/20 text-white border-white/30">Resultados</Badge>
                            </div>
                          </div>

                          <div className="max-h-80 overflow-y-auto">
                            {productos.map((producto, index) => (
                              <motion.div
                                key={producto.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15, delay: index * 0.03 }}
                                className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                  productoSeleccionado?.id === producto.id
                                    ? "bg-gradient-to-r from-orange-100 to-orange-200 border-l-4 border-l-orange-600"
                                    : "hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100"
                                }`}
                                onClick={() => handleSeleccionarProducto(producto)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2 rounded-lg ${
                                          productoSeleccionado?.id === producto.id ? "bg-orange-200" : "bg-orange-100"
                                        }`}
                                      >
                                        <Package
                                          className={`h-4 w-4 ${
                                            productoSeleccionado?.id === producto.id
                                              ? "text-orange-700"
                                              : "text-orange-600"
                                          }`}
                                        />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-gray-900 text-base">{producto.nombre}</h4>
                                          {productoSeleccionado?.id === producto.id && (
                                            <CheckCircle className="h-4 w-4 text-orange-600" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <Badge variant="outline" className="text-xs bg-gray-50">
                                            {producto.codigo}
                                          </Badge>
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">Stock:</span>
                                            <span
                                              className={`text-xs font-medium ${
                                                producto.stock > 10
                                                  ? "text-green-600"
                                                  : producto.stock > 0
                                                    ? "text-amber-600"
                                                    : "text-red-600"
                                              }`}
                                            >
                                              {producto.stock || 0}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xl font-bold text-orange-600">
                                      {formatearPrecio(producto.precio || 0)}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {producto.stock > 10 ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      ) : producto.stock > 0 ? (
                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                      ) : (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {producto.stock > 10
                                          ? "Disponible"
                                          : producto.stock > 0
                                            ? "Stock bajo"
                                            : "Sin stock"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mensaje cuando no hay resultados */}
                    {mostrarDropdownProductos &&
                      productos.length === 0 &&
                      busquedaProducto.length >= 2 &&
                      !cargandoProductos && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 text-center"
                        >
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-600 mb-1">No se encontraron productos</h3>
                          <p className="text-sm text-gray-400">Intenta con diferentes términos de búsqueda</p>
                        </motion.div>
                      )}
                  </div>

                  {/* Producto seleccionado */}
                  <AnimatePresence>
                    {productoSeleccionado && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <Star className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">Filtrando por producto:</h4>
                              <p className="text-orange-100">{productoSeleccionado.nombre}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={limpiarFiltroProducto}
                            className="text-white hover:bg-white/20 hover:text-white"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Quitar filtro
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Ayuda y consejos */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Search className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Consejos de búsqueda</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Escribe al menos 2 caracteres para comenzar la búsqueda</li>
                          <li>• Puedes buscar por nombre del producto o código</li>
                          <li>• Los resultados se actualizan automáticamente mientras escribes</li>
                          <li>• El producto seleccionado se mantiene marcado hasta que lo cambies</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header mejorado y responsivo */}
      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mb-6">
        <div className="bg-[#131321] p-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
              <Filter size={20} />
              Filtros Adicionales
            </h2>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {totalItems} ventas
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-3">
            {/* Primera fila: Búsqueda y controles principales */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por factura, cliente..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border">
                  <Checkbox id="mostrarAnuladas" checked={mostrarAnuladas} onCheckedChange={setMostrarAnuladas} />
                  <label
                    htmlFor="mostrarAnuladas"
                    className="text-sm font-medium leading-none cursor-pointer select-none whitespace-nowrap"
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
                        className="h-10 w-10 flex-shrink-0"
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

            {/* Segunda fila: Filtros específicos */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Punto de venta */}
                <Select value={selectedPuntoVenta} onValueChange={setSelectedPuntoVenta}>
                  <SelectTrigger
                    className={`w-full sm:w-auto ${
                      selectedPuntoVenta !== "todos"
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{selectedPuntoVenta === "todos" ? "Todos los puntos" : selectedPuntoVenta}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los puntos</SelectItem>
                    {puntosVenta.map((punto) => (
                      <SelectItem key={punto.id} value={punto.nombre}>
                        {punto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* CORREGIDO: Método de pago con datos reales */}
                <Select value={selectedMetodoPago} onValueChange={setSelectedMetodoPago} disabled={loadingMetodosPago}>
                  <SelectTrigger
                    className={`w-full sm:w-auto ${
                      selectedMetodoPago !== "todos"
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {loadingMetodosPago ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <DollarSign size={14} />
                      )}
                      <span>
                        {loadingMetodosPago 
                          ? "Cargando..." 
                          : selectedMetodoPago === "todos" 
                            ? "Todos los métodos" 
                            : selectedMetodoPago
                        }
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los métodos</SelectItem>
                    {metodosPago.map((metodo) => (
                      <SelectItem key={metodo.id} value={metodo.nombre}>
                        <div className="flex items-center gap-2">
                          {React.createElement(getPaymentIcon(metodo.nombre), { size: 14 })}
                          {metodo.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de fechas mejorado */}
              <div className="w-full lg:w-auto">
                <DateRangePicker
                  date={dateRange}
                  setDate={setDateRange}
                  className="w-full lg:w-[280px]"
                  showPresets={true}
                  align="start"
                  disableBefore={!isAdmin ? new Date(new Date().setDate(new Date().getDate() - 7)) : undefined}
                />
              </div>
            </div>

            {/* Indicadores de filtros activos */}
            {(searchTerm ||
              selectedPuntoVenta !== "todos" ||
              selectedMetodoPago !== "todos" ||
              productoSeleccionado ||
              mostrarAnuladas ||
              dateRange?.from ||
              dateRange?.to) && (
              <div className="pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
                  <Filter size={14} className="text-orange-400" />
                  <span>Filtros activos:</span>
                  {searchTerm && (
                    <Badge variant="outline" className="ml-2 text-xs bg-gray-50">
                      Búsqueda: {searchTerm}
                    </Badge>
                  )}
                  {selectedPuntoVenta !== "todos" && (
                    <Badge variant="outline" className="ml-1 text-xs bg-gray-50">
                      Punto: {selectedPuntoVenta}
                    </Badge>
                  )}
                  {selectedMetodoPago !== "todos" && (
                    <Badge variant="outline" className="ml-1 text-xs bg-gray-50">
                      <div className="flex items-center gap-1">
                        {React.createElement(getPaymentIcon(selectedMetodoPago), { size: 12 })}
                        Pago: {selectedMetodoPago}
                      </div>
                    </Badge>
                  )}
                  {productoSeleccionado && (
                    <Badge variant="outline" className="ml-1 text-xs bg-orange-50 text-orange-700 border-orange-300">
                      Producto: {productoSeleccionado.nombre}
                    </Badge>
                  )}
                  {mostrarAnuladas && (
                    <Badge variant="outline" className="ml-1 text-xs bg-red-50 text-red-700 border-red-300">
                      Anuladas incluidas
                    </Badge>
                  )}
                  {(dateRange?.from || dateRange?.to) && (
                    <Badge variant="outline" className="ml-1 text-xs bg-gray-50">
                      <Calendar size={12} className="mr-1" />
                      Fechas: {dateRange?.from ? formatLocalDate(dateRange.from) : "..."} -{" "}
                      {dateRange?.to ? formatLocalDate(dateRange.to) : "..."}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500 hover:text-gray-700"
                  onClick={limpiarFiltros}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}

            {/* Advertencia para usuarios no admin */}
            {!isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Acceso limitado</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Solo puedes ver las ventas de los últimos 7 días. Para acceso completo, contacta al administrador.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <FileText size={20} />
            {productoSeleccionado ? `Ventas con ${productoSeleccionado.nombre}` : "Listado de Ventas"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {totalItems} ventas encontradas - Página {currentPage} de {totalPages}
            {startItem > 0 && endItem > 0 && (
              <span className="ml-2">
                (Mostrando {startItem}-{endItem})
              </span>
            )}
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
                    <TableHead className="bg-white">Punto de Venta</TableHead>
                    <TableHead className="bg-white">Método de Pago</TableHead>
                    <TableHead className="bg-white">Total</TableHead>
                    <TableHead className="bg-white text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    renderSkeletons()
                  ) : ventas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-500">No hay ventas disponibles</h3>
                          <p className="text-sm text-gray-400">
                            {productoSeleccionado
                              ? `No se encontraron ventas con el producto "${productoSeleccionado.nombre}"`
                              : "No se encontraron ventas que coincidan con los criterios de búsqueda"}
                          </p>
                          {fetchError && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchVentas(currentPage)}
                              className="mt-2"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reintentar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventas.map((venta) => (
                      <React.Fragment key={venta.id}>
                        <TableRow
                          ref={(el) => (ventaRefs.current[venta.id] = el)}
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
                            {/* CORREGIDO: Mostrar métodos de pago mejorado */}
                            {(() => {
                              const metodosVenta = getVentaPaymentMethods(venta)
                              const esMultiple = hasMultiplePaymentMethods(venta)
                              
                              if (esMultiple) {
                                return (
                                  <div className="flex flex-wrap gap-1">
                                    <Badge
                                      variant="secondary"
                                      className="font-normal bg-purple-100 text-purple-700 border-purple-300"
                                    >
                                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                                      Múltiple ({metodosVenta.length})
                                    </Badge>
                                  </div>
                                )
                              } else if (metodosVenta.length > 0) {
                                const metodo = metodosVenta[0]
                                const IconoMetodo = getPaymentIcon(metodo.nombre)
                                return (
                                  <Badge variant="secondary" className="font-normal">
                                    <IconoMetodo className="h-3 w-3 mr-1" />
                                    {metodo.nombre}
                                  </Badge>
                                )
                              } else {
                                return (
                                  <Badge variant="outline" className="font-normal">
                                    N/A
                                  </Badge>
                                )
                              }
                            })()}
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
                                      disabled={loadingDetalle && detalleVentaAbierto === venta.id}
                                      className={
                                        detalleVentaAbierto === venta.id
                                          ? "bg-orange-100 text-orange-700"
                                          : "hover:bg-orange-50 hover:text-orange-600"
                                      }
                                    >
                                      {loadingDetalle && detalleVentaAbierto === venta.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : detalleVentaAbierto === venta.id ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {loadingDetalle && detalleVentaAbierto === venta.id
                                        ? "Cargando..."
                                        : detalleVentaAbierto === venta.id
                                          ? "Ocultar detalles"
                                          : "Ver detalles"}
                                    </p>
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

                        {/* Detalle de venta con scroll automático mejorado */}
                        <AnimatePresence>
                          {detalleVentaAbierto === venta.id && (
                            <TableRow>
                              <TableCell colSpan={7} className="p-0 border-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  onAnimationComplete={() => {
                                    if (detalleVentaAbierto === venta.id) {
                                      scrollToVenta(venta.id)
                                    }
                                  }}
                                >
                                  <Card className="mx-4 my-2 border border-orange-200 shadow-sm">
                                    <CardContent className="p-4">
                                      {loadingDetalle ? (
                                        <div className="flex justify-center items-center py-8">
                                          <div className="flex items-center gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                                            <span className="text-gray-600">Cargando detalles de la venta...</span>
                                          </div>
                                        </div>
                                      ) : ventaSeleccionada ? (
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
                                                    <span className="font-medium">
                                                      {ventaSeleccionada.numeroFactura}
                                                    </span>
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

                                                  {/* CORREGIDO: Mostrar múltiples métodos de pago en detalle */}
                                                  <div className="flex flex-col">
                                                    <span className="text-gray-500 mb-2">Métodos de pago:</span>
                                                    {(() => {
                                                      const metodosVenta = getVentaPaymentMethods(ventaSeleccionada)
                                                      
                                                      if (metodosVenta.length > 0) {
                                                        return (
                                                          <div className="space-y-2">
                                                            {metodosVenta.map((metodo, index) => {
                                                              const IconoMetodo = getPaymentIcon(metodo.nombre)
                                                              return (
                                                                <div
                                                                  key={index}
                                                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md border"
                                                                >
                                                                  <div className="flex items-center gap-2">
                                                                    <IconoMetodo size={16} className="text-gray-600" />
                                                                    <span className="font-medium">
                                                                      {metodo.nombre}
                                                                    </span>
                                                                    {metodo.anulado && (
                                                                      <Badge variant="destructive" className="text-xs">
                                                                        Anulado
                                                                      </Badge>
                                                                    )}
                                                                  </div>
                                                                  {metodo.monto && (
                                                                    <span className="font-medium text-orange-600">
                                                                      {formatearPrecio(metodo.monto)}
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              )
                                                            })}
                                                            
                                                            {metodosVenta.length > 1 && (
                                                              <div className="pt-2 border-t">
                                                                <div className="flex justify-between font-medium">
                                                                  <span>Total pagado:</span>
                                                                  <span className="text-orange-600">
                                                                    {formatearPrecio(ventaSeleccionada.total)}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )
                                                      } else {
                                                        return (
                                                          <Badge variant="outline" className="font-normal">
                                                            N/A
                                                          </Badge>
                                                        )
                                                      }
                                                    })()}
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
                                                  {productoSeleccionado && (
                                                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                                      Filtrado por: {productoSeleccionado.nombre}
                                                    </Badge>
                                                  )}
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
                                                            className={`${
                                                              detalle.devueltoParcial ? "bg-blue-50/50" : ""
                                                            } ${
                                                              productoSeleccionado &&
                                                              detalle.producto.id === productoSeleccionado.id
                                                                ? "bg-orange-50 border-l-4 border-orange-400"
                                                                : ""
                                                            }`}
                                                          >
                                                            <TableCell>
                                                              <div>
                                                                <div className="font-medium flex items-center gap-2">
                                                                  {detalle.producto.nombre}
                                                                  {productoSeleccionado &&
                                                                    detalle.producto.id === productoSeleccionado.id && (
                                                                      <Badge className="bg-orange-600 text-white text-xs">
                                                                        Producto filtrado
                                                                      </Badge>
                                                                    )}
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
                                                                      <div className="font-medium">
                                                                        {producto.nombre}
                                                                      </div>
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
                                                                    {formatearPrecio(
                                                                      producto.precio * producto.cantidad,
                                                                    )}
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
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                                      ) : (
                                        <div className="text-center py-8 text-gray-500">
                                          Error al cargar los detalles de la venta
                                        </div>
                                      )}
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

      {/* CORREGIDO: Controles de paginación mejorados */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={isLoading}
      />

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
                    <Loader2 className="h-4 w-4 animate-spin" />
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

export default HistorialVentas