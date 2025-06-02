"use client"

import React, { useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactTooltip from "react-tooltip"
import {
  Edit,
  Trash,
  ChevronUp,
  ChevronDown,
  Smartphone,
  Info,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  RefreshCw,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DollarContext } from "@/context/DollarContext"

export const EquipmentTable = ({ equipments, isLoading, onEdit, onDelete, showDetails, toggleDetails }) => {
  // Función auxiliar para asegurarse de que un valor es un número
  const ensureNumber = (value) => {
    if (value === null || value === undefined) return 0
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Función para formatear moneda en formato argentino
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const { dollarPrice } = useContext(DollarContext)

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
              <TableHead className="bg-white">Estado</TableHead>
              <TableHead className="bg-white">Marca / Modelo</TableHead>
              <TableHead className="hidden md:table-cell bg-white">Memoria</TableHead>
              <TableHead className="hidden sm:table-cell bg-white">Color</TableHead>
              <TableHead className="hidden lg:table-cell bg-white">Batería</TableHead>
              <TableHead className="bg-white">Precio USD</TableHead>
              <TableHead className="bg-white">Precio ARS</TableHead>
              <TableHead className="bg-white">Punto de Venta</TableHead>
              <TableHead className="hidden md:table-cell bg-white">IMEI</TableHead>
              <TableHead className="hidden sm:table-cell bg-white">Fecha</TableHead>
              <TableHead className="text-right bg-white">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Smartphone className="h-12 w-12 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-500">No hay equipos disponibles</h3>
                    <p className="text-sm text-gray-400">
                      No se encontraron equipos que coincidan con los criterios de búsqueda
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((eq) => (
                <React.Fragment key={eq.id}>
                  <TableRow
                    className={`group ${showDetails === eq.id ? "bg-orange-50" : ""} ${
                      eq.vendido ? "bg-gray-50" : eq.es_canje ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <TableCell>
                      {eq.vendido ? (
                        <Badge variant="outline" className="font-normal border-red-300 bg-red-50 text-red-700">
                          <Tag className="h-3 w-3 mr-1" />
                          Vendido
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="font-normal border-green-300 bg-green-50 text-green-700">
                            <Tag className="h-3 w-3 mr-1" />
                            Disponible
                          </Badge>
                          {eq.es_canje && (
                            <Badge variant="outline" className="font-normal border-blue-300 bg-blue-50 text-blue-700">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Plan Canje
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{eq.marca}</div>
                        <div className="text-sm text-gray-500">{eq.modelo}</div>
                        {eq.es_canje && eq.cliente_canje && (
                          <div className="text-xs text-blue-600 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            De: {eq.cliente_canje}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-normal border-orange-200 bg-orange-50 text-orange-700">
                        {eq.memoria || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{eq.color || "N/A"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={`font-normal ${
                          ensureNumber(eq.bateria) >= 80
                            ? "border-green-300 bg-green-50 text-green-700"
                            : ensureNumber(eq.bateria) >= 60
                              ? "border-orange-300 bg-orange-50 text-orange-700"
                              : "border-red-300 bg-red-50 text-red-700"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-2 bg-gray-200 rounded-sm overflow-hidden">
                            <div
                              className={`h-full ${
                                ensureNumber(eq.bateria) >= 80
                                  ? "bg-green-500"
                                  : ensureNumber(eq.bateria) >= 60
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${ensureNumber(eq.bateria)}%` }}
                            ></div>
                          </div>
                          {ensureNumber(eq.bateria)}%
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-orange-700">${ensureNumber(eq.precio).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-orange-700">
                      {formatCurrency(ensureNumber(eq.precio) * dollarPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-normal ${
                          eq.puntoVenta?.nombre === "Tala" || eq.pointOfSale === "Tala"
                            ? "border-orange-300 bg-orange-50 text-orange-700"
                            : "border-indigo-300 bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {eq.puntoVenta?.nombre || eq.pointOfSale || "No asignado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-gray-500">{eq.imei}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {eq.fechaCreacion
                        ? (() => {
                            const fecha = new Date(eq.fechaCreacion)
                            fecha.setHours(fecha.getHours() + 3) // Agregar 3 horas
                            return fecha.toLocaleString("es-ES", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false, // Formato de 24 horas
                            })
                          })()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDetails(eq.id)}
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content={showDetails === eq.id ? "Ocultar detalles" : "Ver detalles"}
                          className={
                            showDetails === eq.id
                              ? "bg-orange-100 text-orange-700"
                              : "hover:bg-orange-50 hover:text-orange-600"
                          }
                        >
                          {showDetails === eq.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(eq)}
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="Editar equipo"
                          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          disabled={eq.vendido}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(eq.id)}
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="Eliminar equipo"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={eq.vendido}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <ReactTooltip id="action-tooltip" />
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {showDetails === eq.id && (
                      <TableRow>
                        <TableCell colSpan={11} className="p-0 border-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card
                              className={`mx-4 my-2 border ${eq.es_canje ? "border-blue-200" : "border-orange-200"} shadow-sm`}
                            >
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-orange-700">
                                        <Info size={16} />
                                        <h3 className="font-medium">Información detallada</h3>
                                      </div>

                                      {eq.es_canje && (
                                        <Badge
                                          variant="outline"
                                          className="font-normal border-blue-300 bg-blue-50 text-blue-700 flex items-center"
                                        >
                                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                          Equipo recibido por Plan Canje
                                        </Badge>
                                      )}
                                    </div>

                                    {eq.es_canje && eq.cliente_canje && (
                                      <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700">
                                          <User size={16} />
                                          <span className="font-medium">Entregado por: {eq.cliente_canje}</span>
                                        </div>
                                        {eq.venta_canje && (
                                          <div className="text-sm text-blue-600 mt-1 ml-6">
                                            Venta: #{eq.venta_canje}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Marca</div>
                                        <div className="font-medium">{eq.marca}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Modelo</div>
                                        <div className="font-medium">{eq.modelo}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Memoria</div>
                                        <div className="font-medium">{eq.memoria || "N/A"}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Color</div>
                                        <div className="font-medium">{eq.color || "N/A"}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Batería</div>
                                        <div className="font-medium flex items-center gap-2">
                                          <div className="w-16 h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full ${
                                                ensureNumber(eq.bateria) >= 80
                                                  ? "bg-green-500"
                                                  : ensureNumber(eq.bateria) >= 60
                                                    ? "bg-orange-500"
                                                    : "bg-red-500"
                                              }`}
                                              style={{ width: `${ensureNumber(eq.bateria)}%` }}
                                            ></div>
                                          </div>
                                          <span
                                            className={`font-medium ${
                                              ensureNumber(eq.bateria) >= 80
                                                ? "text-green-600"
                                                : ensureNumber(eq.bateria) >= 60
                                                  ? "text-orange-600"
                                                  : "text-red-600"
                                            }`}
                                          >
                                            {ensureNumber(eq.bateria)}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">IMEI</div>
                                        <div className="font-medium">{eq.imei}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Punto de Venta</div>
                                        <div className="font-medium flex items-center">
                                          <Badge
                                            variant="outline"
                                            className={`font-normal mr-1 ${
                                              eq.puntoVenta?.nombre === "Tala" || eq.pointOfSale === "Tala"
                                                ? "border-orange-300 bg-orange-50 text-orange-700"
                                                : "border-indigo-300 bg-indigo-50 text-indigo-700"
                                            }`}
                                          >
                                            {eq.puntoVenta?.nombre || eq.pointOfSale || "No asignado"}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-gray-500">Estado</div>
                                        <div className="font-medium">
                                          {eq.vendido ? (
                                            <Badge
                                              variant="outline"
                                              className="font-normal border-red-300 bg-red-50 text-red-700"
                                            >
                                              Vendido
                                            </Badge>
                                          ) : (
                                            <Badge
                                              variant="outline"
                                              className="font-normal border-green-300 bg-green-50 text-green-700"
                                            >
                                              Disponible
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {eq.descripcion && (
                                      <div className="pt-2">
                                        <div className="text-gray-500 text-sm">Descripción</div>
                                        <p className="text-sm mt-1">{eq.descripcion}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    className={`${
                                      eq.es_canje ? "bg-blue-50/30" : "bg-[#131321]/5"
                                    } p-4 rounded-lg flex flex-col justify-between`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2 text-orange-700 mb-3">
                                        <DollarSign size={16} />
                                        <h3 className="font-medium">Información comercial</h3>
                                      </div>

                                      <div className="space-y-3">
                                        <div>
                                          <div className="text-gray-500 text-sm">Precio USD</div>
                                          <div className="text-2xl font-bold text-orange-700">
                                            ${ensureNumber(eq.precio).toFixed(2)}
                                          </div>
                                        </div>

                                        <Separator className="bg-[#131321]/10" />

                                        <div>
                                          <div className="text-gray-500 text-sm">Precio ARS (Actual)</div>
                                          <div className="text-xl font-bold text-orange-700">
                                            {formatCurrency(ensureNumber(eq.precio) * dollarPrice)}
                                            <span className="text-sm text-gray-500 ml-2">
                                              (TC: {dollarPrice.toFixed(2)})
                                            </span>
                                          </div>
                                        </div>

                                        <Separator className="bg-[#131321]/10" />

                                        <div>
                                          <div className="text-gray-500 text-sm">Precio ARS (Original)</div>
                                          <div className="text-base text-gray-600">
                                            {formatCurrency(
                                              ensureNumber(eq.precio) * ensureNumber(eq.tipoCambioOriginal),
                                            )}
                                            <span className="text-xs text-gray-500 ml-2">
                                              (TC: {ensureNumber(eq.tipoCambioOriginal).toFixed(2)})
                                            </span>
                                          </div>
                                        </div>

                                        <Separator className="bg-[#131321]/10" />

                                        <div className="space-y-1">
                                          <div className="text-gray-500 text-sm flex items-center gap-1">
                                            <Calendar size={14} /> Fecha de creación
                                          </div>
                                          <div className="font-medium">
                                            {eq.fechaCreacion
                                              ? (() => {
                                                  const fecha = new Date(eq.fechaCreacion)
                                                  fecha.setHours(fecha.getHours() + 3) // Agregar 3 horas
                                                  return fecha.toLocaleString("es-ES", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: false,
                                                  })
                                                })()
                                              : "N/A"}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-4">
                                      {!eq.vendido ? (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit(eq)}
                                            className="gap-1 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                          >
                                            <Edit className="h-3.5 w-3.5" /> Editar
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDelete(eq.id)}
                                            className="gap-1 bg-[#131321] hover:bg-[#131321]/90"
                                          >
                                            <Trash className="h-3.5 w-3.5" /> Eliminar
                                          </Button>
                                        </>
                                      ) : (
                                        <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                                          Este equipo ya ha sido vendido
                                        </Badge>
                                      )}
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
