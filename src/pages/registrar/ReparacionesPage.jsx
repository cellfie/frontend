"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactTooltip from "react-tooltip"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { NumericFormat } from "react-number-format"
import {
  Smartphone,
  User,
  Wrench,
  DollarSign,
  Printer,
  Plus,
  Trash2,
  ArrowRight,
  CreditCardIcon as Card,
  CheckCircle,
  ArrowLeft,
  Receipt,
  PenToolIcon as Tool,
  Banknote,
  ArrowDownToLine,
  Search,
  Loader2,
  UserPlus,
  X,
  AlertCircle,
  MapPin,
  Package,
  PlusCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card as CardUI, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Importar servicios
import { createReparacion, getPuntosVenta } from "@/services/reparacionesService"
import { searchClientes, createCliente } from "@/services/clientesService"
import { getMetodosPagoReparacion } from "@/services/metodosPagoService"
import { printTicket } from "@/services/ticketPrinterService"
import { getCuentaCorrienteByCliente } from "@/services/cuentasCorrientesService"
import { searchRepuestos } from "@/services/repuestosService"

// Importar componentes
import TicketThermal from "@/components/tickets/TicketThermal"

const ReparacionesPage = () => {
  // Estado para los datos del cliente
  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    dni: "",
    id: null,
  })

  // Estado para los datos del equipo
  const [equipo, setEquipo] = useState({
    marca: "",
    modelo: "",
    password: "",
    imei: "",
    descripcion: "",
  })

  // Estado para las reparaciones
  const [reparaciones, setReparaciones] = useState([{ descripcion: "", precio: "" }])

  // Estado para el pago
  const [pago, setPago] = useState({
    realizaPago: false,
    monto: "",
    metodo: "efectivo",
  })

  // Estado para la cuenta corriente
  const [cuentaCorriente, setCuentaCorriente] = useState(null)
  const [verificandoCuenta, setVerificandoCuenta] = useState(false)

  // Estado para el paso actual del formulario
  const [pasoActual, setPasoActual] = useState(1)

  // Estado para mostrar el ticket
  const [mostrarTicket, setMostrarTicket] = useState(false)

  // Estado para controlar si la reparación ya fue registrada
  const [reparacionRegistrada, setReparacionRegistrada] = useState(false)

  // Estado para el número de ticket
  const [numeroTicket, setNumeroTicket] = useState(null)

  // Estado para la búsqueda de clientes
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [mostrarResultadosBusqueda, setMostrarResultadosBusqueda] = useState(false)

  // Estado para mostrar el formulario de nuevo cliente
  const [mostrarFormNuevoCliente, setMostrarFormNuevoCliente] = useState(false)

  // Estado para el nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    dni: "",
  })

  // Estado para indicar si se realizó una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Estado para los métodos de pago
  const [metodosPago, setMetodosPago] = useState([])

  // Estado para indicar carga
  const [cargando, setCargando] = useState(false)

  // Estado para los puntos de venta
  const [puntosVenta, setPuntosVenta] = useState([])
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState("")
  const [cargandoPuntosVenta, setCargandoPuntosVenta] = useState(false)

  // Estados para el modal de repuestos
  const [showRepuestosModal, setShowRepuestosModal] = useState(false)
  const [repuestos, setRepuestos] = useState([])
  const [filteredRepuestos, setFilteredRepuestos] = useState([])
  const [searchRepuestoTerm, setSearchRepuestoTerm] = useState("")
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false)
  const [repuestoSeleccionadoIndex, setRepuestoSeleccionadoIndex] = useState(null)

  // Referencia para imprimir
  const ticketRef = useRef()

  // Referencia para el input de búsqueda
  const searchInputRef = useRef(null)

  // Fecha actual
  const fechaActual = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  // Hora actual
  const horaActual = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Función para formatear precios en formato de pesos argentinos
  const formatearPrecio = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "$ 0,00"

    let numero = valor

    if (typeof valor === "string") {
      numero = Number.parseFloat(valor.replace(/\$ /g, "").replace(/\./g, "").replace(",", "."))
    }

    if (isNaN(numero)) return "$ 0,00"

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numero)
  }

  // Función para convertir valor formateado a número
  const convertirANumero = (valorFormateado) => {
    if (!valorFormateado) return 0

    if (typeof valorFormateado === "string") {
      const numeroLimpio = valorFormateado.replace(/\$ /g, "").replace(/\./g, "").replace(",", ".")
      return Number.parseFloat(numeroLimpio)
    }

    return Number.parseFloat(valorFormateado)
  }

  // Cargar métodos de pago y puntos de venta al iniciar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const metodos = await getMetodosPagoReparacion()

        const tieneCuentaCorriente = metodos.some((m) => m.id === "cuentaCorriente")
        if (!tieneCuentaCorriente) {
          metodos.push({ id: "cuentaCorriente", nombre: "Cuenta Corriente" })
        }

        setMetodosPago(metodos)

        setCargandoPuntosVenta(true)
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)

        if (puntos.length > 0) {
          setPuntoVentaSeleccionado(puntos[1].id.toString())
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales", { position: "bottom-right" })
      } finally {
        setCargandoPuntosVenta(false)
      }
    }

    cargarDatosIniciales()
  }, [])

  // Efecto para verificar la cuenta corriente cuando se selecciona como método de pago
  useEffect(() => {
    const verificarCuentaCorriente = async () => {
      if (pago.metodo === "cuentaCorriente" && cliente.id) {
        setVerificandoCuenta(true)
        try {
          const cuentaData = await getCuentaCorrienteByCliente(cliente.id)
          if (cuentaData) {
            cuentaData.saldo = Number(cuentaData.saldo)
            cuentaData.limiteCredito = Number(cuentaData.limiteCredito)
          }
          setCuentaCorriente(cuentaData)
        } catch (error) {
          console.error("Error al verificar cuenta corriente:", error)
          setCuentaCorriente(null)
          toast.error("Error al verificar la cuenta corriente del cliente", { position: "bottom-right" })
        } finally {
          setVerificandoCuenta(false)
        }
      } else if (pago.metodo !== "cuentaCorriente") {
        setCuentaCorriente(null)
      }
    }

    verificarCuentaCorriente()
  }, [pago.metodo, cliente.id])

  // Efecto para buscar clientes cuando cambia la búsqueda
  useEffect(() => {
    if (cliente.id !== null) {
      return
    }

    const buscarClientes = async () => {
      if (busquedaCliente.length < 2) {
        setClientesEncontrados([])
        setMostrarResultadosBusqueda(false)
        setBusquedaRealizada(false)
        return
      }

      setBuscandoClientes(true)
      try {
        const resultados = await searchClientes(busquedaCliente)
        setClientesEncontrados(resultados)
        setMostrarResultadosBusqueda(true)
        setBusquedaRealizada(true)
      } catch (error) {
        console.error("Error al buscar clientes:", error)
        toast.error("Error al buscar clientes", { position: "bottom-right" })
      } finally {
        setBuscandoClientes(false)
      }
    }

    const timeoutId = setTimeout(() => {
      if (busquedaCliente.length >= 2) {
        buscarClientes()
      } else if (busquedaCliente.length === 0) {
        setClientesEncontrados([])
        setMostrarResultadosBusqueda(false)
        setBusquedaRealizada(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [busquedaCliente, cliente.id])

  // Efecto para buscar repuestos cuando cambia el término de búsqueda
  useEffect(() => {
    const buscarRepuestos = async () => {
      if (searchRepuestoTerm.length < 2) {
        setFilteredRepuestos(repuestos)
        return
      }

      try {
        const resultados = await searchRepuestos({
          query: searchRepuestoTerm,
          punto_venta_id: puntoVentaSeleccionado,
        })
        setFilteredRepuestos(resultados)
      } catch (error) {
        console.error("Error al buscar repuestos:", error)
        toast.error("Error al buscar repuestos", { position: "bottom-right" })
      }
    }

    const timeoutId = setTimeout(() => {
      if (showRepuestosModal) {
        buscarRepuestos()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchRepuestoTerm, showRepuestosModal, repuestos, puntoVentaSeleccionado])

  // Cargar repuestos cuando se abre el modal
  const handleOpenRepuestosModal = async (index) => {
    if (!puntoVentaSeleccionado) {
      toast.error("Debe seleccionar un punto de venta primero", { position: "bottom-right" })
      return
    }

    setRepuestoSeleccionadoIndex(index)
    setCargandoRepuestos(true)
    setSearchRepuestoTerm("")

    try {
      // Filtrar repuestos por punto de venta seleccionado
      const data = await searchRepuestos({
        punto_venta_id: puntoVentaSeleccionado,
      })
      setRepuestos(data)
      setFilteredRepuestos(data)
      setShowRepuestosModal(true)
    } catch (error) {
      console.error("Error al cargar repuestos:", error)
      toast.error("Error al cargar repuestos", { position: "bottom-right" })
    } finally {
      setCargandoRepuestos(false)
    }
  }

  // Seleccionar un repuesto y agregarlo a la reparación
  const seleccionarRepuesto = (repuesto) => {
    if (repuestoSeleccionadoIndex === null) return

    // Verificar que el repuesto pertenece al punto de venta seleccionado
    if (repuesto.punto_venta_id?.toString() !== puntoVentaSeleccionado) {
      toast.error("Este repuesto no pertenece al punto de venta seleccionado", {
        position: "bottom-right",
      })
      return
    }

    const nuevasReparaciones = [...reparaciones]
    nuevasReparaciones[repuestoSeleccionadoIndex] = {
      descripcion: `${repuesto.nombre}${repuesto.descripcion ? ` - ${repuesto.descripcion}` : ""}`,
      precio: repuesto.precio || 0,
    }

    setReparaciones(nuevasReparaciones)
    setShowRepuestosModal(false)

    toast.success(`Repuesto "${repuesto.nombre}" agregado con precio ${formatearPrecio(repuesto.precio)}`, {
      position: "bottom-right",
    })
  }

  // Calcular el total de las reparaciones
  const calcularTotal = () => {
    return reparaciones.reduce((total, rep) => {
      return total + convertirANumero(rep.precio)
    }, 0)
  }

  // Manejar cambios en la búsqueda de clientes
  const handleBusquedaChange = (e) => {
    const { value } = e.target
    setBusquedaCliente(value)

    if (value === "") {
      setBusquedaRealizada(false)
      setMostrarFormNuevoCliente(false)
    }
  }

  // Manejar cambios en el formulario de nuevo cliente
  const handleNuevoClienteChange = (e) => {
    const { name, value } = e.target
    setNuevoCliente((prev) => ({ ...prev, [name]: value }))
  }

  // Seleccionar un cliente de los resultados de búsqueda
  const seleccionarCliente = (clienteSeleccionado) => {
    setCliente({
      id: clienteSeleccionado.id,
      nombre: clienteSeleccionado.nombre,
      telefono: clienteSeleccionado.telefono || "",
      dni: clienteSeleccionado.dni || "",
    })
    setBusquedaCliente(clienteSeleccionado.nombre)
    setMostrarResultadosBusqueda(false)
    setMostrarFormNuevoCliente(false)
    setBusquedaRealizada(false)
    setClientesEncontrados([])

    if (pago.metodo === "cuentaCorriente") {
      verificarCuentaCorriente(clienteSeleccionado.id)
    }

    toast.success("Cliente seleccionado correctamente", { position: "bottom-right" })
  }

  // Verificar la cuenta corriente de un cliente
  const verificarCuentaCorriente = async (clienteId) => {
    setVerificandoCuenta(true)
    try {
      const cuentaData = await getCuentaCorrienteByCliente(clienteId)
      if (cuentaData) {
        cuentaData.saldo = Number(cuentaData.saldo)
        cuentaData.limiteCredito = Number(cuentaData.limiteCredito)
      }
      setCuentaCorriente(cuentaData)
    } catch (error) {
      console.error("Error al verificar cuenta corriente:", error)
      setCuentaCorriente(null)
    } finally {
      setVerificandoCuenta(false)
    }
  }

  // Mostrar formulario para agregar nuevo cliente
  const mostrarAgregarCliente = () => {
    setMostrarFormNuevoCliente(true)
    setNuevoCliente({
      nombre: busquedaCliente,
      telefono: "",
      dni: "",
    })
    setMostrarResultadosBusqueda(false)
  }

  // Cancelar la adición de un nuevo cliente
  const cancelarNuevoCliente = () => {
    setMostrarFormNuevoCliente(false)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Guardar nuevo cliente
  const guardarNuevoCliente = async () => {
    if (!nuevoCliente.nombre) {
      toast.error("El nombre del cliente es obligatorio", { position: "bottom-right" })
      return
    }

    setCargando(true)
    try {
      const clienteCreado = await createCliente({
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono || null,
        dni: nuevoCliente.dni || null,
      })

      setCliente({
        id: clienteCreado.id,
        nombre: clienteCreado.nombre,
        telefono: clienteCreado.telefono || "",
        dni: clienteCreado.dni || "",
      })

      setBusquedaCliente(clienteCreado.nombre)
      setMostrarFormNuevoCliente(false)
      setBusquedaRealizada(false)

      if (pago.metodo === "cuentaCorriente") {
        verificarCuentaCorriente(clienteCreado.id)
      }

      toast.success("Cliente creado correctamente", { position: "bottom-right" })
    } catch (error) {
      console.error("Error al crear cliente:", error)
      toast.error("Error al crear el cliente", { position: "bottom-right" })
    } finally {
      setCargando(false)
    }
  }

  // Limpiar la selección de cliente
  const limpiarSeleccionCliente = () => {
    setCliente({
      id: null,
      nombre: "",
      telefono: "",
      dni: "",
    })
    setBusquedaCliente("")
    setBusquedaRealizada(false)
    setMostrarFormNuevoCliente(false)
    setClientesEncontrados([])
    setMostrarResultadosBusqueda(false)
    setCuentaCorriente(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Manejar cambios en los datos del equipo
  const handleEquipoChange = (e) => {
    const { name, value } = e.target
    setEquipo((prev) => ({ ...prev, [name]: value }))
  }

  // Manejar cambios en las reparaciones
  const handleReparacionChange = (index, field, value) => {
    const nuevasReparaciones = [...reparaciones]
    nuevasReparaciones[index][field] = value
    setReparaciones(nuevasReparaciones)
  }

  // Agregar una nueva reparación
  const agregarReparacion = () => {
    setReparaciones([...reparaciones, { descripcion: "", precio: "" }])
  }

  // Eliminar una reparación
  const eliminarReparacion = (index) => {
    if (reparaciones.length > 1) {
      const nuevasReparaciones = reparaciones.filter((_, i) => i !== index)
      setReparaciones(nuevasReparaciones)
    } else {
      toast.error("Debe haber al menos una reparación", { position: "bottom-right" })
    }
  }

  // Manejar el método de pago
  const handleMetodoPago = (value) => {
    setPago((prev) => ({ ...prev, metodo: value }))
  }

  // Avanzar al siguiente paso
  const avanzarPaso = () => {
    if (pasoActual === 1) {
      if (!cliente.id && !mostrarFormNuevoCliente) {
        if (!busquedaCliente) {
          toast.error("Por favor busque y seleccione un cliente o cree uno nuevo", { position: "bottom-right" })
          return
        } else {
          mostrarAgregarCliente()
          return
        }
      } else if (mostrarFormNuevoCliente && !nuevoCliente.nombre) {
        toast.error("Por favor ingrese el nombre del cliente", { position: "bottom-right" })
        return
      }

      if (!puntoVentaSeleccionado) {
        toast.error("Por favor seleccione un punto de venta", { position: "bottom-right" })
        return
      }
    } else if (pasoActual === 2) {
      if (!equipo.marca) {
        toast.error("Por favor ingrese la marca del equipo", { position: "bottom-right" })
        return
      }
    } else if (pasoActual === 3) {
      const reparacionesValidas = reparaciones.every((rep) => rep.descripcion)
      if (!reparacionesValidas) {
        toast.error("Por favor complete la descripción de todas las reparaciones", { position: "bottom-right" })
        return
      }
    }

    if (pasoActual < 4) {
      setPasoActual(pasoActual + 1)
    }
  }

  // Retroceder al paso anterior
  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1)
    }
  }

  // Preparar el ticket
  const prepararTicket = () => {
    const total = calcularTotal()

    if (total > 0 && pago.realizaPago && (!pago.monto || convertirANumero(pago.monto) <= 0)) {
      toast.error("Debe ingresar un monto de pago mayor a 0", { position: "bottom-right" })
      return
    }

    if (pago.realizaPago && convertirANumero(pago.monto) > total) {
      toast.error("El monto de pago no puede ser mayor al total", { position: "bottom-right" })
      return
    }

    if (pago.realizaPago && pago.metodo === "cuentaCorriente" && !cliente.id) {
      toast.error("Debe seleccionar un cliente para usar cuenta corriente", { position: "bottom-right" })
      return
    }

    if (pago.realizaPago && pago.metodo === "cuentaCorriente") {
      if (!cuentaCorriente) {
        toast.error("El cliente no tiene una cuenta corriente configurada", { position: "bottom-right" })
        return
      }

      if (!cuentaCorriente.activo) {
        toast.error("La cuenta corriente del cliente está inactiva", { position: "bottom-right" })
        return
      }

      const montoTotal = convertirANumero(pago.monto)
      const nuevoSaldo = cuentaCorriente.saldo + montoTotal

      if (cuentaCorriente.limiteCredito > 0 && nuevoSaldo > cuentaCorriente.limiteCredito) {
        toast.error(
          `El monto excede el límite de crédito del cliente (${formatearPrecio(cuentaCorriente.limiteCredito)})`,
          { position: "bottom-right" },
        )
        return
      }
    }

    setMostrarTicket(true)
  }

  // Registrar la reparación en el backend
  const registrarReparacion = async () => {
    setCargando(true)

    try {
      const datosReparacion = {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono || null,
          dni: cliente.dni || null,
        },
        equipo: {
          marca: equipo.marca,
          modelo: equipo.modelo || null,
          imei: equipo.imei || null,
          password: equipo.password || null,
          descripcion: equipo.descripcion || null,
        },
        reparaciones: reparaciones.map((rep) => ({
          descripcion: rep.descripcion,
          precio: convertirANumero(rep.precio) || 0,
        })),
        pago: pago.realizaPago
          ? {
              realizaPago: true,
              monto: convertirANumero(pago.monto),
              metodo: pago.metodo,
              referencia_tipo: pago.metodo === "cuentaCorriente" ? "reparacion" : null,
            }
          : null,
        notas: "",
        punto_venta_id: Number(puntoVentaSeleccionado),
      }

      const respuesta = await createReparacion(datosReparacion)

      setNumeroTicket(respuesta.numero_ticket)
      setReparacionRegistrada(true)

      return respuesta
    } catch (error) {
      console.error("Error al registrar la reparación:", error)
      toast.error(error.message || "Error al registrar la reparación", { position: "bottom-right" })
      throw error
    } finally {
      setCargando(false)
    }
  }

  // Obtener el nombre del método de pago
  const obtenerNombreMetodoPago = (metodo) => {
    const metodoPago = metodosPago.find((m) => m.id === metodo)
    return metodoPago ? metodoPago.nombre : "Desconocido"
  }

  // Obtener el nombre del punto de venta
  const obtenerNombrePuntoVenta = (id) => {
    if (!id) return "No seleccionado"
    const puntoVenta = puntosVenta.find((p) => p.id.toString() === id.toString())
    return puntoVenta ? puntoVenta.nombre : "Desconocido"
  }

  // Función para imprimir usando el servicio de impresión
  const handlePrintTicket = async () => {
    try {
      setCargando(true)

      let ticketNumber = numeroTicket

      if (!reparacionRegistrada) {
        const respuesta = await registrarReparacion()
        ticketNumber = respuesta.numero_ticket
        setNumeroTicket(respuesta.numero_ticket)
      } else {
        toast.success("Ticket enviado a la impresora", { position: "bottom-right" })
      }

      const ticketData = {
        numeroTicket: ticketNumber,
        fechaActual,
        horaActual,
        cliente,
        equipo,
        puntoVenta: {
          id: puntoVentaSeleccionado,
          nombre: obtenerNombrePuntoVenta(puntoVentaSeleccionado),
        },
        total: calcularTotal(),
        pago: pago.realizaPago
          ? {
              ...pago,
              nombreMetodo: obtenerNombreMetodoPago(pago.metodo),
            }
          : null,
      }

      await printTicket(ticketData)
    } catch (error) {
      console.error("Error al imprimir ticket:", error)
      toast.error("Error al imprimir ticket", { position: "bottom-right" })
    } finally {
      setCargando(false)
    }
  }

  // Reiniciar el formulario
  const reiniciarFormulario = () => {
    setMostrarTicket(false)
    setCliente({ nombre: "", telefono: "", dni: "", id: null })
    setEquipo({ marca: "", modelo: "", password: "", imei: "", descripcion: "" })
    setReparaciones([{ descripcion: "", precio: "" }])
    setPago({ realizaPago: false, monto: "", metodo: "efectivo" })
    setPasoActual(1)
    setReparacionRegistrada(false)
    setNumeroTicket(null)
    setBusquedaCliente("")
    setClientesEncontrados([])
    setMostrarResultadosBusqueda(false)
    setBusquedaRealizada(false)
    setMostrarFormNuevoCliente(false)
    setCuentaCorriente(null)
  }

  // Renderizar los pasos del formulario
  const renderPasoIndicator = (paso, titulo, icono) => {
    const esPasoActual = pasoActual === paso
    const esPasoCompletado = pasoActual > paso

    return (
      <div
        className={`flex items-center ${
          esPasoActual || esPasoCompletado ? "text-orange-600" : "text-gray-400"
        } gap-2 relative`}
      >
        <div
          className={`rounded-full w-8 h-8 flex items-center justify-center ${
            esPasoActual
              ? "bg-orange-100 text-orange-600 border-2 border-orange-500"
              : esPasoCompletado
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          {esPasoCompletado ? <CheckCircle className="w-4 h-4" /> : icono}
        </div>
        <span className={`text-sm ${esPasoActual ? "font-medium" : ""}`}>{titulo}</span>
        {paso < 4 && (
          <div
            className={`absolute top-4 left-8 w-full h-0.5 -z-10 ${esPasoCompletado ? "bg-orange-500" : "bg-gray-200"}`}
          ></div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-200">
      <ToastContainer position="bottom-right" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Registrar reparaciones</h1>
      </div>

      <AnimatePresence mode="wait">
        {!mostrarTicket ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardUI className="max-w-4xl mx-auto border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-[#131321] text-white">
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Tool size={20} /> Registro de Reparación
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Complete el formulario para registrar una nueva reparación
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <div className="flex justify-between mb-8 px-2">
                  {renderPasoIndicator(1, "Cliente", <User className="w-4 h-4" />)}
                  {renderPasoIndicator(2, "Equipo", <Smartphone className="w-4 h-4" />)}
                  {renderPasoIndicator(3, "Reparación", <Wrench className="w-4 h-4" />)}
                  {renderPasoIndicator(4, "Pago", <DollarSign className="w-4 h-4" />)}
                </div>

                <Tabs value={`paso-${pasoActual}`} className="w-full">
                  <TabsContent value="paso-1" className="space-y-4 mt-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-orange-600 flex items-center gap-2">
                        <User className="h-5 w-5" /> Datos del Cliente
                      </h3>

                      {/* Selección de punto de venta mejorada */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900">Punto de Venta</h3>
                            <p className="text-sm text-blue-600">
                              Seleccione la ubicación donde se registra la reparación
                            </p>
                          </div>
                        </div>

                        {cargandoPuntosVenta ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
                            <span className="text-blue-600">Cargando puntos de venta...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {puntosVenta.map((punto) => (
                              <div
                                key={punto.id}
                                onClick={() => setPuntoVentaSeleccionado(punto.id.toString())}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  puntoVentaSeleccionado === punto.id.toString()
                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-2 rounded-full ${
                                        puntoVentaSeleccionado === punto.id.toString() ? "bg-blue-100" : "bg-gray-100"
                                      }`}
                                    >
                                      <MapPin
                                        className={`h-4 w-4 ${
                                          puntoVentaSeleccionado === punto.id.toString()
                                            ? "text-blue-600"
                                            : "text-gray-500"
                                        }`}
                                      />
                                    </div>
                                    <div>
                                      <h4
                                        className={`font-medium ${
                                          puntoVentaSeleccionado === punto.id.toString()
                                            ? "text-blue-600"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {punto.nombre}
                                      </h4>
                                      <p className="text-xs text-gray-500">Punto de venta</p>
                                    </div>
                                  </div>
                                  {puntoVentaSeleccionado === punto.id.toString() && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!puntoVentaSeleccionado && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <span className="text-sm text-amber-700">
                                Debe seleccionar un punto de venta para continuar
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sección de búsqueda de cliente */}
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        {cliente.id ? (
                          <div className="bg-green-50 p-3 rounded-md border border-green-200 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-green-800 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                Cliente seleccionado
                              </div>
                              <div className="text-sm text-green-700 mt-1">
                                <span className="font-medium">Nombre:</span> {cliente.nombre}
                                {cliente.dni && (
                                  <span className="ml-2">
                                    <span className="font-medium">DNI:</span> {cliente.dni}
                                  </span>
                                )}
                                {cliente.telefono && (
                                  <span className="ml-2">
                                    <span className="font-medium">Teléfono:</span> {cliente.telefono}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={limpiarSeleccionCliente}
                              className="border-green-300 hover:bg-green-100 text-green-700"
                            >
                              <X className="h-4 w-4 mr-1" /> Cambiar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4">
                              <Label htmlFor="busquedaCliente" className="text-orange-700 font-medium mb-2 block">
                                Buscar cliente existente
                              </Label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                  <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <Input
                                  id="busquedaCliente"
                                  ref={searchInputRef}
                                  value={busquedaCliente}
                                  onChange={handleBusquedaChange}
                                  placeholder="Ingrese nombre, DNI o teléfono del cliente"
                                  className="pl-10 border-orange-200 focus-visible:ring-orange-500"
                                  autoComplete="off"
                                  disabled={mostrarFormNuevoCliente}
                                />
                                {busquedaCliente && !mostrarFormNuevoCliente && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                                    onClick={limpiarSeleccionCliente}
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Limpiar</span>
                                  </Button>
                                )}
                                {buscandoClientes && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Resultados de búsqueda */}
                            {mostrarResultadosBusqueda && clientesEncontrados.length > 0 && (
                              <div className="mt-2 border border-gray-200 rounded-md shadow-sm bg-white">
                                <ScrollArea className="max-h-60">
                                  <div className="p-1">
                                    {clientesEncontrados.map((clienteItem) => (
                                      <div
                                        key={clienteItem.id}
                                        className="p-2 hover:bg-orange-50 rounded cursor-pointer flex items-center justify-between"
                                        onClick={() => seleccionarCliente(clienteItem)}
                                      >
                                        <div>
                                          <div className="font-medium">{clienteItem.nombre}</div>
                                          <div className="text-xs text-gray-500 flex gap-2">
                                            {clienteItem.dni && <span>DNI: {clienteItem.dni}</span>}
                                            {clienteItem.telefono && <span>Tel: {clienteItem.telefono}</span>}
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-orange-600">
                                          <CheckCircle className="h-4 w-4 mr-1" /> Seleccionar
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}

                            {/* Mensaje cuando no se encuentran clientes */}
                            {busquedaRealizada && clientesEncontrados.length === 0 && !mostrarFormNuevoCliente && (
                              <Alert className="mt-2 bg-orange-100 border-orange-200 text-orange-800">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="flex items-center justify-between">
                                  <span>No se encontraron clientes con ese nombre, DNI o teléfono.</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={mostrarAgregarCliente}
                                    className="ml-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-200"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" /> Crear nuevo cliente
                                  </Button>
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Formulario para nuevo cliente */}
                            {mostrarFormNuevoCliente && (
                              <div className="mt-3 border border-orange-200 rounded-md p-4 bg-white">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-orange-700 flex items-center">
                                    <UserPlus className="h-4 w-4 mr-1" /> Nuevo Cliente
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelarNuevoCliente}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="nuevoNombre">
                                      Nombre completo <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id="nuevoNombre"
                                      name="nombre"
                                      value={nuevoCliente.nombre}
                                      onChange={handleNuevoClienteChange}
                                      placeholder="Ingrese el nombre del cliente"
                                      className="border-orange-200 focus-visible:ring-orange-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="nuevoDni">DNI</Label>
                                    <Input
                                      id="nuevoDni"
                                      name="dni"
                                      value={nuevoCliente.dni}
                                      onChange={handleNuevoClienteChange}
                                      placeholder="Documento de identidad"
                                      className="border-orange-200 focus-visible:ring-orange-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="nuevoTelefono">Número de teléfono</Label>
                                    <Input
                                      id="nuevoTelefono"
                                      name="telefono"
                                      value={nuevoCliente.telefono}
                                      onChange={handleNuevoClienteChange}
                                      placeholder="Ej: 123-456-7890"
                                      className="border-orange-200 focus-visible:ring-orange-500"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                  <Button
                                    variant="outline"
                                    className="mr-2 border-gray-200"
                                    onClick={cancelarNuevoCliente}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={guardarNuevoCliente}
                                    disabled={cargando}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    {cargando ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Guardando...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Guardar Cliente
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Botón para agregar nuevo cliente cuando no hay búsqueda */}
                            {!busquedaRealizada && !mostrarFormNuevoCliente && busquedaCliente.length < 2 && (
                              <div className="mt-2 flex justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={mostrarAgregarCliente}
                                  className="border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                                >
                                  <UserPlus className="h-4 w-4 mr-1" /> Crear nuevo cliente
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paso-2" className="space-y-4 mt-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-orange-600 flex items-center gap-2">
                        <Smartphone className="h-5 w-5" /> Datos del Equipo
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="marca">
                            Marca <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="marca"
                            name="marca"
                            value={equipo.marca}
                            onChange={handleEquipoChange}
                            placeholder="Ej: Samsung, Apple, Xiaomi"
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="modelo">Modelo</Label>
                          <Input
                            id="modelo"
                            name="modelo"
                            value={equipo.modelo}
                            onChange={handleEquipoChange}
                            placeholder="Ej: iPhone 12, Galaxy S21"
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imei">IMEI (opcional)</Label>
                          <Input
                            id="imei"
                            name="imei"
                            value={equipo.imei}
                            onChange={handleEquipoChange}
                            placeholder="Número de IMEI"
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Contraseña (opcional)</Label>
                          <Input
                            id="password"
                            name="password"
                            value={equipo.password}
                            onChange={handleEquipoChange}
                            placeholder="Contraseña del dispositivo"
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="descripcion">Observaciones (opcional)</Label>
                          <Input
                            id="descripcion"
                            name="descripcion"
                            value={equipo.descripcion}
                            onChange={handleEquipoChange}
                            placeholder="Detalles adicionales del equipo"
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paso-3" className="space-y-4 mt-2">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-orange-600 flex items-center gap-2">
                          <Wrench className="h-5 w-5" /> Detalles de la Reparación
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={agregarReparacion}
                            className="flex items-center gap-1 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-200 hover:text-orange-600"
                            data-tooltip-id="agregar-tooltip"
                            data-tooltip-content="Agregar otra reparación"
                          >
                            <Plus className="h-4 w-4" /> Agregar
                          </Button>
                          <ReactTooltip id="agregar-tooltip" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {reparaciones.map((reparacion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-orange-50"
                          >
                            <div className="md:col-span-7 space-y-2">
                              <Label htmlFor={`descripcion-${index}`} className="flex justify-between">
                                <span>
                                  Descripción <span className="text-red-500">*</span>
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenRepuestosModal(index)}
                                  className="h-7 px-3 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-full transition-all duration-200"
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Buscar repuesto
                                </Button>
                              </Label>
                              <Input
                                id={`descripcion-${index}`}
                                value={reparacion.descripcion}
                                onChange={(e) => handleReparacionChange(index, "descripcion", e.target.value)}
                                placeholder="Ej: Cambio de pantalla, Reparación de placa"
                                className="border-orange-200 focus-visible:ring-orange-500"
                              />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                              <Label htmlFor={`precio-${index}`}>Precio</Label>
                              <NumericFormat
                                id={`precio-${index}`}
                                value={reparacion.precio}
                                onValueChange={(values) => {
                                  const { value } = values
                                  handleReparacionChange(index, "precio", value)
                                }}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="$ "
                                decimalScale={2}
                                placeholder="$ 0,00"
                                className="w-full px-3 py-2 border rounded-md border-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                              />
                            </div>
                            <div className="md:col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => eliminarReparacion(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                data-tooltip-id="eliminar-tooltip"
                                data-tooltip-content="Eliminar reparación"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <ReactTooltip id="eliminar-tooltip" />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4">
                        <Badge
                          variant="outline"
                          className="text-lg px-4 py-2 bg-orange-50 text-orange-600 border-orange-200"
                        >
                          Total: {formatearPrecio(calcularTotal())}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paso-4" className="space-y-6 mt-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-orange-600 flex items-center gap-2">
                        <Receipt className="h-5 w-5" /> Resumen y Pago
                      </h3>

                      <CardUI className="border border-orange-200">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium flex items-center mb-2 text-orange-600">
                                  <User className="w-4 h-4 mr-2" /> Cliente
                                </h4>
                                <p className="text-gray-700">{cliente.nombre}</p>
                                {cliente.dni && <p className="text-gray-700">DNI: {cliente.dni}</p>}
                                {cliente.telefono && <p className="text-gray-700">Tel: {cliente.telefono}</p>}
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium flex items-center mb-2 text-orange-600">
                                  <Smartphone className="w-4 h-4 mr-2" /> Equipo
                                </h4>
                                <p className="text-gray-700">
                                  {equipo.marca} {equipo.modelo}
                                </p>
                                {equipo.imei && <p className="text-gray-700">IMEI: {equipo.imei}</p>}
                                {equipo.password && <p className="text-gray-700">Contraseña: {equipo.password}</p>}
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium flex items-center mb-2 text-orange-600">
                                  <MapPin className="w-4 h-4 mr-2" /> Punto de Venta
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`${
                                    obtenerNombrePuntoVenta(puntoVentaSeleccionado) === "Tala"
                                      ? "border-orange-300 bg-orange-50 text-orange-700"
                                      : "border-indigo-300 bg-indigo-50 text-indigo-700"
                                  }`}
                                >
                                  <MapPin className="h-3.5 w-3.5 mr-1" />
                                  {obtenerNombrePuntoVenta(puntoVentaSeleccionado)}
                                </Badge>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium flex items-center mb-2 text-orange-600">
                                <Wrench className="w-4 h-4 mr-2" /> Reparaciones
                              </h4>
                              <ul className="space-y-2">
                                {reparaciones.map((rep, index) => (
                                  <li key={index} className="flex justify-between text-gray-700">
                                    <span>{rep.descripcion}</span>
                                    <span>{rep.precio ? formatearPrecio(rep.precio) : "-"}</span>
                                  </li>
                                ))}
                              </ul>
                              <Separator className="my-2" />
                              <div className="flex justify-between font-bold text-orange-700">
                                <span>Total</span>
                                <span>{formatearPrecio(calcularTotal())}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CardUI>

                      <div className="pt-4 bg-gray-50 p-4 rounded-lg">
                        {calcularTotal() > 0 ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="realizaPago"
                                checked={pago.realizaPago}
                                className="border-orange-600 data-[state=checked]:bg-orange-600"
                                onCheckedChange={(checked) =>
                                  setPago((prev) => ({ ...prev, realizaPago: checked === true }))
                                }
                              />
                              <Label htmlFor="realizaPago" className="font-medium text-gray-700">
                                Registrar pago ahora
                              </Label>
                            </div>

                            <AnimatePresence>
                              {pago.realizaPago && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="monto">Monto a pagar</Label>
                                        <NumericFormat
                                          id="monto"
                                          value={pago.monto}
                                          onValueChange={(values) => {
                                            const { value } = values
                                            setPago({ ...pago, monto: value })
                                          }}
                                          thousandSeparator="."
                                          decimalSeparator=","
                                          prefix="$ "
                                          decimalScale={2}
                                          placeholder="$ 0,00"
                                          className="w-full px-3 py-2 border rounded-md border-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                                        />
                                        <p className="text-sm text-gray-500">
                                          {pago.monto ? (
                                            <>
                                              Saldo pendiente:{" "}
                                              {formatearPrecio(calcularTotal() - convertirANumero(pago.monto))}
                                            </>
                                          ) : (
                                            "Ingrese el monto a pagar"
                                          )}
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Método de pago</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                          {metodosPago.map((metodo) => (
                                            <div
                                              key={metodo.id}
                                              onClick={() => handleMetodoPago(metodo.id)}
                                              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                pago.metodo === metodo.id
                                                  ? "border-orange-500 bg-orange-50"
                                                  : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                                              }`}
                                            >
                                              <div
                                                className={`p-3 rounded-full ${
                                                  pago.metodo === metodo.id ? "bg-orange-100" : "bg-gray-100"
                                                }`}
                                              >
                                                {metodo.id === "efectivo" && (
                                                  <Banknote
                                                    className={`w-5 h-5 ${pago.metodo === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                                  />
                                                )}
                                                {metodo.id === "tarjeta" && (
                                                  <Card
                                                    className={`w-5 h-5 ${pago.metodo === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                                  />
                                                )}
                                                {metodo.id === "transferencia" && (
                                                  <ArrowDownToLine
                                                    className={`w-5 h-5 ${pago.metodo === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                                  />
                                                )}
                                                {metodo.id === "cuentaCorriente" && (
                                                  <Card
                                                    className={`w-5 h-5 ${pago.metodo === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                                  />
                                                )}
                                              </div>
                                              <span
                                                className={`text-sm mt-2 font-medium ${pago.metodo === metodo.id ? "text-orange-600" : "text-gray-600"}`}
                                              >
                                                {metodo.nombre}
                                              </span>
                                              {metodo.id === "cuentaCorriente" && !cliente.id && (
                                                <span className="text-xs text-red-500 mt-1">Requiere cliente</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Información de cuenta corriente */}
                                    {pago.metodo === "cuentaCorriente" && cliente.id && (
                                      <div className="mt-4 p-3 rounded-lg border border-orange-200 bg-orange-50">
                                        <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-1">
                                          <Card className="h-4 w-4" /> Información de Cuenta Corriente
                                        </h4>

                                        {verificandoCuenta ? (
                                          <div className="flex items-center justify-center py-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-orange-600 mr-2" />
                                            <span className="text-sm text-orange-600">
                                              Verificando cuenta corriente...
                                            </span>
                                          </div>
                                        ) : cuentaCorriente ? (
                                          <>
                                            {cuentaCorriente.activo ? (
                                              <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                  <div className="bg-white p-2 rounded border">
                                                    <span className="text-gray-500">Saldo actual:</span>
                                                    <div
                                                      className={`font-medium ${
                                                        Number(cuentaCorriente.saldo) > 0
                                                          ? "text-red-600"
                                                          : "text-green-600"
                                                      }`}
                                                    >
                                                      {formatearPrecio(Number(cuentaCorriente.saldo))}
                                                    </div>
                                                  </div>
                                                  <div className="bg-white p-2 rounded border">
                                                    <span className="text-gray-500">Límite de crédito:</span>
                                                    <div className="font-medium">
                                                      {cuentaCorriente.limiteCredito > 0
                                                        ? formatearPrecio(cuentaCorriente.limiteCredito)
                                                        : "Sin límite"}
                                                    </div>
                                                  </div>
                                                </div>

                                                {pago.monto && (
                                                  <div className="bg-white p-2 rounded border">
                                                    <span className="text-gray-500">Nuevo saldo proyectado:</span>
                                                    <div
                                                      className={`font-medium ${
                                                        (
                                                          Number(cuentaCorriente.saldo) +
                                                            Number(convertirANumero(pago.monto))
                                                        ) > 0
                                                          ? "text-red-600"
                                                          : "text-green-600"
                                                      }`}
                                                    >
                                                      {formatearPrecio(
                                                        Number(cuentaCorriente.saldo) +
                                                          Number(convertirANumero(pago.monto)),
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                {cuentaCorriente.limiteCredito > 0 &&
                                                  pago.monto &&
                                                  cuentaCorriente.saldo + convertirANumero(pago.monto) >
                                                    cuentaCorriente.limiteCredito && (
                                                    <div className="bg-red-100 text-red-700 p-2 rounded border border-red-200 flex items-center">
                                                      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                                      <span className="text-sm">
                                                        El monto excede el límite de crédito del cliente
                                                      </span>
                                                    </div>
                                                  )}
                                              </div>
                                            ) : (
                                              <div className="bg-red-100 text-red-700 p-2 rounded border border-red-200 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                                <span className="text-sm">
                                                  La cuenta corriente del cliente está inactiva
                                                </span>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="bg-yellow-100 text-yellow-700 p-2 rounded border border-yellow-200 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                            <span className="text-sm">
                                              Se creará una cuenta corriente automáticamente al registrar la reparación
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-500">No hay monto a pagar</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex justify-between py-4 border-t">
                {pasoActual > 1 ? (
                  <Button
                    variant="outline"
                    onClick={retrocederPaso}
                    className="flex items-center gap-1 border-orange-200 hover:bg-orange-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </Button>
                ) : (
                  <div></div>
                )}

                {pasoActual < 4 ? (
                  <Button onClick={avanzarPaso} className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700">
                    Siguiente <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={prepararTicket}
                    disabled={cargando}
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {cargando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Procesando...
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4 mr-1" /> Generar Ticket
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </CardUI>
          </motion.div>
        ) : (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            <div className="mb-6">
              <div className="flex justify-between items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setMostrarTicket(false)}
                  className="border-gray-200 hover:bg-gray-50 text-gray-700 flex-1 -ml-8"
                >
                  Volver al formulario
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setCargando(true)
                      if (!reparacionRegistrada) {
                        await registrarReparacion()
                      }
                      reiniciarFormulario()
                      toast.success("Reparación registrada correctamente", { position: "bottom-center" })
                    } catch (error) {
                      console.error("Error al registrar sin ticket:", error)
                      toast.error("Error al registrar la reparación", { position: "bottom-right" })
                    } finally {
                      setCargando(false)
                    }
                  }}
                  disabled={cargando}
                  className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" /> Registrar sin ticket
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await handlePrintTicket()
                      setTimeout(() => {
                        reiniciarFormulario()
                      }, 1000)
                    } catch (error) {
                      console.error("Error al imprimir:", error)
                    }
                  }}
                  disabled={cargando}
                  className="flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700 text-white flex-1"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-1" /> Imprimir Ticket
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="border-2 border-dashed border-orange-300 p-4 rounded-lg shadow-md">
              <h3 className="text-center text-orange-600 font-medium mb-4">Vista previa del ticket</h3>
              <div className="flex justify-center">
                <div className="bg-white p-1 rounded border border-gray-200" style={{ width: "58mm" }}>
                  <TicketThermal
                    ref={ticketRef}
                    numeroTicket={numeroTicket || "XXXXX"}
                    fechaActual={fechaActual}
                    horaActual={horaActual}
                    cliente={cliente}
                    equipo={equipo}
                    puntoVenta={{
                      id: puntoVentaSeleccionado,
                      nombre: obtenerNombrePuntoVenta(puntoVentaSeleccionado),
                    }}
                    total={calcularTotal()}
                    pago={
                      pago.realizaPago
                        ? {
                            ...pago,
                            nombreMetodo: obtenerNombreMetodoPago(pago.metodo),
                          }
                        : null
                    }
                    formatearPrecio={formatearPrecio}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Repuestos Mejorado */}
      <Dialog open={showRepuestosModal} onOpenChange={setShowRepuestosModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 bg-[#131321] text-white">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-orange-600">
              <Package size={20} /> Seleccionar Repuesto
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Busque y seleccione un repuesto para agregar a la reparación
            </DialogDescription>
          </DialogHeader>

          {/* Barra de búsqueda mejorada */}
          <div className="p-6 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar repuestos por nombre o descripción..."
                value={searchRepuestoTerm}
                onChange={(e) => setSearchRepuestoTerm(e.target.value)}
                className="pl-12 pr-12 h-12 text-lg border-orange-200 focus-visible:ring-orange-500 rounded-xl"
              />
              {searchRepuestoTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                  onClick={() => setSearchRepuestoTerm("")}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              )}
            </div>

            {puntoVentaSeleccionado && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <MapPin className="h-3 w-3 mr-1" />
                  Punto de venta: {obtenerNombrePuntoVenta(puntoVentaSeleccionado)}
                </Badge>
                <span className="text-sm text-gray-500">Solo se muestran repuestos de este punto de venta</span>
              </div>
            )}
          </div>

          {/* Lista de repuestos */}
          <div className="max-h-[calc(90vh-240px)] overflow-y-auto">
            {cargandoRepuestos ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-500 text-lg">Cargando repuestos...</p>
              </div>
            ) : filteredRepuestos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-lg">No se encontraron repuestos</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchRepuestoTerm
                    ? "Intente con otra búsqueda"
                    : "No hay repuestos disponibles en este punto de venta"}
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-4">
                  {filteredRepuestos.map((repuesto) => (
                    <div
                      key={repuesto.id}
                      onClick={() => seleccionarRepuesto(repuesto)}
                      className="group p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-white hover:bg-orange-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-orange-900 text-lg">
                                {repuesto.nombre}
                              </h4>
                              <p className="text-gray-600 text-sm mt-1">{repuesto.descripcion || "Sin descripción"}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-orange-600">
                                {formatearPrecio(repuesto.precio)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge
                                variant={repuesto.stock > 0 ? "default" : "destructive"}
                                className={`${
                                  repuesto.stock > 0
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }`}
                              >
                                <Package className="h-3 w-3 mr-1" />
                                {repuesto.stock > 0 ? `Stock: ${repuesto.stock}` : "Sin stock"}
                              </Badge>

                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                <MapPin className="h-3 w-3 mr-1" />
                                {repuesto.punto_venta || "No asignado"}
                              </Badge>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Seleccionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer del modal */}
          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {filteredRepuestos.length} repuesto{filteredRepuestos.length !== 1 ? "s" : ""} encontrado
              {filteredRepuestos.length !== 1 ? "s" : ""}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowRepuestosModal(false)}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReparacionesPage
