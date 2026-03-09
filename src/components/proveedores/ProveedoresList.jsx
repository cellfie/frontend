"use client"

import React from "react"
import { Users, Edit, Trash2, Phone, Mail, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const renderSkeletons = () =>
  Array.from({ length: 5 }).map((_, idx) => (
    <TableRow key={idx}>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
    </TableRow>
  ))

const ProveedoresList = ({ proveedores, cargando, busqueda, abrirDialogProveedor, setProveedorSeleccionado, setDialogEliminarAbierto }) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#131321] pb-3">
        <CardTitle className="text-orange-600 flex items-center gap-2">
          <Users size={20} />
          Listado de Proveedores
        </CardTitle>
        <CardDescription className="text-gray-300">
          {proveedores.length} proveedores encontrados
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-white">
              <TableRow className="border-b after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:bg-border">
                <TableHead className="bg-white">Nombre</TableHead>
                <TableHead className="bg-white">CUIT / DNI</TableHead>
                <TableHead className="bg-white">Teléfono</TableHead>
                <TableHead className="bg-white">Email</TableHead>
                <TableHead className="bg-white">Contacto</TableHead>
                <TableHead className="bg-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                renderSkeletons()
              ) : proveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-500">No hay proveedores disponibles</h3>
                      <p className="text-sm text-gray-400">
                        {busqueda
                          ? "No se encontraron proveedores que coincidan con la búsqueda"
                          : "Aún no hay proveedores registrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proveedores.map((proveedor) => (
                  <React.Fragment key={proveedor.id}>
                    <TableRow className="group">
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {proveedor.nombre}
                          {proveedor.activo === 0 && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{proveedor.cuit || "-"}</TableCell>
                      <TableCell>
                        {proveedor.telefono ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            {proveedor.telefono}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {proveedor.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-500" />
                            {proveedor.email}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{proveedor.contacto || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogProveedor(proveedor)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProveedorSeleccionado(proveedor)
                              setDialogEliminarAbierto(true)
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProveedoresList

