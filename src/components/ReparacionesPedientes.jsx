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
  Ban,
  AlertTriangle,
  CreditCardIcon,
  Info,
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
import { NumericFormat } from "react-number-format"
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

const ReparacionesPendientes = ({ showHeader = true }) => {
  // Estados principales
  const [reparaciones, setReparaciones] = useState([])
  const [filteredReparaciones, setFilteredReparaciones] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [ordenarPor, setOrdenarPor] = useState("fecha-reciente")

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

  // Cargar reparaciones al iniciar
  useEffect(() => {
    cargarReparaciones()
  }, [])

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

  // Efecto para filtrar reparaciones
  useEffect(() => {
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
  }, [reparaciones, searchTerm, filtroEstado, ordenarPor])

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
  const handleMarkAsComplete = async (reparacion) => {
    try {
      setCargandoAccion(true)
      // Obtener la información completa de la reparación
      const reparacionCompleta = await getReparacionById(reparacion.id)
      const reparacionFormateada = adaptReparacionToFrontend(reparacionCompleta)

      setCurrentReparacion(reparacionFormateada)
      setShowCompleteModal(true)
    } catch (error) {
      console.error("Error al obtener detalles de la reparación:", error)
      toast.error("Error al cargar los detalles de la reparación", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Abrir modal para cancelar reparación
  const handleCancelRepair = async (reparacion) => {
    try {
      setCargandoAccion(true)
      // Obtener la información completa de la reparación
      const reparacionCompleta = await getReparacionById(reparacion.id)
      const reparacionFormateada = adaptReparacionToFrontend(reparacionCompleta)

      // Verificar si tiene pagos con cuenta corriente
      const pagosCuentaCorriente = reparacionFormateada.pagos.some((pago) => pago.metodoPago === "cuentaCorriente")
      setHasPagosCuentaCorriente(pagosCuentaCorriente)

      setCurrentReparacion(reparacionFormateada)
      setMotivoCancelacion("")
      setShowCancelModal(true)
    } catch (error) {
      console.error("Error al obtener detalles de la reparación:", error)
      toast.error("Error al cargar los detalles de la reparación", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
  }

  // Abrir modal para editar reparación
  const handleEditRepair = () => {
    if (!currentReparacion) return

    // Inicializar los detalles editados con los actuales
    setDetallesEditados([...currentReparacion.detalles])
    setObservacionTecnico(currentReparacion.notas || "")
    setShowEditModal(true)
  }

  // Agregar un nuevo detalle de reparación
  const agregarDetalleReparacion = () => {
    setDetallesEditados([
      ...detallesEditados,
      {
        id: `temp-${Date.now()}`, // ID temporal para nuevos detalles
        descripcion: "",
        precio: "0",
        completado: false,
      },
    ])
  }

  // Eliminar un detalle de reparación
  const eliminarDetalleReparacion = (index) => {
    if (detallesEditados.length <= 1) {
      toast.error("Debe haber al menos un detalle de reparación", { position: "bottom-right" })
      return
    }

    const nuevosDetalles = [...detallesEditados]
    nuevosDetalles.splice(index, 1)
    setDetallesEditados(nuevosDetalles)
  }

  // Manejar cambios en los detalles de reparación
  const handleDetalleChange = (index, campo, valor) => {
    const nuevosDetalles = [...detallesEditados]
    nuevosDetalles[index][campo] = valor
    setDetallesEditados(nuevosDetalles)
  }

  // Guardar cambios en la reparación
  const guardarCambiosReparacion = async () => {
    // Validar que todos los detalles tengan descripción
    const detallesValidos = detallesEditados.every((detalle) => detalle.descripcion.trim() !== "")
    if (!detallesValidos) {
      toast.error("Todos los detalles deben tener una descripción", { position: "bottom-right" })
      return
    }

    try {
      setGuardandoCambios(true)

      // Preparar datos para enviar al backend
      const datosActualizados = {
        reparaciones: detallesEditados.map((detalle) => {
          const precioConvertido = convertirANumero(detalle.precio)
          return {
            descripcion: detalle.descripcion,
            precio: precioConvertido,
          }
        }),
        notas: observacionTecnico,
      }

      // Enviar al backend
      await updateReparacion(currentReparacion.id, datosActualizados)

      // Recargar la reparación para ver los cambios
      const reparacionActualizada = await getReparacionById(currentReparacion.id)
      const reparacionFormateada = adaptReparacionToFrontend(reparacionActualizada)
      setCurrentReparacion(reparacionFormateada)

      // Recargar todas las reparaciones
      await cargarReparaciones()

      // Cerrar el modal de edición
      setShowEditModal(false)

      toast.success("Reparación actualizada correctamente", { position: "bottom-right" })
    } catch (error) {
      console.error("Error al actualizar la reparación:", error)
      toast.error("Error al actualizar la reparación", { position: "bottom-right" })
    } finally {
      setGuardandoCambios(false)
    }
  }

  // Marcar reparación como completada
  const completeRepair = async () => {
    if (!currentReparacion) return

    try {
      setCargandoAccion(true)
      await updateEstadoReparacion(currentReparacion.id, "terminada")

      toast.success("Reparación marcada como terminada", { position: "bottom-right" })
      setShowCompleteModal(false)

      // Recargar reparaciones
      await cargarReparaciones()
    } catch (error) {
      console.error("Error al marcar como terminada:", error)
      toast.error(error.message || "Error al marcar la reparación como terminada", { position: "bottom-right" })
    } finally {
      setCargandoAccion(false)
    }
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
      await cargarReparaciones()

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
      await cargarReparaciones()

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
      await cargarReparaciones()
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

  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reparaciones Pendientes</h1>
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
        {/* Modificar la sección de filtros para mejorar la vista móvil */}
        {/* Reemplazar el div de filtros actual con esta versión mejorada */}
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  filtroEstado === "todos" ? "bg-orange-600 hover:bg-orange-700" : "border-gray-200 hover:bg-gray-50"
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
        </div>

        {/* Estadísticas rápidas */}
      </div>

      {/* Resumen de totales */}
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
            <h3 className="text-lg font-medium text-gray-700">No hay reparaciones</h3>
            <p className="text-sm text-gray-500">
              No se encontraron reparaciones que coincidan con los criterios de búsqueda
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" ref={cardsContainerRef}>
          <AnimatePresence>
            {filteredReparaciones.map((reparacion) => {
              const estadoColor = estadoColors[reparacion.estado] || estadoColors.pendiente

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
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold text-gray-800">
                              {reparacion.cliente?.nombre}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Tag className="h-3 w-3" />
                            <span>#{reparacion.numeroTicket}</span>
                            <Calendar className="h-3 w-3 ml-2" />
                            <span>{formatearFecha(reparacion.fechaIngreso)}</span>
                          </div>
                        </div>
                        <Badge
                          className={`${estadoColor.badge} text-xs px-2 py-0.5 h-5 flex items-center gap-0.5 font-medium`}
                        >
                          {obtenerNombreEstado(reparacion.estado)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-2 flex-grow">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`${estadoColor.light} p-1.5 rounded-full`}>
                            <Smartphone className={`h-4 w-4 ${estadoColor.text}`} />
                          </div>
                          <span className="text-gray-800 font-medium">
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
                            onClick={() => handleMarkAsComplete(reparacion)}
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

                        {/* Botón de cancelar movido al modal de detalles */}
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
          // Si se está cerrando el modal, actualizar el estado
          if (!open) setShowDetailsModal(false)
        }}
      >
        {/* Modificar el modal de detalles para mejorar la vista móvil */}
        {/* Reemplazar el DialogContent del modal de detalles con esta versión mejorada */}
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 sm:max-w-lg md:max-w-2xl lg:max-w-4xl rounded-xl">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5" /> Detalles de la Reparación
              </DialogTitle>
            </div>
            {currentReparacion && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`${estadoColors[currentReparacion.estado]?.badge || estadoColors.pendiente.badge} flex items-center gap-1 text-xs`}
                >
                  {obtenerNombreEstado(currentReparacion.estado)}
                </Badge>
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
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info" className="text-sm">
                      Información
                    </TabsTrigger>
                    <TabsTrigger value="pagos" className="text-sm">
                      Pagos
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

                      {/* Resumen financiero */}
                      <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                          Resumen Financiero
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                          <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
                            <span className="text-[10px] sm:text-xs text-gray-500 block">Total</span>
                            <span className="text-sm sm:text-lg font-semibold text-orange-600">
                              {formatearPrecio(calcularTotal(currentReparacion))}
                            </span>
                          </div>
                          <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
                            <span className="text-[10px] sm:text-xs text-gray-500 block">Pagado</span>
                            <span className="text-sm sm:text-lg font-semibold text-green-600">
                              {formatearPrecio(calcularTotalPagado(currentReparacion))}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-3">
                          <div className="relative pt-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Progreso de pago</span>
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                                {calcularTotal(currentReparacion) > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (calcularTotalPagado(currentReparacion) / calcularTotal(currentReparacion)) *
                                          100,
                                      ),
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="overflow-hidden h-1.5 sm:h-2 text-xs flex rounded-full bg-gray-100">
                              <div
                                className={`${
                                  currentReparacion.estado === "cancelada"
                                    ? "bg-red-500"
                                    : estaPagadaCompletamente(currentReparacion)
                                      ? "bg-green-500"
                                      : "bg-orange-500"
                                } rounded-full h-1.5 sm:h-2 transition-all duration-500 ease-in-out`}
                                style={{
                                  width: `${
                                    calcularTotal(currentReparacion) > 0
                                      ? Math.min(
                                          100,
                                          (calcularTotalPagado(currentReparacion) / calcularTotal(currentReparacion)) *
                                            100,
                                        )
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t">
                <div className="flex flex-wrap gap-2 justify-center">
                  {/* Botón para cancelar (solo si está pendiente o terminada) */}
                  {(currentReparacion.estado === "pendiente" || currentReparacion.estado === "terminada") && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        setTimeout(() => handleCancelRepair(currentReparacion), 300)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm h-9 sm:h-10"
                    >
                      <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Cancelar Reparación
                    </Button>
                  )}

                  {/* Botón para marcar como completada (solo si está pendiente) */}
                  {currentReparacion.estado === "pendiente" && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        setTimeout(() => handleMarkAsComplete(currentReparacion), 300)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg text-xs sm:text-sm h-9 sm:h-10"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Marcar como Terminada
                    </Button>
                  )}

                  {/* Botón para registrar pago (si tiene saldo pendiente y no está cancelada) */}
                  {calcularSaldoPendiente(currentReparacion) > 0 && currentReparacion.estado !== "cancelada" && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        setTimeout(() => handlePayment(currentReparacion), 300)
                      }}
                      className="bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm h-9 sm:h-10"
                    >
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Registrar Pago
                    </Button>
                  )}

                  {/* Botón para marcar como entregada (solo si está completada y pagada) */}
                  {currentReparacion.estado === "terminada" && calcularSaldoPendiente(currentReparacion) <= 0 && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        setTimeout(() => marcarComoEntregada(currentReparacion.id), 300)
                      }}
                      className="bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm h-9 sm:h-10"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Marcar como Entregada
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          // Si se está cerrando el modal, actualizar el estado
          if (!open) setShowEditModal(false)
        }}
      >
        {/* Modificar el modal de edición para mejorar la vista móvil */}
        {/* Reemplazar el DialogContent del modal de edición con esta versión mejorada */}
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 sm:max-w-lg md:max-w-2xl lg:max-w-4xl rounded-xl">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" /> Editar Reparación
              </DialogTitle>
            </div>
            {currentReparacion && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`${estadoColors[currentReparacion.estado]?.badge || estadoColors.pendiente.badge} flex items-center gap-1 text-xs`}
                >
                  {obtenerNombreEstado(currentReparacion.estado)}
                </Badge>
                <span className="text-xs sm:text-sm">
                  Ticket #{currentReparacion.numeroTicket} - {formatearFecha(currentReparacion.fechaIngreso)}
                </span>
              </div>
            )}
          </DialogHeader>

          <div className="max-h-[calc(70vh-180px)] sm:max-h-[calc(95vh-180px)] overflow-y-auto">
            <div className="p-4 sm:p-6 pt-3 sm:pt-4">
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Wrench className="h-3 w-3 sm:h-4 sm:w-4" /> Editar Detalles de Reparación
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={agregarDetalleReparacion}
                      className="h-6 sm:h-8 text-[10px] sm:text-xs border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg"
                    >
                      <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Agregar
                    </Button>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    {detallesEditados.map((detalle, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-1 sm:gap-2 items-center bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="col-span-7">
                          <Label htmlFor={`descripcion-${index}`} className="sr-only">
                            Descripción
                          </Label>
                          <Input
                            id={`descripcion-${index}`}
                            value={detalle.descripcion}
                            onChange={(e) => handleDetalleChange(index, "descripcion", e.target.value)}
                            placeholder="Descripción de la reparación"
                            className="border-gray-200 rounded-lg focus-visible:ring-orange-500 text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`precio-${index}`} className="sr-only">
                            Precio
                          </Label>
                          <NumericFormat
                            id={`precio-${index}`}
                            value={detalle.precio}
                            onValueChange={(values) => {
                              const { value } = values
                              handleDetalleChange(index, "precio", value)
                            }}
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="$ "
                            decimalScale={2}
                            placeholder="$ 0,00"
                            className="w-full px-3 py-2 border rounded-lg border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarDetalleReparacion(index)}
                            className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 sm:mt-4 flex justify-end">
                    <div className="bg-orange-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-orange-200 text-xs sm:text-sm font-medium text-orange-600">
                      Total:{" "}
                      {formatearPrecio(
                        detallesEditados.reduce((sum, d) => {
                          const precio = convertirANumero(d.precio)
                          return sum + precio
                        }, 0),
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 sm:mb-3">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" /> Observaciones del Técnico
                  </h3>
                  <Textarea
                    value={observacionTecnico}
                    onChange={(e) => setObservacionTecnico(e.target.value)}
                    placeholder="Ingrese observaciones o notas sobre la reparación"
                    className="min-h-[80px] sm:min-h-[120px] border-gray-200 rounded-lg focus-visible:ring-orange-500 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t">
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg text-xs sm:text-sm h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={guardarCambiosReparacion}
                disabled={guardandoCambios}
                className="bg-orange-600 hover:bg-orange-700 rounded-lg text-xs sm:text-sm h-9 sm:h-10"
              >
                {guardandoCambios ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de pago */}
      <Dialog
        open={showPaymentModal}
        onOpenChange={(open) => {
          // Si se está cerrando el modal, actualizar el estado
          if (!open) setShowPaymentModal(false)
        }}
      >
        {/* Modificar el modal de pago para mejorar la vista móvil */}
        {/* Reemplazar el DialogContent del modal de pago con esta versión mejorada */}
        <DialogContent className="max-w-md p-0 rounded-xl">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" /> Registrar Pago
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm">
              Ingrese los detalles del pago para la reparación
            </DialogDescription>
          </DialogHeader>

          {currentReparacion && (
            <div className="max-h-[calc(70vh-180px)] overflow-y-auto">
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm text-gray-500">Cliente:</span>
                      <span className="text-xs sm:text-sm font-medium">{currentReparacion.cliente?.nombre}</span>
                    </div>
                    <div className="flex justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm text-gray-500">Equipo:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {currentReparacion.equipo?.marca} {currentReparacion.equipo?.modelo}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm text-gray-500">Total:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {formatearPrecio(calcularTotal(currentReparacion))}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm text-gray-500">Pagado:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {formatearPrecio(calcularTotalPagado(currentReparacion))}
                      </span>
                    </div>
                    <Separator className="my-1.5 sm:my-2" />
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm font-medium text-orange-600">Saldo pendiente:</span>
                      <span className="text-xs sm:text-sm font-medium text-orange-600">
                        {formatearPrecio(calcularSaldoPendiente(currentReparacion))}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="monto-pago" className="text-xs sm:text-sm text-gray-700">
                        Monto a pagar
                      </Label>
                      <NumericFormat
                        id="monto-pago"
                        value={nuevoPago.monto}
                        onValueChange={(values) => {
                          const { value } = values
                          setNuevoPago({ ...nuevoPago, monto: value })
                        }}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$ "
                        decimalScale={2}
                        placeholder="$ 0,00"
                        className="w-full px-3 py-2 border rounded-lg border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 text-xs sm:text-sm h-8 sm:h-10"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm text-gray-700">Método de pago</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1 sm:mt-2">
                        {metodosPago.map((metodo) => (
                          <div
                            key={metodo.id}
                            onClick={() => setNuevoPago({ ...nuevoPago, metodo_pago: metodo.id })}
                            className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              nuevoPago.metodo_pago === metodo.id
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                            }`}
                          >
                            <div
                              className={`p-1.5 sm:p-2 rounded-full ${
                                nuevoPago.metodo_pago === metodo.id ? "bg-orange-100" : "bg-gray-100"
                              }`}
                            >
                              {metodo.id === "efectivo" && (
                                <Banknote
                                  className={`w-4 h-4 sm:w-5 sm:h-5 ${nuevoPago.metodo_pago === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                />
                              )}
                              {metodo.id === "tarjeta" && (
                                <CreditCard
                                  className={`w-4 h-4 sm:w-5 sm:h-5 ${nuevoPago.metodo_pago === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                />
                              )}
                              {metodo.id === "transferencia" && (
                                <ArrowDownToLine
                                  className={`w-4 h-4 sm:w-5 sm:h-5 ${nuevoPago.metodo_pago === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                />
                              )}
                              {metodo.id === "cuentaCorriente" && (
                                <CreditCardIcon
                                  className={`w-4 h-4 sm:w-5 sm:h-5 ${nuevoPago.metodo_pago === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                />
                              )}
                            </div>
                            <span
                              className={`text-xs sm:text-sm mt-1 font-medium ${nuevoPago.metodo_pago === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                            >
                              {metodo.nombre}
                              {metodo.id === "cuentaCorriente" && !currentReparacion.cliente?.id && (
                                <span className="block text-red-500 text-[8px] sm:text-[10px]">(Requiere cliente)</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Información de cuenta corriente */}
                    {nuevoPago.metodo_pago === "cuentaCorriente" && currentReparacion.cliente?.id && (
                      <div className="mt-2 sm:mt-4 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                        {cargandoCuentaCorriente ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600 mr-2" />
                            <span className="text-xs sm:text-sm text-blue-600">
                              Cargando información de cuenta corriente...
                            </span>
                          </div>
                        ) : cuentaCorriente ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              <h4 className="text-xs sm:text-sm font-medium text-blue-700">
                                Información de Cuenta Corriente
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-500 block">Saldo actual:</span>
                                <span className="font-medium">{formatearPrecio(Number(cuentaCorriente.saldo))}</span>
                              </div>
                              {cuentaCorriente.limite_credito > 0 && (
                                <div>
                                  <span className="text-gray-500 block">Límite de crédito:</span>
                                  <span className="font-medium">{formatearPrecio(cuentaCorriente.limite_credito)}</span>
                                </div>
                              )}
                              <div className="col-span-2">
                                <span className="text-gray-500 block">Saldo proyectado:</span>
                                <span
                                  className={`font-medium ${
                                    cuentaCorriente.limite_credito > 0 &&
                                    Number(cuentaCorriente.saldo) + convertirANumero(nuevoPago.monto) >
                                      cuentaCorriente.limite_credito
                                      ? "text-red-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {formatearPrecio(Number(cuentaCorriente.saldo) + convertirANumero(nuevoPago.monto))}
                                </span>
                              </div>
                            </div>

                            {cuentaCorriente.limite_credito > 0 &&
                              Number(cuentaCorriente.saldo) + convertirANumero(nuevoPago.monto) >
                                cuentaCorriente.limite_credito && (
                                <div className="bg-red-100 p-2 sm:p-3 rounded-lg border border-red-200 mt-2">
                                  <div className="flex items-start gap-1 sm:gap-2">
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] sm:text-xs text-red-700">
                                      El monto excede el límite de crédito del cliente. Considere reducir el monto o
                                      usar otro método de pago.
                                    </p>
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 sm:gap-2 py-2">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                            <span className="text-xs sm:text-sm text-amber-700">
                              El cliente no tiene una cuenta corriente configurada. Se creará una nueva.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t">
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg text-xs sm:text-sm h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSavePago}
                disabled={cargandoAccion}
                className="bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm h-9 sm:h-10"
              >
                {cargandoAccion ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Registrar Pago
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para marcar como completada */}
      <AlertDialog
        open={showCompleteModal}
        onOpenChange={(open) => {
          // Si se está cerrando el modal, actualizar el estado
          if (!open) setShowCompleteModal(false)
        }}
      >
        <AlertDialogContent className="max-w-md rounded-xl">
          <div className="flex justify-between items-center w-full mb-2">
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <CheckCircle className="h-5 w-5" /> Marcar como Terminada
            </AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCompleteModal(false)}
              className="h-8 w-8 rounded-full -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogDescription>
            ¿Está seguro de marcar esta reparación como terminada? Esto indica que el trabajo técnico ha sido
            finalizado.
          </AlertDialogDescription>

          {currentReparacion && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm my-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Cliente:</span>
                <span className="text-sm font-medium">{currentReparacion.cliente?.nombre}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Equipo:</span>
                <span className="text-sm font-medium">
                  {currentReparacion.equipo?.marca} {currentReparacion.equipo?.modelo}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-sm font-medium">{formatearPrecio(calcularTotal(currentReparacion))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Saldo pendiente:</span>
                <span className="text-sm font-medium text-orange-600">
                  {formatearPrecio(calcularSaldoPendiente(currentReparacion))}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowCompleteModal(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={completeRepair}
              disabled={cargandoAccion}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {cargandoAccion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
                </>
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para cancelar reparación */}
      <AlertDialog
        open={showCancelModal}
        onOpenChange={(open) => {
          // Si se está cerrando el modal, actualizar el estado
          if (!open) setShowCancelModal(false)
        }}
      >
        <AlertDialogContent className="max-w-md rounded-xl">
          <div className="flex justify-between items-center w-full mb-2">
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" /> Cancelar Reparación
            </AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCancelModal(false)}
              className="h-8 w-8 rounded-full -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogDescription>
            ¿Está seguro de cancelar esta reparación? Esta acción no se puede deshacer.
          </AlertDialogDescription>

          {currentReparacion && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm my-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Cliente:</span>
                <span className="text-sm font-medium">{currentReparacion.cliente?.nombre}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Equipo:</span>
                <span className="text-sm font-medium">
                  {currentReparacion.equipo?.marca} {currentReparacion.equipo?.modelo}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-sm font-medium">{formatearPrecio(calcularTotal(currentReparacion))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Saldo pendiente:</span>
                <span className="text-sm font-medium text-orange-600">
                  {formatearPrecio(calcularSaldoPendiente(currentReparacion))}
                </span>
              </div>
            </div>
          )}

          {hasPagosCuentaCorriente && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 my-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Atención: Pagos en cuenta corriente</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Esta reparación tiene pagos realizados con cuenta corriente. Al cancelarla, se revertirán los cargos
                    en la cuenta corriente del cliente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="motivo-cancelacion" className="text-gray-700">
                Motivo de cancelación
              </Label>
              <Textarea
                id="motivo-cancelacion"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ingrese el motivo por el cual se cancela esta reparación"
                className="min-h-[80px] border-red-200 focus-visible:ring-red-500 rounded-lg"
              />
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Importante:</p>
                <p>
                  Al cancelar la reparación, el estado cambiará a "Cancelada" y no se podrá modificar ni procesar pagos
                  adicionales.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowCancelModal(false)} className="rounded-lg">
              Volver
            </Button>
            <Button
              onClick={confirmCancelRepair}
              disabled={cargandoAccion}
              className="bg-red-600 hover:bg-red-700 rounded-lg"
            >
              {cargandoAccion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-1" /> Confirmar Cancelación
                </>
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ReparacionesPendientes
