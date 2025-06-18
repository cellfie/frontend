"use client"

import { useState, useEffect, useContext, useCallback } from "react"
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
  PlusCircle,
  Edit3,
} from "lucide-react"
import { NumericFormat } from "react-number-format"

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
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
// RadioGroup ya no se usará para un solo tipo de pago, pero podría reutilizarse si es necesario.
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Importar servicios
import { getEquipos, adaptEquipoToFrontend as adaptEquipoService } from "@/services/equiposService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { searchClientes, createCliente } from "@/services/clientesService"
import { getTiposPago } from "@/services/pagosService"
import { createVentaEquipo } from "@/services/ventasEquiposService" // Usamos el adaptador del servicio
import { getCuentaCorrienteByCliente } from "@/services/cuentasCorrientesService"
import { useAuth } from "@/context/AuthContext"
import { DollarContext } from "@/context/DollarContext"

// Importar componente de precios canjes
import PreciosCanjes from "@/components/PreciosCanje" // Asumo que este componente existe y funciona

// Función para formatear moneda en formato argentino
const formatearMonedaARS = (valor) => {
  if (isNaN(valor)) return "$0,00"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor)
}

const formatearMonedaUSD = (valor) => {
  if (isNaN(valor)) return "U$S0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(valor)
}

// Componentes auxiliares (EquipoCard se mantiene igual)
const EquipoCard = ({ equipo, onSelect, dollarPrice, puntoVentaSeleccionado, getNombrePuntoVenta }) => {
  const esPuntoVentaDiferente = equipo.puntoVenta?.id.toString() !== puntoVentaSeleccionado
  const estaVendido = equipo.vendido

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div
        className={`p-4 cursor-pointer hover:bg-blue-100 transition-colors border-b border-gray-100 ${
          esPuntoVentaDiferente ? "bg-gray-50" : ""
        } ${estaVendido ? "bg-red-50" : ""}`}
        onDoubleClick={() => !estaVendido && !esPuntoVentaDiferente && onSelect(equipo)}
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
  const { currentUser } = useAuth()
  const { dollarPrice } = useContext(DollarContext)

  const [equipos, setEquipos] = useState([])
  const [equiposFiltrados, setEquiposFiltrados] = useState([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [busquedaMarcaModelo, setBusquedaMarcaModelo] = useState("")
  const [busquedaIMEI, setBusquedaIMEI] = useState("")
  const [tipoFiltroActivo, setTipoFiltroActivo] = useState("marca-modelo")
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

  // --- NUEVOS ESTADOS PARA MÚLTIPLES PAGOS ---
  const [listaPagos, setListaPagos] = useState([])
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false)
  const [pagoActual, setPagoActual] = useState(null) // Para editar un pago existente o agregar uno nuevo
  const [indicePagoEditando, setIndicePagoEditando] = useState(null) // Para saber qué pago se edita

  const montoTotalVentaUSD = equipoSeleccionado
    ? (Number(equipoSeleccionado.precio) - (canjeCompletado ? Number(nuevoEquipoCanje.precio) || 0 : 0)) *
      (1 - porcentajeDescuento / 100)
    : 0

  const montoTotalPagadoUSD = listaPagos.reduce((sum, pago) => sum + Number(pago.monto_usd || 0), 0)
  const saldoPendienteUSD = montoTotalVentaUSD - montoTotalPagadoUSD

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)
        const puntoPorDefecto = puntos.find((p) => p.nombre.toLowerCase() === "trancas") || puntos[0]
        if (puntoPorDefecto) {
          setPuntoVentaSeleccionado(puntoPorDefecto.id.toString())
        }

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
          const adaptedEquipo = adaptEquipoService(equipo) // Usar el adaptador del servicio
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

  // Cálculos (se mantienen similares, pero el total de la venta es clave para los pagos)
  const precioBruto = equipoSeleccionado ? Number(equipoSeleccionado.precio) : 0
  const descuentoCanje = canjeCompletado ? Number(nuevoEquipoCanje.precio) || 0 : 0
  const subtotal = precioBruto - descuentoCanje
  const interes = (subtotal * porcentajeInteres) / 100 // Interés visual
  const descuentoAplicado = (subtotal * porcentajeDescuento) / 100
  const totalVentaRealUSD = subtotal - descuentoAplicado // Total que se debe pagar
  const totalVisualConInteres = subtotal + interes - descuentoAplicado // Total para mostrar con interés

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

  const seleccionarEquipo = (eq) => {
    if (eq.vendido) {
      toast.error(`Este equipo ya ha sido vendido`, { position: "bottom-right" })
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
    setListaPagos([]) // Resetear pagos al seleccionar nuevo equipo
    toast.success(`${eq.marca} ${eq.modelo} seleccionado`, { icon: "✅", position: "bottom-right" })
  }

  const removerSeleccion = () => {
    setEquipoSeleccionado(null)
    cancelarPlanCanje()
    setListaPagos([])
    toast.info("Selección eliminada", { position: "bottom-right" })
  }

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
    toast.success(`Cliente ${clienteSeleccionado.nombre} seleccionado`, { position: "bottom-right" })
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

  // Handlers Plan Canje (sin cambios mayores)
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
    toast.success("Plan Canje aplicado", { position: "bottom-right" })
  }
  const validarPasoCanje = () => {
    if (pasoActualCanje === 3) {
      return !!nuevoEquipoCanje.precio && !!nuevoEquipoCanje.imei
    }
    return true
  }

  // --- FUNCIONES PARA MANEJAR MÚLTIPLES PAGOS ---
  const abrirDialogNuevoPago = () => {
    setPagoActual({
      tipo_pago: tiposPagoDisponibles.length > 0 ? tiposPagoDisponibles[0].nombre : "",
      monto_usd: saldoPendienteUSD > 0 ? saldoPendienteUSD : 0, // Sugerir el saldo pendiente
      monto_ars: saldoPendienteUSD > 0 ? saldoPendienteUSD * dollarPrice : 0,
      tipo_cambio_pago: dollarPrice,
      descripcion: "",
    })
    setIndicePagoEditando(null)
    setDialogPagoAbierto(true)
  }

  const abrirDialogEditarPago = (pago, index) => {
    setPagoActual({ ...pago })
    setIndicePagoEditando(index)
    setDialogPagoAbierto(true)
  }

  const guardarPago = () => {
    if (
      !pagoActual ||
      !pagoActual.tipo_pago ||
      Number(pagoActual.monto_usd) <= 0 ||
      Number(pagoActual.tipo_cambio_pago) <= 0
    ) {
      toast.error("Complete todos los campos obligatorios del pago (Tipo, Monto USD > 0, TC Pago > 0).", {
        position: "bottom-right",
      })
      return
    }

    const tipoPagoInfo = tiposPagoDisponibles.find((tp) => tp.nombre === pagoActual.tipo_pago)
    const esCuentaCorriente =
      tipoPagoInfo &&
      (tipoPagoInfo.nombre.toLowerCase() === "cuenta corriente" || tipoPagoInfo.nombre.toLowerCase() === "cuenta")

    if (esCuentaCorriente && !cliente.id) {
      toast.error("Debe seleccionar un cliente para pagos con cuenta corriente.", { position: "bottom-right" })
      return
    }

    if (esCuentaCorriente && cuentaCorrienteInfo && cuentaCorrienteInfo.limite_credito > 0) {
      const saldoActualCC = Number(cuentaCorrienteInfo.saldo) || 0
      const montoPagoARS = Number(pagoActual.monto_ars) || 0
      // Calcular el impacto de este pago en la CC, considerando otros pagos de CC ya en la lista
      const otrosPagosCC_ARS = listaPagos
        .filter((p, idx) => {
          const esPagoCCExistente =
            p.tipo_pago.toLowerCase() === "cuenta corriente" || p.tipo_pago.toLowerCase() === "cuenta"
          return esPagoCCExistente && (indicePagoEditando === null || idx !== indicePagoEditando) // Excluir el pago actual si se está editando
        })
        .reduce((sum, p) => sum + Number(p.monto_ars || 0), 0)

      if (saldoActualCC + otrosPagosCC_ARS + montoPagoARS > cuentaCorrienteInfo.limite_credito) {
        toast.error(
          `Este pago excede el límite de crédito del cliente (${formatearMonedaARS(cuentaCorrienteInfo.limite_credito)}). Saldo CC actual: ${formatearMonedaARS(saldoActualCC)}, Otros pagos CC: ${formatearMonedaARS(otrosPagosCC_ARS)}, Este pago: ${formatearMonedaARS(montoPagoARS)}`,
          { position: "bottom-right", autoClose: 7000 },
        )
        return
      }
    }

    if (indicePagoEditando !== null) {
      const pagosActualizados = [...listaPagos]
      pagosActualizados[indicePagoEditando] = pagoActual
      setListaPagos(pagosActualizados)
    } else {
      setListaPagos([...listaPagos, pagoActual])
    }
    setDialogPagoAbierto(false)
    setPagoActual(null)
    setIndicePagoEditando(null)
  }

  const eliminarPago = (index) => {
    const pagosActualizados = listaPagos.filter((_, i) => i !== index)
    setListaPagos(pagosActualizados)
  }

  const handlePagoInputChange = (field, value) => {
    const newPagoActual = { ...pagoActual, [field]: value }

    if (field === "monto_usd" && pagoActual.tipo_cambio_pago > 0) {
      newPagoActual.monto_ars = (Number(value) * Number(pagoActual.tipo_cambio_pago)).toFixed(2)
    } else if (field === "monto_ars" && pagoActual.tipo_cambio_pago > 0) {
      newPagoActual.monto_usd = (Number(value) / Number(pagoActual.tipo_cambio_pago)).toFixed(2)
    } else if (field === "tipo_cambio_pago" && pagoActual.monto_usd > 0) {
      newPagoActual.monto_ars = (Number(pagoActual.monto_usd) * Number(value)).toFixed(2)
    }
    setPagoActual(newPagoActual)
  }
  // --- FIN FUNCIONES MÚLTIPLES PAGOS ---

  const finalizarVenta = async () => {
    if (!equipoSeleccionado) {
      toast.error("Debe seleccionar un equipo", { position: "bottom-right" })
      return
    }
    if (!cliente.id) {
      toast.error("Debe seleccionar un cliente", { position: "bottom-right" })
      return
    }
    if (listaPagos.length === 0) {
      toast.error("Debe agregar al menos un método de pago", { position: "bottom-right" })
      return
    }
    if (Math.abs(saldoPendienteUSD) > 0.01) {
      // Permitir una pequeña diferencia por redondeo
      const confirmContinue = window.confirm(
        `El total pagado (${formatearMonedaUSD(montoTotalPagadoUSD)}) no cubre el total de la venta (${formatearMonedaUSD(totalVentaRealUSD)}). Saldo pendiente: ${formatearMonedaUSD(saldoPendienteUSD)}. ¿Desea continuar igualmente?`,
      )
      if (!confirmContinue) {
        return
      }
    }
    if (!currentUser || !currentUser.id) {
      toast.error("Usuario no autenticado.", { position: "bottom-right" })
      return
    }

    setProcesandoVenta(true)
    try {
      const ventaData = {
        cliente_id: cliente.id,
        punto_venta_id: Number(puntoVentaSeleccionado || 1),
        equipo_id: equipoSeleccionado.id,
        porcentaje_interes: 0, // Interés visual no se envía
        porcentaje_descuento: porcentajeDescuento,
        plan_canje: canjeCompletado ? nuevoEquipoCanje : null,
        notas: `Venta de equipo ${equipoSeleccionado.marca} ${equipoSeleccionado.modelo}`,
        pagos: listaPagos.map((p) => ({
          // Asegurar que los montos sean números
          ...p,
          monto_usd: Number(p.monto_usd),
          monto_ars: Number(p.monto_ars),
          tipo_cambio_pago: Number(p.tipo_cambio_pago),
        })),
      }

      await createVentaEquipo(ventaData)
      toast.success(`Venta registrada con éxito`, { icon: "✅", position: "bottom-center", autoClose: 3000 })
      if (canjeCompletado) {
        toast.success(`Equipo de canje registrado`, { icon: "📱", position: "bottom-center", autoClose: 5000 })
      }

      // Actualizar cuenta corriente si hubo pagos de ese tipo
      const tienePagoCC = listaPagos.some((p) => p.tipo_pago.toLowerCase().includes("cuenta"))
      if (cliente.id && tienePagoCC) {
        const cuentaActualizada = await getCuentaCorrienteByCliente(cliente.id)
        setCuentaCorrienteInfo(cuentaActualizada)
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
      setListaPagos([]) // Resetear lista de pagos
      setCuentaCorrienteInfo(null)
      setMostrarInteresVisual(false)

      // Recargar equipos
      const equiposData = await getEquipos()
      const equiposAdaptados = equiposData.map(adaptEquipoService)
      setEquipos(equiposAdaptados.filter((eq) => !eq.vendido))
      setEquiposFiltrados(equiposAdaptados.filter((eq) => !eq.vendido))
    } catch (error) {
      console.error("Error al finalizar venta:", error)
      toast.error("Error al finalizar venta: " + (error.message || "Error desconocido"))
    } finally {
      setProcesandoVenta(false)
    }
  }

  const getNombrePuntoVenta = useCallback(
    (id) => {
      const puntoVenta = puntosVenta.find((p) => p.id.toString() === id)
      return puntoVenta ? puntoVenta.nombre : ""
    },
    [puntosVenta],
  )

  const aplicarPrecioCanje = (precio) => {
    if (pasoActualCanje === 3 && nuevoEquipoCanje) {
      setNuevoEquipoCanje({ ...nuevoEquipoCanje, precio: precio })
      setPreciosCanjesAbierto(false)
      toast.success(`Precio de ${formatearMonedaUSD(precio)} aplicado al canje`, { position: "bottom-right" })
    }
  }

  useEffect(() => {
    if (
      puntoVentaSeleccionado &&
      equipoSeleccionado &&
      equipoSeleccionado.puntoVenta?.id.toString() !== puntoVentaSeleccionado
    ) {
      setEquipoSeleccionado(null)
      cancelarPlanCanje()
      setListaPagos([])
      toast.info(`Selección limpiada por cambio de punto de venta a ${getNombrePuntoVenta(puntoVentaSeleccionado)}`, {
        position: "bottom-center",
      })
    }
  }, [puntoVentaSeleccionado, equipoSeleccionado, getNombrePuntoVenta])

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, idx) => (
      <div key={idx} className="flex items-center space-x-4 p-3 border-b">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="space-y-2 flex-1">
          {" "}
          <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-4 w-1/2" />{" "}
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))

  const limpiarBusqueda = () => {
    setBusquedaMarcaModelo("")
    setBusquedaIMEI("")
  }

  // Renderizado de pasos del Plan Canje (sin cambios mayores)
  const renderPasoCanje = () => {
    switch (pasoActualCanje) {
      case 1:
        return (
          /* ... JSX original ... */ <div className="grid grid-cols-1 gap-4">
            {" "}
            <div className="grid gap-2">
              {" "}
              <Label htmlFor="marca">
                {" "}
                Marca <span className="text-red-500">*</span>{" "}
              </Label>{" "}
              <Input
                id="marca"
                value={nuevoEquipoCanje.marca}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, marca: e.target.value })}
              />{" "}
            </div>{" "}
            <div className="grid gap-2">
              {" "}
              <Label htmlFor="modelo">
                {" "}
                Modelo <span className="text-red-500">*</span>{" "}
              </Label>{" "}
              <Input
                id="modelo"
                value={nuevoEquipoCanje.modelo}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, modelo: e.target.value })}
              />{" "}
            </div>{" "}
            <div className="grid gap-2">
              {" "}
              <Label htmlFor="descripcion">Descripción</Label>{" "}
              <Input
                id="descripcion"
                value={nuevoEquipoCanje.descripcion}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, descripcion: e.target.value })}
              />{" "}
            </div>{" "}
          </div>
        )
      case 2:
        return (
          /* ... JSX original ... */ <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {" "}
            <div className="grid gap-2">
              {" "}
              <Label htmlFor="memoria">Memoria</Label>{" "}
              <Input
                id="memoria"
                value={nuevoEquipoCanje.memoria}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, memoria: e.target.value })}
              />{" "}
            </div>{" "}
            <div className="grid gap-2">
              {" "}
              <Label htmlFor="color">Color</Label>{" "}
              <Input
                id="color"
                value={nuevoEquipoCanje.color}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, color: e.target.value })}
              />{" "}
            </div>{" "}
            <div className="grid gap-2 md:col-span-2">
              {" "}
              <Label htmlFor="bateria">Condición de la Batería</Label>{" "}
              <Input
                id="bateria"
                value={nuevoEquipoCanje.bateria}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, bateria: e.target.value })}
              />{" "}
            </div>{" "}
          </div>
        )
      case 3:
        return (
          /* ... JSX original ... */ <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {" "}
            <div className="grid gap-2 md:col-span-2">
              {" "}
              <Label htmlFor="precio" className="flex items-center gap-2">
                {" "}
                Precio de Canje (USD) <span className="text-red-500">*</span>{" "}
                <Badge variant="outline" className="font-normal text-xs">
                  {" "}
                  <DollarSign className="h-3 w-3 mr-1 text-orange-600" /> TC: ${dollarPrice.toFixed(2)}{" "}
                </Badge>{" "}
              </Label>{" "}
              <div className="relative">
                {" "}
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />{" "}
                <Input
                  id="precio"
                  type="text"
                  value={nuevoEquipoCanje.precio === 0 ? "" : nuevoEquipoCanje.precio}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setNuevoEquipoCanje({ ...nuevoEquipoCanje, precio: value === "" ? "" : Number.parseFloat(value) })
                    }
                  }}
                  onBlur={() => {
                    if (nuevoEquipoCanje.precio === "") {
                      setNuevoEquipoCanje({ ...nuevoEquipoCanje, precio: 0 })
                    }
                  }}
                  placeholder="0.00"
                  className="pl-8"
                  step="0.01"
                  min="0"
                />{" "}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 text-orange-600"
                  onClick={() => setPreciosCanjesAbierto(true)}
                >
                  {" "}
                  <DollarSign className="h-3.5 w-3.5 mr-1" /> Precios de referencia{" "}
                </Button>{" "}
              </div>{" "}
              {nuevoEquipoCanje.precio > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  {" "}
                  <Badge
                    variant="outline"
                    className="font-normal text-xs bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {" "}
                    Equivalente en ARS{" "}
                  </Badge>{" "}
                  <p className="text-sm font-medium text-orange-700">
                    {" "}
                    {formatearMonedaARS(nuevoEquipoCanje.precio * dollarPrice)}{" "}
                  </p>{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="grid gap-2 md:col-span-2">
              {" "}
              <Label htmlFor="imei">
                {" "}
                IMEI <span className="text-red-500">*</span>{" "}
              </Label>{" "}
              <Input
                id="imei"
                value={nuevoEquipoCanje.imei}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, imei: e.target.value })}
                placeholder="Ingrese el IMEI del equipo"
              />{" "}
            </div>{" "}
            <div className="grid gap-2">
              {" "}
              <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>{" "}
              <Input
                id="fechaIngreso"
                type="date"
                value={nuevoEquipoCanje.fechaIngreso}
                onChange={(e) => setNuevoEquipoCanje({ ...nuevoEquipoCanje, fechaIngreso: e.target.value })}
              />{" "}
            </div>{" "}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" autoClose={3000} />

      {/* Encabezado y selección de cliente/punto de venta (sin cambios mayores) */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar ventas de Equipos</h1>
            <div className="flex items-center mt-2">
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${getNombrePuntoVenta(puntoVentaSeleccionado) === "Tala" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-indigo-300 bg-indigo-50 text-indigo-700"}`}
              >
                <MapPin className="h-3.5 w-3.5" />
                Punto de venta: {getNombrePuntoVenta(puntoVentaSeleccionado)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={puntoVentaSeleccionado} onValueChange={setPuntoVentaSeleccionado}>
              <SelectTrigger className="w-[180px] h-9 bg-white shadow-sm">
                {" "}
                <SelectValue placeholder="Cambiar punto de venta" />{" "}
              </SelectTrigger>
              <SelectContent>
                {" "}
                {puntosVenta.map((punto) => (
                  <SelectItem key={punto.id} value={punto.id.toString()}>
                    {" "}
                    {punto.nombre}{" "}
                  </SelectItem>
                ))}{" "}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreciosCanjesAbierto(true)}
              className="h-9 bg-white shadow-sm flex items-center gap-1"
            >
              {" "}
              <DollarSign size={14} /> <span>Precios Canjes</span>{" "}
            </Button>
            <Dialog open={dialogClienteAbierto} onOpenChange={setDialogClienteAbierto}>
              <DialogTrigger asChild>
                {" "}
                <Button variant="outline" size="sm" className="h-9 bg-white shadow-sm flex items-center gap-1">
                  {" "}
                  <User size={14} />{" "}
                  <span className="hidden sm:inline">
                    {" "}
                    Cliente<span className="text-red-500">*</span>:{" "}
                  </span>{" "}
                  {cliente.nombre}{" "}
                </Button>{" "}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  {" "}
                  <DialogTitle className="text-orange-600">Datos del Cliente</DialogTitle>{" "}
                  <DialogDescription>Busca un cliente existente o crea uno nuevo</DialogDescription>{" "}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {" "}
                  <div className="grid gap-2">
                    {" "}
                    <Label>Buscar cliente</Label>{" "}
                    <div className="relative">
                      {" "}
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />{" "}
                      <Input
                        placeholder="Buscar por nombre, teléfono o DNI..."
                        className="pl-8"
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                      />{" "}
                    </div>{" "}
                    {clientesBusqueda.length > 0 && (
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        {" "}
                        {clientesBusqueda.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer flex justify-between items-center"
                            onClick={() => seleccionarCliente(cliente)}
                          >
                            {" "}
                            <div>
                              {" "}
                              <p className="font-medium">{cliente.nombre}</p>{" "}
                              <div className="flex flex-col text-xs text-gray-500">
                                {" "}
                                {cliente.dni && <span>DNI: {cliente.dni}</span>}{" "}
                                {cliente.telefono && <span>Tel: {cliente.telefono}</span>}{" "}
                              </div>{" "}
                            </div>{" "}
                            <Button variant="ghost" size="sm">
                              {" "}
                              Seleccionar{" "}
                            </Button>{" "}
                          </div>
                        ))}{" "}
                      </ScrollArea>
                    )}{" "}
                    <div className="flex justify-between items-center mt-2">
                      {" "}
                      <Separator className="flex-1" /> <span className="px-2 text-xs text-gray-500">o</span>{" "}
                      <Separator className="flex-1" />{" "}
                    </div>{" "}
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => {
                        setDialogNuevoClienteAbierto(true)
                        setNuevoCliente({ nombre: "", telefono: "", dni: "" })
                      }}
                    >
                      {" "}
                      <UserPlus className="h-4 w-4 mr-2" /> Crear nuevo cliente{" "}
                    </Button>{" "}
                  </div>{" "}
                </div>
                <DialogFooter>
                  {" "}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogClienteAbierto(false)
                      setBusquedaCliente("")
                      setClientesBusqueda([])
                    }}
                  >
                    {" "}
                    Cancelar{" "}
                  </Button>{" "}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogNuevoClienteAbierto} onOpenChange={setDialogNuevoClienteAbierto}>
              <DialogContent>
                <DialogHeader>
                  {" "}
                  <DialogTitle className="text-orange-600">Nuevo Cliente</DialogTitle>{" "}
                  <DialogDescription>Ingresa los datos del nuevo cliente</DialogDescription>{" "}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {" "}
                  <div className="grid gap-2">
                    {" "}
                    <Label htmlFor="nombre">
                      {" "}
                      Nombre <span className="text-red-500">*</span>{" "}
                    </Label>{" "}
                    <Input
                      id="nombre"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                      placeholder="Nombre del cliente"
                    />{" "}
                  </div>{" "}
                  <div className="grid gap-2">
                    {" "}
                    <Label htmlFor="dni">DNI</Label>{" "}
                    <Input
                      id="dni"
                      value={nuevoCliente.dni}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, dni: e.target.value })}
                      placeholder="Documento de identidad"
                    />{" "}
                  </div>{" "}
                  <div className="grid gap-2">
                    {" "}
                    <Label htmlFor="telefono">Teléfono</Label>{" "}
                    <Input
                      id="telefono"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                      placeholder="Número de teléfono"
                    />{" "}
                  </div>{" "}
                </div>
                <DialogFooter>
                  {" "}
                  <Button variant="outline" onClick={() => setDialogNuevoClienteAbierto(false)}>
                    {" "}
                    Cancelar{" "}
                  </Button>{" "}
                  <Button onClick={crearNuevoCliente} className="bg-orange-600 hover:bg-orange-700">
                    {" "}
                    Guardar{" "}
                  </Button>{" "}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipos Disponibles (sin cambios mayores) */}
        <Card className="lg:col-span-1 overflow-hidden border-0 shadow-md bg-white">
          <CardHeader className="bg-[#131321]">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              {" "}
              <Smartphone size={20} /> Equipos Disponibles{" "}
            </CardTitle>
            <CardDescription className="text-brand-100">
              {" "}
              Venta en punto: {getNombrePuntoVenta(puntoVentaSeleccionado)} - Solo puedes vender equipos de este punto{" "}
            </CardDescription>
            <div className="mt-2">
              <Tabs value={tipoFiltroActivo} onValueChange={setTipoFiltroActivo} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  {" "}
                  <TabsTrigger value="marca-modelo" className="text-xs">
                    {" "}
                    <Search className="h-3.5 w-3.5 mr-1" /> Marca/Modelo{" "}
                  </TabsTrigger>{" "}
                  <TabsTrigger value="imei" className="text-xs">
                    {" "}
                    <Barcode className="h-3.5 w-3.5 mr-1" /> IMEI{" "}
                  </TabsTrigger>{" "}
                </TabsList>
                <TabsContent value="marca-modelo" className="mt-2">
                  {" "}
                  <div className="relative">
                    {" "}
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />{" "}
                    <Input
                      type="text"
                      placeholder="Buscar por marca y modelo..."
                      className="pl-8 bg-white/90 border-0 focus-visible:ring-brand-500"
                      value={busquedaMarcaModelo}
                      onChange={(e) => setBusquedaMarcaModelo(e.target.value)}
                    />{" "}
                    {busquedaMarcaModelo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBusquedaMarcaModelo("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                      >
                        {" "}
                        <X className="h-3.5 w-3.5" />{" "}
                      </Button>
                    )}{" "}
                  </div>{" "}
                </TabsContent>
                <TabsContent value="imei" className="mt-2">
                  {" "}
                  <div className="relative">
                    {" "}
                    <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />{" "}
                    <Input
                      type="text"
                      placeholder="Buscar por IMEI..."
                      className="pl-8 bg-white/90 border-0 focus-visible:ring-brand-500"
                      value={busquedaIMEI}
                      onChange={(e) => setBusquedaIMEI(e.target.value)}
                    />{" "}
                    {busquedaIMEI && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBusquedaIMEI("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                      >
                        {" "}
                        <X className="h-3.5 w-3.5" />{" "}
                      </Button>
                    )}{" "}
                  </div>{" "}
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
                  {" "}
                  {equiposFiltrados.map((eq) => (
                    <EquipoCard
                      key={eq.id}
                      equipo={eq}
                      onSelect={seleccionarEquipo}
                      dollarPrice={dollarPrice}
                      puntoVentaSeleccionado={puntoVentaSeleccionado}
                      getNombrePuntoVenta={getNombrePuntoVenta}
                    />
                  ))}{" "}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  {" "}
                  <Search className="mx-auto h-12 w-12 text-gray-600 mb-3" />{" "}
                  <h3 className="text-lg font-medium mb-1">No se encontraron equipos</h3>{" "}
                  <p className="text-sm">Intenta con otra búsqueda</p>{" "}
                  {(busquedaMarcaModelo || busquedaIMEI) && (
                    <Button variant="outline" size="sm" onClick={limpiarBusqueda} className="mt-3">
                      {" "}
                      <X className="h-3.5 w-3.5 mr-1" /> Limpiar búsqueda{" "}
                    </Button>
                  )}{" "}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="text-xs text-gray-700 flex justify-between py-3 border-t">
            {" "}
            <span>Total: {equiposFiltrados.length} equipos</span>{" "}
            <span className="flex items-center gap-1">
              {" "}
              <Info size={12} /> Doble clic para seleccionar{" "}
            </span>{" "}
          </CardFooter>
        </Card>

        {/* Detalle de Venta */}
        <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-[#131321] border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                {" "}
                <ShoppingCart size={20} /> Detalle de Venta{" "}
              </CardTitle>
              <div className="flex items-center gap-2">
                {" "}
                <span className="text-sm text-gray-300">Cliente:</span>{" "}
                <Badge variant="outline" className="flex items-center gap-1 bg-white">
                  {" "}
                  <User size={14} /> {cliente.nombre || "—"}{" "}
                </Badge>{" "}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {equipoSeleccionado ? (
              <div className="p-4">
                <Table>
                  <TableHeader>
                    {" "}
                    <TableRow className="hover:bg-transparent">
                      {" "}
                      <TableHead className="text-orange-600">Equipo</TableHead>{" "}
                      <TableHead className="text-orange-600 text-right">Precio</TableHead>{" "}
                      <TableHead className="w-[50px]"></TableHead>{" "}
                    </TableRow>{" "}
                  </TableHeader>
                  <TableBody>
                    {" "}
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      {" "}
                      <TableCell>
                        {" "}
                        <div>
                          {" "}
                          <p className="font-medium">
                            {" "}
                            {equipoSeleccionado.marca} {equipoSeleccionado.modelo}{" "}
                          </p>{" "}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {" "}
                            <Badge variant="outline" className="text-xs">
                              {" "}
                              {equipoSeleccionado.memoria || "N/A"}{" "}
                            </Badge>{" "}
                            <Badge variant="outline" className="text-xs">
                              {" "}
                              {equipoSeleccionado.color || "N/A"}{" "}
                            </Badge>{" "}
                            <Badge variant="outline" className="text-xs">
                              {" "}
                              Batería: {equipoSeleccionado.bateria}%{" "}
                            </Badge>{" "}
                          </div>{" "}
                          <p className="text-xs text-gray-500 mt-1">IMEI: {equipoSeleccionado.imei}</p>{" "}
                        </div>{" "}
                      </TableCell>{" "}
                      <TableCell className="text-right">
                        {" "}
                        <p className="font-medium text-orange-600">${Number(equipoSeleccionado.precio).toFixed(2)}</p>{" "}
                        <p className="text-xs text-gray-500">
                          {" "}
                          {formatearMonedaARS(Number(equipoSeleccionado.precio) * dollarPrice)}{" "}
                        </p>{" "}
                      </TableCell>{" "}
                      <TableCell>
                        {" "}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={removerSeleccion}
                        >
                          {" "}
                          <Trash2 size={14} />{" "}
                        </Button>{" "}
                      </TableCell>{" "}
                    </motion.tr>{" "}
                  </TableBody>
                </Table>
                {/* Plan Canje (sin cambios mayores) */}
                <div className="mt-6">
                  {" "}
                  {!canjeCompletado ? (
                    <div className="flex items-center justify-between">
                      {" "}
                      {!planCanjeAbierto ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={abrirPlanCanje}
                          className="gap-1 bg-[#131321] text-orange-600 hover:bg-[#1f1f30] hover:text-orange-600"
                        >
                          {" "}
                          <RefreshCw size={14} className="mr-1" /> Plan Canje{" "}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelarPlanCanje}
                          className="text-red-500 hover:text-red-700 gap-1"
                        >
                          {" "}
                          <X size={14} /> Cancelar{" "}
                        </Button>
                      )}{" "}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      {" "}
                      <div className="flex items-start justify-between">
                        {" "}
                        <div className="flex gap-3">
                          {" "}
                          <div className="bg-green-100 rounded-full p-1 h-6">
                            {" "}
                            <Check size={18} className="text-green-600" />{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <h3 className="font-medium text-green-800">Plan Canje Aplicado</h3>{" "}
                            <p className="text-sm text-green-700">
                              {" "}
                              {nuevoEquipoCanje.marca} {nuevoEquipoCanje.modelo}{" "}
                            </p>{" "}
                            <div className="flex items-center gap-2 mt-1">
                              {" "}
                              <span className="text-xs text-green-700">${nuevoEquipoCanje.precio.toFixed(2)} USD</span>{" "}
                              <span className="text-xs text-green-700">|</span>{" "}
                              <span className="text-xs text-green-700">
                                {" "}
                                {formatearMonedaARS(nuevoEquipoCanje.precio * dollarPrice)}{" "}
                              </span>{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelarPlanCanje}
                          className="text-red-500 hover:text-red-700"
                        >
                          {" "}
                          <X size={14} />{" "}
                        </Button>{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                  {planCanjeAbierto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 border rounded-lg p-4 bg-white border-[#131321]"
                    >
                      {" "}
                      <div className="flex items-center justify-between mb-4">
                        {" "}
                        <h3 className="font-medium flex items-center gap-2 text-orange-600">
                          {" "}
                          <Smartphone size={16} /> Datos del equipo a entregar{" "}
                        </h3>{" "}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          Paso {pasoActualCanje} de 3
                        </div>{" "}
                      </div>{" "}
                      <div className="mb-6">
                        {" "}
                        <div className="flex justify-between items-center mb-2">
                          {" "}
                          {[1, 2, 3].map((paso) => (
                            <div key={paso} className="flex items-center gap-2">
                              {" "}
                              <div
                                className={`rounded-full text-xs w-5 h-5 flex items-center justify-center ${pasoActualCanje >= paso ? "bg-orange-600 text-white" : "bg-gray-200"}`}
                              >
                                {" "}
                                {pasoActualCanje > paso ? <Check size={12} /> : paso}{" "}
                              </div>{" "}
                              <span
                                className={pasoActualCanje === paso ? "font-medium text-sm" : "text-gray-500 text-sm"}
                              >
                                {" "}
                                {paso === 1 ? "Información básica" : paso === 2 ? "Características" : "Valoración"}{" "}
                              </span>{" "}
                            </div>
                          ))}{" "}
                        </div>{" "}
                      </div>{" "}
                      {renderPasoCanje()}{" "}
                      <div className="flex justify-between mt-6">
                        {" "}
                        <Button
                          variant="outline"
                          onClick={anteriorPasoCanje}
                          disabled={pasoActualCanje === 1}
                          className="border-gray-200"
                        >
                          {" "}
                          Anterior{" "}
                        </Button>{" "}
                        <Button
                          onClick={siguientePasoCanje}
                          disabled={!validarPasoCanje()}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {" "}
                          {pasoActualCanje === 3 ? "Finalizar" : "Siguiente"}{" "}
                        </Button>{" "}
                      </div>{" "}
                    </motion.div>
                  )}{" "}
                </div>
                {/* Cálculos (sin cambios mayores) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 bg-gray-50 border-t rounded-lg"
                >
                  {" "}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    {" "}
                    <div className="flex flex-col space-y-3">
                      {" "}
                      <div className="flex justify-between items-center">
                        {" "}
                        <span className="text-gray-500">Subtotal:</span>{" "}
                        <span className="font-medium">${subtotal.toFixed(2)}</span>{" "}
                      </div>{" "}
                      <div className="flex items-center justify-between">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                            {" "}
                            <Percent className="h-3.5 w-3.5 text-orange-500" />{" "}
                            <NumericFormat
                              value={interesInputValue}
                              onValueChange={(values) => {
                                const { value } = values
                                setInteresInputValue(value)
                                setPorcentajeInteres(Number(value) || 0)
                                setMostrarInteresVisual(Number(value) > 0)
                              }}
                              decimalScale={2}
                              decimalSeparator=","
                              allowNegative={false}
                              className="w-12 h-6 text-sm p-0 border-0 bg-transparent focus-visible:ring-0 text-center"
                              onFocus={handleInteresFocus}
                              onBlur={handleInteresBlur}
                            />{" "}
                          </div>{" "}
                          <span className="text-sm text-gray-500">Interés</span>{" "}
                          <TooltipProvider>
                            {" "}
                            <Tooltip>
                              {" "}
                              <TooltipTrigger>
                                {" "}
                                <AlertCircle className="h-4 w-4 text-orange-500" />{" "}
                              </TooltipTrigger>{" "}
                              <TooltipContent>
                                {" "}
                                <p className="max-w-xs text-xs">
                                  {" "}
                                  Este interés es solo informativo para mostrar al cliente el precio con tarjeta o
                                  transferencia. No afecta al total de la venta.{" "}
                                </p>{" "}
                              </TooltipContent>{" "}
                            </Tooltip>{" "}
                          </TooltipProvider>{" "}
                        </div>{" "}
                        {porcentajeInteres > 0 && (
                          <span className="text-orange-600 font-medium">+${interes.toFixed(2)}</span>
                        )}{" "}
                      </div>{" "}
                      <div className="flex items-center justify-between">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                            {" "}
                            <Percent className="h-3.5 w-3.5 text-green-500" />{" "}
                            <NumericFormat
                              value={descuentoInputValue}
                              onValueChange={(values) => {
                                const { value } = values
                                setDescuentoInputValue(value)
                                setPorcentajeDescuento(Number(value) || 0)
                              }}
                              decimalScale={2}
                              decimalSeparator=","
                              allowNegative={false}
                              className="w-12 h-6 text-sm p-0 border-0 bg-transparent focus-visible:ring-0 text-center"
                              onFocus={handleDescuentoFocus}
                              onBlur={handleDescuentoBlur}
                            />{" "}
                          </div>{" "}
                          <span className="text-sm text-gray-500">Descuento</span>{" "}
                        </div>{" "}
                        {porcentajeDescuento > 0 && (
                          <span className="text-green-600 font-medium">-${descuentoAplicado.toFixed(2)}</span>
                        )}{" "}
                      </div>{" "}
                      <Separator className="my-1" />{" "}
                      <div className="flex justify-between text-lg font-bold">
                        {" "}
                        <span>Total Venta:</span>{" "}
                        <span className="text-orange-600">${totalVentaRealUSD.toFixed(2)}</span>{" "}
                      </div>{" "}
                      {mostrarInteresVisual && porcentajeInteres > 0 && (
                        <div className="flex justify-between text-sm">
                          {" "}
                          <span className="text-gray-500 flex items-center gap-1">
                            {" "}
                            <CreditCardIcon className="h-3.5 w-3.5" /> Total con interés:{" "}
                          </span>{" "}
                          <span className="text-orange-500">${totalVisualConInteres.toFixed(2)}</span>{" "}
                        </div>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-16 px-4 text-gray-500 border-b">
                {" "}
                <div className="bg-gray-50 p-8 rounded-xl inline-flex flex-col items-center">
                  {" "}
                  <Smartphone className="h-16 w-16 text-gray-300 mb-4" strokeWidth={1.5} />{" "}
                  <h3 className="text-xl font-medium mb-2 text-gray-800">No hay equipo seleccionado</h3>{" "}
                  <p className="text-sm max-w-md">
                    {" "}
                    Busca y haz doble clic en un equipo para seleccionarlo. Recuerda que también debes seleccionar un
                    cliente para completar la venta.{" "}
                  </p>{" "}
                </div>{" "}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                removerSeleccion()
                setCliente({ id: null, nombre: "Seleccione un cliente", telefono: "", dni: "" })
              }}
              disabled={!equipoSeleccionado}
              className="bg-gray-600 hover:bg-red-800 text-gray-100 hover:text-gray-100"
            >
              {" "}
              Cancelar{" "}
            </Button>
            <Dialog open={dialogFinalizarAbierto} onOpenChange={setDialogFinalizarAbierto}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setDialogFinalizarAbierto(true)}
                  disabled={!equipoSeleccionado || !cliente.id}
                  className="gap-1 bg-orange-600 hover:bg-orange-700"
                >
                  {" "}
                  <Receipt size={16} /> Finalizar Venta{" "}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                {" "}
                {/* Aumentar ancho del modal */}
                <DialogHeader>
                  {" "}
                  <DialogTitle className="text-orange-600">Confirmar y Registrar Pagos</DialogTitle>{" "}
                  <DialogDescription>Revisa los detalles y registra los métodos de pago.</DialogDescription>{" "}
                </DialogHeader>
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda: Detalles de la Venta */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3 text-gray-700">Resumen de la Venta:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cliente:</span>
                        <span className="font-medium">{cliente.nombre}</span>
                      </div>
                      {cliente.dni && (
                        <div className="flex justify-between">
                          <span>DNI:</span>
                          <span>{cliente.dni}</span>
                        </div>
                      )}
                      {cliente.telefono && (
                        <div className="flex justify-between">
                          <span>Teléfono:</span>
                          <span>{cliente.telefono}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Equipo:</span>
                        <span>
                          {equipoSeleccionado?.marca} {equipoSeleccionado?.modelo}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Precio Bruto:</span>
                        <span>{formatearMonedaUSD(precioBruto)}</span>
                      </div>
                      {canjeCompletado && (
                        <div className="flex justify-between text-red-600">
                          <span>Descuento Canje:</span>
                          <span>-{formatearMonedaUSD(descuentoCanje)}</span>
                        </div>
                      )}
                      {porcentajeDescuento > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento ({porcentajeDescuento}%):</span>
                          <span>-{formatearMonedaUSD(descuentoAplicado)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total Venta:</span>
                        <span className="text-orange-600">{formatearMonedaUSD(totalVentaRealUSD)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span></span>
                        <span>{formatearMonedaARS(totalVentaRealUSD * dollarPrice)}</span>
                      </div>
                      {mostrarInteresVisual && porcentajeInteres > 0 && (
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600 flex items-center gap-1">
                            <CreditCardIcon className="h-3.5 w-3.5" />
                            Total con interés visual:
                          </span>
                          <span className="text-orange-500">{formatearMonedaUSD(totalVisualConInteres)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Gestión de Pagos */}
                  <div className="bg-white rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Métodos de Pago:</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={abrirDialogNuevoPago}
                        className="gap-1 text-orange-600 border-orange-500 hover:bg-orange-50"
                      >
                        {" "}
                        <PlusCircle size={14} /> Agregar Pago{" "}
                      </Button>
                    </div>
                    {listaPagos.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No hay pagos agregados.</p>
                    ) : (
                      <ScrollArea className="h-[200px] pr-2">
                        <div className="space-y-2">
                          {listaPagos.map((pago, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
                            >
                              <div>
                                <p className="text-xs font-medium">{pago.tipo_pago}</p>
                                <p className="text-xs text-gray-600">
                                  {formatearMonedaUSD(pago.monto_usd)} ({formatearMonedaARS(pago.monto_ars)})
                                </p>
                                {pago.descripcion && (
                                  <p className="text-xs text-gray-500 italic truncate max-w-[150px]">
                                    {pago.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-600"
                                  onClick={() => abrirDialogEditarPago(pago, index)}
                                >
                                  {" "}
                                  <Edit3 size={12} />{" "}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-600"
                                  onClick={() => eliminarPago(index)}
                                >
                                  {" "}
                                  <Trash2 size={12} />{" "}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <Separator className="my-3" />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Pagado:</span>
                        <span className="font-medium">{formatearMonedaUSD(montoTotalPagadoUSD)}</span>
                      </div>
                      <div
                        className={`flex justify-between ${saldoPendienteUSD > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        <span>Saldo Pendiente:</span>
                        <span className="font-medium">{formatearMonedaUSD(saldoPendienteUSD)}</span>
                      </div>
                    </div>
                    {cliente.id && cuentaCorrienteInfo && (
                      <div className="mt-2 pt-2 border-t text-xs">
                        <p className="text-gray-600">
                          Saldo CC Actual:{" "}
                          <span
                            className={`font-medium ${cuentaCorrienteInfo.saldo > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {formatearMonedaARS(cuentaCorrienteInfo.saldo)}
                          </span>
                        </p>
                        {cuentaCorrienteInfo.limite_credito > 0 && (
                          <p className="text-gray-500">
                            Límite CC: {formatearMonedaARS(cuentaCorrienteInfo.limite_credito)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="bg-gray-600 hover:bg-red-800 text-gray-100 hover:text-gray-100"
                    >
                      {" "}
                      Cancelar{" "}
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={finalizarVenta}
                    className="gap-1 bg-orange-600 hover:bg-orange-700"
                    disabled={
                      listaPagos.length === 0 ||
                      procesandoVenta ||
                      Math.abs(saldoPendienteUSD) > 0.01 /* Permitir si está cubierto */
                    }
                  >
                    {procesandoVenta ? (
                      <>
                        <span className="mr-1">Procesando</span>
                        <span className="animate-spin">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                        </span>
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Confirmar Venta
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>

      {/* Dialog para agregar/editar pago */}
      <Dialog open={dialogPagoAbierto} onOpenChange={setDialogPagoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-600">
              {indicePagoEditando !== null ? "Editar" : "Agregar"} Método de Pago
            </DialogTitle>
          </DialogHeader>
          {pagoActual && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo_pago_modal">
                  Tipo de Pago <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={pagoActual.tipo_pago}
                  onValueChange={(value) => handlePagoInputChange("tipo_pago", value)}
                >
                  <SelectTrigger id="tipo_pago_modal">
                    {" "}
                    <SelectValue placeholder="Seleccione un tipo" />{" "}
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPagoDisponibles.map((tipo) => (
                      <SelectItem
                        key={tipo.id}
                        value={tipo.nombre}
                        disabled={tipo.nombre.toLowerCase().includes("cuenta") && !cliente.id}
                      >
                        {tipo.nombre}{" "}
                        {tipo.nombre.toLowerCase().includes("cuenta") && !cliente.id ? "(Req. Cliente)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="monto_usd_modal">
                    Monto USD <span className="text-red-500">*</span>
                  </Label>
                  <NumericFormat
                    id="monto_usd_modal"
                    value={pagoActual.monto_usd}
                    onValueChange={(values) => handlePagoInputChange("monto_usd", values.floatValue || 0)}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$"
                    decimalScale={2}
                    allowNegative={false}
                    customInput={Input}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo_cambio_pago_modal">
                    Tipo Cambio Pago <span className="text-red-500">*</span>
                  </Label>
                  <NumericFormat
                    id="tipo_cambio_pago_modal"
                    value={pagoActual.tipo_cambio_pago}
                    onValueChange={(values) =>
                      handlePagoInputChange("tipo_cambio_pago", values.floatValue || dollarPrice)
                    }
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$"
                    decimalScale={2}
                    allowNegative={false}
                    customInput={Input}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monto_ars_modal">Monto ARS (calculado)</Label>
                <NumericFormat
                  id="monto_ars_modal"
                  value={pagoActual.monto_ars}
                  onValueChange={(values) => handlePagoInputChange("monto_ars", values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$"
                  decimalScale={2}
                  allowNegative={false}
                  customInput={Input}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion_pago_modal">Descripción (Opcional)</Label>
                <Input
                  id="descripcion_pago_modal"
                  value={pagoActual.descripcion}
                  onChange={(e) => handlePagoInputChange("descripcion", e.target.value)}
                  placeholder="Ej: Nro. transacción, CBU, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagoAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarPago} className="bg-orange-600 hover:bg-orange-700">
              Guardar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PreciosCanjes
        isOpen={preciosCanjesAbierto}
        onClose={() => setPreciosCanjesAbierto(false)}
        dollarPrice={dollarPrice}
        onSelectPrice={aplicarPrecioCanje}
        showApplyButtons={pasoActualCanje === 3}
      />
    </div>
  )
}

export default VentasEquipos
