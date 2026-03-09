"use client"

import { useEffect, useState } from "react"
import { ArrowDownCircle, ArrowUpCircle, Clock, Package, MapPin, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getMovimientosInventario } from "@/services/inventarioService"

const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numero)
}

const formatearFechaHora = (fechaString) => {
  if (!fechaString) return ""
  const fecha = new Date(fechaString)
  if (isNaN(fecha.getTime())) return ""

  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const StockMovementsModal = ({ open, onClose, puntoVentaId = null }) => {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState("todos") // todos | entrada | salida

  const pageSize = 20

  const cargarMovimientos = async (pageToLoad = 1, reset = false, tipo = tipoFiltro) => {
    setLoading(true)
    try {
      const filters = {}
      if (puntoVentaId) {
        filters.punto_venta_id = puntoVentaId
      }
      if (tipo && tipo !== "todos") {
        filters.tipo = tipo
      }

      const data = await getMovimientosInventario(pageToLoad, pageSize, filters)

      if (reset) {
        setMovimientos(data.movimientos || [])
      } else {
        setMovimientos((prev) => [...prev, ...(data.movimientos || [])])
      }

      setPage(data.pagination.currentPage)
      setHasNextPage(data.pagination.hasNextPage)
    } catch (error) {
      console.error("Error al cargar movimientos de inventario:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      // Al abrir, cargar primera página y resetear lista
      setMovimientos([])
      cargarMovimientos(1, true, tipoFiltro)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleCambiarTipo = (nuevoTipo) => {
    setTipoFiltro(nuevoTipo)
    setMovimientos([])
    cargarMovimientos(1, true, nuevoTipo)
  }

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, idx) => (
      <div key={idx} className="flex items-center justify-between py-3 border-b">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    ))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Historial de movimientos de stock
          </DialogTitle>
          <DialogDescription>
            Consulta todas las entradas y salidas de stock (ventas, compras, devoluciones, pérdidas, ajustes, etc.).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <Select value={tipoFiltro} onValueChange={handleCambiarTipo}>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="salida">Salidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline" className="flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3 text-green-600" />
              Entrada
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3 text-red-600" />
              Salida
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          <div className="divide-y">
            {loading && movimientos.length === 0
              ? renderSkeletons()
              : movimientos.length === 0
                ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-sm">No hay movimientos para los filtros seleccionados.</p>
                </div>
                  )
                : movimientos.map((mov) => {
                    const esEntrada = Number(mov.cantidad) > 0
                    const cantidadAbs = Math.abs(Number(mov.cantidad) || 0)

                    return (
                      <div key={mov.id} className="flex items-center justify-between py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center ${
                              esEntrada ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}
                          >
                            {esEntrada ? (
                              <ArrowDownCircle className="h-5 w-5" />
                            ) : (
                              <ArrowUpCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {mov.producto_nombre} ({mov.producto_codigo})
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1 border-indigo-200 bg-indigo-50 text-indigo-700"
                              >
                                <MapPin className="h-3 w-3" />
                                {mov.punto_venta_nombre}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatearFechaHora(mov.fecha)}
                              </span>
                              {mov.tipo_movimiento && (
                                <Badge variant="outline" className="text-[10px] bg-gray-50">
                                  {mov.tipo_movimiento}
                                </Badge>
                              )}
                              {mov.usuario_nombre && <span>Usuario: {mov.usuario_nombre}</span>}
                              {mov.referencia_id && (
                                <span className="text-[11px] text-gray-400">Ref: {mov.referencia_id}</span>
                              )}
                            </div>
                            {mov.notas && (
                              <p className="text-xs text-gray-600 max-w-[600px] line-clamp-2">{mov.notas}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1 min-w-[110px]">
                          <div
                            className={`text-sm font-semibold ${
                              esEntrada ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {esEntrada ? "+" : "-"} {cantidadAbs}
                          </div>
                          <div className="text-xs text-gray-500">
                            {esEntrada ? "Entrada de stock" : "Salida de stock"}
                          </div>
                        </div>
                      </div>
                    )
                  })}

            {loading && movimientos.length > 0 && renderSkeletons()}
          </div>
        </ScrollArea>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Mostrando {movimientos.length} movimientos{tipoFiltro !== "todos" && ` (${tipoFiltro})`}
          </span>
          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                if (!loading && hasNextPage) {
                  cargarMovimientos(page + 1, false, tipoFiltro)
                }
              }}
            >
              Ver más
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

