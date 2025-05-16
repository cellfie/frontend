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

// Componente para el diálogo de crear/editar cliente
const ClienteFormDialog = ({
  open,
  setOpen,
  modoEdicion,
  formCliente,
  setFormCliente,
  guardarCliente,
  clienteSeleccionado,
  dialogEliminarAbierto,
  setDialogEliminarAbierto,
  eliminarCliente,
}) => {
  return (
    <>
      {/* Diálogo para crear/editar cliente */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-600">{modoEdicion ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {modoEdicion
                ? "Modifica los datos del cliente seleccionado"
                : "Completa los datos para crear un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formCliente.nombre}
                onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={formCliente.dni}
                onChange={(e) => setFormCliente({ ...formCliente, dni: e.target.value })}
                placeholder="Documento de identidad"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formCliente.telefono}
                onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarCliente} className="bg-orange-600 hover:bg-orange-700">
              {modoEdicion ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar cliente */}
      <Dialog open={dialogEliminarAbierto} onOpenChange={setDialogEliminarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle size={18} />
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 p-3 rounded border mb-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="font-medium">{clienteSeleccionado?.nombre}</span>
                </div>
                {clienteSeleccionado?.dni && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">DNI:</span>
                    <span>{clienteSeleccionado.dni}</span>
                  </div>
                )}
                {clienteSeleccionado?.telefono && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Teléfono:</span>
                    <span>{clienteSeleccionado.telefono}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded border text-red-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Advertencia</p>
                <p className="text-sm">
                  Si el cliente tiene ventas asociadas o una cuenta corriente activa, no podrá ser eliminado.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEliminarAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminarCliente}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ClienteFormDialog
