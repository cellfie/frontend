"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Search, Package, X, MapPin, Loader2, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { searchRepuestos } from "@/services/repuestosService"

const PreciosRepuestos = ({
  isOpen,
  onClose,
  puntoVentaId,
  puntoVentaNombre,
  formatearPrecio,
}) => {
  const [repuestos, setRepuestos] = useState([])
  const [filteredRepuestos, setFilteredRepuestos] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!isOpen || !puntoVentaId) return

    let cancelled = false

    const cargar = async () => {
      setCargando(true)
      setSearchTerm("")

      try {
        const data = await searchRepuestos({
          punto_venta_id: puntoVentaId,
        })

        if (cancelled) return

        const normalizados = (data || []).map((repuesto) => ({
          ...repuesto,
          precio: Number.parseFloat(repuesto.precio) || 0,
        }))

        setRepuestos(normalizados)
        setFilteredRepuestos(normalizados)
      } catch (error) {
        if (cancelled) return
        console.error("Error al cargar precios de repuestos:", error)
        toast.error(error.message || "Error al cargar precios de repuestos", {
          position: "bottom-right",
        })
        setRepuestos([])
        setFilteredRepuestos([])
      } finally {
        if (!cancelled) setCargando(false)
      }
    }

    cargar()

    return () => {
      cancelled = true
    }
  }, [isOpen, puntoVentaId])

  useEffect(() => {
    if (!isOpen) return

    if (!searchTerm.trim()) {
      setFilteredRepuestos(repuestos)
      return
    }

    const term = searchTerm.toLowerCase()
    setFilteredRepuestos(
      repuestos.filter(
        (r) =>
          r.nombre?.toLowerCase().includes(term) ||
          r.descripcion?.toLowerCase().includes(term) ||
          r.codigo?.toLowerCase().includes(term),
      ),
    )
  }, [searchTerm, repuestos, isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Precios de repuestos"
      >
        {/* Header */}
        <div className="bg-[#131321] px-4 sm:px-5 py-3.5 flex justify-between items-start gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-orange-600 text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 shrink-0" />
              Precios de repuestos
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-0.5">
              Consultá precios y stock sin interrumpir el registro
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="p-4 border-b bg-gray-50 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-10 border-orange-200 focus-visible:ring-orange-500"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            )}
          </div>

          {puntoVentaNombre && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-normal">
              <MapPin className="h-3 w-3 mr-1" />
              {puntoVentaNombre}
            </Badge>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              <p className="text-sm text-gray-500">Cargando precios...</p>
            </div>
          ) : filteredRepuestos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 px-4 text-center">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="text-gray-600 font-medium">No se encontraron repuestos</p>
              <p className="text-sm text-gray-400">
                {searchTerm ? "Probá con otro término de búsqueda" : "No hay repuestos en este punto de venta"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredRepuestos.map((repuesto) => (
                <li
                  key={repuesto.id}
                  className="px-4 sm:px-5 py-3 flex items-start justify-between gap-3 hover:bg-orange-50/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base leading-snug">{repuesto.nombre}</p>
                    {(repuesto.descripcion || repuesto.codigo) && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {repuesto.codigo ? `${repuesto.codigo}` : ""}
                        {repuesto.codigo && repuesto.descripcion ? " · " : ""}
                        {repuesto.descripcion || ""}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs font-normal ${
                          Number(repuesto.stock) > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {Number(repuesto.stock) > 0 ? `Stock: ${repuesto.stock}` : "Sin stock"}
                      </Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right pt-0.5">
                    <span className="text-base sm:text-lg font-bold text-orange-600 tabular-nums">
                      {formatearPrecio(repuesto.precio)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t bg-gray-50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs sm:text-sm text-gray-500">
            {filteredRepuestos.length} repuesto{filteredRepuestos.length !== 1 ? "s" : ""}
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PreciosRepuestos
