"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactTooltip from "react-tooltip"
import {
  Edit,
  Trash,
  ChevronUp,
  ChevronDown,
  Package,
  Info,
  DollarSign,
  Box,
  MapPin,
  PercentCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const ProductTable = ({
  products = [],
  isLoading = false,
  onEdit,
  onDelete,
  showDetails,
  toggleDetails,
  onAddDiscount,
}) => {
  // Función para formatear precio en formato de moneda argentina
  const formatPrice = (price) => {
    const numPrice = typeof price === "number" ? price : Number(price)
    if (isNaN(numPrice)) return "$ 0,00"

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(numPrice)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg shadow-md border-0 overflow-hidden bg-white">
        <div className="p-4 flex items-center justify-between border-b">
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden p-3">
      <div className="relative max-h-[600px] overflow-auto">
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20 bg-white">
            <TableRow className="border-b after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-border">
              <TableHead className="bg-white">Nombre / Código</TableHead>
              <TableHead className="hidden md:table-cell bg-white">Descripción</TableHead>
              <TableHead className="bg-white">Precio</TableHead>
              <TableHead className="bg-white">Stock</TableHead>
              <TableHead className="bg-white">Punto de Venta</TableHead>
              <TableHead className="bg-white">Fecha Creación</TableHead>
              <TableHead className="text-right bg-white">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-12 w-12 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-500">No hay productos disponibles</h3>
                    <p className="text-sm text-gray-400">
                      No se encontraron productos que coincidan con los criterios de búsqueda
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <React.Fragment key={product.id}>
                  <TableRow className={`group ${showDetails === product.id ? "bg-orange-50" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.code}</div>
                        </div>
                        {product.discount && new Date(product.discount.endDate) > new Date() && (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300">
                            <PercentCircle className="h-3 w-3 mr-1" />
                            {product.discount.percentage}% OFF
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600 max-w-[300px] truncate">
                      {product.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.discount && new Date(product.discount.endDate) > new Date() ? (
                        <div>
                          <span className="text-orange-600">
                            {formatPrice(product.price * (1 - product.discount.percentage / 100))}
                          </span>
                          <span className="text-gray-400 text-xs line-through ml-1">{formatPrice(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-orange-600">{formatPrice(product.price)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={product.stock < 3 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-normal ${product.pointOfSale === "Tala" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-indigo-300 bg-indigo-50 text-indigo-700"}`}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {product.pointOfSale || "No asignado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.fechaCreacion
                          ? new Date(product.fechaCreacion).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.fechaCreacion
                          ? (() => {
                              // Crear una nueva fecha y sumar 3 horas para corregir el desfase
                              const fecha = new Date(product.fechaCreacion)
                              fecha.setHours(fecha.getHours() + 3)

                              // Formatear en formato de 24 horas
                              return fecha.toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            })()
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDetails(product.id)}
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content={showDetails === product.id ? "Ocultar detalles" : "Ver detalles"}
                          className={
                            showDetails === product.id
                              ? "bg-orange-100 text-orange-700"
                              : "hover:bg-orange-50 hover:text-orange-600"
                          }
                        >
                          {showDetails === product.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(product)}
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="Editar producto"
                          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(product.id)}
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="Eliminar producto"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <ReactTooltip id="action-tooltip" />
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {showDetails === product.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0 border-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="mx-4 my-2 border border-orange-200 shadow-sm">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2 space-y-3">
                                    <div className="flex items-center gap-2 text-orange-700">
                                      <Info size={16} />
                                      <h3 className="font-medium">Información detallada</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Nombre</div>
                                        <div className="font-medium">{product.name}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Código</div>
                                        <div className="font-medium">{product.code}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Categoría</div>
                                        <div className="font-medium">{product.category || "Sin categoría"}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Punto de Venta</div>
                                        <div className="font-medium flex items-center">
                                          <Badge
                                            variant="outline"
                                            className={`font-normal mr-1 ${product.pointOfSale === "Tala" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-indigo-300 bg-indigo-50 text-indigo-700"}`}
                                          >
                                            {product.pointOfSale || "No asignado"}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <div className="text-gray-500">Descripción</div>
                                        <div className="font-medium">{product.description || "Sin descripción"}</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-[#131321]/5 p-4 rounded-lg flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 text-orange-700 mb-3">
                                        <DollarSign size={16} />
                                        <h3 className="font-medium">Información comercial</h3>
                                      </div>

                                      <div className="space-y-3">
                                        <div>
                                          <div className="text-gray-500 text-sm">Precio</div>
                                          {product.discount && new Date(product.discount.endDate) > new Date() ? (
                                            <div>
                                              <div className="text-2xl font-bold text-orange-700">
                                                {formatPrice(product.price * (1 - product.discount.percentage / 100))}
                                              </div>
                                              <div className="text-sm text-gray-500 flex items-center">
                                                <span className="line-through mr-2">{formatPrice(product.price)}</span>
                                                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300">
                                                  {product.discount.percentage}% OFF
                                                </Badge>
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Hasta: {new Date(product.discount.endDate).toLocaleDateString()}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-2xl font-bold text-orange-700">
                                              {formatPrice(product.price)}
                                            </div>
                                          )}
                                        </div>

                                        <Separator className="bg-[#131321]/10" />

                                        <div>
                                          <div className="text-gray-500 text-sm flex items-center gap-1">
                                            <Box size={14} /> Inventario
                                          </div>
                                          <div className="font-medium flex items-center gap-2">
                                            <span className={product.stock < 3 ? "text-red-600" : "text-green-600"}>
                                              {product.stock} unidades
                                            </span>
                                            <Badge
                                              variant={
                                                product.stock > 10
                                                  ? "outline"
                                                  : product.stock > 0
                                                    ? "secondary"
                                                    : "destructive"
                                              }
                                              className={`font-normal text-xs ${
                                                product.stock > 10
                                                  ? "border-green-300 bg-green-50 text-green-700"
                                                  : product.stock > 0 && product.stock < 3
                                                    ? "bg-red-100 text-red-800 border-red-300"
                                                    : product.stock > 0
                                                      ? "bg-orange-100 text-orange-800 border-orange-300"
                                                      : ""
                                              }`}
                                            >
                                              {product.stock > 10
                                                ? "Stock disponible"
                                                : product.stock > 0 && product.stock < 3
                                                  ? "Stock bajo"
                                                  : product.stock > 0
                                                    ? "Stock limitado"
                                                    : "Sin stock"}
                                            </Badge>
                                          </div>
                                        </div>

                                        <Separator className="bg-[#131321]/10" />

                                        {product.discount && new Date(product.discount.endDate) > new Date() ? (
                                          <div>
                                            <div className="text-gray-500 text-sm flex items-center gap-1">
                                              <PercentCircle size={14} /> Descuento activo
                                            </div>
                                            <div className="font-medium">
                                              {product.discount.percentage}% hasta el{" "}
                                              {new Date(product.discount.endDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                                onClick={() => onAddDiscount(product)}
                                              >
                                                Modificar
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  onDelete(product.id, true)
                                                }}
                                              >
                                                Cancelar descuento
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="w-full text-xs bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
                                              onClick={() => onAddDiscount(product)}
                                            >
                                              <PercentCircle className="h-3.5 w-3.5 mr-1" />
                                              Agregar descuento
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(product)}
                                        className="gap-1 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                      >
                                        <Edit className="h-3.5 w-3.5" /> Editar
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onDelete(product.id)}
                                        className="gap-1 bg-[#131321] hover:bg-[#131321]/90"
                                      >
                                        <Trash className="h-3.5 w-3.5" /> Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
