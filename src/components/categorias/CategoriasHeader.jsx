"use client"
import { Search, Plus, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export const CategoriasHeader = ({
  searchTerm,
  setSearchTerm,
  mostrarInactivas,
  setMostrarInactivas,
  onAddClick,
  totalCategorias = 0,
}) => {
  const clearSearch = () => {
    setSearchTerm("")
  }

  const hasActiveFilters = searchTerm || mostrarInactivas

  return (
    <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mb-6">
      <div className="bg-[#131321] p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
            <Tag size={20} /> Gestión de Categorías
          </h2>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            {totalCategorias} categorías
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre de categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full pr-8"
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

          <div className="flex gap-2 md:gap-3 items-center">
            <div className="flex items-center space-x-2">
              <Switch id="mostrar-inactivas" checked={mostrarInactivas} onCheckedChange={setMostrarInactivas} />
              <Label htmlFor="mostrar-inactivas" className="text-sm">
                Mostrar inactivas
              </Label>
            </div>

            <Button onClick={onAddClick} size="sm" className="whitespace-nowrap bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Agregar</span>
              <span className="sm:hidden">Nueva</span>
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
                  Búsqueda: {searchTerm}
                </Badge>
              )}
              {mostrarInactivas && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
                  Incluyendo inactivas
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm("")
                setMostrarInactivas(false)
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
