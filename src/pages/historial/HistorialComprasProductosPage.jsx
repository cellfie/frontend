"use client"

import { useState, useEffect } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Search, Filter, FileText, MapPin, Factory, Trash2, AlertTriangle, Receipt, Calendar, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { DateRangePicker } from "@/lib/DatePickerWithRange"
import { PaginationControls } from "@/lib/PaginationControls"

import { getComprasPaginadas, getCompraById, anularCompra } from "@/services/comprasService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getProveedores } from "@/services/proveedoresService"
import { useAuth } from "@/context/AuthContext"

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

const formatLocalDate = (date) => {
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numero)
}

export default function HistorialComprasProductosPage() {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const [compras, setCompras] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)
  const [detalleCompraAbierto, setDetalleCompraAbierto] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [startItem, setStartItem] = useState(1)
  const [endItem, setEndItem] = useState(0)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPuntoVenta, setSelectedPuntoVenta] = useState("todos")
  const [selectedProveedor, setSelectedProveedor] = useState("todos")
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  })

  const [puntosVenta, setPuntosVenta] = useState([])
  const [proveedores, setProveedores] = useState([])

  const [dialogAnularAbierto, setDialogAnularAbierto] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [compraAnular, setCompraAnular] = useState(null)
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [puntos, provs] = await Promise.all([getPuntosVenta(), getProveedores()])
        setPuntosVenta(puntos)
        setProveedores(provs)
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      }
    }
    cargarDatosIniciales()
  }, [])

  const construirFiltros = () => {
    const filters = {}

    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      filters.search = debouncedSearchTerm.trim()
    }
    if (selectedPuntoVenta && selectedPuntoVenta !== "todos") {
      filters.punto_venta_id = selectedPuntoVenta
    }
    if (selectedProveedor && selectedProveedor !== "todos") {
      filters.proveedor_id = selectedProveedor
    }
    if (mostrarAnuladas) {
      filters.anuladas = "true"
    }
    if (dateRange.from) {
      filters.fecha_inicio = formatLocalDate(dateRange.from)
    }
    if (dateRange.to) {
      filters.fecha_fin = formatLocalDate(dateRange.to)
    }

    return filters
  }

  const cargarCompras = async (page = 1, limit = itemsPerPage) => {
    setIsLoading(true)
    try {
      const filters = construirFiltros()
      const data = await getComprasPaginadas(page, limit, filters)

      setCompras(data.compras || [])
      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage)
        setItemsPerPage(data.pagination.itemsPerPage)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
        setHasNextPage(data.pagination.hasNextPage)
        setHasPrevPage(data.pagination.hasPrevPage)
        setStartItem(data.pagination.startItem)
        setEndItem(data.pagination.endItem)
      }
    } catch (error) {
      console.error("Error al cargar compras:", error)
      toast.error(error.message || "Error al cargar compras")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarCompras(1, itemsPerPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedPuntoVenta, selectedProveedor, mostrarAnuladas, dateRange.from, dateRange.to])

  const cargarDetalleCompra = async (compraId) => {
    if (detalleCompraAbierto === compraId) {
      setDetalleCompraAbierto(null)
      setCompraSeleccionada(null)
      return
    }

    setLoadingDetalle(true)
    try {
      const compra = await getCompraById(compraId)
      setCompraSeleccionada(compra)
      setDetalleCompraAbierto(compraId)
    } catch (error) {
      console.error("Error al obtener detalle de compra:", error)
      toast.error(error.message || "Error al obtener detalle de compra")
    } finally {
      setLoadingDetalle(false)
    }
  }

  const handleCambiarPagina = (page) => {
    if (page < 1 || page > totalPages) return
    cargarCompras(page, itemsPerPage)
  }

  const handleCambiarItemsPorPagina = (limit) => {
    setItemsPerPage(limit)
    cargarCompras(1, limit)
  }

  const abrirDialogAnular = (compra) => {
    setCompraAnular(compra)
    setMotivoAnulacion("")
    setProcesandoAnulacion(false)
    setDialogAnularAbierto(true)
  }

  const confirmarAnulacion = async () => {
    if (!compraAnular) return
    if (!motivoAnulacion.trim()) {
      toast.error("El motivo de anulación es obligatorio")
      return
    }

    setProcesandoAnulacion(true)
    try {
      const result = await anularCompra(compraAnular.id, motivoAnulacion)
      toast.success(result.message || "Compra anulada correctamente")

      setCompras((prev) =>
        prev.map((c) => (c.id === compraAnular.id ? { ...c, anulada: 1, motivo_anulacion: motivoAnulacion } : c)),
      )
      setDialogAnularAbierto(false)
      setCompraAnular(null)
    } catch (error) {
      console.error("Error al anular compra:", error)
      toast.error(error.message || "Error al anular compra")
    } finally {
      setProcesandoAnulacion(false)
    }
  }

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, idx) => (
      <TableRow key={idx}>
        <TableCell>
          <Skeleton className="h-4 w-40" />
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
          <Skeleton className="h-4 w-24" />
        </TableCell>
      </TableRow>
    ))

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Compras de Productos</h1>
          <p className="text-gray-500">Consulta y gestiona las compras realizadas a proveedores</p>
        </div>
      </div>

      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            Filtros de búsqueda
          </CardTitle>
          <CardDescription className="text-gray-300">
            Filtra las compras por proveedor, punto de venta, fecha o número de comprobante
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por comprobante o proveedor..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Punto de venta
              </Label>
              <Select value={selectedPuntoVenta} onValueChange={setSelectedPuntoVenta}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {puntosVenta.map((pv) => (
                    <SelectItem key={pv.id} value={pv.id.toString()}>
                      {pv.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Factory className="h-3 w-3" /> Proveedor
              </Label>
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {proveedores.map((prov) => (
                    <SelectItem key={prov.id} value={prov.id.toString()}>
                      {prov.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Rango de fechas
              </Label>
              <DateRangePicker date={dateRange} setDate={setDateRange} className="w-full" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarAnuladas((prev) => !prev)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${
                  mostrarAnuladas
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {mostrarAnuladas ? "Mostrando anuladas" : "Ocultar anuladas"}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setSelectedPuntoVenta("todos")
                setSelectedProveedor("todos")
                setMostrarAnuladas(false)
                setDateRange({ from: null, to: null })
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Receipt size={20} />
            Compras registradas
          </CardTitle>
          <CardDescription className="text-gray-300">
            {totalItems} compras encontradas. Mostrando {startItem} - {endItem}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-white">
                <TableRow className="border-b">
                  <TableHead className="bg-white">Fecha</TableHead>
                  <TableHead className="bg-white">Comprobante</TableHead>
                  <TableHead className="bg-white">Proveedor</TableHead>
                  <TableHead className="bg-white">Punto de venta</TableHead>
                  <TableHead className="bg-white text-right">Total</TableHead>
                  <TableHead className="bg-white text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? renderSkeletons()
                  : compras.length === 0 && !isLoading
                    ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="h-12 w-12 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-500">No hay compras registradas</h3>
                          <p className="text-sm text-gray-400">
                            Ajusta los filtros o registra una nueva compra.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                      )
                    : compras.map((compra) => (
                        <TableRow
                          key={compra.id}
                          className={compra.anulada ? "bg-red-50" : detalleCompraAbierto === compra.id ? "bg-orange-50" : ""}
                        >
                          <TableCell>
                            {new Date(compra.fecha).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{compra.numero_comprobante}</span>
                              {compra.anulada && (
                                <Badge className="mt-1 bg-red-100 text-red-800 border-red-300 text-[10px]">
                                  Anulada
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{compra.proveedor_nombre}</span>
                              {compra.proveedor_cuit && (
                                <span className="text-xs text-gray-500">CUIT: {compra.proveedor_cuit}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">{compra.punto_venta_nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatearMonedaARS(compra.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cargarDetalleCompra(compra.id)}
                                className={
                                  detalleCompraAbierto === compra.id
                                    ? "bg-orange-100 text-orange-700"
                                    : "hover:bg-orange-50 hover:text-orange-600"
                                }
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                              {isAdmin && !compra.anulada && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => abrirDialogAnular(compra)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-3 px-4 border-t bg-gray-50">
          <div className="text-xs text-gray-600">
            Mostrando {startItem} - {endItem} de {totalItems} compras
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={handleCambiarPagina}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleCambiarItemsPorPagina}
          />
        </CardFooter>
      </Card>

      {/* Modal de detalle de compra */}
      <Dialog
        open={!!compraSeleccionada}
        onOpenChange={(open) => {
          if (!open) {
            setCompraSeleccionada(null)
            setDetalleCompraAbierto(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-600" />
              Detalle de compra
            </DialogTitle>
            <DialogDescription>
              Información completa de la compra, sus productos y pagos registrados.
            </DialogDescription>
          </DialogHeader>

          {loadingDetalle && (
            <div className="py-6">
              <div className="flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          )}

          {!loadingDetalle && compraSeleccionada && (
            <div className="space-y-4">
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Comprobante</p>
                  <p className="font-semibold">{compraSeleccionada.numero_comprobante}</p>
                  <p className="text-xs text-gray-500 mt-2">Fecha</p>
                  <p className="font-medium">
                    {compraSeleccionada.fecha
                      ? new Date(compraSeleccionada.fecha).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Registrado por</p>
                  <p className="font-medium">{compraSeleccionada.usuario_nombre || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Proveedor</p>
                  <p className="font-semibold">{compraSeleccionada.proveedor_nombre}</p>
                  {compraSeleccionada.proveedor_cuit && (
                    <p className="text-xs text-gray-500">CUIT: {compraSeleccionada.proveedor_cuit}</p>
                  )}
                  {compraSeleccionada.proveedor_telefono && (
                    <p className="text-xs text-gray-500">Teléfono: {compraSeleccionada.proveedor_telefono}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Punto de venta</p>
                  <p className="font-medium">{compraSeleccionada.punto_venta_nombre}</p>
                  <p className="text-xs text-gray-500 mt-2">Estado</p>
                  <div>
                    {compraSeleccionada.anulada ? (
                      <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">Anulada</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">Vigente</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Totales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-semibold">
                    {formatearMonedaARS(compraSeleccionada.subtotal ?? compraSeleccionada.total ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Descuento</p>
                  <p className="font-semibold">
                    {compraSeleccionada.porcentaje_descuento
                      ? `${compraSeleccionada.porcentaje_descuento}% (${formatearMonedaARS(
                          compraSeleccionada.monto_descuento || 0,
                        )})`
                      : formatearMonedaARS(compraSeleccionada.monto_descuento || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-orange-600">
                    {formatearMonedaARS(compraSeleccionada.total || 0)}
                  </p>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Productos de la compra
                  </p>
                  <p className="text-xs text-gray-500">
                    {Array.isArray(compraSeleccionada.detalles) ? compraSeleccionada.detalles.length : 0} ítems
                  </p>
                </div>
                {(!compraSeleccionada.detalles || compraSeleccionada.detalles.length === 0) && (
                  <p className="text-xs text-gray-500">Esta compra no tiene productos asociados.</p>
                )}
                {compraSeleccionada.detalles && compraSeleccionada.detalles.length > 0 && (
                  <div className="border rounded-md max-h-64 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow>
                          <TableHead className="text-xs">Producto</TableHead>
                          <TableHead className="text-xs text-center">Cant.</TableHead>
                          <TableHead className="text-xs text-right">Costo unit.</TableHead>
                          <TableHead className="text-xs text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compraSeleccionada.detalles.map((det) => (
                          <TableRow key={det.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{det.producto_nombre}</span>
                                {det.producto_codigo && (
                                  <span className="text-[11px] text-gray-500">Cod: {det.producto_codigo}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">{det.cantidad}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatearMonedaARS(det.costo_unitario)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatearMonedaARS(det.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Pagos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    Pagos de la compra
                  </p>
                  <p className="text-xs text-gray-500">
                    {Array.isArray(compraSeleccionada.pagos) ? compraSeleccionada.pagos.length : 0} registros
                  </p>
                </div>
                {(!compraSeleccionada.pagos || compraSeleccionada.pagos.length === 0) && (
                  <p className="text-xs text-gray-500">No hay pagos registrados para esta compra.</p>
                )}
                {compraSeleccionada.pagos && compraSeleccionada.pagos.length > 0 && (
                  <div className="border rounded-md max-h-56 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow>
                          <TableHead className="text-xs">Fecha</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs text-right">Monto</TableHead>
                          <TableHead className="text-xs">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compraSeleccionada.pagos.map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell className="text-xs">
                              {pago.fecha
                                ? new Date(pago.fecha).toLocaleString("es-AR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs">{pago.tipo_pago_nombre}</TableCell>
                            <TableCell className="text-xs text-right">
                              {formatearMonedaARS(pago.monto)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {pago.anulado ? (
                                <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">Anulado</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">
                                  Vigente
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Notas y anulación */}
              {(compraSeleccionada.notas || compraSeleccionada.anulada) && (
                <div className="space-y-2">
                  {compraSeleccionada.notas && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Notas</p>
                      <p className="text-sm bg-gray-50 border rounded-md p-2">{compraSeleccionada.notas}</p>
                    </div>
                  )}
                  {compraSeleccionada.anulada && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-800 space-y-1">
                      <p className="font-semibold">Compra anulada</p>
                      {compraSeleccionada.fecha_anulacion && (
                        <p>
                          Fecha de anulación:{" "}
                          {new Date(compraSeleccionada.fecha_anulacion).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                      {compraSeleccionada.motivo_anulacion && (
                        <p>Motivo: {compraSeleccionada.motivo_anulacion}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAnularAbierto} onOpenChange={setDialogAnularAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle size={18} />
              Anular compra
            </DialogTitle>
            <DialogDescription>
              Esta acción revertirá el stock ingresado por esta compra y marcará todos sus pagos como anulados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-gray-50 p-3 rounded-md border text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Comprobante:</span>
                <span className="font-medium">{compraAnular?.numero_comprobante}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Proveedor:</span>
                <span className="font-medium">{compraAnular?.proveedor_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-medium">{formatearMonedaARS(compraAnular?.total || 0)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="motivo-anulacion">Motivo de anulación</Label>
              <Textarea
                id="motivo-anulacion"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Describe el motivo de la anulación..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAnularAbierto(false)} disabled={procesandoAnulacion}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarAnulacion}
              disabled={procesandoAnulacion || !motivoAnulacion.trim()}
            >
              {procesandoAnulacion ? "Anulando..." : "Confirmar anulación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

