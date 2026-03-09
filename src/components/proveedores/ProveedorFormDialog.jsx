"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const ProveedorFormDialog = ({
  open,
  setOpen,
  modoEdicion,
  formProveedor,
  setFormProveedor,
  guardarProveedor,
  proveedorSeleccionado,
  dialogEliminarAbierto,
  setDialogEliminarAbierto,
  eliminarProveedor,
}) => {
  return (
    <>
      {/* Diálogo para crear/editar proveedor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-600">
              {modoEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {modoEdicion
                ? "Modifica los datos del proveedor seleccionado"
                : "Completa los datos para crear un nuevo proveedor"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre comercial <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formProveedor.nombre}
                onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cuit">CUIT / DNI</Label>
              <Input
                id="cuit"
                value={formProveedor.cuit}
                onChange={(e) => setFormProveedor({ ...formProveedor, cuit: e.target.value })}
                placeholder="CUIT o documento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formProveedor.telefono}
                onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formProveedor.email}
                onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                placeholder="Correo electrónico"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contacto">Persona de contacto</Label>
              <Input
                id="contacto"
                value={formProveedor.contacto}
                onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formProveedor.direccion}
                onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                placeholder="Dirección comercial"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formProveedor.notas}
                onChange={(e) => setFormProveedor({ ...formProveedor, notas: e.target.value })}
                placeholder="Información adicional (condiciones de pago, horarios, etc.)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarProveedor} className="bg-orange-600 hover:bg-orange-700">
              {modoEdicion ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar proveedor */}
      <Dialog open={dialogEliminarAbierto} onOpenChange={setDialogEliminarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle size={18} />
              Eliminar Proveedor
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 p-3 rounded border mb-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="font-medium">{proveedorSeleccionado?.nombre}</span>
                </div>
                {proveedorSeleccionado?.cuit && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">CUIT / DNI:</span>
                    <span>{proveedorSeleccionado.cuit}</span>
                  </div>
                )}
                {proveedorSeleccionado?.telefono && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Teléfono:</span>
                    <span>{proveedorSeleccionado.telefono}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded border text-red-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Advertencia</p>
                <p className="text-sm">
                  Más adelante, cuando se registre el módulo de compras, no se podrán eliminar proveedores con
                  compras asociadas.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEliminarAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminarProveedor}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProveedorFormDialog

