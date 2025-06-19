"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Package,
  Percent,
  Save,
  Info,
  Receipt,
  X,
  MapPin,
  PercentCircle,
  Filter,
  UserPlus,
  TrendingUp,
  CalendarDays,
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Importar servicios optimizados
import { getProductosPaginados, adaptProductoToFrontend } from "@/services/productosService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getCategorias } from "@/services/categoriasService"
import { searchClientes, createCliente } from "@/services/clientesService"
import { getTiposPago } from "@/services/pagosService"
import { createVenta } from "@/services/ventasService"
import { getCuentaCorrienteByCliente } from "@/services/cuentasCorrientesService"
import { useAuth } from "@/context/AuthContext"

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

// Función para formatear moneda
const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numero)
}

const VentasProductos = () => {
  const { currentUser } = useAuth()

  // Estados principales
  const [busqueda, setBusqueda] = useState("")
  const [productos, setProductos] = useState([])
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [cargando, setCargando] = useState(false)

  // Estados de venta
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0)
  const [cliente, setCliente] = useState({ id: null, nombre: "Cliente General", telefono: "", dni: "" })
  const [dialogClienteAbierto, setDialogClienteAbierto] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", dni: "" })
  const [dialogFinalizarAbierto, setDialogFinalizarAbierto] = useState(false)
  const [descuentoInputValue, setDescuentoInputValue] = useState("0")

  // Estados de configuración
  const [puntosVenta, setPuntosVenta] = useState([])
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [categorias, setCategorias] = useState([])
  const [tiposPagoDisponibles, setTiposPagoDisponibles] = useState([])
  const [clientesBusqueda, setClientesBusqueda] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [dialogNuevoClienteAbierto, setDialogNuevoClienteAbierto] = useState(false)
  const [procesandoVenta, setProcesandoVenta] = useState(false)
  const [cuentaCorrienteInfo, setCuentaCorrienteInfo] = useState(null)
  const [cargandoCuentaCorriente, setCargandoCuentaCorriente] = useState(false)

  // Estados para múltiples pagos
  const [pagos, setPagos] = useState([])
  const [montoPagoActual, setMontoPagoActual] = useState("")
  const [tipoPagoActual, setTipoPagoActual] = useState("")

  // Debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(busqueda, 300)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)
        if (puntos.length > 0) {
          const trancas = puntos.find((p) => p.nombre.toLowerCase() === "trancas")
          setPuntoVentaSeleccionado(trancas ? trancas.id.toString() : puntos[0].id.toString())
        }

        const cats = await getCategorias()
        setCategorias(cats)

        const tipos = await getTiposPago()
        setTiposPagoDisponibles(tipos)
        if (tipos.length > 0) {
          setTipoPagoActual(tipos[0].id.toString())
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      }
    }

    cargarDatosIniciales()
  }, [])

  // Limpiar carrito cuando cambia el punto de venta
  useEffect(() => {
    if (puntoVentaSeleccionado && productosSeleccionados.length > 0) {
      setProductosSeleccionados([])
      toast.info(`Se ha limpiado el carrito debido al cambio de punto de venta.`, {
        position: "bottom-center",
      })
    }
  }, [puntoVentaSeleccionado])

  // Búsqueda de productos
  const buscarProductos = useCallback(async () => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      setProductos([])
      return
    }

    setCargando(true)
    try {
      const filters = {
        search: debouncedSearchTerm,
        punto_venta_id: puntoVentaSeleccionado,
        categoria_id: filtroCategoria !== "todos" ? filtroCategoria : undefined,
      }

      const result = await getProductosPaginados(1, 50, filters)
      const productosAdaptados = result.data.map(adaptProductoToFrontend).map((prod) => ({
        ...prod,
        price: typeof prod.price === "number" ? prod.price : Number.parseFloat(prod.price) || 0,
      }))

      setProductos(productosAdaptados)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      toast.error("Error al buscar productos")
    } finally {
      setCargando(false)
    }
  }, [debouncedSearchTerm, puntoVentaSeleccionado, filtroCategoria])

  useEffect(() => {
    buscarProductos()
  }, [buscarProductos])

  // Búsqueda de clientes
  useEffect(() => {
    const buscar = async () => {
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
    const timeoutId = setTimeout(buscar, 300)
    return () => clearTimeout(timeoutId)
  }, [busquedaCliente])

  // Cargar cuenta corriente del cliente
  useEffect(() => {
    const cargarCuenta = async () => {
      if (!cliente.id) {
        setCuentaCorrienteInfo(null)
        return
      }
      setCargandoCuentaCorriente(true)
      try {
        const cuenta = await getCuentaCorrienteByCliente(cliente.id)
        setCuentaCorrienteInfo(cuenta)
      } catch (error) {
        if (error.message?.includes("no tiene cuenta corriente")) {
          setCuentaCorrienteInfo({ saldo: 0, limite_credito: 0, activo: true, cliente_id: cliente.id })
        } else {
          toast.error("Error al cargar cuenta corriente")
        }
      } finally {
        setCargandoCuentaCorriente(false)
      }
    }
    cargarCuenta()
  }, [cliente.id])

  // Cálculos de la venta
  const calcularPrecioConDescuento = (producto) => {
    if (!producto.discount || new Date(producto.discount.endDate) <= new Date()) {
      return Number.parseFloat(producto.price) || 0
    }
    return (Number.parseFloat(producto.price) || 0) * (1 - (Number.parseFloat(producto.discount.percentage) || 0) / 100)
  }

  const calcularSubtotal = () => {
    return productosSeleccionados.reduce((sum, item) => {
      return sum + calcularPrecioConDescuento(item) * item.cantidad
    }, 0)
  }

  const calcularDescuento = () => (calcularSubtotal() * porcentajeDescuento) / 100

  const calcularTotal = () => calcularSubtotal() - calcularDescuento()

  const calcularTotalPagado = () => pagos.reduce((total, pago) => total + Number(pago.monto), 0)

  const calcularRestante = () => calcularTotal() - calcularTotalPagado()

  // Handlers de inputs
  const handleDescuentoFocus = () => {
    if (descuentoInputValue === "0") setDescuentoInputValue("")
  }

  const handleDescuentoBlur = () => {
    if (descuentoInputValue === "") {
      setDescuentoInputValue("0")
      setPorcentajeDescuento(0)
    }
  }

  // Acciones sobre productos
  const agregarProducto = (prod) => {
    if (prod.punto_venta_id.toString() !== puntoVentaSeleccionado) {
      toast.error(`Solo puedes vender productos de ${getNombrePuntoVenta(puntoVentaSeleccionado)}`)
      return
    }
    if (prod.stock <= 0) {
      toast.error("Este producto no tiene stock disponible")
      return
    }
    const existe = productosSeleccionados.find((i) => i.id === prod.id)
    if (existe) {
      if (existe.cantidad >= prod.stock) {
        toast.error(`Solo hay ${prod.stock} unidades disponibles`)
        return
      }
      setProductosSeleccionados((ps) => ps.map((i) => (i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)))
    } else {
      setProductosSeleccionados((ps) => [...ps, { ...prod, cantidad: 1 }])
    }
    toast.success(`${prod.name} agregado al carrito`, { icon: "🛒" })
  }

  const cambiarCantidad = (id, nueva) => {
    if (nueva < 1) return
    const producto = productos.find((x) => x.id === id) || productosSeleccionados.find((x) => x.id === id)
    if (nueva > producto.stock) {
      toast.error(`Solo hay ${producto.stock} unidades disponibles`)
      return
    }
    setProductosSeleccionados((ps) => ps.map((i) => (i.id === id ? { ...i, cantidad: nueva } : i)))
  }

  const eliminarProducto = (id) => {
    setProductosSeleccionados((ps) => ps.filter((i) => i.id !== id))
    toast.success("Producto eliminado del carrito", { icon: "🗑️" })
  }

  // Acciones sobre clientes
  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.error("El nombre del cliente es obligatorio")
      return
    }
    try {
      const clienteCreado = await createCliente(nuevoCliente)
      setCliente(clienteCreado)
      setDialogNuevoClienteAbierto(false)
      setDialogClienteAbierto(false)
      toast.success("Cliente creado correctamente")
    } catch (error) {
      toast.error(`Error al crear cliente: ${error.message}`)
    }
  }

  const seleccionarCliente = (clienteSeleccionado) => {
    setCliente(clienteSeleccionado)
    setDialogClienteAbierto(false)
    setBusquedaCliente("")
    setClientesBusqueda([])
    toast.success(`Cliente ${clienteSeleccionado.nombre} seleccionado`)
  }

  // Acciones sobre pagos
  const handleAddPago = () => {
    const monto = Number.parseFloat(montoPagoActual.replace(/[^0-9,-]+/g, "").replace(",", "."))
    if (!monto || monto <= 0) {
      toast.error("El monto del pago debe ser mayor a cero.")
      return
    }
    if (monto > calcularRestante() + 0.01) {
      // Se agrega 0.01 para problemas de redondeo
      toast.error("El monto del pago no puede ser mayor que el restante.")
      return
    }
    const tipoPago = tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoActual)
    if (!tipoPago) {
      toast.error("Seleccione un tipo de pago válido.")
      return
    }
    if (tipoPago.nombre.toLowerCase().includes("cuenta") && !cliente.id) {
      toast.error("Debe seleccionar un cliente para usar Cuenta Corriente.")
      return
    }

    const nuevoPago = {
      id: Date.now(),
      tipo_pago_id: tipoPago.id,
      tipo_pago_nombre: tipoPago.nombre,
      monto: monto,
      esTarjeta: tipoPago.nombre.toLowerCase().includes("tarjeta"),
      interesTarjeta: 0,
      cuotasTarjeta: 1,
    }

    setPagos([...pagos, nuevoPago])
    setMontoPagoActual("")
  }

  const handleRemovePago = (pagoId) => {
    setPagos(pagos.filter((p) => p.id !== pagoId))
  }

  const handlePagoTarjetaChange = (pagoId, campo, valor) => {
    setPagos(
      pagos.map((p) => {
        if (p.id === pagoId) {
          return { ...p, [campo]: valor }
        }
        return p
      }),
    )
  }

  // Finalizar venta
  const finalizarVenta = async () => {
    if (productosSeleccionados.length === 0) {
      toast.error("Debe seleccionar al menos un producto.")
      return
    }
    if (pagos.length === 0) {
      toast.error("Debe agregar al menos un método de pago.")
      return
    }
    if (Math.abs(calcularRestante()) > 0.01) {
      toast.error("El total pagado no coincide con el total de la venta.")
      return
    }
    if (!currentUser || !currentUser.id) {
      toast.error("Usuario no autenticado. Por favor, inicie sesión.")
      return
    }

    const pagoEnCuentaCorriente = pagos.find((p) => p.tipo_pago_nombre.toLowerCase().includes("cuenta"))
    if (pagoEnCuentaCorriente) {
      if (!cliente.id) {
        toast.error("Debe seleccionar un cliente para ventas con cuenta corriente.")
        return
      }
      if (
        cuentaCorrienteInfo &&
        cuentaCorrienteInfo.limite_credito > 0 &&
        cuentaCorrienteInfo.saldo + pagoEnCuentaCorriente.monto > cuentaCorrienteInfo.limite_credito
      ) {
        toast.error(
          `La venta excede el límite de crédito del cliente (${formatearMonedaARS(cuentaCorrienteInfo.limite_credito)})`,
        )
        return
      }
    }

    setProcesandoVenta(true)
    try {
      const ventaData = {
        cliente_id: cliente.id || null,
        punto_venta_id: Number.parseInt(puntoVentaSeleccionado),
        porcentaje_descuento: porcentajeDescuento,
        productos: productosSeleccionados.map((p) => ({
          id: p.id,
          cantidad: p.cantidad,
          precio: Number.parseFloat(p.price) || 0,
          descuento: p.discount ? { porcentaje: Number.parseFloat(p.discount.percentage) || 0 } : null,
        })),
        pagos: pagos.map((p) => ({
          tipo_pago_id: p.tipo_pago_id,
          monto: p.monto,
        })),
        notas: `Venta de ${productosSeleccionados.length} productos.`,
      }

      const resultado = await createVenta(ventaData)
      toast.success(`Venta #${resultado.numero_factura} registrada con éxito`, { icon: "✅" })

      // Resetear estados
      setProductosSeleccionados([])
      setPorcentajeDescuento(0)
      setDescuentoInputValue("0")
      setCliente({ id: null, nombre: "Cliente General", telefono: "", dni: "" })
      setDialogFinalizarAbierto(false)
      setCuentaCorrienteInfo(null)
      setPagos([])
      setMontoPagoActual("")

      if (debouncedSearchTerm) buscarProductos()
    } catch (error) {
      toast.error(`Error al finalizar venta: ${error.message}`)
    } finally {
      setProcesandoVenta(false)
    }
  }

  // Helpers
  const getNombrePuntoVenta = (id) => puntosVenta.find((p) => p.id.toString() === id)?.nombre || ""

  const renderSkeletons = () =>
    Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="flex items-center space-x-4 p-3 border-b">
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar venta de productos</h1>
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
            <Dialog open={dialogClienteAbierto} onOpenChange={setDialogClienteAbierto}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-white shadow-sm flex items-center gap-1">
                  <User size={14} />
                  <span className="hidden sm:inline">Cliente:</span> {cliente.nombre}
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
                  <Button
                    onClick={() => {
                      setCliente({ id: null, nombre: "Cliente General", telefono: "", dni: "" })
                      setDialogClienteAbierto(false)
                      setBusquedaCliente("")
                      setClientesBusqueda([])
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Usar cliente general
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
        {/* Columna de Búsqueda de Productos */}
        <Card className="lg:col-span-1 overflow-hidden border-0 shadow-md bg-white">
          <CardHeader className="bg-[#131321] pb-3">
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <Package size={20} />
              Buscar Productos
            </CardTitle>
            <CardDescription className="text-gray-300">
              Busca productos por nombre o código para agregarlos al carrito
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por nombre, código..."
                className="pl-8 bg-white/90 border-0 focus-visible:ring-orange-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`whitespace-nowrap flex items-center gap-1 h-8 ${
                      filtroCategoria !== "todos"
                        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "bg-white"
                    }`}
                  >
                    <Filter size={14} />
                    <span className="hidden sm:inline">
                      {filtroCategoria === "todos"
                        ? "Todas las categorías"
                        : categorias.find((c) => c.id.toString() === filtroCategoria)?.nombre || "Categoría"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-2">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start ${filtroCategoria === "todos" ? "bg-orange-50 text-orange-700" : ""}`}
                        onClick={() => setFiltroCategoria("todos")}
                      >
                        Todas las categorías
                      </Button>
                      {categorias.map((cat) => (
                        <Button
                          key={cat.id}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start ${filtroCategoria === cat.id.toString() ? "bg-orange-50 text-orange-700" : ""}`}
                          onClick={() => setFiltroCategoria(cat.id.toString())}
                        >
                          {cat.nombre}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              {cargando ? (
                renderSkeletons()
              ) : productos.length > 0 ? (
                <AnimatePresence>
                  {productos.map((prod) => (
                    <motion.div
                      key={prod.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                          prod.stock <= 0 ? "opacity-50 pointer-events-none bg-gray-50" : ""
                        }`}
                        onDoubleClick={() => agregarProducto(prod)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <h3 className="font-medium text-gray-800 line-clamp-1">{prod.name}</h3>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs font-normal">
                                {prod.code}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs font-normal ${
                                  prod.pointOfSale === "Tala"
                                    ? "border-orange-300 bg-orange-50 text-orange-700"
                                    : "border-indigo-300 bg-indigo-50 text-indigo-700"
                                }`}
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                {prod.pointOfSale}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{prod.description}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            {prod.discount && new Date(prod.discount.endDate) > new Date() ? (
                              <div>
                                <p className="font-semibold text-orange-600">
                                  {formatearMonedaARS(calcularPrecioConDescuento(prod))}
                                </p>
                                <p className="text-xs text-gray-500 line-through">{formatearMonedaARS(prod.price)}</p>
                                <Badge className="mt-1 bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300">
                                  <PercentCircle className="h-3 w-3 mr-1" />
                                  {prod.discount.percentage}% OFF
                                </Badge>
                              </div>
                            ) : (
                              <p className="font-semibold text-orange-600">{formatearMonedaARS(prod.price)}</p>
                            )}
                            <Badge
                              variant={prod.stock > 10 ? "outline" : prod.stock > 5 ? "secondary" : "secondary"}
                              className={`mt-1 ${prod.stock <= 2 ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-300" : ""}`}
                            >
                              {prod.stock} unidades
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : busqueda.length >= 2 ? (
                <div className="text-center py-12 text-gray-600">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium mb-1 text-gray-800">No se encontraron productos</h3>
                  <p className="text-sm text-gray-500">No hay productos que coincidan con "{busqueda}"</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl mx-4 border border-orange-200">
                    <Search className="mx-auto h-16 w-16 text-orange-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2 text-gray-800">Busca productos</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Escribe el nombre o código del producto que quieres vender
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="text-xs text-gray-700 flex justify-between py-3 border-t">
            <span>
              {productos.length > 0 ? `${productos.length} productos encontrados` : "Busca para ver productos"}
            </span>
            <span className="flex items-center gap-1">
              <Info size={12} /> Doble click para agregar
            </span>
          </CardFooter>
        </Card>

        {/* Columna de Detalle de Venta */}
        <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-[#131321] border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <ShoppingCart size={20} /> Detalle de Venta
            </CardTitle>
            <CardDescription className="text-gray-300">
              Productos seleccionados para la venta en {getNombrePuntoVenta(puntoVentaSeleccionado)}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {productosSeleccionados.length > 0 ? (
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-orange-600">Producto</TableHead>
                      <TableHead className="text-right text-orange-600">Precio</TableHead>
                      <TableHead className="text-orange-600 text-center">Cantidad</TableHead>
                      <TableHead className="text-orange-600 text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {productosSeleccionados.map((prod) => (
                        <motion.tr
                          key={prod.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="group"
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{prod.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500">Código: {prod.code}</p>
                                {prod.discount && new Date(prod.discount.endDate) > new Date() && (
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300 text-xs">
                                    <PercentCircle className="h-3 w-3 mr-1" />
                                    {prod.discount.percentage}% OFF
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {prod.discount && new Date(prod.discount.endDate) > new Date() ? (
                              <div>
                                <span className="text-orange-600">
                                  {formatearMonedaARS(calcularPrecioConDescuento(prod))}
                                </span>
                                <span className="text-gray-400 text-xs line-through ml-1">
                                  {formatearMonedaARS(prod.price)}
                                </span>
                              </div>
                            ) : (
                              <span>{formatearMonedaARS(prod.price)}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => cambiarCantidad(prod.id, prod.cantidad - 1)}
                                disabled={prod.cantidad <= 1}
                              >
                                <Minus size={14} />
                              </Button>
                              <span className="w-10 text-center">{prod.cantidad}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => cambiarCantidad(prod.id, prod.cantidad + 1)}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatearMonedaARS(calcularPrecioConDescuento(prod) * prod.cantidad)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-50 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => eliminarProducto(prod.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 px-4 text-gray-500 border-b">
                <div className="bg-gray-50 p-8 rounded-xl inline-flex flex-col items-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" strokeWidth={1.5} />
                  <h3 className="text-xl font-medium mb-2 text-gray-800">Carrito vacío</h3>
                  <p className="text-sm max-w-md">Busca y selecciona productos para agregarlos al carrito</p>
                </div>
              </div>
            )}

            {productosSeleccionados.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-gray-50 border-t">
                <div className="flex flex-col gap-2">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Subtotal:</span>
                        <span className="font-medium">{formatearMonedaARS(calcularSubtotal())}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                            <Percent className="h-3.5 w-3.5 text-green-500" />
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
                            />
                          </div>
                          <span className="text-sm text-gray-500">Descuento</span>
                        </div>
                        {porcentajeDescuento > 0 && (
                          <span className="text-green-600 font-medium">-{formatearMonedaARS(calcularDescuento())}</span>
                        )}
                      </div>

                      <Separator className="my-1" />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-orange-600">{formatearMonedaARS(calcularTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setProductosSeleccionados([])}
              disabled={!productosSeleccionados.length}
              className="bg-gray-600 hover:bg-red-800 text-gray-100 hover:text-gray-100"
            >
              <X size={16} className="mr-1" /> Cancelar
            </Button>

            <Dialog open={dialogFinalizarAbierto} onOpenChange={setDialogFinalizarAbierto}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setPagos([])
                    setMontoPagoActual("")
                    setDialogFinalizarAbierto(true)
                  }}
                  disabled={!productosSeleccionados.length}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Receipt size={16} className="mr-1" /> Finalizar Venta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-orange-600">Confirmar Venta</DialogTitle>
                  <DialogDescription>Agrega los métodos de pago para completar la venta.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Columna de Resumen */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Resumen de la Venta</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium text-right">{cliente.nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Punto de venta:</span>
                        <Badge
                          variant="outline"
                          className={`${
                            getNombrePuntoVenta(puntoVentaSeleccionado) === "Tala"
                              ? "border-orange-300 bg-orange-50 text-orange-700"
                              : "border-indigo-300 bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {getNombrePuntoVenta(puntoVentaSeleccionado)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatearMonedaARS(calcularSubtotal())}</span>
                      </div>
                      {porcentajeDescuento > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Descuento ({porcentajeDescuento}%):</span>
                          <span className="text-green-600">-{formatearMonedaARS(calcularDescuento())}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total a cobrar:</span>
                        <span className="text-orange-700">{formatearMonedaARS(calcularTotal())}</span>
                      </div>
                    </div>
                    {cliente.id && cuentaCorrienteInfo && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-800">Cuenta Corriente</span>
                          <span
                            className={`font-bold ${cuentaCorrienteInfo.saldo > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {formatearMonedaARS(cuentaCorrienteInfo.saldo)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Columna de Pagos */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Métodos de Pago</h3>
                    <div className="bg-white rounded-lg border p-4 space-y-4">
                      {/* Agregar Pago */}
                      <div className="flex items-end gap-2">
                        <div className="flex-grow">
                          <Label htmlFor="monto-pago">Monto</Label>
                          <NumericFormat
                            id="monto-pago"
                            value={montoPagoActual}
                            onValueChange={(values) => setMontoPagoActual(values.value)}
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="$ "
                            className="w-full mt-1"
                            customInput={Input}
                          />
                        </div>
                        <div className="flex-grow">
                          <Label htmlFor="tipo-pago">Tipo</Label>
                          <Select value={tipoPagoActual} onValueChange={setTipoPagoActual}>
                            <SelectTrigger id="tipo-pago" className="mt-1">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposPagoDisponibles.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddPago} size="sm">
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-orange-600"
                          onClick={() => setMontoPagoActual(calcularRestante().toString().replace(".", ","))}
                        >
                          Asignar restante ({formatearMonedaARS(calcularRestante())})
                        </Button>
                      </div>

                      <Separator />

                      {/* Pagos Agregados */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Pagado:</span>
                          <span>{formatearMonedaARS(calcularTotalPagado())}</span>
                        </div>
                        <div
                          className={`flex justify-between text-sm font-medium ${
                            calcularRestante() > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          <span>Restante:</span>
                          <span>{formatearMonedaARS(calcularRestante())}</span>
                        </div>
                      </div>

                      {pagos.length > 0 && (
                        <ScrollArea className="h-[150px] pr-3">
                          <div className="space-y-3">
                            {pagos.map((pago) => (
                              <div key={pago.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{pago.tipo_pago_nombre}</p>
                                    <p className="text-lg font-bold text-orange-700">
                                      {formatearMonedaARS(pago.monto)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:bg-red-100"
                                    onClick={() => handleRemovePago(pago.id)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                                {pago.esTarjeta && (
                                  <div className="mt-3 space-y-3 border-t pt-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1">
                                        <Label className="text-xs flex items-center gap-1 mb-1">
                                          <TrendingUp size={12} /> Interés %
                                        </Label>
                                        <NumericFormat
                                          value={pago.interesTarjeta}
                                          onValueChange={(values) =>
                                            handlePagoTarjetaChange(pago.id, "interesTarjeta", Number(values.value))
                                          }
                                          suffix=" %"
                                          className="h-8 text-sm"
                                          customInput={Input}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <Label className="text-xs flex items-center gap-1 mb-1">
                                          <CalendarDays size={12} /> Cuotas
                                        </Label>
                                        <NumericFormat
                                          value={pago.cuotasTarjeta}
                                          onValueChange={(values) =>
                                            handlePagoTarjetaChange(pago.id, "cuotasTarjeta", Number(values.value))
                                          }
                                          allowDecimal={false}
                                          className="h-8 text-sm"
                                          customInput={Input}
                                        />
                                      </div>
                                    </div>
                                    {pago.interesTarjeta > 0 && (
                                      <div className="text-xs space-y-1 bg-orange-50 p-2 rounded-md">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Monto c/interés:</span>
                                          <span className="font-medium text-orange-800">
                                            {formatearMonedaARS(pago.monto * (1 + pago.interesTarjeta / 100))}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">{pago.cuotasTarjeta} cuota(s) de:</span>
                                          <span className="font-medium text-orange-800">
                                            {formatearMonedaARS(
                                              (pago.monto * (1 + pago.interesTarjeta / 100)) / pago.cuotasTarjeta,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogFinalizarAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={finalizarVenta}
                    className="gap-1 bg-orange-600 hover:bg-orange-700"
                    disabled={Math.abs(calcularRestante()) > 0.01 || pagos.length === 0 || procesandoVenta}
                  >
                    {procesandoVenta ? (
                      <>
                        <span className="mr-1">Procesando...</span>
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
    </div>
  )
}

export default VentasProductos
