"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

const UsuarioFormDialog = ({
  open,
  setOpen,
  modoEdicion,
  formUsuario,
  setFormUsuario,
  guardarUsuario,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-orange-600">{modoEdicion ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {modoEdicion
              ? "Actualizá los datos del usuario. La contraseña es opcional."
              : "Creá un usuario para que pueda iniciar sesión."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre de usuario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formUsuario.nombre}
              onChange={(e) => setFormUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: rocio"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select value={formUsuario.rol} onValueChange={(v) => setFormUsuario((prev) => ({ ...prev, rol: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegir rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="empleado">empleado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <Switch
                checked={!!formUsuario.activo}
                onCheckedChange={(checked) => setFormUsuario((prev) => ({ ...prev, activo: checked ? 1 : 0 }))}
              />
              <div>
                <p className="text-sm font-medium">{formUsuario.activo ? "Activo" : "Inactivo"}</p>
                <p className="text-xs text-gray-500">Si está inactivo, no podrá iniciar sesión.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña {modoEdicion ? <span className="text-gray-500 text-xs">(opcional)</span> : <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formUsuario.password}
              onChange={(e) => setFormUsuario((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={modoEdicion ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
              autoComplete="new-password"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="nota">Nota (opcional)</Label>
            <Textarea
              id="nota"
              value={formUsuario.nota || ""}
              onChange={(e) => setFormUsuario((prev) => ({ ...prev, nota: e.target.value }))}
              placeholder="Si querés, agregá un comentario interno."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardarUsuario} className="bg-orange-600 hover:bg-orange-700">
            {modoEdicion ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UsuarioFormDialog

