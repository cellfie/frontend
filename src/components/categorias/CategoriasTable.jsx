"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Edit, Trash, ChevronUp, ChevronDown, Tag, Info, Calendar, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const CategoriasTable = ({ categorias, isLoading, onEdit, onDelete, onToggleActive }) => {
  const [showDetails, setShowDetails] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const toggleDetails = (id) => setShowDetails((prev) => (prev === id ? null : id))

  const handleDeleteClick = (categoria) => {
    setDeleteConfirm(categoria)
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await onDelete(deleteConfirm.id)
      } catch (error) {
        console.error("Error al eliminar:", error)
      } finally {
        setDeleteConfirm(null)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
              <Skeleton className="h-4 flex-1" />
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
              <TableHead className="bg-white">Estado</TableHead>
              <TableHead className="bg-white">Nombre</TableHead>
              <TableHead className="hidden md:table-cell bg-white">Productos</TableHead>
              <TableHead className="hidden sm:table-cell bg-white">Fecha creación</TableHead>
              <TableHead className="hidden lg:table-cell bg-white">Última actualización</TableHead>
              <TableHead className="text-right bg-white">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Tag className="h-12 w-12 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-500">No hay categorías disponibles</h3>
                    <p className="text-sm text-gray-400">
                      No se encontraron categorías que coincidan con los criterios de búsqueda
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((categoria) => (
                <React.Fragment key={categoria.id}>
                  <TableRow
                    className={`group ${showDetails === categoria.id ? "bg-orange-50" : ""} ${!categoria.activo ? "bg-gray-50" : ""}`}
                  >
                    <TableCell>
                      {categoria.activo ? (
                        <Badge variant="outline" className="font-normal border-green-300 bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal border-red-300 bg-red-50 text-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{categoria.nombre}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-normal border-orange-200 bg-orange-50 text-orange-700">
                        {categoria.productos || 0} productos
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {formatDate(categoria.fecha_creacion)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {formatDate(categoria.fecha_actualizacion)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleDetails(categoria.id)}
                                className={
                                  showDetails === categoria.id
                                    ? "bg-orange-100 text-orange-700"
                                    : "hover:bg-orange-50 hover:text-orange-600"
                                }
                              >
                                {showDetails === categoria.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {showDetails === categoria.id ? "Ocultar detalles" : "Ver detalles"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(categoria)}
                                className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar categoría</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleActive(categoria)}
                                className={
                                  categoria.activo
                                    ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                                    : "text-green-500 hover:text-green-600 hover:bg-green-50"
                                }
                              >
                                {categoria.activo ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {categoria.activo ? "Desactivar categoría" : "Activar categoría"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(categoria)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar categoría</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {showDetails === categoria.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0 border-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="mx-4 my-2 border border-orange-200 shadow-sm">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-orange-700">
                                      <Info size={16} />
                                      <h3 className="font-medium">Información detallada</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-y-2 text-sm">
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Nombre</div>
                                        <div className="font-medium">{categoria.nombre}</div>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="text-gray-500">Descripción</div>
                                        <div className="font-medium">{categoria.descripcion || "Sin descripción"}</div>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="text-gray-500">Estado</div>
                                        <div className="font-medium">
                                          {categoria.activo ? (
                                            <Badge
                                              variant="outline"
                                              className="font-normal border-green-300 bg-green-50 text-green-700"
                                            >
                                              Activa
                                            </Badge>
                                          ) : (
                                            <Badge
                                              variant="outline"
                                              className="font-normal border-red-300 bg-red-50 text-red-700"
                                            >
                                              Inactiva
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-[#131321]/5 p-4 rounded-lg flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 text-orange-700 mb-3">
                                        <Calendar size={16} />
                                        <h3 className="font-medium">Información adicional</h3>
                                      </div>

                                      <div className="space-y-3">
                                        <div>
                                          <div className="text-gray-500 text-sm">Productos asociados</div>
                                          <div className="text-2xl font-bold text-orange-700">
                                            {categoria.productos || 0}
                                          </div>
                                        </div>

                                        <div>
                                          <div className="text-gray-500 text-sm flex items-center gap-1">
                                            <Calendar size={14} /> Fecha de creación
                                          </div>
                                          <div className="font-medium">{formatDate(categoria.fecha_creacion)}</div>
                                        </div>

                                        <div>
                                          <div className="text-gray-500 text-sm flex items-center gap-1">
                                            <Calendar size={14} /> Última actualización
                                          </div>
                                          <div className="font-medium">{formatDate(categoria.fecha_actualizacion)}</div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(categoria)}
                                        className="gap-1 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                      >
                                        <Edit className="h-3.5 w-3.5" /> Editar
                                      </Button>
                                      <Button
                                        variant={categoria.activo ? "destructive" : "outline"}
                                        size="sm"
                                        onClick={() => onToggleActive(categoria)}
                                        className={
                                          categoria.activo
                                            ? "gap-1 bg-[#131321] hover:bg-[#131321]/90"
                                            : "gap-1 border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                        }
                                      >
                                        {categoria.activo ? (
                                          <>
                                            <XCircle className="h-3.5 w-3.5" /> Desactivar
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3.5 w-3.5" /> Activar
                                          </>
                                        )}
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

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && deleteConfirm.productos > 0 ? (
                <>
                  Esta categoría tiene <strong>{deleteConfirm.productos}</strong> productos asociados. No se puede
                  eliminar, pero será desactivada en su lugar.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas eliminar la categoría <strong>{deleteConfirm?.nombre}</strong>? Esta
                  acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              {deleteConfirm && deleteConfirm.productos > 0 ? "Desactivar" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
