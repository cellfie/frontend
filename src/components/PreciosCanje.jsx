"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Search, DollarSign, Trash2, ArrowUpRight, Plus, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Importar el servicio de precios canjes
import { getPreciosCanjes, createPrecioCanje, deletePrecioCanje } from "@/services/preciosCanjesService"

// Función para formatear moneda en formato argentino
const formatearMonedaARS = (valor) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor)
}

// Estilos personalizados para la barra de desplazamiento
const scrollbarStyles = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
    background: #d1d5db;
  }
  .scrollbar-track-gray-100::-webkit-scrollbar-track {
    background: #f3f4f6;
  }
`

const PreciosCanjes = ({ isOpen, onClose, dollarPrice, onSelectPrice, showApplyButtons = false }) => {
  // Estados
  const [preciosCanjes, setPreciosCanjes] = useState([])
  const [busquedaPrecioCanje, setBusquedaPrecioCanje] = useState("")
  const [cargandoPreciosCanjes, setCargandoPreciosCanjes] = useState(false)
  const [activeTab, setActiveTab] = useState("lista")
  const [nuevoEquipoCanjePrecio, setNuevoEquipoCanjePrecio] = useState({
    nombre: "",
    precioNormal: "",
    precioCellfie: "",
  })

  // Obtener información del usuario actual
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  // Cargar precios canjes
  useEffect(() => {
    const cargarPreciosCanjes = async () => {
      if (!isOpen) return

      setCargandoPreciosCanjes(true)
      try {
        const data = await getPreciosCanjes()
        setPreciosCanjes(data)
      } catch (error) {
        console.error("Error al cargar precios de canjes:", error)
        toast.error("Error al cargar precios de canjes")
      } finally {
        setCargandoPreciosCanjes(false)
      }
    }

    cargarPreciosCanjes()
  }, [isOpen])

  // Filtrar precios de canjes por búsqueda
  const preciosCanjesFiltrados = preciosCanjes.filter(
    (precio) => !busquedaPrecioCanje.trim() || precio.nombre.toLowerCase().includes(busquedaPrecioCanje.toLowerCase()),
  )

  // Agregar precio de canje
  const agregarPrecioCanje = async () => {
    if (!nuevoEquipoCanjePrecio.nombre.trim()) {
      toast.error("El nombre del equipo es obligatorio", { position: "bottom-right" })
      return
    }

    if (!nuevoEquipoCanjePrecio.precioNormal || !nuevoEquipoCanjePrecio.precioCellfie) {
      toast.error("Ambos precios son obligatorios", { position: "bottom-right" })
      return
    }

    try {
      // Agregar nuevo precio
      const nuevoPrecio = await createPrecioCanje({
        nombre: nuevoEquipoCanjePrecio.nombre,
        precioNormal: Number.parseFloat(nuevoEquipoCanjePrecio.precioNormal),
        precioCellfie: Number.parseFloat(nuevoEquipoCanjePrecio.precioCellfie),
      })

      setPreciosCanjes([...preciosCanjes, nuevoPrecio])
      toast.success("Precio de canje agregado correctamente", { position: "bottom-right" })

      // Resetear formulario
      setNuevoEquipoCanjePrecio({
        nombre: "",
        precioNormal: "",
        precioCellfie: "",
      })
      setActiveTab("lista")
    } catch (error) {
      console.error("Error al guardar precio de canje:", error)
      toast.error("Error al guardar precio de canje: " + error.message)
    }
  }

  // Eliminar precio de canje
  const eliminarPrecioCanje = async (index) => {
    try {
      await deletePrecioCanje(preciosCanjes[index].id)

      const nuevosPrecios = [...preciosCanjes]
      nuevosPrecios.splice(index, 1)
      setPreciosCanjes(nuevosPrecios)

      toast.success("Precio de canje eliminado correctamente", { position: "bottom-right" })
    } catch (error) {
      console.error("Error al eliminar precio de canje:", error)
      toast.error("Error al eliminar precio de canje: " + error.message)
    }
  }

  // Aplicar precio de canje
  const aplicarPrecioCanje = (precio) => {
    if (onSelectPrice) {
      onSelectPrice(precio)
      onClose()
    }
  }

  // Agregar estilos de scrollbar al DOM
  useEffect(() => {
    if (typeof document !== "undefined" && isOpen) {
      const styleElement = document.createElement("style")
      styleElement.innerHTML = scrollbarStyles
      document.head.appendChild(styleElement)

      return () => {
        document.head.removeChild(styleElement)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Precios de Canjes
            </h2>
            <p className="text-orange-100 text-sm">Gestiona los precios de referencia para equipos de canje</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-orange-700/50 rounded-full h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 border-b">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="lista" className="rounded-md">
                <Search className="h-4 w-4 mr-2" />
                Lista de Precios
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="agregar" className="rounded-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Precio
                </TabsTrigger>
              )}
              {!isAdmin && <div></div>}
            </TabsList>
          </div>

          {/* Lista de precios */}
          <TabsContent value="lista" className="p-6 flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar equipo..."
                  className="pl-8"
                  value={busquedaPrecioCanje}
                  onChange={(e) => setBusquedaPrecioCanje(e.target.value)}
                />
              </div>
              {isAdmin && (
                <Button
                  onClick={() => {
                    setActiveTab("agregar")
                    setNuevoEquipoCanjePrecio({
                      nombre: "",
                      precioNormal: "",
                      precioCellfie: "",
                    })
                  }}
                  className="bg-orange-600 hover:bg-orange-700 sm:w-auto w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Precio
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
              {cargandoPreciosCanjes ? (
                <div className="p-8 text-center flex-1 flex flex-col justify-center">
                  <div className="animate-spin mx-auto mb-4 h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-500">Cargando precios de canjes...</p>
                </div>
              ) : preciosCanjesFiltrados.length > 0 ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="overflow-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>Equipo</TableHead>
                          <TableHead className="text-right">Precio Normal</TableHead>
                          <TableHead className="text-right">Precio Cellfie</TableHead>
                          <TableHead className="text-right w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preciosCanjesFiltrados.map((precio, index) => (
                          <TableRow key={precio.id} className="group">
                            <TableCell className="font-medium">{precio.nombre}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span>${Number(precio.precioNormal).toFixed(2)}</span>
                                <span className="text-xs text-gray-500">
                                  {formatearMonedaARS(Number(precio.precioNormal) * dollarPrice)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-orange-600">${Number(precio.precioCellfie).toFixed(2)}</span>
                                <span className="text-xs text-gray-500">
                                  {formatearMonedaARS(Number(precio.precioCellfie) * dollarPrice)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                {showApplyButtons && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => aplicarPrecioCanje(Number(precio.precioNormal))}
                                      title="Aplicar precio normal"
                                    >
                                      <DollarSign size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                      onClick={() => aplicarPrecioCanje(Number(precio.precioCellfie))}
                                      title="Aplicar precio Cellfie"
                                    >
                                      <ArrowUpRight size={14} />
                                    </Button>
                                  </>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => eliminarPrecioCanje(index)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 flex-1 flex flex-col justify-center">
                  <DollarSign className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <h3 className="text-sm font-medium mb-1">No hay precios registrados</h3>
                  <p className="text-xs">
                    {busquedaPrecioCanje
                      ? "No se encontraron resultados con los filtros aplicados"
                      : "Agrega precios de referencia para equipos de canje"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Formulario para agregar - Solo visible para administradores */}
          {isAdmin && (
            <TabsContent value="agregar" className="p-6 focus:outline-none overflow-auto">
              <div className="max-w-md mx-auto bg-white rounded-lg">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombreEquipo">
                      Nombre del equipo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombreEquipo"
                      value={nuevoEquipoCanjePrecio.nombre}
                      onChange={(e) => setNuevoEquipoCanjePrecio({ ...nuevoEquipoCanjePrecio, nombre: e.target.value })}
                      placeholder="Ej: iPhone 13 Pro 128GB"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="precioNormal" className="flex items-center gap-2">
                      Precio Normal (USD) <span className="text-red-500">*</span>
                      <Badge variant="outline" className="font-normal text-xs">
                        Equipos externos
                      </Badge>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="precioNormal"
                        type="text"
                        value={nuevoEquipoCanjePrecio.precioNormal}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setNuevoEquipoCanjePrecio({ ...nuevoEquipoCanjePrecio, precioNormal: value })
                          }
                        }}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                    {nuevoEquipoCanjePrecio.precioNormal && (
                      <p className="text-xs text-gray-500">
                        Equivalente: {formatearMonedaARS(Number(nuevoEquipoCanjePrecio.precioNormal) * dollarPrice)}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="precioCellfie" className="flex items-center gap-2">
                      Precio Cellfie (USD) <span className="text-red-500">*</span>
                      <Badge
                        variant="outline"
                        className="font-normal text-xs bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Equipos propios
                      </Badge>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="precioCellfie"
                        type="text"
                        value={nuevoEquipoCanjePrecio.precioCellfie}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setNuevoEquipoCanjePrecio({ ...nuevoEquipoCanjePrecio, precioCellfie: value })
                          }
                        }}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                    {nuevoEquipoCanjePrecio.precioCellfie && (
                      <p className="text-xs text-gray-500">
                        Equivalente: {formatearMonedaARS(Number(nuevoEquipoCanjePrecio.precioCellfie) * dollarPrice)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4 gap-3">
                    <Button variant="outline" onClick={() => setActiveTab("lista")} className="w-full">
                      Cancelar
                    </Button>
                    <Button onClick={agregarPrecioCanje} className="w-full bg-orange-600 hover:bg-orange-700">
                      Agregar Precio
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default PreciosCanjes
