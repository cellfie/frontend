"use client"

import { useState, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
  Search,
  ShoppingCart,
  Trash2,
  User,
  Percent,
  Save,
  Info,
  RefreshCw,
  Smartphone,
  Check,
  X,
  Receipt,
  DollarSign,
  ArrowUpRight,
  CreditCardIcon,
  BookOpen,
  MapPin,
  UserPlus,
  Barcode,
  AlertCircle,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Importar servicios
import { getEquipos, adaptEquipoToFrontend } from "@/services/equiposService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { searchClientes, createCliente } from "@/services/clientesService"
import { getTiposPago } from "@/services/pagosService"
import { createVentaEquipo } from "@/services/ventasEquiposService"
import { getCuentaCorrienteByCliente } from "@/services/cuentasCorrientesService"
import { useAuth } from "@/context/AuthContext"
import { DollarContext } from "@/context/DollarContext"

// Importar componente de precios canjes
import PreciosCanjes from "@/components/PreciosCanje"

// ✅ NUEVO: Componente mejorado para múltiples métodos de pago
import PaymentMethodsModal from "@/components/PaymentMethodsModal"

// Función para formatear moneda en formato argentino
const formatearMonedaARS = (valor) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor)
}

// Componentes auxiliares
const PrecioConARS = ({ precio, dollarPrice, className = "" }) => (
  <div className={`flex flex-col items-end ${className}`}>
    <span>
      {precio < 0 ? "-" : ""}${Math.abs(precio).toFixed(2)}
    </span>
    <span className="text-xs text-gray-500">{formatearMonedaARS(Math.abs(precio * dollarPrice))}</span>
  </div>
)

const EquipoCard = ({ equipo, onSelect, dollarPrice, puntoVentaSeleccionado, getNombrePuntoVenta }) => {
  const esPuntoVentaDiferente = equipo.puntoVenta?.id.toString() !== puntoVentaSeleccionado
  const estaVendido = equipo.vendido

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div
        className={`p-4 cursor-pointer hover:bg-blue-100 transition-colors border-b border-gray-100 ${
          esPuntoVentaDiferente ? "bg-gray-50" : ""
        } ${estaVendido ? "bg-red-50" : ""}`}
        onDoubleClick={() => !estaVendido && onSelect(equipo)}
        data-tooltip-id="tooltip-search"
        data-tooltip-content={
          estaVendido
            ? "Este equipo ya ha sido vendido"
            : esPuntoVentaDiferente
              ? `Este equipo pertenece a ${equipo.puntoVenta?.nombre}. Solo puedes vender equipos de ${getNombrePuntoVenta(puntoVentaSeleccionado)}`
              : "Doble clic para seleccionar"
        }
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-800">
              {equipo.marca} {equipo.modelo}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal">
                {equipo.memoria || "N/A"}
              </Badge>
              <p className="text-xs text-gray-500 line-clamp-1">{equipo.color || "N/A"}</p>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge
                variant="outline"
                className={`text-xs font-normal ${
                  equipo.puntoVenta?.nombre === "Tala"
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-indigo-300 bg-indigo-50 text-indigo-700"
                }`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {equipo.puntoVenta?.nombre || "Sin asignar"}
              </Badge>
              {esPuntoVentaDiferente && (
                <Badge variant="outline" className="text-xs font-normal border-red-300 bg-red-50 text-red-700">
                  Punto de venta diferente
                </Badge>
              )}
              {estaVendido && (
                <Badge variant="outline" className="text-xs font-normal border-red-300 bg-red-50 text-red-700">
                  Vendido
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">IMEI: {equipo.imei}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-orange-600">${Number(equipo.precio).toFixed(2)}</p>
            <p className="text-xs text-gray-500">{formatearMonedaARS(Number(equipo.precio) * dollarPrice)}</p>
            <Badge
              variant={
                Number(equipo.bateria) > 90 ? "secondary" : Number(equipo.bateria) > 80 ? "outline" : "destructive"
              }
              className="mt-1"
            >
              Batería: {equipo.bateria}%
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Componente principal
const VentasEquipos = () => {
  // Estados existentes
  const { currentUser } = useAuth()
  const { dollarPrice } = useContext(DollarContext)

  // Estados
  const [equipos, setEquipos] = useState([])
  const [equiposFiltrados, setEquiposFiltrados] = useState([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Estados para búsqueda
  const [busquedaMarcaModelo, setBusquedaMarcaModelo] = useState("")
  const [busquedaIMEI, setBusquedaIMEI] = useState("")
  const [tipoFiltroActivo, setTipoFiltroActivo] = useState("marca-modelo")

  // Resto de estados existentes...
  const [porcentajeInteres, setPorcentajeInteres] = useState(0)
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0)
  const [interesInputValue, setInteresInputValue] = useState("0")
  const [descuentoInputValue, setDescuentoInputValue] = useState("0")
  const [cliente, setCliente] = useState({ id: null, nombre: "Seleccione un cliente", telefono: "", dni: "" })
  const [dialogClienteAbierto, setDialogClienteAbierto] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", dni: "" })
  const [clientesBusqueda, setClientesBusqueda] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [dialogNuevoClienteAbierto, setDialogNuevoClienteAbierto] = useState(false)
  const [dialogFinalizarAbierto, setDialogFinalizarAbierto] = useState(false)
  const [tiposPagoDisponibles, setTiposPagoDisponibles] = useState([])
  const [procesandoVenta, setProcesandoVenta] = useState(false)
  const [cuentaCorrienteInfo, setCuentaCorrienteInfo] = useState(null)
  const [cargandoCuentaCorriente, setCargandoCuentaCorriente] = useState(false)
  const [planCanjeAbierto, setPlanCanjeAbierto] = useState(false)
  const [pasoActualCanje, setPasoActualCanje] = useState(1)
  const [canjeCompletado, setCanjeCompletado] = useState(false)
  const [nuevoEquipoCanje, setNuevoEquipoCanje] = useState({
    marca: "",
    modelo: "",
    memoria: "",
    color: "",
    bateria: "",
    precio: 0,
    descripcion: "",
    imei: "",
    fechaIngreso: new Date().toISOString().split("T")[0],
  })
  const [puntosVenta, setPuntosVenta] = useState([])
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState("")
  const [preciosCanjesAbierto, setPreciosCanjesAbierto] = useState(false)
  const [mostrarInteresVisual, setMostrarInteresVisual] = useState(false)

  // ✅ NUEVOS ESTADOS PARA PAGOS MÚLTIPLES MEJORADOS
  const [pagos, setPagos] = useState([])
  const [marcarComoIncompleta, setMarcarComoIncompleta] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)
        setPuntoVentaSeleccionado("1")

        const tipos = await getTiposPago()
        setTiposPagoDisponibles(
          tipos.map((tipo) => {
            let icono = DollarSign
            if (tipo.nombre.toLowerCase().includes("transferencia")) icono = ArrowUpRight
            if (tipo.nombre.toLowerCase().includes("tarjeta")) icono = CreditCardIcon
            if (tipo.nombre.toLowerCase().includes("cuenta")) icono = BookOpen
            return { ...tipo, icono }
          }),
        )
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      }
    }
    cargarDatosIniciales()
  }, [])

  // Cargar equipos
  useEffect(() => {
    const fetchEquipos = async () => {
      setCargando(true)
      try {
        const data = await getEquipos()
        const adaptedData = data.map((equipo) => {
          const adaptedEquipo = adaptEquipoToFrontend(equipo)
          if (adaptedEquipo.vendido === undefined) {
            adaptedEquipo.vendido = false
          }
          return adaptedEquipo
        })
        const equiposDisponibles = adaptedData.filter((equipo) => !equipo.vendido)
        setEquipos(equiposDisponibles)
        setEquiposFiltrados(equiposDisponibles)
      } catch (err) {
        console.error("Error al cargar equipos:", err)
        toast.error("Error al cargar equipos")
      } finally {
        setCargando(false)
      }
    }
    fetchEquipos()
  }, [])

  // Filtrar equipos
  useEffect(() => {
    const filtrarEquipos = () => {
      if (tipoFiltroActivo === "marca-modelo" && busquedaMarcaModelo.trim()) {
        const termino = busquedaMarcaModelo.toLowerCase().trim()
        return equipos.filter((equipo) => {
          const marcaModelo = `${equipo.marca || ""} ${equipo.modelo || ""}`.toLowerCase()
          return marcaModelo.includes(termino)
        })
      } else if (tipoFiltroActivo === "imei" && busquedaIMEI.trim()) {
        const termino = busquedaIMEI.toLowerCase().trim()
        return equipos.filter((equipo) => {
          const imei = (equipo.imei || "").toString().toLowerCase()
          return imei.includes(termino)
        })
      }
      return equipos
    }
    setEquiposFiltrados(filtrarEquipos())
  }, [busquedaMarcaModelo, busquedaIMEI, tipoFiltroActivo, equipos])

  // Buscar clientes
  useEffect(() => {
    const buscarClientes = async () => {
      if (busquedaCliente.length < 2) {
        setClientesBusqueda([])
        return
      }
      try {
        const clientes = await searchClientes(busquedaCliente)
        setClientesBusqueda(clientes)
      } catch (error) {
        console.error("Error al buscar clientes:", error)
      }
    }
    const timeoutId = setTimeout(() => {
      buscarClientes()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [busquedaCliente])

  // Cargar cuenta corriente
  useEffect(() => {
    const cargarCuentaCorriente = async () => {
      if (!cliente.id) {
        setCuentaCorrienteInfo(null)
        return
      }
      setCargandoCuentaCorriente(true)
      try {
        const cuentaCorriente = await getCuentaCorrienteByCliente(cliente.id)
        setCuentaCorrienteInfo(cuentaCorriente)
      } catch (error) {
        console.error("Error al cargar cuenta corriente:", error)
        if (error.message && error.message.includes("no tiene cuenta corriente")) {
          setCuentaCorrienteInfo({ saldo: 0, limite_credito: 0, activo: true, cliente_id: cliente.id })
        } else {
          toast.error("Error al cargar información de cuenta corriente")
        }
      } finally {
        setCargandoCuentaCorriente(false)
      }
    }
    if (cliente.id) {
      cargarCuentaCorriente()
    }
  }, [cliente.id])

  // Cálculos
  const precioBruto = equipoSeleccionado ? Number(equipoSeleccionado.precio) : 0
  const descuentoCanje = canjeCompletado ? Number(nuevoEquipoCanje.precio) || 0 : 0
  const subtotal = precioBruto - descuentoCanje
  const interes = (subtotal * porcentajeInteres) / 100
  const descuento = (subtotal * porcentajeDescuento) / 100
  const total = subtotal - descuento
  const totalVisual = subtotal + interes - descuento

  // ✅ MEJORA: Cálculos para pagos múltiples
  const totalPagadoUSD = pagos.reduce((sum, p) => sum + Number(p.monto_usd), 0)
  const saldoPendienteUSD = total - totalPagadoUSD
  const pagoCompleto = Math.abs(saldoPendienteUSD) <= 0.01

  const handleInteresFocus = () => interesInputValue === "0" && setInteresInputValue("")
  const handleDescuentoFocus = () => descuentoInputValue === "0" && setDescuentoInputValue("")
  const handleInteresBlur = () => {
    if (interesInputValue === "") {
      setInteresInputValue("0")
      setPorcentajeInteres(0)
    }
  }
  const handleDescuentoBlur = () => {
    if (descuentoInputValue === "") {
      setDescuentoInputValue("0")
      setPorcentajeDescuento(0)
    }
  }

  // Handlers para equipos
  const seleccionarEquipo = (eq) => {
    if (eq.vendido) {
      toast.error(`No puedes vender este equipo porque ya ha sido vendido`, { position: "bottom-right" })
      return
    }
    if (eq.puntoVenta?.id.toString() !== puntoVentaSeleccionado) {
      toast.error(
        `No puedes vender equipos de ${eq.puntoVenta?.nombre}. Solo puedes vender equipos de ${getNombrePuntoVenta(puntoVentaSeleccionado)}`,
        { position: "bottom-right" },
      )
      return
    }
    setEquipoSeleccionado(eq)
    toast.success(`${eq.marca} ${eq.modelo} seleccionado`, { icon: "✅", position: "bottom-right" })
  }

  const removerSeleccion = () => {
    setEquipoSeleccionado(null)
    cancelarPlanCanje()
    setPagos([])
    setMarcarComoIncompleta(false)
    toast.info("Selección eliminada", { position: "bottom-right" })
  }

  // Handlers para cliente
  const seleccionarCliente = (clienteSeleccionado) => {
    setCliente({
      id: clienteSeleccionado.id,
      nombre: clienteSeleccionado.nombre,
      telefono: clienteSeleccionado.telefono || "",
      dni: clienteSeleccionado.dni || "",
    })
    setDialogClienteAbierto(false)
    setBusquedaCliente("")
    setClientesBusqueda([])
    toast.success(`Cliente ${clienteSeleccionado.nombre} seleccionado correctamente`, { position: "bottom-right" })
  }

  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.error("El nombre del cliente es obligatorio", { position: "bottom-right" })
      return
    }
    try {
      const clienteCreado = await createCliente(nuevoCliente)
      setCliente({
        id: clienteCreado.id,
        nombre: clienteCreado.nombre,
        telefono: clienteCreado.telefono || "",
        dni: clienteCreado.dni || "",
      })
      setDialogNuevoClienteAbierto(false)
      setDialogClienteAbierto(false)
      toast.success("Cliente creado correctamente", { position: "bottom-right" })
    } catch (error) {
      console.error("Error al crear cliente:", error)
      toast.error("Error al crear cliente: " + error.message)
    }
  }

  // Handlers para plan canje
  const abrirPlanCanje = () => {
    setPlanCanjeAbierto(true)
    setPasoActualCanje(1)
    setCanjeCompletado(false)
  }

  const cancelarPlanCanje = () => {
    setPlanCanjeAbierto(false)
    setPasoActualCanje(1)
    setCanjeCompletado(false)
    setNuevoEquipoCanje({
      ...nuevoEquipoCanje,
      marca: "",
      modelo: "",
      memoria: "",
      color: "",
      bateria: "",
      precio: 0,
      descripcion: "",
      imei: "",
    })
  }

  const siguientePasoCanje = () => {
    if (pasoActualCanje < 3) {
      setPasoActualCanje(pasoActualCanje + 1)
    } else {
      finalizarCanje()
    }
  }

  const anteriorPasoCanje = () => pasoActualCanje > 1 && setPasoActualCanje(pasoActualCanje - 1)

  const finalizarCanje = () => {
    if (!nuevoEquipoCanje.precio) {
      toast.error("El precio de canje es obligatorio", { position: "bottom-right" })
      return
    }
    if (!nuevoEquipoCanje.imei) {
      toast.error("El IMEI del equipo de canje es obligatorio", { position: "bottom-right" })
      return
    }
    setCanjeCompletado(true)
    setPlanCanjeAbierto(false)
    toast.success("Plan Canje aplicado correctamente", { position: "bottom-right" })
  }

  const validarPasoCanje = () => {
    if (pasoActualCanje === 3) {
      return !!nuevoEquipoCanje.precio && !!nuevoEquipoCanje.imei
    }
    return true
  }

  // ✅ MEJORA: Finalizar venta con validación mejorada
  const finalizarVenta = async () => {
    if (!equipoSeleccionado || !cliente.id) {
      toast.error("Debe seleccionar un equipo y un cliente.", { position: "bottom-right" })
      return
    }

    if (pagos.length === 0 && !marcarComoIncompleta) {
      toast.error("Debe agregar al menos un método de pago o marcar la venta como incompleta.", {
        position: "bottom-right",
      })
      return
    }

    if (!pagoCompleto && !marcarComoIncompleta) {
      toast.error(
        "El monto pagado no cubre el total de la venta. Complete el pago o marque la venta como incompleta.",
        {
          position: "bottom-right",
        },
      )
      return
    }

    if (!currentUser || !currentUser.id) {
      toast.error("Usuario no autenticado. Por favor, inicie sesión.", { position: "bottom-right" })
      return
    }

    setProcesandoVenta(true)

    try {
      const ventaData = {
        cliente_id: cliente.id,
        punto_venta_id: Number(puntoVentaSeleccionado || 1),
        equipo_id: equipoSeleccionado.id,
        porcentaje_interes: 0,
        porcentaje_descuento: porcentajeDescuento,
        plan_canje: canjeCompletado ? nuevoEquipoCanje : null,
        notas: `Venta de equipo ${equipoSeleccionado.marca} ${equipoSeleccionado.modelo}`,
        tipo_cambio: dollarPrice,
        total: total,
        pagos: pagos.map((p) => ({
          monto_usd: p.monto_usd,
          monto_ars: p.monto_ars,
          tipo_pago_nombre: p.tipo_pago_nombre,
          notas_pago: p.notas || "",
        })),
        marcar_como_incompleta: marcarComoIncompleta,
      }

      console.log("Datos de venta a enviar:", ventaData)

      const resultado = await createVentaEquipo(ventaData)

      toast.success(`Venta registrada con éxito (Factura: ${resultado.numero_factura})`, {
        icon: "✅",
        position: "bottom-center",
        autoClose: 3000,
      })

      if (canjeCompletado) {
        toast.success(`Equipo de canje registrado en el inventario`, {
          icon: "📱",
          position: "bottom-center",
          autoClose: 5000,
        })
      }

      // Resetear estados
      setEquipoSeleccionado(null)
      setCliente({ id: null, nombre: "Seleccione un cliente", telefono: "", dni: "" })
      setPorcentajeInteres(0)
      setPorcentajeDescuento(0)
      setInteresInputValue("0")
      setDescuentoInputValue("0")
      cancelarPlanCanje()
      setDialogFinalizarAbierto(false)
      setCuentaCorrienteInfo(null)
      setMostrarInteresVisual(false)
      setPagos([])
      setMarcarComoIncompleta(false)

      // Recargar equipos
      const equiposData = await getEquipos()
      const equiposAdaptados = equiposData.map(adaptEquipoToFrontend)
      setEquipos(equiposAdaptados)
      setEquiposFiltrados(equiposAdaptados)
    } catch (error) {
      console.error("Error al finalizar venta:", error)
      toast.error("Error al finalizar venta: " + error.message)
    } finally {
      setProcesandoVenta(false)
    }
  }

  // Obtener nombre del punto de venta
  const getNombrePuntoVenta = (id) => {
    const puntoVenta = puntosVenta.find((p) => p.id.toString() === id)
    return puntoVenta ? puntoVenta.nombre : ""
  }

  // Aplicar precio de canje
  const aplicarPrecioCanje = (precio) => {
    if (pasoActualCanje === 3 && nuevoEquipoCanje) {
      setNuevoEquipoCanje({ ...nuevoEquipoCanje, precio: precio })
      setPreciosCanjesAbierto(false)
      toast.success(`Precio de ${precio} USD aplicado al canje`, { position: "bottom-right" })
    }
  }

  // Limpiar equipo seleccionado cuando cambia el punto de venta
  useEffect(() => {
    if (puntoVentaSeleccionado && equipoSeleccionado) {
      setEquipoSeleccionado(null)
      cancelarPlanCanje()
      setPagos([])
      setMarcarComoIncompleta(false)
      toast.info(
        `Se ha limpiado la selección debido al cambio de punto de venta a ${getNombrePuntoVenta(puntoVentaSeleccionado)}`,
        { position: "bottom-center" },
      )
    }
  }, [puntoVentaSeleccionado])

  // Renderizado de pasos del Plan Canje
  const renderPasoCanje = () => {
    switch (pasoActualCanje) {
      case 1:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="marca">
                Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="marca"
                value={nuevoEquipoCanje.marca}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, marca: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modelo">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modelo"
                value={nuevoEquipoCanje.modelo}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, modelo: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={nuevoEquipoCanje.descripcion}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, descripcion: e.target.value })}
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="memoria">Memoria</Label>
              <Input
                id="memoria"
                value={nuevoEquipoCanje.memoria}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, memoria: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={nuevoEquipoCanje.color}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, color: e.target.value })}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="bateria">Condición de la Batería</Label>
              <Input
                id="bateria"
                value={nuevoEquipoCanje.bateria}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, bateria: e.target.value })}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="precio" className="flex items-center gap-2">
                Precio de Canje (USD) <span className="text-red-500">*</span>
                <Badge variant="outline" className="font-normal text-xs">
                  <DollarSign className="h-3 w-3 mr-1 text-orange-600" />
                  TC: ${dollarPrice.toFixed(2)}
                </Badge>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="precio"
                  type="text"
                  value={nuevoEquipoCanje.precio === 0 ? "" : nuevoEquipoCanje.precio}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setNuevoEquipoCanje({
                        ...nuevoEquipoCanje,
                        precio: value === "" ? "" : Number.parseFloat(value),
                      })
                    }
                  }}
                  onBlur={() => {
                    if (nuevoEquipoCanje.precio === "") {
                      setNuevoEquipoCanje({
                        ...nuevoEquipoCanje,
                        precio: 0,
                      })
                    }
                  }}
                  placeholder="0.00"
                  className="pl-8"
                  step="0.01"
                  min="0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 text-orange-600"
                  onClick={() => setPreciosCanjesAbierto(true)}
                >
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  Precios de referencia
                </Button>
              </div>
              {nuevoEquipoCanje.precio > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="font-normal text-xs bg-orange-50 text-orange-700 border-orange-200"
                  >
                    Equivalente en ARS
                  </Badge>
                  <p className="text-sm font-medium text-orange-700">
                    {formatearMonedaARS(nuevoEquipoCanje.precio * dollarPrice)}
                  </p>
                </div>
              )}
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="imei">
                IMEI <span className="text-red-500">*</span>
              </Label>
              <Input
                id="imei"
                value={nuevoEquipoCanje.imei}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, imei: e.target.value })}
                placeholder="Ingrese el IMEI del equipo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={nuevoEquipoCanje.fechaIngreso}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, fechaIngreso: e.target.value })}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Skeletons
  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, idx) => (
      <div key={idx} className="flex items-center space-x-4 p-3 border-b">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setBusquedaMarcaModelo("")
    setBusquedaIMEI("")
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar ventas de Equipos</h1>
            <div className="flex items-center mt-2">
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${
                  getNombrePuntoVenta(puntoVentaSeleccionado) === "Tala"
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-indigo-300 bg-indigo-50 text-indigo-700"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                Punto de venta: {getNombrePuntoVenta(puntoVentaSeleccionado)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={puntoVentaSeleccionado} onValueChange={setPuntoVentaSeleccionado}>
              <SelectTrigger className="w-[180px] h-9 bg-white shadow-sm">
                <SelectValue placeholder="Cambiar punto de venta" />
              </SelectTrigger>
              <SelectContent>
                {puntosVenta.map((punto) => (
                  <SelectItem key={punto.id} value={punto.id.toString()}>
                    {punto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreciosCanjesAbierto(true)}
              className="h-9 bg-white shadow-sm flex items-center gap-1"
            >
              <DollarSign size={14} />
              <span>Precios Canjes</span>
            </Button>

            <Dialog open={dialogClienteAbierto} onOpenChange={setDialogClienteAbierto}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-white shadow-sm flex items-center gap-1">
                  <User size={14} />
                  <span className="hidden sm:inline">
                    Cliente<span className="text-red-500">*</span>:
                  </span>{" "}
                  {cliente.nombre}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-orange-600">Datos del Cliente</DialogTitle>
                  <DialogDescription>Busca un cliente existente o crea uno nuevo</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Buscar cliente</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar por nombre, teléfono o DNI..."
                        className="pl-8"
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                      />
                    </div>

                    {clientesBusqueda.length > 0 && (
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        {clientesBusqueda.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer flex justify-between items-center"
                            onClick={() => seleccionarCliente(cliente)}
                          >
                            <div>
                              <p className="font-medium">{cliente.nombre}</p>
                              <div className="flex flex-col text-xs text-gray-500">
                                {cliente.dni && <span>DNI: {cliente.dni}</span>}
                                {cliente.telefono && <span>Tel: {cliente.telefono}</span>}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Seleccionar
                            </Button>
                          </div>
                        ))}
                      </ScrollArea>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <Separator className="flex-1" />
                      <span className="px-2 text-xs text-gray-500">o</span>
                      <Separator className="flex-1" />
                    </div>

                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        setDialogNuevoClienteAbierto(true)
                        setNuevoCliente({ nombre: "", telefono: "", dni: "" })
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Crear nuevo cliente
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogClienteAbierto(false)
                      setBusquedaCliente("")
                      setClientesBusqueda([])
                    }}
                  >
                    Cancelar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog para crear nuevo cliente */}
            <Dialog open={dialogNuevoClienteAbierto} onOpenChange={setDialogNuevoClienteAbierto}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-orange-600">Nuevo Cliente</DialogTitle>
                  <DialogDescription>Ingresa los datos del nuevo cliente</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      value={nuevoCliente.dni}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, dni: e.target.value })}
                      placeholder="Documento de identidad"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogNuevoClienteAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={crearNuevoCliente} className="bg-orange-600 hover:bg-orange-700">
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipos Disponibles */}
        <Card className="lg:col-span-1 overflow-hidden border-0 shadow-md bg-white">
          <CardHeader className="bg-[#131321]">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Smartphone size={20} />
              Equipos Disponibles
            </CardTitle>
            <CardDescription className="text-brand-100">
              Venta en punto: {getNombrePuntoVenta(puntoVentaSeleccionado)} - Solo puedes vender equipos de este punto
            </CardDescription>

            {/* Nueva interfaz de búsqueda con pestañas */}
            <div className="mt-2">
              <Tabs value={tipoFiltroActivo} onValueChange={setTipoFiltroActivo} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="marca-modelo" className="text-xs">
                    <Search className="h-3.5 w-3.5 mr-1" />
                    Marca/Modelo
                  </TabsTrigger>
                  <TabsTrigger value="imei" className="text-xs">
                    <Barcode className="h-3.5 w-3.5 mr-1" />
                    IMEI
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="marca-modelo" className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Buscar por marca y modelo..."
                      className="pl-8 bg-white/90 border-0 focus-visible:ring-brand-500"
                      value={busquedaMarcaModelo}
                      onChange={(e) => setBusquedaMarcaModelo(e.target.value)}
                    />
                    {busquedaMarcaModelo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBusquedaMarcaModelo("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="imei" className="mt-2">
                  <div className="relative">
                    <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Buscar por IMEI..."
                      className="pl-8 bg-white/90 border-0 focus-visible:ring-brand-500"
                      value={busquedaIMEI}
                      onChange={(e) => setBusquedaIMEI(e.target.value)}
                    />
                    {busquedaIMEI && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBusquedaIMEI("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              {cargando ? (
                renderSkeletons()
              ) : equiposFiltrados.length > 0 ? (
                <AnimatePresence>
                  {equiposFiltrados.map((eq) => (
                    <EquipoCard
                      key={eq.id}
                      equipo={eq}
                      onSelect={seleccionarEquipo}
                      dollarPrice={dollarPrice}
                      puntoVentaSeleccionado={puntoVentaSeleccionado}
                      getNombrePuntoVenta={getNombrePuntoVenta}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <Search className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                  <h3 className="text-lg font-medium mb-1">No se encontraron equipos</h3>
                  <p className="text-sm">Intenta con otra búsqueda</p>
                  {(busquedaMarcaModelo || busquedaIMEI) && (
                    <Button variant="outline" size="sm" onClick={limpiarBusqueda} className="mt-3">
                      <X className="h-3.5 w-3.5 mr-1" />
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="text-xs text-gray-700 flex justify-between py-3 border-t">
            <span>Total: {equiposFiltrados.length} equipos</span>
            <span className="flex items-center gap-1">
              <Info size={12} /> Doble clic para seleccionar
            </span>
          </CardFooter>
        </Card>

        {/* Detalle de Venta */}
        <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-[#131321] border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <ShoppingCart size={20} /> Detalle de Venta
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Cliente:</span>
                <Badge variant="outline" className="flex items-center gap-1 bg-white">
                  <User size={14} /> {cliente.nombre || "—"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {equipoSeleccionado ? (
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-orange-600">Equipo</TableHead>
                      <TableHead className="text-orange-600 text-right">Precio</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {equipoSeleccionado.memoria || "N/A"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {equipoSeleccionado.color || "N/A"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Batería: {equipoSeleccionado.bateria}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">IMEI: {equipoSeleccionado.imei}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium text-orange-600">${Number(equipoSeleccionado.precio).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {formatearMonedaARS(Number(equipoSeleccionado.precio) * dollarPrice)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={removerSeleccion}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  </TableBody>
                </Table>

                {/* Plan Canje */}
                <div className="mt-6">
                  {!canjeCompletado ? (
                    <div className="flex items-center justify-between">
                      {!planCanjeAbierto ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={abrirPlanCanje}
                          className="gap-1 bg-[#131321] text-orange-600 hover:bg-[#1f1f30] hover:text-orange-600"
                        >
                          <RefreshCw size={14} className="mr-1" /> Plan Canje
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelarPlanCanje}
                          className="text-red-500 hover:text-red-700 gap-1"
                        >
                          <X size={14} /> Cancelar
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="bg-green-100 rounded-full p-1 h-6">
                            <Check size={18} className="text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-green-800">Plan Canje Aplicado</h3>
                            <p className="text-sm text-green-700">
                              {nuevoEquipoCanje.marca} {nuevoEquipoCanje.modelo}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-700">${nuevoEquipoCanje.precio.toFixed(2)} USD</span>
                              <span className="text-xs text-green-700">|</span>
                              <span className="text-xs text-green-700">
                                {formatearMonedaARS(nuevoEquipoCanje.precio * dollarPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelarPlanCanje}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {planCanjeAbierto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 border rounded-lg p-4 bg-white border-[#131321]"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium flex items-center gap-2 text-orange-600">
                          <Smartphone size={16} /> Datos del equipo a entregar
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500">Paso {pasoActualCanje} de 3</div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          {[1, 2, 3].map((paso) => (
                            <div key={paso} className="flex items-center gap-2">
                              <div
                                className={`rounded-full text-xs w-5 h-5 flex items-center justify-center ${
                                  pasoActualCanje >= paso ? "bg-orange-600 text-white" : "bg-gray-200"
                                }`}
                              >
                                {pasoActualCanje > paso ? <Check size={12} /> : paso}
                              </div>
                              <span
                                className={pasoActualCanje === paso ? "font-medium text-sm" : "text-gray-500 text-sm"}
                              >
                                {paso === 1 ? "Información básica" : paso === 2 ? "Características" : "Valoración"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {renderPasoCanje()}

                      <div className="flex justify-between mt-6">
                        <Button
                          variant="outline"
                          onClick={anteriorPasoCanje}
                          disabled={pasoActualCanje === 1}
                          className="border-gray-200"
                        >
                          Anterior
                        </Button>
                        <Button
                          onClick={siguientePasoCanje}
                          disabled={!validarPasoCanje()}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {pasoActualCanje === 3 ? "Finalizar" : "Siguiente"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Descuentos e Intereses */}
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Percent size={14} className="text-orange-600" />
                        Descuento (%)
                      </Label>
                      <Input
                        type="text"
                        value={descuentoInputValue}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setDescuentoInputValue(value)
                            setPorcentajeDescuento(value === "" ? 0 : Number.parseFloat(value))
                          }
                        }}
                        onFocus={handleDescuentoFocus}
                        onBlur={handleDescuentoBlur}
                        placeholder="0"
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de Cálculos */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Receipt size={16} className="text-orange-600" />
                    Resumen de Venta
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Precio del equipo:</span>
                      <PrecioConARS precio={precioBruto} dollarPrice={dollarPrice} />
                    </div>
                    {canjeCompletado && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento por canje:</span>
                        <PrecioConARS precio={-descuentoCanje} dollarPrice={dollarPrice} />
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <PrecioConARS precio={subtotal} dollarPrice={dollarPrice} />
                    </div>
                    {porcentajeDescuento > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento ({porcentajeDescuento}%):</span>
                        <PrecioConARS precio={-descuento} dollarPrice={dollarPrice} />
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <PrecioConARS precio={total} dollarPrice={dollarPrice} className="text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* ✅ NUEVA SECCIÓN: Métodos de Pago Mejorados */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                      <CreditCardIcon size={16} className="text-orange-600" />
                      Métodos de Pago
                    </h3>
                    <PaymentMethodsModal
                      total={total}
                      dollarPrice={dollarPrice}
                      tiposPago={tiposPagoDisponibles}
                      cliente={cliente}
                      cuentaCorrienteInfo={cuentaCorrienteInfo}
                      pagos={pagos}
                      setPagos={setPagos}
                      marcarComoIncompleta={marcarComoIncompleta}
                      setMarcarComoIncompleta={setMarcarComoIncompleta}
                    />
                  </div>

                  {/* Resumen de pagos */}
                  {pagos.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Pagos configurados:</h4>
                      <div className="space-y-2">
                        {pagos.map((pago, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-blue-700">{pago.tipo_pago_nombre}:</span>
                            <span className="font-medium text-blue-800">${pago.monto_usd.toFixed(2)} USD</span>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-blue-800">Total pagado:</span>
                          <span className="text-blue-800">${totalPagadoUSD.toFixed(2)} USD</span>
                        </div>
                        {!pagoCompleto && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-amber-700">Saldo pendiente:</span>
                            <span className="font-medium text-amber-700">${saldoPendienteUSD.toFixed(2)} USD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {marcarComoIncompleta && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-600" />
                        <span className="text-amber-800 font-medium">Venta marcada como incompleta</span>
                      </div>
                      <p className="text-amber-700 text-sm mt-1">
                        Esta venta se registrará con estado "pendiente" y podrás completar el pago posteriormente.
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón Finalizar */}
                <div className="mt-6 pt-4 border-t">
                  <Dialog open={dialogFinalizarAbierto} onOpenChange={setDialogFinalizarAbierto}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-semibold"
                        disabled={!cliente.id || (!pagoCompleto && !marcarComoIncompleta)}
                      >
                        <Save className="mr-2" size={18} />
                        Finalizar Venta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-orange-600">Confirmar Venta</DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que deseas finalizar esta venta? Esta acción no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span>Cliente:</span>
                            <span className="font-medium">{cliente.nombre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Equipo:</span>
                            <span className="font-medium">
                              {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium text-orange-600">${total.toFixed(2)} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estado de pago:</span>
                            <span className={`font-medium ${pagoCompleto ? "text-green-600" : "text-amber-600"}`}>
                              {pagoCompleto ? "Completo" : marcarComoIncompleta ? "Incompleto" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogFinalizarAbierto(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={finalizarVenta}
                          disabled={procesandoVenta}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {procesandoVenta ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2" size={16} />
                              Confirmar Venta
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Smartphone className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecciona un equipo</h3>
                <p className="text-sm">Busca y selecciona un equipo de la lista para comenzar la venta</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Precios de Canjes */}
      <PreciosCanjes
        isOpen={preciosCanjesAbierto}
        onClose={() => setPreciosCanjesAbierto(false)}
        onSelectPrice={aplicarPrecioCanje}
        dollarPrice={dollarPrice}
      />
    </div>
  )
}

export default VentasEquipos
