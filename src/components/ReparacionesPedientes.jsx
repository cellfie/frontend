"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "react-toastify"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  User,
  Smartphone,
  Wrench,
  DollarSign,
  X,
  ChevronDown,
  Banknote,
  CreditCard,
  ArrowDownToLine,
  FileText,
  Loader2,
  Eye,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Edit,
  Plus,
  Trash2,
  Save,
  Calendar,
  Tag,
  CreditCardIcon,
  Info,
  MapPin,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Importar servicios
import {
  getReparaciones,
  getReparacionById,
  registrarPagoReparacion,
  updateEstadoReparacion,
  getEstadosReparacion,
  adaptReparacionToFrontend,
  updateReparacion,
  cancelarReparacion,
} from "@/services/reparacionesService"
import { getMetodosPagoReparacion } from "@/services/metodosPagoService"
import { getCuentaCorrienteByCliente } from "@/services/cuentasCorrientesService"
import { descontarRepuestosInventario } from "@/services/repuestosService"
import { useAuth } from "@/context/AuthContext"
import RepuestosSeleccionModal from "./RepuestosSeleccionModal"

const ReparacionesPendientes = ({ showHeader = true }) => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  // Estados principales
  const [reparaciones, setReparaciones] = useState([])
  const [filteredReparaciones, setFilteredReparaciones] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [ordenarPor, setOrdenarPor] = useState("fecha-reciente")
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Estados para modales
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [currentReparacion, setCurrentReparacion] = useState(null)

  // Estado para nuevo pago
  const [nuevoPago, setNuevoPago] = useState({
    monto: "",
    metodo_pago: "efectivo",
  })

  // Estado para cuenta corriente
  const [cuentaCorriente, setCuentaCorriente] = useState(null)
  const [cargandoCuentaCorriente, setCargandoCuentaCorriente] = useState(false)
  const [hasPagosCuentaCorriente, setHasPagosCuentaCorriente] = useState(false)

  const [detallesEditados, setDetallesEditados] = useState([])
  const [observacionTecnico, setObservacionTecnico] = useState("")
  const [guardandoCambios, setGuardandoCambios] = useState(false)

  // Estado para cancelación
  const [motivoCancelacion, setMotivoCancelacion] = useState("")

  // Estado para métodos de pago
  const [metodosPago, setMetodosPago] = useState([])

  // Estado para estados de reparación
  const [estadosReparacion, setEstadosReparacion] = useState([])

  // Estado para indicar carga
  const [cargando, setCargando] = useState(true)
  const [cargandoAccion, setCargandoAccion] = useState(false)

  // Referencia para el contenedor de tarjetas
  const cardsContainerRef = useRef(null)

  // Add state for repuestos modal and selected repuestos
  const [showRepuestosModal, setShowRepuestosModal] = useState(false)
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([])

  // Cargar reparaciones al iniciar - solo si es admin
  useEffect(() => {
    if (isAdmin) {
      cargarReparaciones()
    } else {
      // Si es empleado, inicializar con lista vacía y quitar estado de carga
      setReparaciones([])
      setFilteredReparaciones([])
      setCargando(false)
      cargarDatosIniciales()
    }
  }, [isAdmin])

  // Cargar datos iniciales (métodos de pago y estados)
  const cargarDatosIniciales = async () => {
    try {
      // Cargar métodos de pago
      const metodos = await getMetodosPagoReparacion()
      setMetodosPago(metodos)

      // Cargar estados de reparación
      const estados = getEstadosReparacion()
      setEstadosReparacion(estados)
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
    }
  }

  // Cargar reparaciones
  const cargarReparaciones = async () => {
    try {
      setCargando(true)

      // Cargar reparaciones
      const reparacionesData = await getReparaciones()

      // Procesar cada reparación
      const reparacionesFormateadas = reparacionesData.map((rep) => {
        return adaptReparacionToFrontend(rep)
      })

      setReparaciones(reparacionesFormateadas)

      // Cargar métodos de pago
      const metodos = await getMetodosPagoReparacion()
      setMetodosPago(metodos)

      // Cargar estados de reparación
      const estados = getEstadosReparacion()
      setEstadosReparacion(estados)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast.error("Error al cargar las reparaciones", { position: "bottom-right" })
    } finally {
      setCargando(false)
    }
  }

  // Buscar reparaciones por término de búsqueda (para empleados)
  const buscarReparaciones = async () => {
    if (!searchTerm.trim()) {
      // Si el empleado no ha ingresado búsqueda, mostrar lista vacía
      if (!isAdmin) {
        setFilteredReparaciones([])
        return
      }

      // Si es admin, mostrar todas las reparaciones
      setFilteredReparaciones(reparaciones)
      return
    }

    // Verificar que el término de búsqueda tenga al menos 3 caracteres
    if (!isAdmin && searchTerm.trim().length < 3) {
      setFilteredReparaciones([])
      return
    }

    setCargando(true)
    try {
      const reparacionesData = await getReparaciones()

      // Filtrar por término de búsqueda
      const termino = searchTerm.toLowerCase()
      const reparacionesFiltradas = reparacionesData.filter(
        (rep) =>
          rep.cliente_nombre?.toLowerCase().includes(termino) ||
          rep.id?.toString().toLowerCase().includes(termino) ||
          rep.numero_ticket?.toString().includes(termino) ||
          rep.equipo?.marca?.toLowerCase().includes(termino) ||
          rep.equipo?.modelo?.toLowerCase().includes(termino),
      )

      // Procesar cada reparación
      const reparacionesFormateadas = reparacionesFiltradas.map((rep) => {
        return adaptReparacionToFrontend(rep)
      })

      setFilteredReparaciones(reparacionesFormateadas)
      setBusquedaRealizada(true)
    } catch (error) {
      console.error("Error al buscar reparaciones:", error)
      toast.error("Error al buscar reparaciones", { position: "bottom-right" })
    } finally {
      setCargando(false)
    }
  }

  // Efecto para filtrar reparaciones
  useEffect(() => {
    // Si es empleado y hay búsqueda, realizar búsqueda en el servidor
    if (!isAdmin && searchTerm.trim()) {
      // Verificar que el término de búsqueda tenga al menos 3 caracteres
      if (searchTerm.trim().length >= 3) {
        buscarReparaciones()
      } else {
        setFilteredReparaciones([])
      }
      return
    }

    // Si es empleado y no hay búsqueda, mostrar lista vacía
    if (!isAdmin && !searchTerm.trim()) {
      setFilteredReparaciones([])
      setBusquedaRealizada(false)
      return
    }

    // Para administradores, filtrar la lista completa localmente
    let filtered = [...reparaciones]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (rep) =>
          rep.cliente?.nombre?.toLowerCase().includes(term) ||
          rep.id?.toString().toLowerCase().includes(term) ||
          rep.numeroTicket?.toString().includes(term) ||
          rep.equipo?.marca?.toLowerCase().includes(term) ||
          rep.equipo?.modelo?.toLowerCase().includes(term),
      )
    }

    // Filtrar por estado
    if (filtroEstado !== "todos") {
      filtered = filtered.filter((rep) => rep.estado === filtroEstado)
    }

    // Ordenar resultados
    if (ordenarPor === "fecha-reciente") {
      filtered.sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso))
    } else if (ordenarPor === "fecha-antigua") {
      filtered.sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso))
    } else if (ordenarPor === "nombre-cliente") {
      filtered.sort((a, b) => a.cliente?.nombre?.localeCompare(b.cliente?.nombre))
    } else if (ordenarPor === "saldo-pendiente") {
      filtered.sort((a, b) => calcularSaldoPendiente(b) - calcularSaldoPendiente(a))
    }

    setFilteredReparaciones(filtered)
  }, [reparaciones, searchTerm, filtroEstado, ordenarPor, isAdmin])

  // Manejar la búsqueda para empleados
  const handleBusqueda = (e) => {
    setSearchTerm(e.target.value)

    // Si es empleado y se borra la búsqueda, limpiar resultados
    if (!isAdmin && e.target.value === "") {
      setFilteredReparaciones([])
      setBusquedaRealizada(false)
    }
  }

  // Manejar el envío del formulario de búsqueda para empleados
  const handleSubmitBusqueda = (e) => {
    e.preventDefault()
    if (!isAdmin) {
      buscarReparaciones()
    }
  }

  // Calcular el total de una reparación
  const calcularTotal = (reparacion) => {
    // Si no hay detalles, usar el total almacenado
    if (!reparacion.detalles || reparacion.detalles.length === 0) {
      return Number.parseFloat(reparacion.total) || 0
    }

    // Calcular el total sumando los precios de los detalles
    return reparacion.detalles.reduce((sum, detalle) => {
      const precio = convertirANumero(detalle.precio)
      return sum + precio
    }, 0)
  }

  // Calcular el total pagado
  const calcularTotalPagado = (reparacion) => {
    return Number.parseFloat(reparacion.totalPagado) || 0
  }

  // Calcular el saldo pendiente
  const calcularSaldoPendiente = (reparacion) => {
    const total = calcularTotal(reparacion)
    const pagado = calcularTotalPagado(reparacion)
    return total - pagado
  }

  // Verificar si una reparación está completamente pagada
  const estaPagadaCompletamente = (reparacion) => {
    return calcularSaldoPendiente(reparacion) <= 0
  }

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return ""
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatearHora = (fechaStr) => {
    if (!fechaStr) return ""
    const fecha = new Date(fechaStr)
    return fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatearPrecio = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "$ 0,00"

    // Asegurarse de que el valor sea un número
    let numero = valor

    if (typeof valor === "string") {
      // Eliminar el símbolo de moneda y los separadores de miles, y cambiar la coma por punto para la conversión
      numero = valor.replace(/\$ /g, "").replace(/\./g, "").replace(",", ".")
      numero = Number.parseFloat(numero)
    }

    // Verificar si es un número válido
    if (isNaN(numero)) return "$ 0,00"

    // Formatear el número usando toLocaleString directamente
    return `$ ${numero.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Función para convertir valor formateado a número
  const convertirANumero = (valorFormateado) => {
    if (!valorFormateado) return 0

    // Si es un número, devolverlo directamente
    if (typeof valorFormateado === "number") return valorFormateado

    // Si es un string, quitar el formato
    if (typeof valorFormateado === "string") {
      // Eliminar el símbolo de peso, espacios y cualquier carácter no numérico excepto punto y coma
      let numeroLimpio = valorFormateado.replace(/\$ /g, "").replace(/\s/g, "")

      // Verificar si tiene formato argentino (con puntos como separadores de miles)
      if (numeroLimpio.includes(".") && numeroLimpio.includes(",")) {
        // Eliminar todos los puntos y reemplazar la coma por punto
        numeroLimpio = numeroLimpio.replace(/\./g, "").replace(",", ".")
      } else if (numeroLimpio.includes(",")) {
        // Solo tiene coma como decimal
        numeroLimpio = numeroLimpio.replace(",", ".")
      }

      // Convertir a número
      const numero = Number.parseFloat(numeroLimpio)
      return isNaN(numero) ? 0 : numero
    }

    return 0
  }

  // Función para obtener el estilo del punto de venta
  const getPuntoVentaStyle = (nombrePuntoVenta) => {
    if (!nombrePuntoVenta)
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        border: "border-gray-200",
      }

    const nombre = nombrePuntoVenta.toLowerCase()

    if (nombre.includes("tala")) {
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
      }
    } else if (nombre.includes("trancas")) {
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      }
    } else {
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      }
    }
  }

  // Cargar información de cuenta corriente del cliente
  const cargarCuentaCorriente = async (clienteId) => {
    if (!clienteId) {
      setCuentaCorriente(null)
      return
    }

    try {
      setCargandoCuentaCorriente(true)
      const cuentaData = await getCuentaCorrienteByCliente(clienteId)
      setCuentaCorriente(cuentaData)
    } catch (error) {
      console.error("Error al cargar cuenta corriente:", error)
      setCuentaCorriente(null)
    } finally {
      setCargandoCuentaCorriente(false)
    }
  }

  // Ver detalles de una reparación
  const handleViewDetails = async (reparacion) => {
    try {
      setCargandoAccion(true)
      // Obtener la información completa de la reparación
      const reparacionCompleta = await getReparacionById(reparacion.id)
      const reparacionFormateada = adaptReparacionToFrontend(reparacionCompleta)

      // Si no hay historial de acciones, inicializarlo como un array vacío
      if (!reparacionFormateada.historialAcciones) {
        reparacionFormateada.historialAcciones = []
      }

      setCurrentReparacion(reparacionFormateada)

      // Cargar cuenta corriente si hay cliente
      if (reparacionFormateada.cliente?.id) {
        await cargarCuentaCorriente(reparacionFormateada.cliente.id)
      }

      setShowDetailsModal(true)
    } catch (error) {
      console.error("Error al obtener detalles de la reparación:", error)
      toast.error("Error al cargar los detalles de la reparación", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Abrir modal de pago
  const handlePayment = async (reparacion) => {
    try {
      setCargandoAccion(true)
      // Obtener la información completa de la reparación
      const reparacionCompleta = await getReparacionById(reparacion.id)
      const reparacionFormateada = adaptReparacionToFrontend(reparacionCompleta)

      setCurrentReparacion(reparacionFormateada)
      const saldoPendiente = calcularSaldoPendiente(reparacionFormateada)

      setNuevoPago({
        monto: saldoPendiente.toString(),
        metodo_pago: "efectivo",
      })

      // Cargar cuenta corriente si hay cliente
      if (reparacionFormateada.cliente?.id) {
        await cargarCuentaCorriente(reparacionFormateada.cliente.id)
      }

      setShowPaymentModal(true)
    } catch (error) {
      console.error("Error al obtener detalles de la reparación:", error)
      toast.error("Error al cargar los detalles de la reparación", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Abrir modal para marcar como completada
  // Marcar reparación como completada
  const completeRepair = async () => {
    if (!currentReparacion) return
    setShowRepuestosModal(true)
  }
  const calcularTotalPagadoCuentaCorriente = (reparacion) => {
    if (!reparacion.pagos || reparacion.pagos.length === 0) return 0

    return reparacion.pagos
      .filter((pago) => pago.metodoPago === "cuentaCorriente")
      .reduce((total, pago) => total + Number.parseFloat(pago.monto), 0)
  }

  // Modificar la función confirmCancelRepair
  const confirmCancelRepair = async () => {
    if (!currentReparacion) return

    try {
      setCargandoAccion(true)

      // Calcular el monto total de pagos con cuenta corriente antes de cancelar
      const montoRevertido = calcularTotalPagadoCuentaCorriente(currentReparacion)

      // Usar la función específica para cancelar reparaciones
      const response = await cancelarReparacion(currentReparacion.id, motivoCancelacion)

      toast.success("Reparación cancelada correctamente", { position: "bottom-right" })

      if (hasPagosCuentaCorriente && montoRevertido > 0) {
        toast.info(`Los cargos en cuenta corriente por ${formatearPrecio(montoRevertido)} han sido revertidos`, {
          position: "bottom-right",
        })
      }

      setShowCancelModal(false)

      // Recargar reparaciones
      if (isAdmin) {
        await cargarReparaciones()
      } else {
        await buscarReparaciones()
      }

      // Si hay cliente, recargar su cuenta corriente para ver los cambios
      if (currentReparacion.cliente?.id) {
        await cargarCuentaCorriente(currentReparacion.cliente.id)
      }
    } catch (error) {
      console.error("Error al cancelar la reparación:", error)
      toast.error(error.message || "Error al cancelar la reparación", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Guardar nuevo pago
  const handleSavePago = async () => {
    if (!nuevoPago.monto || convertirANumero(nuevoPago.monto) <= 0) {
      toast.error("Ingrese un monto válido", {
        position: "bottom-right",
      })
      return
    }

    const saldoPendiente = calcularSaldoPendiente(currentReparacion)
    if (convertirANumero(nuevoPago.monto) > saldoPendiente) {
      toast.error(`El monto no puede ser mayor al saldo pendiente (${formatearPrecio(saldoPendiente)})`, {
        position: "bottom-right",
      })
      return
    }

    // Validar cuenta corriente si es el método seleccionado
    if (nuevoPago.metodo_pago === "cuentaCorriente") {
      if (!currentReparacion.cliente?.id) {
        toast.error("No se puede usar cuenta corriente sin un cliente asociado", {
          position: "bottom-right",
        })
        return
      }

      if (!cuentaCorriente) {
        toast.error("El cliente no tiene una cuenta corriente configurada", {
          position: "bottom-right",
        })
        return
      }

      if (!cuentaCorriente.activo) {
        toast.error("La cuenta corriente del cliente está inactiva", {
          position: "bottom-right",
        })
        return
      }

      // Verificar límite de crédito si existe
      if (cuentaCorriente.limite_credito > 0) {
        const montoNuevo = convertirANumero(nuevoPago.monto)
        const nuevoSaldo = Number.parseFloat(cuentaCorriente.saldo) + montoNuevo

        if (nuevoSaldo > cuentaCorriente.limite_credito) {
          toast.error(
            `El pago excede el límite de crédito del cliente (${formatearPrecio(cuentaCorriente.limite_credito)})`,
            {
              position: "bottom-right",
            },
          )
          return
        }
      }
    }

    try {
      setCargandoAccion(true)

      // Enviar al backend
      await registrarPagoReparacion(currentReparacion.id, nuevoPago)

      // Actualizar la lista de reparaciones
      if (isAdmin) {
        await cargarReparaciones()
      } else {
        await buscarReparaciones()
      }

      setShowPaymentModal(false)
      toast.success("Pago registrado correctamente", {
        position: "bottom-right",
      })
    } catch (error) {
      console.error("Error al registrar el pago:", error)
      toast.error(error.message || "Error al registrar el pago", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Marcar como entregada
  const marcarComoEntregada = async (id) => {
    try {
      setCargandoAccion(true)
      await updateEstadoReparacion(id, "entregada")

      toast.success("Reparación marcada como entregada", { position: "bottom-right" })

      // Recargar reparaciones
      if (isAdmin) {
        await cargarReparaciones()
      } else {
        await buscarReparaciones()
      }
    } catch (error) {
      console.error("Error al marcar como entregada:", error)
      toast.error(error.message || "Error al marcar la reparación como entregada", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Obtener el color del estado
  const obtenerColorEstado = (estado) => {
    const estadoObj = estadosReparacion.find((e) => e.id === estado)
    return estadoObj ? estadoObj.color : "bg-gray-500"
  }

  // Obtener el nombre del estado
  const obtenerNombreEstado = (estado) => {
    const estadoObj = estadosReparacion.find((e) => e.id === estado)
    return estadoObj ? estadoObj.nombre : "Desconocido"
  }

  // Estado para reparaciones pendientes
  const [pendientes, setPendientes] = useState(0)

  // Estados para los totales
  const [totalReparaciones, setTotalReparaciones] = useState(0)
  const [totalPagado, setTotalPagado] = useState(0)
  const [totalPendiente, setTotalPendiente] = useState(0)

  // Calcular los totales de las reparaciones filtradas
  const calcularTotales = useCallback(() => {
    let totalRep = 0
    let totalPag = 0
    let totalPen = 0

    filteredReparaciones.forEach((reparacion) => {
      const total = calcularTotal(reparacion)
      const pagado = calcularTotalPagado(reparacion)
      const pendiente = calcularSaldoPendiente(reparacion)

      totalRep += total
      totalPag += pagado
      totalPen += pendiente
    })

    setTotalReparaciones(totalRep)
    setTotalPagado(totalPag)
    setTotalPendiente(totalPen)
  }, [filteredReparaciones])

  // Actualizar el estado de reparaciones pendientes
  useEffect(() => {
    const pendientesCount = reparaciones.filter((r) => r.estado === "pendiente").length
    setPendientes(pendientesCount)
  }, [reparaciones])

  // Calcular totales cuando cambian las reparaciones filtradas
  useEffect(() => {
    calcularTotales()
  }, [filteredReparaciones, calcularTotales])

  // Colores para los estados
  const estadoColors = {
    pendiente: {
      bg: "bg-orange-500",
      text: "text-orange-600",
      border: "border-orange-200",
      light: "bg-orange-50",
      badge: "bg-orange-100 text-orange-800 border-orange-200",
    },
    terminada: {
      bg: "bg-blue-500",
      text: "text-blue-600",
      border: "border-blue-200",
      light: "bg-blue-50",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
    },
    entregada: {
      bg: "bg-green-500",
      text: "text-green-600",
      border: "border-green-200",
      light: "bg-green-50",
      badge: "bg-green-100 text-green-800 border-green-200",
    },
    cancelada: {
      bg: "bg-red-500",
      text: "text-red-600",
      border: "border-red-200",
      light: "bg-red-50",
      badge: "bg-red-100 text-red-800 border-red-200",
    },
  }

  // Add the handleRepuestosConfirm function
  const handleRepuestosConfirm = async (repuestos) => {
    if (!currentReparacion) return

    try {
      setCargandoAccion(true)
      setRepuestosSeleccionados(repuestos)

      // Primero actualizar el estado de la reparación
      await updateEstadoReparacion(currentReparacion.id, "terminada")

      // Si hay repuestos seleccionados, descontar del inventario
      if (repuestos && repuestos.length > 0) {
        // Preparar los datos para la API
        const repuestosData = repuestos.map((repuesto) => ({
          id: repuesto.id,
          punto_venta_id: currentReparacion.puntoVenta?.id,
          cantidad: repuesto.cantidad,
        }))

        // Usar la función del servicio para descontar del inventario
        await descontarRepuestosInventario(currentReparacion.id, repuestosData)
      }

      toast.success("Reparación marcada como terminada", { position: "bottom-right" })

      if (repuestos && repuestos.length > 0) {
        toast.info(`Se han descontado ${repuestos.length} tipos de repuestos del inventario`, {
          position: "bottom-right",
        })
      }

      setShowRepuestosModal(false)
      setShowCompleteModal(false)

      // Recargar reparaciones
      if (isAdmin) {
        await cargarReparaciones()
      } else {
        await buscarReparaciones()
      }
    } catch (error) {
      console.error("Error al marcar como terminada:", error)
      toast.error(error.message || "Error al marcar la reparación como terminada", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  const handleEditRepair = () => {
    if (!currentReparacion) return

    // Inicializar el estado de los detalles editados con los detalles actuales
    setDetallesEditados(currentReparacion.detalles ? currentReparacion.detalles.map((d) => ({ ...d })) : [])

    // Inicializar el estado de la observación del técnico
    setObservacionTecnico(currentReparacion.notas || "")

    // Abrir el modal de edición
    setShowEditModal(true)
  }

  const handleCancelRepair = (reparacion) => {
    if (!reparacion) return

    // Verificar si hay pagos en cuenta corriente
    const tienePagosCuentaCorriente = reparacion.pagos?.some((pago) => pago.metodoPago === "cuentaCorriente") || false
    setHasPagosCuentaCorriente(tienePagosCuentaCorriente)

    // Abrir el modal de cancelación
    setShowCancelModal(true)
  }

  const agregarDetalleReparacion = () => {
    // Agregar un nuevo detalle vacío al estado
    setDetallesEditados([...detallesEditados, { descripcion: "", precio: "" }])
  }

  const handleDetalleChange = (index, field, value) => {
    // Clonar el array de detalles editados
    const nuevosDetalles = [...detallesEditados]

    // Actualizar el campo del detalle en el índice especificado
    nuevosDetalles[index][field] = value

    // Actualizar el estado con el nuevo array de detalles
    setDetallesEditados(nuevosDetalles)
  }

  const eliminarDetalleReparacion = (index) => {
    // Clonar el array de detalles editados
    const nuevosDetalles = [...detallesEditados]

    // Eliminar el detalle en el índice especificado
    nuevosDetalles.splice(index, 1)

    // Actualizar el estado con el nuevo array de detalles
    setDetallesEditados(nuevosDetalles)
  }

  const guardarCambiosReparacion = async () => {
    if (!currentReparacion) return

    try {
      setGuardandoCambios(true)

      // Preparar los datos para enviar al backend
      const detallesParaBackend = detallesEditados.map((detalle) => ({
        descripcion: detalle.descripcion,
        precio: convertirANumero(detalle.precio),
      }))

      const datosActualizados = {
        detalles: detallesParaBackend,
        notas: observacionTecnico,
      }

      // Enviar la petición al backend para actualizar la reparación
      await updateReparacion(currentReparacion.id, datosActualizados)

      toast.success("Reparación actualizada correctamente", { position: "bottom-right" })
      setShowEditModal(false)

      // Recargar reparaciones
      if (isAdmin) {
        await cargarReparaciones()
      } else {
        await buscarReparaciones()
      }

      // Recargar detalles de la reparación
      handleViewDetails(currentReparacion)
    } catch (error) {
      console.error("Error al actualizar la reparación:", error)
      toast.error(error.message || "Error al actualizar la reparación", { position: "bottom-right" })
    } finally {
      setGuardandoCambios(false)
    }
  }

  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? "Gestión de Reparaciones" : "Buscar Reparaciones"}
            </h1>
            <p className="text-gray-500">
              {isAdmin
                ? "Administra todas las reparaciones del sistema"
                : "Busca reparaciones específicas usando el cliente, equipo o número de ticket"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-1 border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col gap-4">
          {isAdmin ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, equipo, número de ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-gray-200 focus-visible:ring-orange-500 rounded-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitBusqueda} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, equipo, número de ticket..."
                  className="pl-9 border-gray-200 focus-visible:ring-orange-500 rounded-lg"
                  value={searchTerm}
                  onChange={handleBusqueda}
                />
              </div>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={searchTerm.trim().length < 3}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </form>
          )}

          {!isAdmin && !searchTerm.trim() && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Ingresa un término de búsqueda</p>
                <p className="text-sm">
                  Debes ingresar al menos 3 caracteres para buscar reparaciones (cliente, equipo, número de ticket).
                </p>
              </div>
            </div>
          )}

          {!isAdmin && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Término de búsqueda demasiado corto</p>
                <p className="text-sm">Ingresa al menos 3 caracteres para realizar la búsqueda.</p>
              </div>
            </div>
          )}

          {/* Filtros - solo para administradores */}
          {isAdmin && (
            <>
              {/* Vista de escritorio para los filtros - se oculta en móvil */}
              <div className="hidden md:flex gap-3 justify-between flex-wrap">
                <Button
                  variant={filtroEstado === "todos" ? "default" : "outline"}
                  onClick={() => setFiltroEstado("todos")}
                  className={
                    filtroEstado === "todos" ? "bg-orange-600 hover:bg-orange-700" : "border-gray-200 hover:bg-gray-50"
                  }
                >
                  Todos
                </Button>
                <Button
                  variant={filtroEstado === "pendiente" ? "default" : "outline"}
                  onClick={() => setFiltroEstado("pendiente")}
                  className={
                    filtroEstado === "pendiente"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-orange-200 text-orange-600 hover:bg-orange-50"
                  }
                >
                  Pendientes
                </Button>
                <Button
                  variant={filtroEstado === "terminada" ? "default" : "outline"}
                  onClick={() => setFiltroEstado("terminada")}
                  className={
                    filtroEstado === "terminada"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "border-blue-200 text-blue-600 hover:bg-blue-50"
                  }
                >
                  Terminadas
                </Button>
                <Button
                  variant={filtroEstado === "entregada" ? "default" : "outline"}
                  onClick={() => setFiltroEstado("entregada")}
                  className={
                    filtroEstado === "entregada"
                      ? "bg-green-500 hover:bg-green-600"
                      : "border-green-200 text-green-600 hover:bg-green-50"
                  }
                >
                  Entregadas
                </Button>
                <Button
                  variant={filtroEstado === "cancelada" ? "default" : "outline"}
                  onClick={() => setFiltroEstado("cancelada")}
                  className={
                    filtroEstado === "cancelada"
                      ? "bg-red-500 hover:bg-red-600"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }
                >
                  Canceladas
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-1 border-gray-200 hover:bg-gray-50 ml-auto"
                  onClick={() => setOrdenarPor(ordenarPor === "fecha-reciente" ? "fecha-antigua" : "fecha-reciente")}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${ordenarPor === "fecha-antigua" ? "rotate-180" : ""}`}
                  />
                  <span className="truncate">Fecha</span>
                </Button>
              </div>

              {/* Vista móvil para los filtros - se muestra solo en móvil */}
              <div className="md:hidden">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Button
                    variant={filtroEstado === "todos" ? "default" : "outline"}
                    onClick={() => setFiltroEstado("todos")}
                    className={`text-xs h-9 px-2 ${
                      filtroEstado === "todos"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtroEstado === "pendiente" ? "default" : "outline"}
                    onClick={() => setFiltroEstado("pendiente")}
                    className={`text-xs h-9 px-2 ${
                      filtroEstado === "pendiente"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "border-orange-200 text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    Pendientes
                  </Button>
                  <Button
                    variant="outline"
                    className="text-xs h-9 px-2 flex items-center justify-center gap-1 border-gray-200 hover:bg-gray-50"
                    onClick={() => setOrdenarPor(ordenarPor === "fecha-reciente" ? "fecha-antigua" : "fecha-reciente")}
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${ordenarPor === "fecha-antigua" ? "rotate-180" : ""}`}
                    />
                    <span className="truncate">Fecha</span>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={filtroEstado === "terminada" ? "default" : "outline"}
                    onClick={() => setFiltroEstado("terminada")}
                    className={`text-xs h-9 px-2 ${
                      filtroEstado === "terminada"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "border-blue-200 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    Terminadas
                  </Button>
                  <Button
                    variant={filtroEstado === "entregada" ? "default" : "outline"}
                    onClick={() => setFiltroEstado("entregada")}
                    className={`text-xs h-9 px-2 ${
                      filtroEstado === "entregada"
                        ? "bg-green-500 hover:bg-green-600"
                        : "border-green-200 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    Entregadas
                  </Button>
                  <Button
                    variant={filtroEstado === "cancelada" ? "default" : "outline"}
                    onClick={() => setFiltroEstado("cancelada")}
                    className={`text-xs h-9 px-2 ${
                      filtroEstado === "cancelada"
                        ? "bg-red-500 hover:bg-red-600"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Canceladas
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resumen de totales - solo para administradores o cuando hay resultados */}
      {(isAdmin || (busquedaRealizada && filteredReparaciones.length > 0)) && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen de Totales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 block">Total Reparaciones</span>
              <span className="text-lg font-semibold text-gray-800">{formatearPrecio(totalReparaciones)}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 block">Total Pagado</span>
              <span className="text-lg font-semibold text-green-600">{formatearPrecio(totalPagado)}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500 block">Total Pendiente</span>
              <span className="text-lg font-semibold text-orange-600">{formatearPrecio(totalPendiente)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reparaciones */}
      {cargando ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
            <h3 className="text-lg font-medium text-gray-700">Cargando reparaciones...</h3>
            <p className="text-sm text-gray-500">Por favor espere mientras se cargan los datos</p>
          </div>
        </div>
      ) : filteredReparaciones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Wrench className="h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700">
              {!isAdmin && !busquedaRealizada ? "Realiza una búsqueda" : "No hay reparaciones"}
            </h3>
            <p className="text-sm text-gray-500">
              {!isAdmin && !busquedaRealizada
                ? "Ingresa un término de búsqueda para encontrar reparaciones"
                : !isAdmin && busquedaRealizada
                  ? `No se encontraron reparaciones que coincidan con "${searchTerm}". Intenta con otro término de búsqueda.`
                  : "No se encontraron reparaciones que coincidan con los criterios de búsqueda"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" ref={cardsContainerRef}>
          <AnimatePresence>
            {filteredReparaciones.map((reparacion) => {
              const estadoColor = estadoColors[reparacion.estado] || estadoColors.pendiente
              const puntoVentaStyle = getPuntoVentaStyle(reparacion.puntoVenta?.nombre)

              return (
                <motion.div
                  key={reparacion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white h-full flex flex-col rounded-xl">
                    <div className={`h-2 w-full ${estadoColor.bg}`}></div>
                    <CardHeader className="p-5 pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base font-semibold text-gray-800 truncate">
                              {reparacion.cliente?.nombre}
                            </CardTitle>
                          </div>

                          {/* Información del ticket y fecha */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Tag className="h-3 w-3 flex-shrink-0" />
                            <span>#{reparacion.numeroTicket}</span>
                            <Calendar className="h-3 w-3 ml-2 flex-shrink-0" />
                            <span>{formatearFecha(reparacion.fechaIngreso)}</span>
                          </div>

                          {/* Punto de venta - Agregado aquí */}
                          {reparacion.puntoVenta?.nombre && (
                            <div className="flex items-center gap-1 mb-2">
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0.5 h-5 flex items-center gap-1 font-medium border ${puntoVentaStyle.border} ${puntoVentaStyle.bg} ${puntoVentaStyle.text}`}
                              >
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{reparacion.puntoVenta.nombre}</span>
                              </Badge>
                            </div>
                          )}
                        </div>

                        <Badge
                          className={`${estadoColor.badge} text-xs px-2 py-0.5 h-5 flex items-center gap-0.5 font-medium flex-shrink-0 ml-2`}
                        >
                          {obtenerNombreEstado(reparacion.estado)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-2 flex-grow">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`${estadoColor.light} p-1.5 rounded-full flex-shrink-0`}>
                            <Smartphone className={`h-4 w-4 ${estadoColor.text}`} />
                          </div>
                          <span className="text-gray-800 font-medium truncate">
                            {reparacion.equipo?.marca} {reparacion.equipo?.modelo}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-medium text-gray-800">
                              {formatearPrecio(calcularTotal(reparacion))}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Pendiente:</span>
                            <span
                              className={
                                calcularSaldoPendiente(reparacion) > 0
                                  ? `${estadoColor.text} font-medium`
                                  : "text-green-600 font-medium"
                              }
                            >
                              {formatearPrecio(calcularSaldoPendiente(reparacion))}
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100">
                              <div
                                className={`${
                                  reparacion.estado === "cancelada"
                                    ? "bg-red-500"
                                    : estaPagadaCompletamente(reparacion)
                                      ? "bg-green-500"
                                      : estadoColor.bg
                                } rounded-full h-2 transition-all duration-500 ease-in-out`}
                                style={{
                                  width: `${
                                    calcularTotal(reparacion) > 0
                                      ? Math.min(
                                          100,
                                          (calcularTotalPagado(reparacion) / calcularTotal(reparacion)) * 100,
                                        )
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-5 pt-0 flex flex-wrap gap-2 justify-between items-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(reparacion)}
                        className={`text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 h-9 rounded-lg`}
                      >
                        <Eye className="h-4 w-4 mr-1.5" /> Detalles
                      </Button>

                      <div className="flex gap-2">
                        {/* Botones de acción según el estado */}
                        {reparacion.estado === "pendiente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentReparacion(reparacion)
                              completeRepair()
                            }}
                            className={`${estadoColors.terminada.border} ${estadoColors.terminada.light} ${estadoColors.terminada.text} hover:bg-blue-100 px-3 h-9 rounded-lg`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" /> Terminar
                          </Button>
                        )}

                        {reparacion.estado === "terminada" && estaPagadaCompletamente(reparacion) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => marcarComoEntregada(reparacion.id)}
                            className={`${estadoColors.entregada.border} ${estadoColors.entregada.light} ${estadoColors.entregada.text} hover:bg-green-100 px-3 h-9 rounded-lg`}
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" /> Entregar
                          </Button>
                        )}

                        {!estaPagadaCompletamente(reparacion) && reparacion.estado !== "cancelada" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePayment(reparacion)}
                            className={`${estadoColors.pendiente.border} ${estadoColors.pendiente.light} ${estadoColors.pendiente.text} hover:bg-orange-100 px-3 h-9 rounded-lg`}
                          >
                            <DollarSign className="h-4 w-4 mr-1.5" /> Pagar
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de detalles */}
      <Dialog
        open={showDetailsModal}
        onOpenChange={(open) => {
          if (!open) setShowDetailsModal(false)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 sm:max-w-lg md:max-w-2xl lg:max-w-4xl rounded-xl">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5" /> Detalles de la Reparación
              </DialogTitle>
            </div>
            {currentReparacion && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  className={`${estadoColors[currentReparacion.estado]?.badge || estadoColors.pendiente.badge} flex items-center gap-1 text-xs`}
                >
                  {obtenerNombreEstado(currentReparacion.estado)}
                </Badge>
                {currentReparacion.puntoVenta?.nombre && (
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 h-5 flex items-center gap-1 font-medium border ${getPuntoVentaStyle(currentReparacion.puntoVenta.nombre).border} ${getPuntoVentaStyle(currentReparacion.puntoVenta.nombre).bg} ${getPuntoVentaStyle(currentReparacion.puntoVenta.nombre).text}`}
                  >
                    <MapPin className="h-3 w-3" />
                    {currentReparacion.puntoVenta.nombre}
                  </Badge>
                )}
                <span className="text-xs sm:text-sm">
                  Ticket #{currentReparacion.numeroTicket} - {formatearFecha(currentReparacion.fechaIngreso)}
                </span>
              </div>
            )}
          </DialogHeader>

          {currentReparacion && (
            <>
              <Tabs defaultValue="info" className="w-full">
                <div className="px-4 sm:px-6 pt-3 border-b">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info" className="text-sm">
                      Información
                    </TabsTrigger>
                    <TabsTrigger value="pagos" className="text-sm">
                      Pagos
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="text-sm">
                      Historial
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="max-h-[calc(70vh-180px)] sm:max-h-[calc(95vh-250px)] overflow-y-auto">
                  <TabsContent value="info" className="p-4 sm:p-6 pt-3 sm:pt-4 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 sm:mb-3">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" /> Datos del Cliente
                          </h3>
                          <div className="space-y-1 sm:space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs sm:text-sm text-gray-500">Nombre:</span>
                              <span className="text-xs sm:text-sm font-medium">
                                {currentReparacion.cliente?.nombre}
                              </span>
                            </div>
                            {currentReparacion.cliente?.dni && (
                              <div className="flex justify-between">
                                <span className="text-xs sm:text-sm text-gray-500">DNI:</span>
                                <span className="text-xs sm:text-sm font-medium">{currentReparacion.cliente.dni}</span>
                              </div>
                            )}
                            {currentReparacion.cliente?.telefono && (
                              <div className="flex justify-between">
                                <span className="text-xs sm:text-sm text-gray-500">Teléfono:</span>
                                <span className="text-xs sm:text-sm font-medium">
                                  {currentReparacion.cliente.telefono}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 sm:mb-3">
                            <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" /> Datos del Equipo
                          </h3>
                          <div className="space-y-1 sm:space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs sm:text-sm text-gray-500">Marca:</span>
                              <span className="text-xs sm:text-sm font-medium">{currentReparacion.equipo?.marca}</span>
                            </div>
                            {currentReparacion.equipo?.modelo && (
                              <div className="flex justify-between">
                                <span className="text-xs sm:text-sm text-gray-500">Modelo:</span>
                                <span className="text-xs sm:text-sm font-medium">
                                  {currentReparacion.equipo.modelo}
                                </span>
                              </div>
                            )}
                            {currentReparacion.equipo?.imei && (
                              <div className="flex justify-between">
                                <span className="text-xs sm:text-sm text-gray-500">IMEI:</span>
                                <span className="text-xs sm:text-sm font-medium">{currentReparacion.equipo.imei}</span>
                              </div>
                            )}
                            {currentReparacion.equipo?.password && (
                              <div className="flex justify-between">
                                <span className="text-xs sm:text-sm text-gray-500">Contraseña:</span>
                                <span className="text-xs sm:text-sm font-medium">
                                  {currentReparacion.equipo.password}
                                </span>
                              </div>
                            )}
                            {currentReparacion.equipo?.descripcion && (
                              <div className="mt-2 sm:mt-3">
                                <span className="text-xs sm:text-sm text-gray-500 block mb-1">Descripción:</span>
                                <p className="text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                                  {currentReparacion.equipo.descripcion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Wrench className="h-3 w-3 sm:h-4 sm:w-4" /> Detalles de Reparación
                            </h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowDetailsModal(false)
                                setTimeout(() => {
                                  handleEditRepair()
                                }, 300)
                              }}
                              className="h-6 sm:h-8 text-[10px] sm:text-xs border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg"
                            >
                              <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Editar
                            </Button>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <table className="w-full text-xs sm:text-sm">
                              <thead className="border-b border-gray-200">
                                <tr>
                                  <th className="text-left pb-1 sm:pb-2 text-gray-600 font-medium">Descripción</th>
                                  <th className="text-right pb-1 sm:pb-2 text-gray-600 font-medium">Precio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentReparacion.detalles?.map((detalle, index) => (
                                  <tr key={index} className="border-b border-gray-200">
                                    <td className="py-1 sm:py-2">{detalle.descripcion}</td>
                                    <td className="text-right py-1 sm:py-2">
                                      {formatearPrecio(Number(detalle.precio))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td className="pt-1 sm:pt-2 font-medium">Total</td>
                                  <td className="text-right pt-1 sm:pt-2 font-medium text-orange-600">
                                    {formatearPrecio(calcularTotal(currentReparacion))}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {currentReparacion.notas && (
                          <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 sm:mb-3">
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4" /> Observaciones del Técnico
                            </h3>
                            <p className="text-xs sm:text-sm bg-gray-50 p-2 sm:p-4 rounded-lg border border-gray-200 leading-relaxed">
                              {currentReparacion.notas}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pagos" className="p-4 sm:p-6 pt-3 sm:pt-4 m-0">
                    <div className="space-y-4 sm:space-y-6">
                      {currentReparacion.pagos && currentReparacion.pagos.length > 0 ? (
                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 sm:mb-3">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> Historial de Pagos
                          </h3>
                          <div className="space-y-1 sm:space-y-2">
                            <table className="w-full text-xs sm:text-sm">
                              <thead className="border-b border-gray-200">
                                <tr>
                                  <th className="text-left pb-1 sm:pb-2 text-gray-600 font-medium">Fecha</th>
                                  <th className="text-left pb-1 sm:pb-2 text-gray-600 font-medium">Método</th>
                                  <th className="text-right pb-1 sm:pb-2 text-gray-600 font-medium">Monto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentReparacion.pagos.map((pago, index) => (
                                  <tr key={index} className="border-b border-gray-200">
                                    <td className="py-1 sm:py-2">{formatearFecha(pago.fechaPago)}</td>
                                    <td className="py-1 sm:py-2">
                                      {pago.metodoPago === "efectivo" && (
                                        <span className="flex items-center">
                                          <Banknote className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-gray-500" /> Efectivo
                                        </span>
                                      )}
                                      {pago.metodoPago === "tarjeta" && (
                                        <span className="flex items-center">
                                          <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-gray-500" />{" "}
                                          Tarjeta
                                        </span>
                                      )}
                                      {pago.metodoPago === "transferencia" && (
                                        <span className="flex items-center">
                                          <ArrowDownToLine className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-gray-500" />{" "}
                                          Transferencia
                                        </span>
                                      )}
                                      {pago.metodoPago === "cuentaCorriente" && (
                                        <span className="flex items-center">
                                          <CreditCardIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-gray-500" />{" "}
                                          Cuenta Corriente
                                        </span>
                                      )}
                                    </td>
                                    <td className="text-right py-1 sm:py-2 font-medium">
                                      {formatearPrecio(Number(pago.monto))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan="2" className="pt-1 sm:pt-2 font-medium">
                                    Total pagado
                                  </td>
                                  <td className="text-right pt-1 sm:pt-2 font-medium text-green-600">
                                    {formatearPrecio(calcularTotalPagado(currentReparacion))}
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="2" className="pt-0.5 sm:pt-1 font-medium">
                                    Saldo pendiente
                                  </td>
                                  <td className="text-right pt-0.5 sm:pt-1 font-medium text-orange-600">
                                    {formatearPrecio(calcularSaldoPendiente(currentReparacion))}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm text-center">
                          <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-2" />
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500">No hay pagos registrados</h3>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                              Esta reparación aún no tiene pagos registrados
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="historial" className="p-4 sm:p-6 pt-3 sm:pt-4 m-0">
                    <div className="space-y-4 sm:space-y-6">
                      {currentReparacion.historialAcciones && currentReparacion.historialAcciones.length > 0 ? (
                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 sm:mb-3">
                            <Info className="h-3 w-3 sm:h-4 sm:w-4" /> Historial de Acciones
                          </h3>
                          <div className="space-y-1 sm:space-y-2">
                            <table className="w-full text-xs sm:text-sm">
                              <thead className="border-b border-gray-200">
                                <tr>
                                  <th className="text-left pb-1 sm:pb-2 text-gray-600 font-medium">Fecha</th>
                                  <th className="text-left pb-1 sm:pb-2 text-gray-600 font-medium">Acción</th>
                                  <th className="text-left pb-1 sm:pb-2 text-gray-600 font-medium">Usuario</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentReparacion.historialAcciones.map((accion, index) => (
                                  <tr key={index} className="border-b border-gray-200">
                                    <td className="py-1 sm:py-2">{formatearFecha(accion.fecha)}</td>
                                    <td className="py-1 sm:py-2">{accion.accion}</td>
                                    <td className="py-1 sm:py-2">{accion.usuario}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm text-center">
                          <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                            <Info className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-2" />
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                              No hay historial registrado
                            </h3>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                              No se han realizado acciones en esta reparación
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>

                <CardFooter className="flex justify-end items-center p-4 sm:p-6 border-t">
                  <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                    Cerrar
                  </Button>
                </CardFooter>
              </Tabs>
            </>
          )}

          {cargandoAccion && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de pago */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => setShowPaymentModal(open)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>Ingrese el monto del pago y seleccione el método de pago.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">
                Monto
              </Label>
              <div className="col-span-3">
                <Input
                  id="monto"
                  type="text"
                  value={nuevoPago.monto}
                  onChange={(e) => {
                    // Permitir solo números y la coma como separador decimal
                    const value = e.target.value.replace(/[^0-9,]/g, "")

                    // Asegurarse de que solo haya una coma
                    const comaCount = (value.match(/,/g) || []).length
                    if (comaCount > 1) return

                    setNuevoPago({ ...nuevoPago, monto: value })
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="metodo_pago" className="text-right">
                Método de Pago
              </Label>
              <div className="col-span-3">
                <select
                  id="metodo_pago"
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={nuevoPago.metodo_pago}
                  onChange={(e) => setNuevoPago({ ...nuevoPago, metodo_pago: e.target.value })}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  {currentReparacion?.cliente?.id && cuentaCorriente?.activo && (
                    <option value="cuentaCorriente">Cuenta Corriente</option>
                  )}
                </select>
              </div>
            </div>

            {nuevoPago.metodo_pago === "cuentaCorriente" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Pago con Cuenta Corriente</p>
                  {cargandoCuentaCorriente ? (
                    <p className="text-sm">Cargando información...</p>
                  ) : cuentaCorriente ? (
                    <>
                      <p className="text-sm">Saldo actual: {formatearPrecio(cuentaCorriente.saldo)}</p>
                      {cuentaCorriente.limite_credito > 0 && (
                        <p className="text-sm">Límite de crédito: {formatearPrecio(cuentaCorriente.limite_credito)}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm">No se pudo cargar la información de la cuenta corriente.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSavePago} disabled={cargandoAccion}>
              {cargandoAccion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Pago"
              )}
            </Button>
          </CardFooter>

          {cargandoAccion && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para marcar como completada */}
      <AlertDialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <AlertDialogContent className="max-w-md rounded-xl">
          <AlertDialogTitle>Marcar como Terminada</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro de que desea marcar esta reparación como terminada?
          </AlertDialogDescription>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCompleteModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={completeRepair} disabled={cargandoAccion}>
              {cargandoAccion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </CardFooter>

          {cargandoAccion && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de edición de reparación */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Editar Reparación</DialogTitle>
            <DialogDescription>
              Modifique los detalles de la reparación y las observaciones del técnico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <h3 className="text-sm font-medium text-gray-700">Detalles de la Reparación</h3>
            <div className="space-y-3">
              {detallesEditados.map((detalle, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 items-center">
                  <Input
                    type="text"
                    placeholder="Descripción"
                    value={detalle.descripcion}
                    onChange={(e) => handleDetalleChange(index, "descripcion", e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Precio"
                      value={detalle.precio}
                      onChange={(e) => {
                        // Permitir solo números y la coma como separador decimal
                        const value = e.target.value.replace(/[^0-9,]/g, "")

                        // Asegurarse de que solo haya una coma
                        const comaCount = (value.match(/,/g) || []).length
                        if (comaCount > 1) return

                        handleDetalleChange(index, "precio", value)
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => eliminarDetalleReparacion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={agregarDetalleReparacion}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Detalle
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="observacion_tecnico">Observaciones del Técnico</Label>
              <Textarea
                id="observacion_tecnico"
                placeholder="Ingrese las observaciones del técnico"
                value={observacionTecnico}
                onChange={(e) => setObservacionTecnico(e.target.value)}
              />
            </div>
          </div>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardarCambiosReparacion} disabled={guardandoCambios}>
              {guardandoCambios ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>

          {guardandoCambios && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para cancelar reparación */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent className="max-w-md rounded-xl">
          <AlertDialogTitle>Cancelar Reparación</AlertDialogTitle>
          <AlertDialogDescription>
            {hasPagosCuentaCorriente
              ? "¿Está seguro de que desea cancelar esta reparación? Se revertirán los cargos en cuenta corriente."
              : "¿Está seguro de que desea cancelar esta reparación?"}
          </AlertDialogDescription>

          <div className="grid gap-4 py-4">
            <Label htmlFor="motivo_cancelacion">Motivo de Cancelación</Label>
            <Textarea
              id="motivo_cancelacion"
              placeholder="Ingrese el motivo de la cancelación"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
            />
          </div>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmCancelRepair} disabled={cargandoAccion}>
              {cargandoAccion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelación"
              )}
            </Button>
          </CardFooter>

          {cargandoAccion && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Repuestos Modal */}
      <RepuestosSeleccionModal
        open={showRepuestosModal}
        onOpenChange={setShowRepuestosModal}
        onConfirm={handleRepuestosConfirm}
        reparacionId={currentReparacion?.id}
        puntoVentaId={currentReparacion?.puntoVenta?.id}
      />
    </div>
  )
}

export default ReparacionesPendientes
