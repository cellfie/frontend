"use client"

import { useState, useEffect, useCallback } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Save,
  Info,
  MapPin,
  Filter,
  Factory,
  Receipt,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AddProductModal } from "@/components/stock/productos/AddProductModal"

import { getProductosPaginados, adaptProductoToFrontend, createProducto, getProductoById } from "@/services/productosService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getCategorias } from "@/services/categoriasService"
import { getProveedores } from "@/services/proveedoresService"
import { getTiposPago } from "@/services/pagosService"
import { createCompra } from "@/services/comprasService"
import { getCajaActual } from "@/services/cajaService"
import { useAuth } from "@/context/AuthContext"
import { Link } from "react-router-dom"
import { VentaModalPagosUI } from "@/components/ventas/VentaModalPagosUI"

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

const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numero)
}

const ComprasProductos = () => {
  const { currentUser } = useAuth()

  const [busqueda, setBusqueda] = useState("")
  const [productos, setProductos] = useState([])
  const [itemsCompra, setItemsCompra] = useState([])
  const [cargando, setCargando] = useState(false)

  const [puntosVenta, setPuntosVenta] = useState([])
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [categorias, setCategorias] = useState([])

  const [proveedores, setProveedores] = useState([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
  const [busquedaProveedor, setBusquedaProveedor] = useState("")

  const [tiposPagoDisponibles, setTiposPagoDisponibles] = useState([])
  const [pagos, setPagos] = useState([])
  const [montoPagoActual, setMontoPagoActual] = useState("")
  const [tipoPagoActual, setTipoPagoActual] = useState("")

  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0)
  const [descuentoInputValue, setDescuentoInputValue] = useState("0")

  const [dialogFinalizarAbierto, setDialogFinalizarAbierto] = useState(false)
  const [dialogNuevoProductoAbierto, setDialogNuevoProductoAbierto] = useState(false)
  const [procesandoCompra, setProcesandoCompra] = useState(false)
  const [cajaAbierta, setCajaAbierta] = useState(null)

  const debouncedSearchTerm = useDebounce(busqueda, 300)

  useEffect(() => {
    if (!puntoVentaSeleccionado) {
      setCajaAbierta(null)
      return
    }
    let cancelled = false
    getCajaActual(puntoVentaSeleccionado)
      .then((data) => {
        if (!cancelled) setCajaAbierta(!!data)
      })
      .catch(() => {
        if (!cancelled) setCajaAbierta(false)
      })
    return () => {
      cancelled = true
    }
  }, [puntoVentaSeleccionado])

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)
        if (puntos.length > 0) {
          let puntoDefecto
          if (currentUser?.id === 7) {
            // Para FABIAN (ID 7), seleccionar "Tala" por defecto
            puntoDefecto = puntos.find((p) => p.nombre.toLowerCase() === "tala")
          } else {
            // Para otros usuarios, seleccionar "Trancas" por defecto si existe
            puntoDefecto = puntos.find((p) => p.nombre.toLowerCase() === "trancas")
          }

          setPuntoVentaSeleccionado(puntoDefecto ? puntoDefecto.id.toString() : puntos[0].id.toString())
        }

        const cats = await getCategorias()
        setCategorias(cats)

        const proveedoresData = await getProveedores()
        setProveedores(proveedoresData)
        if (proveedoresData.length > 0) {
          setProveedorSeleccionado(proveedoresData[0].id.toString())
        }

        const tipos = await getTiposPago()
        const tiposCompra = [
          ...tipos.filter((t) => t.nombre.toLowerCase() !== "cuenta corriente"),
          {
            id: 999,
            nombre: "Cuenta corriente proveedor",
            descripcion: "Compra a cuenta corriente del proveedor",
          },
        ]
        setTiposPagoDisponibles(tiposCompra)
        if (tiposCompra.length > 0) {
          setTipoPagoActual(tiposCompra[0].id.toString())
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      }
    }

    cargarDatosIniciales()
  }, [])

  const buscarProductos = useCallback(async () => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || !puntoVentaSeleccionado) {
      setProductos([])
      return
    }

    setCargando(true)
    try {
      const filters = {
        search: debouncedSearchTerm,
      }

      if (puntoVentaSeleccionado) {
        filters.punto_venta_id = puntoVentaSeleccionado
      }

      if (filtroCategoria && filtroCategoria !== "todos") {
        filters.categoria_id = filtroCategoria
      }

      const result = await getProductosPaginados(1, 50, filters)
      const productosAdaptados = result.data.map(adaptProductoToFrontend).map((prod) => ({
        ...prod,
        price: typeof prod.price === "number" ? prod.price : Number.parseFloat(prod.price) || 0,
        costPrice: typeof prod.costPrice === "number" ? prod.costPrice : Number.parseFloat(prod.costPrice) || 0,
      }))

      setProductos(productosAdaptados)
    } catch (error) {
      console.error("Error en búsqueda de productos:", error)
      toast.error("Error al buscar productos")
    } finally {
      setCargando(false)
    }
  }, [debouncedSearchTerm, puntoVentaSeleccionado, filtroCategoria])

  useEffect(() => {
    buscarProductos()
  }, [buscarProductos])

  const agregarProducto = (prod) => {
    if (prod.punto_venta_id.toString() !== puntoVentaSeleccionado) {
      toast.error(`Solo puedes comprar productos para el punto de venta seleccionado`)
      return
    }

    const existe = itemsCompra.find((i) => i.id === prod.id)
    if (existe) {
      setItemsCompra((prev) => prev.map((i) => (i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)))
    } else {
      setItemsCompra((prev) => [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          code: prod.code,
          cantidad: 1,
          costo_anterior: prod.costPrice ?? 0,
          costo_unitario: prod.costPrice ?? 0,
          precio_venta_anterior: prod.price ?? 0,
          precio_venta: prod.price ?? 0,
        },
      ])
    }
  }

  const cambiarCantidad = (id, nueva) => {
    if (nueva < 1) return
    setItemsCompra((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: nueva } : i)))
  }

  const cambiarCosto = (id, nuevoCosto) => {
    const valorNumerico = Number.parseFloat(
      typeof nuevoCosto === "string" ? nuevoCosto.replace(/\$\s?/g, "").replace(/\./g, "").replace(",", ".") : nuevoCosto,
    )
    if (Number.isNaN(valorNumerico) || valorNumerico < 0) return
    setItemsCompra((prev) => prev.map((i) => (i.id === id ? { ...i, costo_unitario: valorNumerico } : i)))
  }

  const cambiarPrecioVenta = (id, nuevoPrecioVenta) => {
    const valorNumerico = Number.parseFloat(
      typeof nuevoPrecioVenta === "string"
        ? nuevoPrecioVenta.replace(/\$\s?/g, "").replace(/\./g, "").replace(",", ".")
        : nuevoPrecioVenta,
    )
    if (Number.isNaN(valorNumerico) || valorNumerico < 0) return
    setItemsCompra((prev) => prev.map((i) => (i.id === id ? { ...i, precio_venta: valorNumerico } : i)))
  }

  const eliminarProducto = (id) => {
    setItemsCompra((prev) => prev.filter((i) => i.id !== id))
  }

  const calcularSubtotal = () =>
    itemsCompra.reduce((sum, item) => sum + Number(item.costo_unitario || 0) * Number(item.cantidad || 0), 0)

  const calcularDescuento = () => (calcularSubtotal() * porcentajeDescuento) / 100

  const calcularTotal = () => calcularSubtotal() - calcularDescuento()

  const calcularTotalPagado = () => pagos.reduce((total, pago) => total + Number(pago.monto), 0)

  const calcularRestante = () => calcularTotal() - calcularTotalPagado()

  const handleDescuentoFocus = () => {
    if (descuentoInputValue === "0") setDescuentoInputValue("")
  }

  const handleDescuentoBlur = () => {
    if (descuentoInputValue === "") {
      setDescuentoInputValue("0")
      setPorcentajeDescuento(0)
    }
  }

  const handleAddPago = () => {
    const montoNumerico = Number.parseFloat(
      typeof montoPagoActual === "string"
        ? montoPagoActual.replace(/\$\s?/g, "").replace(/\./g, "").replace(",", ".")
        : montoPagoActual,
    )

    if (Number.isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error("El monto del pago debe ser mayor a cero.")
      return
    }

    if (montoNumerico > calcularRestante() + 0.01) {
      toast.error("El monto del pago no puede ser mayor que el restante.")
      return
    }

    const tipoPago = tiposPagoDisponibles.find((tp) => tp.id.toString() === tipoPagoActual)
    if (!tipoPago) {
      toast.error("Seleccione un tipo de pago válido.")
      return
    }

    const nuevoPago = {
      id: Date.now(),
      tipo_pago: tipoPago.nombre,
      tipo_pago_nombre: tipoPago.nombre,
      monto: montoNumerico,
      esTarjeta: false,
    }

    setPagos((prev) => [...prev, nuevoPago])
    setMontoPagoActual("")
  }

  const handleRemovePago = (pagoId) => {
    setPagos((prev) => prev.filter((p) => p.id !== pagoId))
  }

  const finalizarCompra = async () => {
    if (!proveedorSeleccionado) {
      toast.error("Debe seleccionar un proveedor.")
      return
    }
    if (!puntoVentaSeleccionado) {
      toast.error("Debe seleccionar un punto de venta.")
      return
    }
    if (itemsCompra.length === 0) {
      toast.error("Debe agregar al menos un producto.")
      return
    }
    if (pagos.length > 0 && Math.abs(calcularRestante()) > 0.01) {
      toast.error("El total pagado no coincide con el total de la compra.")
      return
    }
    if (!currentUser || !currentUser.id) {
      toast.error("Usuario no autenticado. Por favor, inicie sesión.")
      return
    }

    setProcesandoCompra(true)
    try {
      const compraData = {
        proveedor_id: Number(proveedorSeleccionado),
        punto_venta_id: Number(puntoVentaSeleccionado),
        porcentaje_descuento: porcentajeDescuento,
        productos: itemsCompra.map((p) => ({
          id: p.id,
          cantidad: p.cantidad,
          costo_unitario: p.costo_unitario,
          precio_venta: p.precio_venta,
        })),
        pagos: pagos.map((p) => ({
          tipo_pago: p.tipo_pago,
          monto: p.monto,
        })),
        notas: `Compra de ${itemsCompra.length} productos.`,
      }

      const resultado = await createCompra(compraData)
      toast.success(`Compra #${resultado.numero_comprobante} registrada con éxito`)

      setItemsCompra([])
      setPagos([])
      setPorcentajeDescuento(0)
      setDescuentoInputValue("0")
      setDialogFinalizarAbierto(false)
      setMontoPagoActual("")
      if (debouncedSearchTerm) buscarProductos()
    } catch (error) {
      toast.error(`Error al finalizar compra: ${error.message}`)
    } finally {
      setProcesandoCompra(false)
    }
  }

  const handleCrearProductoDesdeCompra = async (nuevoProducto) => {
    if (!puntoVentaSeleccionado) {
      toast.error("Debe seleccionar un punto de venta antes de crear el producto.")
      throw new Error("Punto de venta no seleccionado")
    }

    if (Number(nuevoProducto.punto_venta_id) !== Number(puntoVentaSeleccionado)) {
      toast.error("El nuevo producto debe crearse en el mismo punto de venta de la compra.")
      throw new Error("Punto de venta inválido para la compra")
    }

    // En compras, el stock inicial del alta debe quedar en 0 para evitar doble suma:
    // 1) alta del producto y 2) registro de la compra.
    const productoParaCrear = {
      ...nuevoProducto,
      stock: 0,
    }

    const creado = await createProducto(productoParaCrear)
    const productoCreadoRaw = await getProductoById(creado.id)
    const productoCreado = {
      ...adaptProductoToFrontend(productoCreadoRaw),
      price:
        typeof productoCreadoRaw.precio === "number"
          ? productoCreadoRaw.precio
          : Number.parseFloat(productoCreadoRaw.precio) || 0,
      costPrice:
        typeof productoCreadoRaw.precio_costo === "number"
          ? productoCreadoRaw.precio_costo
          : Number.parseFloat(productoCreadoRaw.precio_costo) || 0,
    }

    agregarProducto(productoCreado)
    setBusqueda(productoCreado.code || productoCreado.name || "")
    toast.success(`Producto "${productoCreado.name}" creado y agregado a la compra`)

    if (debouncedSearchTerm) {
      await buscarProductos()
    }

    return creado
  }

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

  const proveedoresFiltrados =
    busquedaProveedor.trim().length < 2
      ? proveedores
      : proveedores.filter((p) => {
          const term = busquedaProveedor.toLowerCase()
          return (
            p.nombre.toLowerCase().includes(term) ||
            (p.cuit && p.cuit.toLowerCase().includes(term)) ||
            (p.telefono && p.telefono.toLowerCase().includes(term))
          )
        })

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />

      {puntoVentaSeleccionado && cajaAbierta === false && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-amber-800 font-medium">
            La caja está cerrada para este punto de venta. Debe abrir la caja para poder registrar compras.
          </p>
          <Link to="/caja">
            <Button variant="outline" size="sm" className="border-amber-600 text-amber-700 hover:bg-amber-100">
              Ir a Caja
            </Button>
          </Link>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar compra de productos</h1>
            <div className="flex items-center mt-2 gap-2">
              <Badge variant="outline" className="flex items-center gap-1 border-orange-300 bg-orange-50 text-orange-700">
                <MapPin className="h-3.5 w-3.5" />
                Punto de venta: {getNombrePuntoVenta(puntoVentaSeleccionado) || "Seleccionar"}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 border-blue-300 bg-blue-50 text-blue-700">
                <Factory className="h-3.5 w-3.5" />
                Proveedor:{" "}
                {proveedores.find((p) => p.id.toString() === proveedorSeleccionado)?.nombre || "Seleccionar"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={puntoVentaSeleccionado} onValueChange={setPuntoVentaSeleccionado}>
              <SelectTrigger className="w-[180px] h-9 bg-white shadow-sm">
                <SelectValue placeholder="Punto de venta" />
              </SelectTrigger>
              <SelectContent>
                {puntosVenta.map((punto) => (
                  <SelectItem key={punto.id} value={punto.id.toString()}>
                    {punto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-white shadow-sm flex items-center gap-1">
                  <Factory size={14} />
                  <span className="hidden sm:inline">
                    {proveedores.find((p) => p.id.toString() === proveedorSeleccionado)?.nombre || "Seleccionar proveedor"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4" align="end">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar proveedor por nombre, CUIT o teléfono..."
                      className="pl-8"
                      value={busquedaProveedor}
                      onChange={(e) => setBusquedaProveedor(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-1">
                      {proveedoresFiltrados.map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => {
                            setProveedorSeleccionado(prov.id.toString())
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm ${
                            proveedorSeleccionado === prov.id.toString() ? "bg-orange-50 text-orange-700" : ""
                          }`}
                        >
                          <div className="font-medium">{prov.nombre}</div>
                          <div className="text-xs text-gray-500 flex gap-2">
                            {prov.cuit && <span>CUIT: {prov.cuit}</span>}
                            {prov.telefono && <span>Tel: {prov.telefono}</span>}
                          </div>
                        </button>
                      ))}
                      {proveedoresFiltrados.length === 0 && (
                        <div className="text-center text-xs text-gray-500 py-4">No se encontraron proveedores</div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 overflow-hidden border-0 shadow-md bg-white">
          <CardHeader className="bg-[#131321] pb-3">
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <Package size={20} />
              Buscar Productos
            </CardTitle>
            <CardDescription className="text-gray-300">
              Busca productos por nombre o código para agregarlos a la compra
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
                        className={`w-full justify-start ${
                          filtroCategoria === "todos" ? "bg-orange-50 text-orange-700" : ""
                        }`}
                        onClick={() => setFiltroCategoria("todos")}
                      >
                        Todas las categorías
                      </Button>
                      {categorias.map((cat) => (
                        <Button
                          key={cat.id}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start ${
                            filtroCategoria === cat.id.toString() ? "bg-orange-50 text-orange-700" : ""
                          }`}
                          onClick={() => setFiltroCategoria(cat.id.toString())}
                        >
                          {cat.nombre}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-orange-600 hover:bg-orange-700"
                onClick={() => setDialogNuevoProductoAbierto(true)}
                disabled={!puntoVentaSeleccionado}
              >
                <Plus size={14} className="mr-1" />
                Nuevo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              {cargando ? (
                renderSkeletons()
              ) : productos.length > 0 ? (
                productos.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100"
                    onDoubleClick={() => agregarProducto(prod)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <h3 className="font-medium text-gray-800 line-clamp-1">{prod.name}</h3>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {prod.code}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-normal">
                            Stock actual: {prod.stock}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{prod.description}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="font-semibold text-orange-600">
                          Costo actual: {formatearMonedaARS(prod.costPrice ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : busqueda.length >= 2 && !cargando ? (
                <div className="text-center py-12 text-gray-600">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium mb-1 text-gray-800">No se encontraron productos</h3>
                  <p className="text-sm text-gray-500">No hay productos que coincidan con "{busqueda}"</p>
                </div>
              ) : !cargando ? (
                <div className="text-center py-12 text-gray-600">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl mx-4 border border-orange-200">
                    <Search className="mx-auto h-16 w-16 text-orange-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2 text-gray-800">Busca productos</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Escribe el nombre o código del producto que quieres comprar
                    </p>
                  </div>
                </div>
              ) : null}
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

        <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-[#131321] border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <ShoppingCart size={20} /> Detalle de Compra
            </CardTitle>
            <CardDescription className="text-gray-300">
              Productos seleccionados para la compra en {getNombrePuntoVenta(puntoVentaSeleccionado)}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {itemsCompra.length > 0 ? (
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-orange-600">Producto</TableHead>
                      <TableHead className="text-right text-orange-600">Costo unitario</TableHead>
                      <TableHead className="text-right text-orange-600">Precio venta</TableHead>
                      <TableHead className="text-orange-600 text-center">Cantidad</TableHead>
                      <TableHead className="text-orange-600 text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsCompra.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">Código: {item.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <NumericFormat
                              value={item.costo_unitario}
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$ "
                              decimalScale={2}
                              fixedDecimalScale
                              customInput={Input}
                              className="w-28 text-right"
                              onValueChange={(values) => cambiarCosto(item.id, values.formattedValue)}
                            />
                            {Number(item.costo_anterior ?? 0) !== Number(item.costo_unitario ?? 0) ? (
                              <div className="text-[11px] text-orange-800 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
                                Antes: {formatearMonedaARS(item.costo_anterior ?? 0)}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-500">
                                Costo: {formatearMonedaARS(item.costo_unitario ?? 0)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <NumericFormat
                              value={item.precio_venta}
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$ "
                              decimalScale={2}
                              fixedDecimalScale
                              customInput={Input}
                              className="w-28 text-right"
                              onValueChange={(values) => cambiarPrecioVenta(item.id, values.formattedValue)}
                            />
                            {Number(item.precio_venta_anterior ?? 0) !== Number(item.precio_venta ?? 0) ? (
                              <div className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                                Antes: {formatearMonedaARS(item.precio_venta_anterior ?? 0)}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-500">
                                Venta: {formatearMonedaARS(item.precio_venta ?? 0)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-transparent"
                              onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="w-10 text-center">{item.cantidad}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-transparent"
                              onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatearMonedaARS(Number(item.costo_unitario || 0) * Number(item.cantidad || 0))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => eliminarProducto(item.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 px-4 text-gray-500 border-b">
                <div className="bg-gray-50 p-8 rounded-xl inline-flex flex-col items-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" strokeWidth={1.5} />
                  <h3 className="text-xl font-medium mb-2 text-gray-800">Sin productos en la compra</h3>
                  <p className="text-sm max-w-md">Busca y selecciona productos para agregarlos a la compra</p>
                </div>
              </div>
            )}

            {itemsCompra.length > 0 && (
              <div className="p-4 bg-gray-50 border-t">
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
                            <span className="text-xs text-gray-600">% Desc</span>
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
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setItemsCompra([])
                setPagos([])
              }}
              disabled={!itemsCompra.length}
              className="bg-gray-600 hover:bg-red-800 text-gray-100 hover:text-gray-100"
            >
              <Trash2 size={16} className="mr-1" /> Limpiar
            </Button>

            <Dialog open={dialogFinalizarAbierto} onOpenChange={setDialogFinalizarAbierto}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setPagos([])
                    setMontoPagoActual("")
                    if (tiposPagoDisponibles.length > 0) {
                      setTipoPagoActual(tiposPagoDisponibles[0].id.toString())
                    }
                    setDialogFinalizarAbierto(true)
                  }}
                  disabled={!itemsCompra.length || cajaAbierta === false}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Receipt size={16} className="mr-1" /> Finalizar Compra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg sm:max-w-2xl lg:max-w-6xl xl:max-w-7xl w-[calc(100vw-0.75rem)] lg:w-[min(96vw,1280px)] gap-0 p-0 max-h-[min(96vh,920px)] lg:max-h-[min(92vh,900px)] flex flex-col overflow-hidden sm:rounded-xl">
                <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-[#131321] text-white border-b">
                  <DialogTitle className="text-orange-600 text-lg sm:text-xl">Confirmar Compra</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Mantené el mismo flujo visual de cobro que en ventas. En compras, los pagos son opcionales.
                  </DialogDescription>
                </DialogHeader>
                <div className="px-3 sm:px-5 pb-3 sm:pb-4">
                  <VentaModalPagosUI
                    resumenSlot={
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Resumen de la compra</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600">Proveedor</span>
                            <span className="font-medium text-right">
                              {proveedores.find((p) => p.id.toString() === proveedorSeleccionado)?.nombre || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600">Punto de venta</span>
                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                              {getNombrePuntoVenta(puntoVentaSeleccionado)}
                            </Badge>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600">Productos</span>
                            <span className="font-medium">{itemsCompra.length}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatearMonedaARS(calcularSubtotal())}</span>
                          </div>
                          {porcentajeDescuento > 0 && (
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600">Descuento ({porcentajeDescuento}%)</span>
                              <span className="font-medium text-green-700">-{formatearMonedaARS(calcularDescuento())}</span>
                            </div>
                          )}
                          <Separator className="my-1" />
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-700 font-semibold">Total</span>
                            <span className="text-orange-700 font-bold">{formatearMonedaARS(calcularTotal())}</span>
                          </div>
                        </div>
                      </div>
                    }
                    tiposPago={tiposPagoDisponibles}
                    tipoSeleccionadoId={tipoPagoActual}
                    onTipoChange={setTipoPagoActual}
                    montoPago={montoPagoActual}
                    onMontoChange={setMontoPagoActual}
                    onAddPago={handleAddPago}
                    onRellenarRestante={() => {
                      const restante = calcularRestante()
                      setMontoPagoActual(restante > 0 ? restante.toFixed(2).replace(".", ",") : "")
                    }}
                    restante={calcularRestante()}
                    totalVenta={calcularTotal()}
                    totalPagado={calcularTotalPagado()}
                    pagos={pagos}
                    onRemovePago={handleRemovePago}
                    onPagoTarjetaChange={() => {}}
                    clienteId={null}
                    formatearMonedaARS={formatearMonedaARS}
                    tituloMetodo="Registrar pagos de compra"
                    subtituloMetodo="Podés agregar pagos ahora o confirmar sin pagos."
                    montoInputId="monto-pago-compra"
                    requireAtLeastOnePago={false}
                    extraBannerSlot={
                      <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 p-2.5 text-xs">
                        Los pagos son opcionales. Si no cargás ninguno, la compra se registra igual.
                      </div>
                    }
                  />
                </div>
                <DialogFooter className="px-4 sm:px-6 py-3 border-t bg-white gap-2">
                  <Button variant="outline" onClick={() => setDialogFinalizarAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={finalizarCompra}
                    className="gap-1 bg-orange-600 hover:bg-orange-700"
                    disabled={procesandoCompra || cajaAbierta === false}
                  >
                    {procesandoCompra ? (
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
                        <Save size={16} /> Confirmar Compra
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>

      <AddProductModal
        isOpen={dialogNuevoProductoAbierto}
        onClose={() => setDialogNuevoProductoAbierto(false)}
        onSave={handleCrearProductoDesdeCompra}
        product={null}
        stockDefinidoPorCompra={true}
        puntosVenta={
          puntoVentaSeleccionado
            ? puntosVenta.filter((pv) => pv.id.toString() === puntoVentaSeleccionado)
            : puntosVenta
        }
        defaultPuntoVentaId={puntoVentaSeleccionado ? Number(puntoVentaSeleccionado) : null}
      />
    </div>
  )
}

export default ComprasProductos

