"use client"

import { useState } from "react"
import { Search, Plus, Smartphone, MapPin, Tag, RefreshCw, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const EquipmentHeader = ({
  searchTerm,
  setSearchTerm,
  imeiSearch,
  setImeiSearch,
  priceRange,
  setPriceRange,
  dateRange,
  setDateRange,
  pointOfSale,
  setPointOfSale,
  batteryRange,
  setBatteryRange,
  onAddClick,
  totalEquipment = 0,
  puntosVenta = [],
  incluirVendidos = true,
  setIncluirVendidos,
  soloCanjes = false,
  setSoloCanjes,
}) => {
  const [activeTab, setActiveTab] = useState("marca-modelo")

  const clearSearch = () => {
    if (activeTab === "marca-modelo") {
      setSearchTerm("")
    } else {
      setImeiSearch("")
    }
  }

  const hasActiveFilters =
    searchTerm ||
    imeiSearch ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000 ||
    dateRange[0] !== "" ||
    dateRange[1] !== "" ||
    pointOfSale !== "todos" ||
    batteryRange[0] > 0 ||
    batteryRange[1] < 100 ||
    !incluirVendidos ||
    soloCanjes

  return (
    <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mb-6">
      <div className="bg-[#131321] p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
            <Smartphone size={20} /> Stock de Equipos
          </h2>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            {totalEquipment} equipos
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="marca-modelo" className="text-xs sm:text-sm">
                  <Search className="h-3.5 w-3.5 mr-1" />
                  Marca/Modelo
                </TabsTrigger>
                <TabsTrigger value="imei" className="text-xs sm:text-sm">
                  <Hash className="h-3.5 w-3.5 mr-1" />
                  IMEI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="marca-modelo" className="mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por marca o modelo..."
                    className="pl-9 pr-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="imei" className="mt-0">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por IMEI..."
                    className="pl-9 pr-8"
                    value={imeiSearch}
                    onChange={(e) => setImeiSearch(e.target.value)}
                  />
                  {imeiSearch && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-2 md:gap-3 flex-wrap">
            <Select value={pointOfSale} onValueChange={setPointOfSale}>
              <SelectTrigger
                className={`h-9 w-auto text-sm ${
                  pointOfSale !== "todos" ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <SelectValue placeholder="Todos" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {puntosVenta.map((pv) => (
                  <SelectItem key={pv.id} value={pv.nombre}>
                    {pv.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`whitespace-nowrap flex items-center gap-1 ${
                    !incluirVendidos || soloCanjes
                      ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                      : ""
                  }`}
                >
                  <Tag size={14} />
                  <span className="hidden sm:inline">Estado</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <div className="font-medium px-4 py-2 bg-gray-50 border-b text-sm flex items-center">
                  <Tag size={14} className="mr-2 text-gray-500" />
                  Filtrar por estado
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="incluir-vendidos" checked={incluirVendidos} onCheckedChange={setIncluirVendidos} />
                      <label
                        htmlFor="incluir-vendidos"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Incluir equipos vendidos
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="solo-canjes" checked={soloCanjes} onCheckedChange={setSoloCanjes} />
                      <label
                        htmlFor="solo-canjes"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <RefreshCw size={14} className="mr-1 text-blue-500" />
                        Solo equipos de Plan Canje
                      </label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button onClick={onAddClick} size="sm" className="whitespace-nowrap bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Agregar</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
              <FilterIcon size={14} className="text-orange-400" />
              <span>Filtros activos</span>
              {searchTerm && (
                <Badge variant="outline" className="ml-2 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Marca/Modelo: {searchTerm}
                </Badge>
              )}
              {imeiSearch && (
                <Badge variant="outline" className="ml-2 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  IMEI: {imeiSearch}
                </Badge>
              )}
              {pointOfSale !== "todos" && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Punto de venta: {pointOfSale}
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 5000) && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Precio: ${priceRange[0]} - ${priceRange[1]}
                </Badge>
              )}
              {(batteryRange[0] > 0 || batteryRange[1] < 100) && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Batería: {batteryRange[0]}% - {batteryRange[1]}%
                </Badge>
              )}
              {(dateRange[0] || dateRange[1]) && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Fecha: {dateRange[0] || "Inicio"} → {dateRange[1] || "Fin"}
                </Badge>
              )}
              {!incluirVendidos && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Solo disponibles
                </Badge>
              )}
              {soloCanjes && (
                <Badge
                  variant="outline"
                  className="ml-1 text-xs bg-blue-50 border-blue-200 text-blue-700 flex items-center"
                >
                  <RefreshCw size={10} className="mr-1" />
                  Solo Plan Canje
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm("")
                setImeiSearch("")
                setPriceRange([0, 5000])
                setDateRange(["", ""])
                setPointOfSale("todos")
                setBatteryRange([0, 100])
                setIncluirVendidos(true)
                setSoloCanjes(false)
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Icono de filtro personalizado
const FilterIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

// Icono X para limpiar búsqueda
const X = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
