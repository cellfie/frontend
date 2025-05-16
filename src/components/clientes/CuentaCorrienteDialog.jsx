"use client"
import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const CuentaCorrienteDialog = ({
  open,
  setOpen,
  formCuentaCorriente,
  setFormCuentaCorriente,
  guardarCuentaCorriente,
  clienteSeleccionado,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-blue-600 flex items-center gap-2">
            <CreditCard size={18} />
            Configurar Cuenta Corriente
          </DialogTitle>
          <DialogDescription>
            {clienteSeleccionado?.cuentaCorriente
              ? "Modifica la configuración de la cuenta corriente"
              : "Configura una nueva cuenta corriente para este cliente"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="limiteCredito">Límite de crédito</Label>
            <Input
              id="limiteCredito"
              type="number"
              min="0"
              step="0.01"
              value={formCuentaCorriente.limiteCredito}
              onChange={(e) =>
                setFormCuentaCorriente({
                  ...formCuentaCorriente,
                  limiteCredito: Number.parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500">Establece 0 para no tener límite de crédito</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="activo"
              checked={formCuentaCorriente.activo}
              onCheckedChange={(checked) =>
                setFormCuentaCorriente({
                  ...formCuentaCorriente,
                  activo: checked,
                })
              }
            />
            <Label htmlFor="activo">Cuenta activa</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardarCuentaCorriente} className="bg-blue-600 hover:bg-blue-700">
            Guardar configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CuentaCorrienteDialog
