"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import {
  ArrowLeftRight,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  DollarSign,
  RotateCcw,
  AlertOctagon,
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Tag,
  Trash,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { adaptProductoToFrontend, getProductosByPuntoVenta } from "@/services/productosService"
import { getTiposPago } from "@/services/pagosService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { createDevolucion, getDevolucionesByVenta } from "@/services/devolucionesService"
import { useAuth } from "@/context/AuthContext"

// Importar los servicios necesarios para clientes y cuentas corrientes
import { searchClientes, createCliente } from "@/services/clientesService"
import { getCuentaCorrienteByCliente, createOrUpdateCuentaCorriente } from "@/services/cuentasCorrientesService"

const DevolucionDialog = ({
  open,
  setOpen,
  venta,
  cliente = { id: null, nombre: "Cliente General", telefono: "" },
  onDevolucionCompleta,
  formatearPrecio,
  setCliente,
}) => {
  // Obtener el usuario actual del contexto de autenticación
  const { currentUser } = useAuth()

  // Estados para la devolución
  const [paso, setPaso] = useState(1) // 1: Selección de productos, 2: Selección de reemplazos, 3: Confirmación
  const [productosADevolver, setProductosADevolver] = useState([])
  const [tipoDevolucion, setTipoDevolucion] = useState("normal") // "normal" o "defectuoso"
  const [productosReemplazo, setProductosReemplazo] = useState([])
  const [productos, setProductos] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(false)
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState("")
  const [tiposPagoDisponibles, setTiposPagoDisponibles] = useState([])
  const [puntosVenta, setPuntosVenta] = useState([])
  const [procesandoDevolucion, setProcesandoDevolucion] = useState(false)
  const [estadoDevolucion, setEstadoDevolucion] = useState({
    exito: false,
    error: false,
    mensaje: "",
  })
  const [devolucionesExistentes, setDevolucionesExistentes] = useState([])
  const [productosDevueltos, setProductosDevueltos] = useState(new Map())

  // Estados para manejo de clientes
  const [dialogClienteAbierto, setDialogClienteAbierto] = useState(false)
  const [dialogNuevoClienteAbierto, setDialogNuevoClienteAbierto] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "" })
  const [clientesBusqueda, setClientesBusqueda] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [cuentaCorrienteInfo, setCuentaCorrienteInfo] = useState(null)
  const [cargandoCuentaCorriente, setCargandoCuentaCorriente] = useState(false)

  // Estado local para manejar el cliente si no se proporciona setCliente
  const [clienteLocal, setClienteLocal] = useState(cliente)

  // Cargar datos iniciales
  useEffect(() => {
    if (open && venta) {
      cargarDatosIniciales()
      cargarDevolucionesExistentes()
    } else {
      // Resetear estados cuando se cierra el diálogo
      setPaso(1)
      setProductosADevolver([])
      setTipoDevolucion("normal")
      setProductosReemplazo([])
      setBusqueda("")
      setTipoPagoSeleccionado("")
      setEstadoDevolucion({ exito: false, error: false, mensaje: "" })
      setDevolucionesExistentes([])
      setProductosDevueltos(new Map())
    }
  }, [open, venta])

  // Buscar clientes cuando cambia la búsqueda
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

  // Cargar información de cuenta corriente cuando cambia el cliente
  useEffect(() => {
    const cargarCuentaCorriente = async () => {
      const clienteActual = typeof setCliente === "function" ? cliente : clienteLocal

      if (!clienteActual || !clienteActual.id) {
        setCuentaCorrienteInfo(null)
        return
      }

      setCargandoCuentaCorriente(true)
      try {
        const cuentaCorriente = await getCuentaCorrienteByCliente(clienteActual.id)
        setCuentaCorrienteInfo(cuentaCorriente)
      } catch (error) {
        console.error("Error al cargar cuenta corriente:", error)
        // Si el error es 404, significa que el cliente no tiene cuenta corriente
        if (error.message && error.message.includes("no tiene cuenta corriente")) {
          setCuentaCorrienteInfo({ saldo: 0, limite_credito: 0, activo: true, cliente_id: clienteActual.id })
        } else {
          toast.error("Error al cargar información de cuenta corriente")
        }
      } finally {
        setCargandoCuentaCorriente(false)
      }
    }

    cargarCuentaCorriente()
  }, [cliente, clienteLocal])

  // Funciones para manejar clientes
  const seleccionarCliente = (clienteSeleccionado) => {
    // Crear una copia local del cliente seleccionado
    const clienteInfo = {
      id: clienteSeleccionado.id,
      nombre: clienteSeleccionado.nombre,
      telefono: clienteSeleccionado.telefono || "",
    }

    // Actualizar el cliente local
    setClienteLocal(clienteInfo)

    // Si existe la función setCliente como prop, usarla también
    if (typeof setCliente === "function") {
      setCliente(clienteInfo)
    }

    setDialogClienteAbierto(false)
    setBusquedaCliente("")
    setClientesBusqueda([])

    toast.success(`Cliente ${clienteSeleccionado.nombre} seleccionado correctamente`, {
      position: "bottom-right",
    })
  }

  const crearNuevoCliente = () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.error("El nombre del cliente es obligatorio", {
        position: "bottom-right",
      })
      return
    }

    try {
      createCliente(nuevoCliente)
        .then((clienteCreado) => {
          const clienteInfo = {
            id: clienteCreado.id,
            nombre: clienteCreado.nombre,
            telefono: clienteCreado.telefono || "",
          }

          // Actualizar el cliente local
          setClienteLocal(clienteInfo)

          // Si existe la función setCliente como prop, usarla también
          if (typeof setCliente === "function") {
            setCliente(clienteInfo)
          }

          setDialogNuevoClienteAbierto(false)
          setDialogClienteAbierto(false)

          toast.success("Cliente creado correctamente", {
            position: "bottom-right",
          })
        })
        .catch((error) => {
          console.error("Error al crear cliente:", error)
          toast.error("Error al crear cliente: " + error.message)
        })
    } catch (error) {
      console.error("Error al crear cliente:", error)
      toast.error("Error al crear cliente: " + error.message)
    }
  }

  // Cargar devoluciones existentes para esta venta
  const cargarDevolucionesExistentes = async () => {
    if (!venta || !venta.id) return

    try {
      const devoluciones = await getDevolucionesByVenta(venta.id)
      setDevolucionesExistentes(devoluciones)

      // Crear un mapa de productos ya devueltos
      const productosMap = new Map()

      devoluciones.forEach((devolucion) => {
        devolucion.productos_devueltos.forEach((producto) => {
          // Usar una clave compuesta de producto_id y detalle_venta_id
          const key = `${producto.producto_id}_${producto.detalle_venta_id}`
          const cantidadActual = productosMap.get(key) || 0
          productosMap.set(key, cantidadActual + producto.cantidad)
        })
      })

      setProductosDevueltos(productosMap)
    } catch (error) {
      console.error("Error al cargar devoluciones existentes:", error)
    }
  }

  // Cargar productos cuando cambia la búsqueda
  useEffect(() => {
    if (productos.length > 0) {
      const filtered = productos.filter((p) => {
        return (
          !busqueda.trim() ||
          p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.code.toLowerCase().includes(busqueda.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(busqueda.toLowerCase()))
        )
      })
      setProductosFiltrados(filtered)
    }
  }, [busqueda, productos])

  const cargarDatosIniciales = async () => {
    setCargando(true)
    try {
      // Obtener el punto de venta de la venta
      const puntoVentaId = venta.puntoVenta.id

      // Cargar productos filtrados por punto de venta
      const productosData = await getProductosByPuntoVenta(puntoVentaId)
      const productosAdaptados = productosData.map(adaptProductoToFrontend).map((prod) => ({
        ...prod,
        price: typeof prod.price === "number" ? prod.price : Number.parseFloat(prod.price) || 0,
      }))
      setProductos(productosAdaptados)
      setProductosFiltrados(productosAdaptados)

      // Cargar tipos de pago
      const tipos = await getTiposPago()
      setTiposPagoDisponibles(tipos)

      // Cargar puntos de venta
      const puntos = await getPuntosVenta()
      setPuntosVenta(puntos)
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
      toast.error("Error al cargar datos iniciales")
    } finally {
      setCargando(false)
    }
  }

  // Función para alternar la selección de un producto para devolución
  const toggleProductoDevolucion = (producto) => {
    // Verificar si el producto ya está seleccionado
    const existe = productosADevolver.find((p) => p.id === producto.id)

    if (existe) {
      // Si ya está seleccionado, lo quitamos
      setProductosADevolver(productosADevolver.filter((p) => p.id !== producto.id))
    } else {
      // Si no está seleccionado, lo agregamos
      // Incluir información sobre si es un producto de reemplazo
      setProductosADevolver([
        ...productosADevolver,
        {
          ...producto,
          cantidad: 1,
          esReemplazo: producto.es_reemplazo || false,
          detalleVentaId: producto.detalleVentaId || null,
        },
      ])
    }
  }

  // Función para cambiar la cantidad de un producto a devolver
  const cambiarCantidadDevolucion = (id, detalleVentaId, nuevaCantidad) => {
    const producto = venta.detalles.find((d) => d.producto.id === id && d.id === detalleVentaId)
    const cantidadDevueltaPrevia = productosDevueltos.get(`${id}_${detalleVentaId}`) || 0
    const cantidadDisponible = producto.cantidad - cantidadDevueltaPrevia

    if (nuevaCantidad < 1 || nuevaCantidad > cantidadDisponible) return

    setProductosADevolver(
      productosADevolver.map((p) =>
        p.id === id && p.detalleVentaId === detalleVentaId ? { ...p, cantidad: nuevaCantidad } : p,
      ),
    )
  }

  // Función para agregar un producto de reemplazo
  const agregarProductoReemplazo = (producto) => {
    // Verificar si el producto ya está en la lista de reemplazos
    const existe = productosReemplazo.find((p) => p.id === producto.id)

    if (existe) {
      // Si ya existe, incrementamos la cantidad
      setProductosReemplazo(
        productosReemplazo.map((p) => (p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p)),
      )
    } else {
      // Si no existe, lo agregamos con cantidad 1
      setProductosReemplazo([...productosReemplazo, { ...producto, cantidad: 1 }])
    }
  }

  // Función para cambiar la cantidad de un producto de reemplazo
  const cambiarCantidadReemplazo = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return

    const producto = productos.find((p) => p.id === id)
    if (nuevaCantidad > producto.stock) {
      toast.error(`Solo hay ${producto.stock} unidades disponibles`, {
        position: "bottom-right",
      })
      return
    }

    setProductosReemplazo(productosReemplazo.map((p) => (p.id === id ? { ...p, cantidad: nuevaCantidad } : p)))
  }

  // Función para eliminar un producto de reemplazo
  const eliminarProductoReemplazo = (id) => {
    setProductosReemplazo(productosReemplazo.filter((p) => p.id !== id))
  }

  // Cálculos para la devolución
  const calcularTotalDevolucion = () => {
    if (!venta || !venta.detalles) return 0

    return productosADevolver.reduce((total, producto) => {
      const detalleVenta = venta.detalles.find((d) => d.producto.id === producto.id)
      if (!detalleVenta) return total
      return total + detalleVenta.precioConDescuento * producto.cantidad
    }, 0)
  }

  // Función para calcular el precio del producto de reemplazo, aplicando el descuento si existe
  const calcularPrecioReemplazo = (producto) => {
    if (producto.discount && new Date(producto.discount.endDate) > new Date()) {
      return producto.price * (1 - producto.discount.percentage / 100)
    }
    return producto.price
  }

  const calcularTotalReemplazo = () => {
    return productosReemplazo.reduce((total, producto) => {
      const precio = calcularPrecioReemplazo(producto)
      return total + precio * producto.cantidad
    }, 0)
  }

  const calcularDiferencia = () => {
    return calcularTotalReemplazo() - calcularTotalDevolucion()
  }

  // Función para asegurar que el cliente tenga una cuenta corriente
  const asegurarCuentaCorrienteCliente = async (clienteId) => {
    if (!clienteId) return null

    try {
      // Intentar obtener la cuenta corriente existente
      const cuenta = await getCuentaCorrienteByCliente(clienteId)
      return cuenta
    } catch (error) {
      // Si el error es porque no existe la cuenta, crearla
      if (error.message && error.message.includes("no tiene cuenta corriente")) {
        try {
          // Crear una nueva cuenta corriente para el cliente
          const nuevaCuenta = await createOrUpdateCuentaCorriente({
            cliente_id: clienteId,
            limite_credito: 0,
            activo: 1,
          })

          return nuevaCuenta
        } catch (createError) {
          console.error("Error al crear cuenta corriente:", createError)
          throw createError
        }
      } else {
        console.error("Error al verificar cuenta corriente:", error)
        throw error
      }
    }
  }

  // Función para avanzar al siguiente paso
  const avanzarPaso = async () => {
    if (paso === 1) {
      // Validar que se haya seleccionado al menos un producto
      if (productosADevolver.length === 0) {
        toast.error("Debe seleccionar al menos un producto para devolver")
        return
      }

      // Validar que se haya seleccionado un tipo de devolución
      if (!tipoDevolucion) {
        toast.error("Debe seleccionar un tipo de devolución")
        return
      }
    } else if (paso === 2) {
      // Si no hay productos de reemplazo, preguntar si desea continuar
      if (productosReemplazo.length === 0) {
        if (!window.confirm("¿Está seguro que desea continuar sin productos de reemplazo?")) {
          return
        }
      }

      // Si hay diferencia a pagar, validar que se haya seleccionado un tipo de pago
      const diferencia = calcularDiferencia()
      if (diferencia > 0 && !tipoPagoSeleccionado) {
        toast.error("Debe seleccionar un método de pago para la diferencia")
        return
      }

      // Si el tipo de pago es cuenta corriente, validar que el cliente tenga cuenta
      if (diferencia > 0 && tipoPagoSeleccionado) {
        const tipoPago = tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoSeleccionado)
        const esCuentaCorriente =
          tipoPago &&
          (tipoPago.nombre.toLowerCase() === "cuenta corriente" || tipoPago.nombre.toLowerCase() === "cuenta")

        const clienteActual = typeof setCliente === "function" ? cliente : clienteLocal

        if (esCuentaCorriente && !clienteActual?.id) {
          toast.error("Debe seleccionar un cliente con cuenta corriente para este método de pago")
          return
        }

        // Si es cuenta corriente y hay un cliente seleccionado, asegurarse de que tenga cuenta
        if (esCuentaCorriente && clienteActual?.id) {
          try {
            // Mostrar un indicador de carga
            setCargandoCuentaCorriente(true)

            // Asegurar que el cliente tenga una cuenta corriente
            const cuenta = await asegurarCuentaCorrienteCliente(clienteActual.id)

            // Actualizar la información de la cuenta
            if (cuenta) {
              setCuentaCorrienteInfo(cuenta)
            }
          } catch (error) {
            console.error("Error al verificar cuenta corriente:", error)
            toast.error("Error al verificar la cuenta corriente del cliente")
            return
          } finally {
            setCargandoCuentaCorriente(false)
          }
        }
      }

      // Si hay diferencia a favor del cliente, asegurarse de que tenga cuenta
      if (diferencia < 0) {
        const clienteActual = typeof setCliente === "function" ? cliente : clienteLocal

        if (!clienteActual?.id) {
          toast.error("Debe seleccionar un cliente para acreditar el saldo a favor")
          return
        }

        try {
          // Mostrar un indicador de carga
          setCargandoCuentaCorriente(true)

          // Asegurar que el cliente tenga una cuenta corriente
          const cuenta = await asegurarCuentaCorrienteCliente(clienteActual.id)

          // Actualizar la información de la cuenta
          if (cuenta) {
            setCuentaCorrienteInfo(cuenta)
          }
        } catch (error) {
          console.error("Error al verificar cuenta corriente:", error)
          toast.error("Error al verificar la cuenta corriente del cliente")
          return
        } finally {
          setCargandoCuentaCorriente(false)
        }
      }
    }

    setPaso(paso + 1)
  }

  // Función para retroceder al paso anterior
  const retrocederPaso = () => {
    setPaso(paso - 1)
  }

  // Función para procesar la devolución
  const procesarDevolucion = async () => {
    setProcesandoDevolucion(true)
    setEstadoDevolucion({ exito: false, error: false, mensaje: "" })

    try {
      // Verificar que el usuario esté autenticado
      if (!currentUser || !currentUser.id) {
        throw new Error("Usuario no autenticado. Por favor, inicie sesión nuevamente.")
      }

      // Verificar si se requiere un cliente para la devolución
      const diferencia = calcularDiferencia()
      const tipoPago = tipoPagoSeleccionado
        ? tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoSeleccionado)
        : null

      const esCuentaCorriente =
        tipoPago && (tipoPago.nombre.toLowerCase() === "cuenta corriente" || tipoPago.nombre.toLowerCase() === "cuenta")

      // Determinar qué cliente usar (el prop o el local)
      const clienteActual = typeof setCliente === "function" ? cliente : clienteLocal

      // Si es cuenta corriente o hay diferencia a favor del cliente, verificar que haya un cliente seleccionado
      if ((esCuentaCorriente || diferencia < 0) && (!clienteActual || !clienteActual.id)) {
        throw new Error("Debe seleccionar un cliente para este tipo de operación")
      }

      // Si hay un cliente seleccionado y es una operación que afecta la cuenta corriente, asegurar que tenga cuenta
      if (clienteActual && clienteActual.id && (esCuentaCorriente || diferencia < 0)) {
        try {
          // Asegurar que el cliente tenga una cuenta corriente
          await asegurarCuentaCorrienteCliente(clienteActual.id)
        } catch (error) {
          console.error("Error al verificar cuenta corriente:", error)
          throw new Error("Error al verificar la cuenta corriente del cliente: " + error.message)
        }
      }

      // Si es cuenta corriente y hay diferencia a pagar, verificar límite de crédito
      if (
        esCuentaCorriente &&
        diferencia > 0 &&
        cuentaCorrienteInfo &&
        cuentaCorrienteInfo.limite_credito > 0 &&
        cuentaCorrienteInfo.saldo + diferencia > cuentaCorrienteInfo.limite_credito
      ) {
        throw new Error(`La operación excede el límite de crédito del cliente (${cuentaCorrienteInfo.limite_credito})`)
      }

      // Datos que se enviarán al backend
      const datosDevolucion = {
        venta_id: venta.id,
        usuario_id: currentUser.id,
        productos_devueltos: productosADevolver.map((p) => ({
          producto_id: p.id,
          cantidad: p.cantidad,
          tipo_devolucion: tipoDevolucion,
          esReemplazo: p.esReemplazo || false, // Indicar si es un producto de reemplazo
          detalle_venta_id: p.detalleVentaId || null, // Incluir el ID del detalle de venta si está disponible
        })),
        productos_reemplazo: productosReemplazo.map((p) => {
          // Calcular el precio con descuento para cada producto de reemplazo
          const precioConDescuento = calcularPrecioReemplazo(p)
          return {
            producto_id: p.id,
            cantidad: p.cantidad,
            precio: precioConDescuento, // Incluir el precio con descuento
          }
        }),
        diferencia: calcularDiferencia(),
        tipo_pago: tipoPagoSeleccionado
          ? tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoSeleccionado)?.nombre
          : null,
        cliente_id: clienteActual?.id || null,
      }

      // Realizar la llamada a la API para crear la devolución
      const respuesta = await createDevolucion(datosDevolucion)

      // Si la devolución fue exitosa y hay un cliente seleccionado, actualizar la información de cuenta corriente
      if (clienteActual && clienteActual.id) {
        try {
          // Recargar la información de cuenta corriente para reflejar los cambios
          const cuentaActualizada = await getCuentaCorrienteByCliente(clienteActual.id)
          setCuentaCorrienteInfo(cuentaActualizada)
        } catch (error) {
          console.error("Error al actualizar información de cuenta corriente:", error)
        }
      }

      setEstadoDevolucion({
        exito: true,
        error: false,
        mensaje: "Devolución procesada correctamente",
      })

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setOpen(false)
        if (onDevolucionCompleta) {
          onDevolucionCompleta()
        }
      }, 2000)
    } catch (error) {
      console.error("Error al procesar devolución:", error)
      setEstadoDevolucion({
        exito: false,
        error: true,
        mensaje: error.message || "Error al procesar la devolución",
      })
    } finally {
      setProcesandoDevolucion(false)
    }
  }

  // Renderizar el contenido según el paso actual
  const renderContenidoPaso = () => {
    switch (paso) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Información de la venta */}
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Factura</div>
                    <div className="font-medium">{venta?.numeroFactura}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Cliente</div>
                    <div className="font-medium">{venta?.cliente ? venta.cliente.nombre : "Cliente General"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Fecha</div>
                    <div className="font-medium">{new Date(venta?.fecha).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="font-medium">{formatearPrecio(venta?.total)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Productos a devolver */}
              <div className="md:col-span-2">
                <Card className="shadow-sm">
                  <CardHeader className="py-3 px-4 bg-gray-50">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-600" />
                      Productos a devolver
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded overflow-hidden">
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead className="w-[50px]"></TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-center">Cantidad</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {venta && venta.detalles ? (
                              venta.detalles.map((detalle) => {
                                const cantidadDevueltaPrevia =
                                  productosDevueltos.get(`${detalle.producto.id}_${detalle.id}`) || 0
                                const cantidadDisponible = detalle.cantidad - cantidadDevueltaPrevia
                                const productoSeleccionado = productosADevolver.find(
                                  (p) => p.id === detalle.producto.id && p.detalleVentaId === detalle.id,
                                )
                                const estaSeleccionado = !!productoSeleccionado
                                const cantidadSeleccionada = productoSeleccionado?.cantidad || 0

                                // No mostrar productos que ya han sido devueltos completamente
                                if (cantidadDisponible <= 0) return null

                                return (
                                  <TableRow key={detalle.id} className={estaSeleccionado ? "bg-orange-50" : ""}>
                                    <TableCell>
                                      <div className="flex justify-center">
                                        <input
                                          type="checkbox"
                                          checked={estaSeleccionado}
                                          onChange={() =>
                                            toggleProductoDevolucion({
                                              id: detalle.producto.id,
                                              nombre: detalle.producto.nombre,
                                              precio: detalle.precioConDescuento,
                                              es_reemplazo: detalle.es_reemplazo || false,
                                              detalleVentaId: detalle.id,
                                            })
                                          }
                                          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                                          disabled={cantidadDisponible <= 0}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{detalle.producto.nombre}</div>
                                        <div className="text-xs text-gray-500">Código: {detalle.producto.codigo}</div>
                                        {cantidadDevueltaPrevia > 0 && (
                                          <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-300">
                                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                                            {cantidadDevueltaPrevia} ya devuelta(s)
                                          </Badge>
                                        )}
                                        {detalle.es_reemplazo && (
                                          <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                            <Plus className="h-3 w-3 mr-1" />
                                            Producto de reemplazo
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                      {formatearPrecio(detalle.precioConDescuento)}
                                    </TableCell>
                                    <TableCell>
                                      {estaSeleccionado ? (
                                        <div className="flex items-center justify-center">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-full"
                                            onClick={() =>
                                              cambiarCantidadDevolucion(
                                                detalle.producto.id,
                                                detalle.id,
                                                cantidadSeleccionada - 1,
                                              )
                                            }
                                            disabled={cantidadSeleccionada <= 1}
                                          >
                                            <span className="sr-only">Disminuir</span>
                                            <span className="text-xs">-</span>
                                          </Button>
                                          <span className="w-10 text-center text-sm">{cantidadSeleccionada}</span>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-full"
                                            onClick={() =>
                                              cambiarCantidadDevolucion(
                                                detalle.producto.id,
                                                detalle.id,
                                                cantidadSeleccionada + 1,
                                              )
                                            }
                                            disabled={cantidadSeleccionada >= cantidadDisponible}
                                          >
                                            <span className="sr-only">Aumentar</span>
                                            <span className="text-xs">+</span>
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="text-center text-sm">{cantidadDisponible}</div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-sm">
                                      {estaSeleccionado
                                        ? formatearPrecio(detalle.precioConDescuento * cantidadSeleccionada)
                                        : formatearPrecio(detalle.precioConDescuento * cantidadDisponible)}
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                  Cargando productos...
                                </TableCell>
                              </TableRow>
                            )}

                            {venta &&
                              venta.detalles &&
                              venta.detalles.every((d) => {
                                const cantidadDevueltaPrevia = productosDevueltos.get(`${d.producto.id}_${d.id}`) || 0
                                return d.cantidad - cantidadDevueltaPrevia <= 0
                              }) && (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                    No hay productos disponibles para devolución
                                  </TableCell>
                                </TableRow>
                              )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {productosADevolver.length > 0 && (
                      <div className="p-3 bg-gray-50 border-t">
                        <div className="flex justify-between font-medium text-sm">
                          <span>Total a devolver:</span>
                          <span className="text-orange-600">{formatearPrecio(calcularTotalDevolucion())}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tipo de devolución y resumen */}
              <div>
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardHeader className="py-3 px-4 bg-gray-50">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-orange-600" />
                        Tipo de devolución
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <RadioGroup value={tipoDevolucion} onValueChange={setTipoDevolucion} className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50">
                          <RadioGroupItem value="normal" id="normal" />
                          <Label htmlFor="normal" className="flex items-center gap-2 cursor-pointer">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
                              Normal
                            </Badge>
                            <span className="text-xs text-gray-600">El producto se devuelve al inventario</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50">
                          <RadioGroupItem value="defectuoso" id="defectuoso" />
                          <Label htmlFor="defectuoso" className="flex items-center gap-2 cursor-pointer">
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
                              Defectuoso
                            </Badge>
                            <span className="text-xs text-gray-600">El producto se registra como pérdida</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {productosADevolver.length > 0 && (
                    <Card className="shadow-sm">
                      <CardHeader className="py-3 px-4 bg-gray-50">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Productos seleccionados
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ScrollArea className="max-h-[200px]">
                          <div className="space-y-2">
                            {productosADevolver.map((producto) => {
                              const detalleVenta = venta.detalles.find((d) => d.producto.id === producto.id)
                              if (!detalleVenta) return null

                              return (
                                <div
                                  key={producto.id}
                                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md border"
                                >
                                  <div>
                                    <div className="font-medium text-sm">{detalleVenta.producto.nombre}</div>
                                    <div className="text-xs text-gray-500">
                                      Cantidad: {producto.cantidad} × {formatearPrecio(detalleVenta.precioConDescuento)}
                                    </div>
                                    {producto.esReemplazo && (
                                      <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Producto de reemplazo
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="font-medium text-sm">
                                    {formatearPrecio(detalleVenta.precioConDescuento * producto.cantidad)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Productos de reemplazo */}
              <div className="md:col-span-2">
                <Card className="shadow-sm">
                  <CardHeader className="py-3 px-4 bg-gray-50">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-orange-600" />
                      Productos de reemplazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Buscar productos por nombre, código o descripción..."
                          className="pl-9 text-sm"
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                        />
                      </div>
                    </div>

                    <Tabs defaultValue="productos" className="w-full">
                      <TabsList className="mb-3 w-full">
                        <TabsTrigger
                          value="productos"
                          className="flex-1 flex items-center justify-center gap-1 text-sm"
                        >
                          <Package className="h-4 w-4" />
                          Productos disponibles
                        </TabsTrigger>
                        <TabsTrigger
                          value="seleccionados"
                          className="flex-1 flex items-center justify-center gap-1 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Seleccionados ({productosReemplazo.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="productos">
                        <ScrollArea className="h-[250px] border rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                            {productosFiltrados.length > 0 ? (
                              productosFiltrados.map((producto) => {
                                // Calcular el precio con descuento si existe
                                const precioConDescuento =
                                  producto.discount && new Date(producto.discount.endDate) > new Date()
                                    ? producto.price * (1 - producto.discount.percentage / 100)
                                    : producto.price

                                return (
                                  <div
                                    key={producto.id}
                                    className="p-2 hover:bg-blue-50 transition-colors border rounded-md flex flex-col"
                                  >
                                    <div className="font-medium text-gray-800 text-sm">{producto.name}</div>
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {producto.code}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-xs font-normal border-indigo-300 bg-indigo-50 text-indigo-700"
                                      >
                                        Stock: {producto.stock}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                      <p className="font-semibold text-orange-600 text-sm">
                                        {formatearPrecio(precioConDescuento)}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100"
                                        onClick={() => agregarProductoReemplazo(producto)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Agregar
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="col-span-2 text-center py-8 text-gray-500">
                                <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p>No se encontraron productos</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="seleccionados">
                        {productosReemplazo.length > 0 ? (
                          <ScrollArea className="h-[250px] border rounded-md">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                  <TableHead>Producto</TableHead>
                                  <TableHead className="text-right">Precio</TableHead>
                                  <TableHead className="text-center">Cantidad</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {productosReemplazo.map((producto) => {
                                  // Calcular el precio con descuento si existe
                                  const precioConDescuento = calcularPrecioReemplazo(producto)

                                  return (
                                    <TableRow key={producto.id}>
                                      <TableCell>
                                        <div className="font-medium text-sm">{producto.name}</div>
                                        <div className="text-xs text-gray-500">Código: {producto.code}</div>
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {formatearPrecio(precioConDescuento)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center justify-center">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-full"
                                            onClick={() => cambiarCantidadReemplazo(producto.id, producto.cantidad - 1)}
                                            disabled={producto.cantidad <= 1}
                                          >
                                            <span className="sr-only">Disminuir</span>
                                            <span className="text-xs">-</span>
                                          </Button>
                                          <span className="w-10 text-center text-sm">{producto.cantidad}</span>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-full"
                                            onClick={() => cambiarCantidadReemplazo(producto.id, producto.cantidad + 1)}
                                          >
                                            <span className="sr-only">Aumentar</span>
                                            <span className="text-xs">+</span>
                                          </Button>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right font-medium text-sm">
                                        {formatearPrecio(precioConDescuento * producto.cantidad)}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                          onClick={() => eliminarProductoReemplazo(producto.id)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-8 border rounded-md text-gray-500">
                            <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p>No hay productos seleccionados</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Resumen y método de pago */}
              <div>
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardHeader className="py-3 px-4 bg-gray-50">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Resumen
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total a devolver:</span>
                          <span className="font-medium">{formatearPrecio(calcularTotalDevolucion())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total reemplazo:</span>
                          <span className="font-medium">{formatearPrecio(calcularTotalReemplazo())}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-sm">
                          <span>Diferencia:</span>
                          {calcularDiferencia() > 0 ? (
                            <span className="text-red-600">A pagar: {formatearPrecio(calcularDiferencia())}</span>
                          ) : calcularDiferencia() < 0 ? (
                            <span className="text-green-600">
                              A favor: {formatearPrecio(Math.abs(calcularDiferencia()))}
                            </span>
                          ) : (
                            <span className="text-gray-600">Sin diferencia</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {calcularDiferencia() !== 0 && (
                    <Card className="shadow-sm">
                      <CardHeader className="py-3 px-4 bg-gray-50">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-orange-600" />
                          {calcularDiferencia() > 0 ? "Método de pago" : "Información de crédito"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {calcularDiferencia() > 0 && (
                          <>
                            <Select value={tipoPagoSeleccionado} onValueChange={setTipoPagoSeleccionado}>
                              <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="Seleccione método de pago" />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposPagoDisponibles.map((tipo) => (
                                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                    {tipo.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {tipoPagoSeleccionado && (
                              <div className="mt-3 p-3 rounded-md border text-sm">
                                {tiposPagoDisponibles
                                  .find((tp) => tp.id.toString() === tipoPagoSeleccionado)
                                  ?.nombre.toLowerCase()
                                  .includes("cuenta") ? (
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-gray-600">Cliente:</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setDialogClienteAbierto(true)}
                                      >
                                        {(typeof setCliente === "function" ? cliente?.id : clienteLocal?.id)
                                          ? typeof setCliente === "function"
                                            ? cliente.nombre
                                            : clienteLocal.nombre
                                          : "Seleccionar cliente"}
                                      </Button>
                                    </div>
                                    {(typeof setCliente === "function" ? cliente?.id : clienteLocal?.id) ? (
                                      cargandoCuentaCorriente ? (
                                        <div className="text-center py-1">
                                          <span className="text-xs text-gray-500">Cargando información...</span>
                                        </div>
                                      ) : cuentaCorrienteInfo ? (
                                        <div className="text-xs space-y-1">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Cliente:</span>
                                            <span className="font-medium">
                                              {typeof setCliente === "function" ? cliente.nombre : clienteLocal.nombre}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Saldo actual:</span>
                                            <span
                                              className={
                                                cuentaCorrienteInfo.saldo > 0 ? "text-red-600" : "text-green-600"
                                              }
                                            >
                                              {formatearPrecio(cuentaCorrienteInfo.saldo)}
                                            </span>
                                          </div>
                                          {cuentaCorrienteInfo.limite_credito > 0 && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Límite de crédito:</span>
                                              <span>{formatearPrecio(cuentaCorrienteInfo.limite_credito)}</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between font-medium">
                                            <span className="text-gray-600">Nuevo saldo:</span>
                                            <span
                                              className={
                                                Number(cuentaCorrienteInfo.saldo) + Number(calcularDiferencia()) > 0
                                                  ? "text-red-600"
                                                  : "text-green-600"
                                              }
                                            >
                                              {formatearPrecio(
                                                Number(cuentaCorrienteInfo.saldo) + Number(calcularDiferencia()),
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-yellow-600">
                                          <AlertTriangle className="h-4 w-4" />
                                          <span>El cliente no tiene cuenta corriente activa</span>
                                        </div>
                                      )
                                    ) : (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Debe seleccionar un cliente con cuenta corriente</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Método de pago:{" "}
                                    {
                                      tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoSeleccionado)
                                        ?.nombre
                                    }
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {calcularDiferencia() < 0 && (
                          <>
                            <div className="text-sm mb-3">
                              <p>
                                Hay una diferencia a favor del cliente de{" "}
                                <span className="font-medium text-green-600">
                                  {formatearPrecio(Math.abs(calcularDiferencia()))}
                                </span>
                                . Este monto se acreditará a su cuenta corriente.
                              </p>
                            </div>

                            <div className="p-3 rounded-md border text-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Cliente:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setDialogClienteAbierto(true)}
                                >
                                  {(typeof setCliente === "function" ? cliente?.id : clienteLocal?.id)
                                    ? typeof setCliente === "function"
                                      ? cliente.nombre
                                      : clienteLocal.nombre
                                    : "Seleccionar cliente"}
                                </Button>
                              </div>
                              {(typeof setCliente === "function" ? cliente?.id : clienteLocal?.id) ? (
                                cargandoCuentaCorriente ? (
                                  <div className="text-center py-1">
                                    <span className="text-xs text-gray-500">Cargando información...</span>
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Cliente:</span>
                                      <span className="font-medium">
                                        {typeof setCliente === "function" ? cliente.nombre : clienteLocal.nombre}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Saldo actual:</span>
                                      <span
                                        className={cuentaCorrienteInfo?.saldo > 0 ? "text-red-600" : "text-green-600"}
                                      >
                                        {formatearPrecio(cuentaCorrienteInfo?.saldo || 0)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                      <span className="text-gray-600">Nuevo saldo:</span>
                                      <span
                                        className={
                                          Number(cuentaCorrienteInfo?.saldo || 0) + Number(calcularDiferencia()) > 0
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }
                                      >
                                        {formatearPrecio(
                                          Number(cuentaCorrienteInfo?.saldo || 0) + Number(calcularDiferencia()),
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="flex items-center gap-1 text-red-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  Debe seleccionar un cliente para acreditar el saldo
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            {/* Estado de la devolución */}
            {estadoDevolucion.exito && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Devolución exitosa</p>
                  <p className="text-sm">{estadoDevolucion.mensaje}</p>
                </div>
              </div>
            )}

            {estadoDevolucion.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-2">
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Error en la devolución</p>
                  <p className="text-sm">{estadoDevolucion.mensaje}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Productos a devolver */}
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4 bg-gray-50">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                    Productos a devolver
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {venta &&
                        venta.detalles &&
                        productosADevolver.map((producto) => {
                          const detalleVenta = venta.detalles.find((d) => d.producto.id === producto.id)
                          if (!detalleVenta) return null
                          return (
                            <div
                              key={producto.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                            >
                              <div>
                                <div className="font-medium text-sm">{detalleVenta.producto.nombre}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge
                                    className={`${tipoDevolucion === "defectuoso" ? "bg-red-100 text-red-800 border-red-300" : "bg-green-100 text-green-800 border-green-300"}`}
                                  >
                                    {tipoDevolucion === "defectuoso" ? "Defectuoso" : "Normal"}
                                  </Badge>
                                  <span className="text-xs text-gray-500">Cantidad: {producto.cantidad}</span>
                                </div>
                                {producto.esReemplazo && (
                                  <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Producto de reemplazo
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  {formatearPrecio(detalleVenta.precioConDescuento * producto.cantidad)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatearPrecio(detalleVenta.precioConDescuento)} c/u
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Productos de reemplazo */}
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4 bg-gray-50">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Productos de reemplazo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-[200px]">
                    {productosReemplazo.length > 0 ? (
                      <div className="space-y-2">
                        {productosReemplazo.map((producto) => {
                          // Calcular el precio con descuento si existe
                          const precioConDescuento = calcularPrecioReemplazo(producto)

                          return (
                            <div
                              key={producto.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                            >
                              <div>
                                <div className="font-medium text-sm">{producto.name}</div>
                                <div className="text-xs text-gray-500 mt-1">Cantidad: {producto.cantidad}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  {formatearPrecio(precioConDescuento * producto.cantidad)}
                                </div>
                                <div className="text-xs text-gray-500">{formatearPrecio(precioConDescuento)} c/u</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 border rounded-md text-gray-500">
                        <p>No hay productos de reemplazo</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Resumen financiero */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4 bg-gray-50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  Resumen financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div className="text-xs text-gray-600">Total a devolver</div>
                    <div className="text-base font-semibold">{formatearPrecio(calcularTotalDevolucion())}</div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div className="text-xs text-gray-600">Total reemplazo</div>
                    <div className="text-base font-semibold">{formatearPrecio(calcularTotalReemplazo())}</div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div className="text-xs text-gray-600">Diferencia</div>
                    <div
                      className={`text-base font-semibold ${
                        calcularDiferencia() > 0 ? "text-red-600" : calcularDiferencia() < 0 ? "text-green-600" : ""
                      }`}
                    >
                      {calcularDiferencia() > 0
                        ? `A pagar: ${formatearPrecio(calcularDiferencia())}`
                        : calcularDiferencia() < 0
                          ? `A favor: ${formatearPrecio(Math.abs(calcularDiferencia()))}`
                          : "Sin diferencia"}
                    </div>
                  </div>
                </div>

                {calcularDiferencia() !== 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md border text-sm">
                    <div className="flex justify-between items-center">
                      {calcularDiferencia() > 0 ? (
                        <>
                          <div className="text-xs text-gray-600">Método de pago:</div>
                          <div className="font-medium">
                            {tipoPagoSeleccionado
                              ? tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoSeleccionado)?.nombre
                              : "No seleccionado"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-600">Crédito a favor de:</div>
                          <div className="font-medium">
                            {(typeof setCliente === "function" ? cliente?.id : clienteLocal?.id)
                              ? typeof setCliente === "function"
                                ? cliente.nombre
                                : clienteLocal.nombre
                              : "Cliente no seleccionado"}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Mostrar información de cuenta corriente si aplica */}
                    {((calcularDiferencia() > 0 &&
                      tipoPagoSeleccionado &&
                      tiposPagoDisponibles
                        .find((tp) => tp.id.toString() === tipoPagoSeleccionado)
                        ?.nombre.toLowerCase()
                        .includes("cuenta")) ||
                      calcularDiferencia() < 0) &&
                      (typeof setCliente === "function" ? cliente?.id : clienteLocal?.id) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cliente:</span>
                              <span className="font-medium">
                                {typeof setCliente === "function" ? cliente.nombre : clienteLocal.nombre}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Saldo actual:</span>
                              <span className={cuentaCorrienteInfo?.saldo > 0 ? "text-red-600" : "text-green-600"}>
                                {formatearPrecio(cuentaCorrienteInfo?.saldo || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span className="text-gray-600">Nuevo saldo:</span>
                              <span
                                className={
                                  Number(cuentaCorrienteInfo?.saldo || 0) + Number(calcularDiferencia()) > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {formatearPrecio(
                                  Number(cuentaCorrienteInfo?.saldo || 0) + Number(calcularDiferencia()),
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {tipoDevolucion === "defectuoso" && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-start gap-2 text-sm">
                    <AlertOctagon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Productos defectuosos</p>
                      <p className="text-sm">
                        Los productos marcados como defectuosos se registrarán como pérdida y no volverán al inventario.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  const renderDialogCliente = () => {
    return (
      <Dialog open={dialogClienteAbierto} onOpenChange={setDialogClienteAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
            <DialogDescription>Busque un cliente existente o cree uno nuevo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar cliente por nombre o teléfono..."
                className="pl-9 text-sm"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
              />
            </div>

            {clientesBusqueda.length > 0 ? (
              <ScrollArea className="h-40">
                {clientesBusqueda.map((clienteItem) => (
                  <div
                    key={clienteItem.id}
                    className="p-2 rounded-md border hover:bg-gray-50 cursor-pointer text-sm mb-1"
                  >
                    <div className="font-medium">{clienteItem.nombre}</div>
                    <div className="text-gray-500">Teléfono: {clienteItem.telefono || "No especificado"}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 w-full text-xs"
                      onClick={() => seleccionarCliente(clienteItem)}
                    >
                      Seleccionar este cliente
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            ) : busquedaCliente.length > 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No se encontraron clientes</p>
              </div>
            ) : null}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setDialogClienteAbierto(false)
                setDialogNuevoClienteAbierto(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Cliente
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDialogClienteAbierto(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const renderDialogNuevoCliente = () => (
    <Dialog open={dialogNuevoClienteAbierto} onOpenChange={setDialogNuevoClienteAbierto}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>Ingrese los datos del nuevo cliente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="nombre" className="text-sm">
              Nombre
            </Label>
            <Input
              id="nombre"
              className="text-sm"
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="telefono" className="text-sm">
              Teléfono (opcional)
            </Label>
            <Input
              id="telefono"
              className="text-sm"
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setDialogNuevoClienteAbierto(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={crearNuevoCliente} className="bg-orange-600 hover:bg-orange-700">
            Crear Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <ArrowLeftRight size={20} />
            Devolución de Productos
          </DialogTitle>
          <DialogDescription>
            Gestione la devolución de productos para la venta #{venta?.numeroFactura}
          </DialogDescription>
        </DialogHeader>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Paso {paso} de 3</div>
            <div className="text-sm text-gray-500">
              {paso === 1 ? "Selección de productos" : paso === 2 ? "Productos de reemplazo" : "Confirmación"}
            </div>
          </div>
          <Progress value={(paso / 3) * 100} className="h-2 bg-gray-100" />
        </div>

        {/* Contenido del paso actual */}
        <div className="py-2 max-h-[70vh] overflow-y-auto pr-1">{renderContenidoPaso()}</div>

        <DialogFooter className="flex justify-between items-center pt-2 border-t">
          <div>
            {paso > 1 && !estadoDevolucion.exito && (
              <Button
                variant="outline"
                onClick={retrocederPaso}
                disabled={procesandoDevolucion}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}
          </div>
          <div>
            {paso < 3 ? (
              <Button onClick={avanzarPaso} className="bg-orange-600 hover:bg-orange-700 flex items-center gap-1">
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              !estadoDevolucion.exito && (
                <Button
                  onClick={procesarDevolucion}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={procesandoDevolucion}
                >
                  {procesandoDevolucion ? (
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
                    "Confirmar Devolución"
                  )}
                </Button>
              )
            )}

            {estadoDevolucion.exito && (
              <Button onClick={() => setOpen(false)} className="bg-green-600 hover:bg-green-700">
                Cerrar
              </Button>
            )}
          </div>
        </DialogFooter>

        {/* Diálogos para selección y creación de clientes */}
        {renderDialogCliente()}
        {renderDialogNuevoCliente()}
      </DialogContent>
    </Dialog>
  )
}

export default DevolucionDialog
