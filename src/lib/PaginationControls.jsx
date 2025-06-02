"use client"

import React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
}) => {
  // Calcular el rango de elementos mostrados
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const delta = 2 // Número de páginas a mostrar a cada lado de la página actual
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) {
    return (
      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mt-4">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {totalItems} producto{totalItems !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Productos por página:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number.parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mt-4">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Información de elementos */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando {startItem}-{endItem} de {totalItems} productos
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Por página:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(Number.parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2">
            {/* Ir a primera página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Página anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNumber, index) => (
                <React.Fragment key={index}>
                  {pageNumber === "..." ? (
                    <span className="px-2 py-1 text-sm text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                      disabled={isLoading}
                      className={`h-8 w-8 p-0 ${
                        currentPage === pageNumber
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Página siguiente */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Ir a última página */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Información adicional en móvil */}
        <div className="sm:hidden mt-3 pt-3 border-t">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              Página {currentPage} de {totalPages}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
