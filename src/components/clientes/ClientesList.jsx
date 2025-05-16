"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  CreditCard,
  User,
  Plus,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DateRangePicker } from "@/lib/DatePickerWithRange"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getMovimientosCuentaCorriente } from "@/services/cuentasCorrientesService"

// Componente de filtros
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

// Componente de detalle del cliente
const ClienteDetalle = ({
  clienteSeleccionado,
  formatearFechaHora,
  formatearPrecio,
  cargandoCuentaCorriente,
  movimientosCuenta,
  rangoFechasMovimientos,
  setRangoFechasMovimientos,
  abrirDialogCuentaCorriente,
  abrirDialogPago,
  cargarMovimientosPorFecha,
}) => {
  // Estado para controlar si se muestran todos los movimientos o solo los primeros 3
  const [mostrarTodosMovimientos, setMostrarTodosMovimientos] = useState(false)

  // Movimientos a mostrar (limitados a 3 o todos)
  const movimientosVisibles = mostrarTodosMovimientos ? movimientosCuenta : movimientosCuenta.slice(0, 3)

  // Efecto para cargar movimientos cuando cambia el rango de fechas
  useEffect(() => {
    if (clienteSeleccionado?.cuentaCorriente?.id && rangoFechasMovimientos?.from && rangoFechasMovimientos?.to) {
      cargarMovimientosPorFecha(clienteSeleccionado.cuentaCorriente.id, rangoFechasMovimientos)
    }
  }, [rangoFechasMovimientos, clienteSeleccionado?.cuentaCorriente?.id, cargarMovimientosPorFecha])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="mx-4 my-2 border border-orange-200 shadow-sm">
        <CardContent className="p-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="info" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Información
              </TabsTrigger>
              <TabsTrigger value="cuenta" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Cuenta Corriente
              </TabsTrigger>
            </TabsList>

            {/* Tab: Información del cliente */}
            <TabsContent value="info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-800">Datos del Cliente</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Nombre</span>
                      <span className="font-medium">{clienteSeleccionado.nombre}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">DNI</span>
                      <span className="font-medium">{clienteSeleccionado.dni || "No registrado"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Teléfono</span>
                      <span className="font-medium">{clienteSeleccionado.telefono || "No registrado"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Cuenta Corriente</span>
                      {clienteSeleccionado.cuentaCorriente ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {clienteSeleccionado.cuentaCorriente.activo ? "Activa" : "Inactiva"}
                          </Badge>
                          <span className="text-sm">
                            Saldo:{" "}
                            <span
                              className={
                                clienteSeleccionado.cuentaCorriente.saldo > 0
                                  ? "text-red-600 font-medium"
                                  : "text-green-600 font-medium"
                              }
                            >
                              {formatearPrecio(clienteSeleccionado.cuentaCorriente.saldo)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-gray-500">
                            No tiene
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={abrirDialogCuentaCorriente}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Crear cuenta
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Cuenta Corriente */}
            <TabsContent value="cuenta">
              <div className="space-y-6">
                {/* Información de la cuenta */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Cuenta Corriente
                  </h3>

                  <>
                    {clienteSeleccionado.cuentaCorriente ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-md border">
                            <div className="text-sm text-gray-500">Estado</div>
                            <div className="font-medium flex items-center gap-1">
                              {clienteSeleccionado.cuentaCorriente.activo ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span>Activa</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span>Inactiva</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-md border">
                            <div className="text-sm text-gray-500">Saldo actual</div>
                            <div
                              className={`font-medium ${
                                clienteSeleccionado.cuentaCorriente.saldo > 0 ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {formatearPrecio(clienteSeleccionado.cuentaCorriente.saldo)}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-md border">
                            <div className="text-sm text-gray-500">Límite de crédito</div>
                            <div className="font-medium">
                              {clienteSeleccionado.cuentaCorriente.limiteCredito > 0
                                ? formatearPrecio(clienteSeleccionado.cuentaCorriente.limiteCredito)
                                : "Sin límite"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={abrirDialogCuentaCorriente}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Configurar cuenta
                          </Button>
                          {clienteSeleccionado.cuentaCorriente.saldo > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={abrirDialogPago}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              <DollarSign className="h-3.5 w-3.5 mr-1" />
                              Registrar pago
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h4 className="text-lg font-medium mb-2 text-gray-700">Sin cuenta corriente</h4>
                        <p className="text-gray-500 mb-4">Este cliente no tiene una cuenta corriente activa</p>
                        <Button
                          variant="outline"
                          onClick={abrirDialogCuentaCorriente}
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Crear cuenta corriente
                        </Button>
                      </div>
                    )}
                  </>
                </div>

                {clienteSeleccionado.cuentaCorriente && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Movimientos recientes
                      </h3>
                      <div className="flex items-center gap-2">
                        <DateRangePicker
                          date={rangoFechasMovimientos}
                          setDate={setRangoFechasMovimientos}
                          className="w-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            cargarMovimientosPorFecha(clienteSeleccionado.cuentaCorriente.id, rangoFechasMovimientos)
                          }
                          className="h-9"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Filtrar
                        </Button>
                      </div>
                    </div>

                    {cargandoCuentaCorriente ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-md border flex justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : movimientosCuenta.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h4 className="text-lg font-medium mb-2 text-gray-700">Sin movimientos</h4>
                        <p className="text-gray-500">No hay movimientos registrados en esta cuenta</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ScrollArea className={mostrarTodosMovimientos ? "h-[350px]" : "max-h-full"}>
                          <div className="space-y-2 pr-4">
                            {movimientosVisibles.map((movimiento) => (
                              <div key={movimiento.id} className="bg-white p-3 rounded-md border">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-1">
                                      {movimiento.tipo === "cargo" ? (
                                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                                      ) : (
                                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                                      )}
                                      <span className="font-medium">
                                        {movimiento.tipo === "cargo" ? "Cargo" : "Pago"}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatearFechaHora(movimiento.fecha)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">{movimiento.notas}</div>
                                  </div>
                                  <div
                                    className={`font-medium ${
                                      movimiento.tipo === "cargo" ? "text-red-600" : "text-green-600"
                                    }`}
                                  >
                                    {movimiento.tipo === "cargo" ? "+" : "-"}
                                    {formatearPrecio(movimiento.monto)}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                  <span>Saldo anterior: {formatearPrecio(Number(movimiento.saldo_anterior) || 0)}</span>
                                  <span>Saldo nuevo: {formatearPrecio(Number(movimiento.saldo_nuevo) || 0)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {movimientosCuenta.length > 3 && (
                          <div className="text-center mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMostrarTodosMovimientos(!mostrarTodosMovimientos)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {mostrarTodosMovimientos ? "Ver menos" : `Ver todos (${movimientosCuenta.length})`}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Historial de Compras */}
            <TabsContent value="ventas">{/* Eliminamos la pestaña de Historial de Compras */}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Renderizar skeletons durante la carga
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
    </TableRow>
  ))

// Componente principal de la lista de clientes
const ClientesList = ({
  clientes,
  cargando,
  detalleClienteAbierto,
  clienteSeleccionado,
  busqueda,
  cargarDetalleCliente,
  abrirDialogCliente,
  setClienteSeleccionado,
  setDialogEliminarAbierto,
  formatearFechaHora,
  formatearPrecio,
  cargandoCuentaCorriente,
  setCargandoCuentaCorriente,
  cuentaCorriente,
  movimientosCuenta,
  setMovimientosCuenta,
  rangoFechasMovimientos,
  setRangoFechasMovimientos,
  abrirDialogCuentaCorriente,
  abrirDialogPago,
}) => {
  // Función para cargar movimientos por rango de fechas
  const cargarMovimientosPorFecha = async (cuentaId, rangoFechas) => {
    if (!cuentaId || !rangoFechas || !rangoFechas.from || !rangoFechas.to) return

    setCargandoCuentaCorriente(true)
    try {
      // Formatear fechas para la API
      const fechaInicio = rangoFechas.from.toISOString().split("T")[0]
      const fechaFin = rangoFechas.to.toISOString().split("T")[0]

      // Llamar a la API con los parámetros de fecha
      const movimientos = await getMovimientosCuentaCorriente(cuentaId, {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      })

      setMovimientosCuenta(movimientos)
    } catch (error) {
      console.error("Error al cargar movimientos por fecha:", error)
    } finally {
      setCargandoCuentaCorriente(false)
    }
  }

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
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
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

                  return (
                    <React.Fragment key={cliente.id}>
                      <TableRow
                        className={`group ${detalleClienteAbierto === cliente.id ? "bg-orange-50" : ""} ${
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
                                          detalleClienteAbierto === cliente.id
                                            ? "bg-orange-100 text-orange-700"
                                            : "hover:bg-orange-50 hover:text-orange-600"
                                        }
                                      >
                                        {detalleClienteAbierto === cliente.id ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {detalleClienteAbierto === cliente.id ? "Ocultar detalles" : "Ver detalles"}
                                      </p>
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

                      {/* Detalle del cliente */}
                      <AnimatePresence>
                        {detalleClienteAbierto === cliente.id && clienteSeleccionado && !esClienteGeneral && (
                          <TableRow>
                            <TableCell colSpan={4} className="p-0 border-0">
                              <ClienteDetalle
                                cliente={cliente}
                                clienteSeleccionado={clienteSeleccionado}
                                formatearFechaHora={formatearFechaHora}
                                formatearPrecio={formatearPrecio}
                                cargandoCuentaCorriente={cargandoCuentaCorriente}
                                cuentaCorriente={cuentaCorriente}
                                movimientosCuenta={movimientosCuenta}
                                rangoFechasMovimientos={rangoFechasMovimientos}
                                setRangoFechasMovimientos={setRangoFechasMovimientos}
                                abrirDialogCuentaCorriente={abrirDialogCuentaCorriente}
                                abrirDialogPago={abrirDialogPago}
                                cargarMovimientosPorFecha={cargarMovimientosPorFecha}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
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

// Asignar el componente de filtros como propiedad del componente principal
ClientesList.Filtros = Filtros

export default ClientesList
