"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Search, Package, Plus, Trash2, Loader2, X, CheckCircle, AlertCircle, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { searchRepuestos } from "@/services/repuestosService"

const RepuestosSeleccionModal = ({
  open,
  onOpenChange,
  puntoVentaId,
  puntoVentaNombre,
  onConfirm,
  formatearPrecio,
}) => {
  // Estados
  const [repuestos, setRepuestos] = useState([])
  const [filteredRepuestos, setFilteredRepuestos] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cargando, setCargando] = useState(false)
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([])

  // Cargar repuestos cuando se abre el modal
  useEffect(() => {
    if (open && puntoVentaId) {
      cargarRepuestos()
    }
  }, [open, puntoVentaId])

  // Cargar repuestos del punto de venta
  const cargarRepuestos = async () => {
    if (!puntoVentaId) {
      toast.error("Debe seleccionar un punto de venta", { position: "bottom-right" })
      return
    }

    setCargando(true)
    setSearchTerm("")

    try {
      // Filtrar repuestos por punto de venta seleccionado
      const data = await searchRepuestos({
        punto_venta_id: puntoVentaId,
      })

      // Filtrar solo repuestos con stock > 0
      const repuestosConStock = data.filter((repuesto) => repuesto.stock > 0)

      setRepuestos(repuestosConStock)
      setFilteredRepuestos(repuestosConStock)
    } catch (error) {
      console.error("Error al cargar repuestos:", error)
      toast.error("Error al cargar repuestos", { position: "bottom-right" })
    } finally {
      setCargando(false)
    }
  }

  // Filtrar repuestos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRepuestos(repuestos)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = repuestos.filter(
      (repuesto) => repuesto.nombre?.toLowerCase().includes(term) || repuesto.descripcion?.toLowerCase().includes(term),
    )
    setFilteredRepuestos(filtered)
  }, [searchTerm, repuestos])

  // Seleccionar o deseleccionar un repuesto
  const toggleRepuesto = (repuesto) => {
    // Verificar si ya está seleccionado
    const index = repuestosSeleccionados.findIndex((r) => r.id === repuesto.id)

    if (index >= 0) {
      // Si ya está seleccionado, lo quitamos
      const nuevosSeleccionados = [...repuestosSeleccionados]
      nuevosSeleccionados.splice(index, 1)
      setRepuestosSeleccionados(nuevosSeleccionados)
    } else {
      // Si no está seleccionado, lo agregamos con cantidad 1
      setRepuestosSeleccionados([
        ...repuestosSeleccionados,
        {
          ...repuesto,
          cantidad: 1,
          stockOriginal: repuesto.stock,
        },
      ])
    }
  }

  // Cambiar la cantidad de un repuesto seleccionado
  const cambiarCantidad = (id, nuevaCantidad) => {
    const repuesto = repuestosSeleccionados.find((r) => r.id === id)

    // Validar que no exceda el stock disponible
    if (nuevaCantidad > repuesto.stockOriginal) {
      toast.error(`No puede exceder el stock disponible (${repuesto.stockOriginal})`, { position: "bottom-right" })
      return
    }

    // Validar que sea al menos 1
    if (nuevaCantidad < 1) {
      toast.error("La cantidad mínima es 1", { position: "bottom-right" })
      return
    }

    const nuevosSeleccionados = repuestosSeleccionados.map((r) => (r.id === id ? { ...r, cantidad: nuevaCantidad } : r))

    setRepuestosSeleccionados(nuevosSeleccionados)
  }

  // Eliminar un repuesto seleccionado
  const eliminarRepuestoSeleccionado = (id) => {
    setRepuestosSeleccionados(repuestosSeleccionados.filter((r) => r.id !== id))
  }

  // Confirmar selección de repuestos
  const confirmarSeleccion = () => {
    onConfirm(repuestosSeleccionados)
  }

  // Verificar si un repuesto está seleccionado
  const estaSeleccionado = (id) => {
    return repuestosSeleccionados.some((r) => r.id === id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 bg-[#131321] text-white">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-blue-500">
            <Package size={20} /> Seleccionar Repuestos Utilizados
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Seleccione los repuestos que se utilizaron en esta reparación para descontar del inventario
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(90vh-180px)]">
          {/* Panel izquierdo: Lista de repuestos disponibles */}
          <div className="border-r border-gray-200">
            <div className="p-4 border-b bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar repuestos por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-9 border-gray-200 focus-visible:ring-blue-500"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-full"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
              </div>

              {puntoVentaId && puntoVentaNombre && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <MapPin className="h-3 w-3 mr-1" />
                    {puntoVentaNombre}
                  </Badge>
                  <span className="text-xs text-gray-500">Solo se muestran repuestos con stock disponible</span>
                </div>
              )}
            </div>

            <ScrollArea className="h-[calc(90vh-280px)]">
              {cargando ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-500 text-lg">Cargando repuestos...</p>
                </div>
              ) : filteredRepuestos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Package className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No se encontraron repuestos</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm ? "Intente con otra búsqueda" : "No hay repuestos disponibles en este punto de venta"}
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid gap-3">
                    {filteredRepuestos.map((repuesto) => (
                      <div
                        key={repuesto.id}
                        onClick={() => toggleRepuesto(repuesto)}
                        className={`group p-3 border rounded-lg transition-all duration-200 cursor-pointer ${
                          estaSeleccionado(repuesto.id)
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h4 className="font-medium text-gray-900 group-hover:text-blue-900">
                                  {repuesto.nombre}
                                </h4>
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {repuesto.descripcion || "Sin descripción"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-600">
                                  {formatearPrecio(repuesto.precio)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                <Package className="h-3 w-3 mr-1" />
                                Stock: {repuesto.stock}
                              </Badge>

                              {estaSeleccionado(repuesto.id) ? (
                                <Badge className="bg-blue-500 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Seleccionado
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 h-7"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Seleccionar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Panel derecho: Repuestos seleccionados */}
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Repuestos Seleccionados ({repuestosSeleccionados.length})
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Estos repuestos se descontarán del inventario al marcar la reparación como terminada
              </p>
            </div>

            <ScrollArea className="flex-1 h-[calc(90vh-280px)]">
              {repuestosSeleccionados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <div className="bg-gray-50 rounded-lg p-6 text-center max-w-md">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-gray-700 font-medium mb-2">No hay repuestos seleccionados</h4>
                    <p className="text-gray-500 text-sm">
                      Seleccione los repuestos utilizados en la reparación desde la lista de la izquierda.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Si no se utilizaron repuestos, puede continuar sin seleccionar ninguno.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {repuestosSeleccionados.map((repuesto) => (
                    <div key={repuesto.id} className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-blue-900">{repuesto.nombre}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            eliminarRepuestoSeleccionado(repuesto.id)
                          }}
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {repuesto.descripcion && <p className="text-gray-600 text-xs mb-2">{repuesto.descripcion}</p>}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`cantidad-${repuesto.id}`} className="text-xs text-gray-500">
                            Cantidad:
                          </Label>
                          <Input
                            id={`cantidad-${repuesto.id}`}
                            type="number"
                            min="1"
                            max={repuesto.stockOriginal}
                            value={repuesto.cantidad}
                            onChange={(e) => cambiarCantidad(repuesto.id, Number.parseInt(e.target.value) || 1)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 h-8 text-sm border-gray-200 focus-visible:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500">(Máx: {repuesto.stockOriginal})</span>
                        </div>
                        <div className="text-sm font-bold text-blue-600">{formatearPrecio(repuesto.precio)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t bg-gray-50 mt-auto">
              {repuestosSeleccionados.length > 0 && (
                <div className="mb-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Resumen:</p>
                      <p>
                        Se descontarán {repuestosSeleccionados.reduce((sum, r) => sum + r.cantidad, 0)} unidades de{" "}
                        {repuestosSeleccionados.length} repuestos diferentes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmarSeleccion} className="bg-blue-600 hover:bg-blue-700">
                  Confirmar Selección
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RepuestosSeleccionModal
