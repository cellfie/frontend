import { useState, useEffect } from "react"
import { Search, Plus, Package, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { getCategorias } from "../../../services/categoriasService"

export const ProductHeader = ({
  searchTerm,
  setSearchTerm,
  stockRange,
  pointOfSale,
  setPointOfSale,
  onAddClick,
  totalProducts = 0,
  puntosVenta = [],
  selectedCategory,
  setSelectedCategory,
  maxStockAvailable = 100,
}) => {
  const [categorias, setCategorias] = useState([])

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getCategorias()
        setCategorias(data)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      }
    }
    fetchCategorias()
  }, [])

  const clearSearch = () => {
    setSearchTerm("")
  }

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "todas" ||
    stockRange[0] > 0 ||
    stockRange[1] < maxStockAvailable ||
    pointOfSale !== "todos"

  return (
    <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mb-6">
      <div className="bg-[#131321] p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
            <Package size={20} /> Stock de Productos
          </h2>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            {totalProducts} productos
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
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

          <div className="flex gap-2 md:gap-3 flex-wrap">
            <Select value={pointOfSale} onValueChange={setPointOfSale}>
              <SelectTrigger
                className={`h-9 w-auto text-sm ${
                  pointOfSale !== "todos" ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{pointOfSale === "todos" ? "Todos" : pointOfSale}</span>
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

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger
                className={`h-9 w-auto text-sm ${
                  selectedCategory !== "todas"
                    ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <Package size={14} />
                  <span>Categoría: {selectedCategory === "todas" ? "Todas" : selectedCategory}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <Badge variant="outline" className="ml-2 text-xs bg-gray-50">
                  Búsqueda: {searchTerm}
                </Badge>
              )}
              {pointOfSale !== "todos" && (
                <Badge variant="outline" className="ml-1 text-xs bg-gray-50">
                  Punto de venta: {pointOfSale}
                </Badge>
              )}
              {selectedCategory !== "todas" && (
                <Badge variant="outline" className="ml-1 text-xs bg-gray-50">
                  Categoría: {selectedCategory}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("todas")
                setPointOfSale("todos")
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

