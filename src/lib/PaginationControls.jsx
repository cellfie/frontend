"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
  showItemsPerPageSelector = true,
  showPageInfo = true,
  showQuickJump = true,
  className = "",
  size = "default" // "sm", "default", "lg"
}) => {
  // Calcular información de paginación
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Generar array de páginas para mostrar
  const getVisiblePages = () => {
    const delta = size === "sm" ? 1 : size === "lg" ? 3 : 2
    const range = []
    const rangeWithDots = []

    // Calcular el rango de páginas a mostrar
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    // Agregar primera página
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    // Agregar páginas del rango
    rangeWithDots.push(...range)

    // Agregar última página
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = totalPages > 1 ? getVisiblePages() : []

  // Opciones para items por página
  const itemsPerPageOptions = [10, 25, 50, 100, 200]

  // Estilos según el tamaño
  const sizeClasses = {
    sm: {
      button: "h-8 w-8 text-xs",
      select: "h-8 text-xs",
      text: "text-xs",
      gap: "gap-1"
    },
    default: {
      button: "h-9 w-9 text-sm",
      select: "h-9 text-sm", 
      text: "text-sm",
      gap: "gap-2"
    },
    lg: {
      button: "h-10 w-10 text-base",
      select: "h-10 text-base",
      text: "text-base", 
      gap: "gap-3"
    }
  }

  const styles = sizeClasses[size]

  if (totalItems === 0) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Info className="h-4 w-4" />
          <span className={styles.text}>No hay elementos para mostrar</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 py-4 ${className}`}>
      {/* Información de paginación */}
      {showPageInfo && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {totalItems.toLocaleString()} elementos en total
            </Badge>
            <Badge variant="secondary" className="font-normal">
              Página {currentPage} de {totalPages}
            </Badge>
            {startItem > 0 && endItem > 0 && (
              <span className={`text-gray-600 ${styles.text}`}>
                Mostrando {startItem.toLocaleString()}-{endItem.toLocaleString()}
              </span>
            )}
          </div>

          {/* Selector de items por página */}
          {showItemsPerPageSelector && (
            <div className="flex items-center gap-2">
              <span className={`text-gray-600 whitespace-nowrap ${styles.text}`}>
                Elementos por página:
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-20 ${styles.select}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${styles.gap}`}>
            {/* Botón primera página */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={styles.button}
                    onClick={() => onPageChange(1)}
                    disabled={!hasPrevPage || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronsLeft className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Primera página</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botón página anterior */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={styles.button}
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Página anterior</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Números de página */}
            <div className={`flex items-center ${styles.gap}`}>
              {visiblePages.map((page, index) => {
                if (page === "...") {
                  return (
                    <span key={`dots-${index}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  )
                }

                const isCurrentPage = page === currentPage
                return (
                  <Button
                    key={page}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="icon"
                    className={`${styles.button} ${
                      isCurrentPage 
                        ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600" 
                        : "hover:bg-orange-50 hover:border-orange-300"
                    }`}
                    onClick={() => onPageChange(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            {/* Botón página siguiente */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={styles.button}
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Página siguiente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botón última página */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={styles.button}
                    onClick={() => onPageChange(totalPages)}
                    disabled={!hasNextPage || isLoading}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Última página</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Salto rápido a página (opcional) */}
      {showQuickJump && totalPages > 10 && (
        <div className="flex items-center justify-center gap-2">
          <span className={`text-gray-600 ${styles.text}`}>Ir a página:</span>
          <Select
            value=""
            onValueChange={(value) => onPageChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className={`w-20 ${styles.select}`}>
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <SelectItem key={page} value={page.toString()}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className={styles.text}>Cargando...</span>
        </div>
      )}
    </div>
  )
}

export default PaginationControls

// Componente simplificado para casos básicos
export const SimplePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className = ""
}) => {
  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={0}
      itemsPerPage={0}
      onPageChange={onPageChange}
      onItemsPerPageChange={() => {}}
      isLoading={isLoading}
      showItemsPerPageSelector={false}
      showPageInfo={false}
      showQuickJump={false}
      size="sm"
      className={className}
    />
  )
}

// Hook personalizado para manejar paginación
export const usePagination = (initialPage = 1, initialItemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = React.useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage)

  const handlePageChange = React.useCallback((page) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = React.useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }, [])

  const resetPagination = React.useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    setCurrentPage,
    setItemsPerPage
  }
}