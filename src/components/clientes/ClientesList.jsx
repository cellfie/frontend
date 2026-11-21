"use client"

import React from "react"
import {
  Search,
  Users,
  Edit,
  Trash2,
  CreditCard,
  AlertCircle,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Componente de filtros (reutilizable si se necesita fuera de la página)
const Filtros = ({ busqueda, setBusqueda, mostrarSoloConCuenta, setMostrarSoloConCuenta }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, DNI o teléfono..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className={`whitespace-nowrap flex items-center gap-1 h-9 ${
          mostrarSoloConCuenta ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-white"
        }`}
        onClick={() => setMostrarSoloConCuenta(!mostrarSoloConCuenta)}
      >
        <CreditCard size={14} />
        <span className="hidden sm:inline">Con cuenta corriente</span>
      </Button>
    </div>
  )
}

const renderSkeletons = () =>
  Array.from({ length: 5 }).map((_, idx) => (
    <TableRow key={idx}>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20 ml-auto" />
      </TableCell>
    </TableRow>
  ))

const ClientesList = ({
  clientes,
  cargando,
  detalleClienteAbierto,
  busqueda,
  cargarDetalleCliente,
  abrirDialogCliente,
  setClienteSeleccionado,
  setDialogEliminarAbierto,
  formatearPrecio,
}) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#131321] pb-3">
        <CardTitle className="text-orange-600 flex items-center gap-2">
          <Users size={20} />
          Listado de Clientes
        </CardTitle>
        <CardDescription className="text-gray-300">{clientes.length} clientes encontrados</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-white">
              <TableRow className="border-b after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-border">
                <TableHead className="bg-white">Nombre</TableHead>
                <TableHead className="bg-white">DNI</TableHead>
                <TableHead className="bg-white">Teléfono</TableHead>
                <TableHead className="bg-white">Saldo</TableHead>
                <TableHead className="bg-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                renderSkeletons()
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-12 w-12 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-500">No hay clientes disponibles</h3>
                      <p className="text-sm text-gray-400">
                        {busqueda
                          ? "No se encontraron clientes que coincidan con la búsqueda"
                          : "Aún no hay clientes registrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => {
                  const esClienteGeneral = cliente.nombre === "Cliente General"
                  const tieneSaldoPendiente = cliente.cuentaCorriente && cliente.cuentaCorriente.saldo > 0
                  const detalleAbierto = detalleClienteAbierto === cliente.id

                  return (
                    <TableRow
                      key={cliente.id}
                      className={`group ${detalleAbierto ? "bg-orange-50" : ""} ${
                        tieneSaldoPendiente ? "bg-red-50" : ""
                      }`}
                    >
                      <TableCell>
                        <div className="font-medium">{cliente.nombre}</div>
                      </TableCell>
                      <TableCell>{cliente.dni || "-"}</TableCell>
                      <TableCell>{cliente.telefono || "-"}</TableCell>
                      <TableCell>
                        {cliente.cuentaCorriente ? (
                          <div className="flex items-center gap-2">
                            {tieneSaldoPendiente ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {formatearPrecio(cliente.cuentaCorriente.saldo)}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
                                Al día
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Sin cuenta
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!esClienteGeneral && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => cargarDetalleCliente(cliente.id)}
                                      className={
                                        detalleAbierto
                                          ? "bg-orange-100 text-orange-700"
                                          : "hover:bg-orange-50 hover:text-orange-600"
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver detalles</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => abrirDialogCliente(cliente)}
                                      className="hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar cliente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setClienteSeleccionado(cliente)
                                        setDialogEliminarAbierto(true)
                                      }}
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar cliente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                          {esClienteGeneral && (
                            <span className="text-xs text-gray-500 italic px-2">Cliente por defecto</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

ClientesList.Filtros = Filtros

export default ClientesList
