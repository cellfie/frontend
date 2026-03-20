"use client"

import React from "react"
import { Users, Edit, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const renderSkeletons = () =>
  Array.from({ length: 6 }).map((_, idx) => (
    <TableRow key={idx}>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-20 ml-auto" />
      </TableCell>
    </TableRow>
  ))

const UsuariosList = ({
  usuarios,
  cargando,
  abrirDialogUsuario,
  setUsuarioSeleccionado,
  setDialogDesactivarAbierto,
  onToggleActivo,
}) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#131321] pb-3">
        <CardTitle className="text-orange-600 flex items-center gap-2">
          <Users size={20} />
          Listado de Usuarios
        </CardTitle>
        <CardDescription className="text-gray-300">{usuarios.length} usuarios</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-white">
              <TableRow>
                <TableHead className="bg-white">Nombre</TableHead>
                <TableHead className="bg-white">Rol</TableHead>
                <TableHead className="bg-white">Estado</TableHead>
                <TableHead className="bg-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cargando ? (
                renderSkeletons()
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.nombre}
                      </div>
                    </TableCell>
                    <TableCell>{u.rol || "-"}</TableCell>
                    <TableCell>
                      {u.activo === 0 ? (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Inactivo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                          Activo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirDialogUsuario(u)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {u.activo === 1 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUsuarioSeleccionado(u)
                              setDialogDesactivarAbierto(true)
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            aria-label="Desactivar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleActivo?.(u)}
                            className="text-green-700 hover:text-green-800 hover:bg-green-50"
                            aria-label="Usuario inactivo (activar)"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default UsuariosList

