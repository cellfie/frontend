// Obtener todos los métodos de pago
export const getMetodosPago = async () => {
  return [
    { id: "Efectivo", nombre: "Efectivo", descripcion: "Pago en efectivo" },
    { id: "Transferencia", nombre: "Transferencia", descripcion: "Pago por transferencia bancaria" },
    { id: "Tarjeta de crédito", nombre: "Tarjeta de crédito", descripcion: "Pago con tarjeta de crédito" },
    { id: "Cuenta corriente", nombre: "Cuenta corriente", descripcion: "Pago con cuenta corriente del cliente" },
  ]
}

// Obtener métodos de pago para reparaciones
export const getMetodosPagoReparacion = async () => {
  return [
    { id: "efectivo", nombre: "Efectivo", descripcion: "Pago en efectivo" },
    { id: "tarjeta", nombre: "Tarjeta", descripcion: "Pago con tarjeta" },
    { id: "transferencia", nombre: "Transferencia", descripcion: "Pago por transferencia bancaria" },
    { id: "cuentaCorriente", nombre: "Cuenta corriente", descripcion: "Cargo a cuenta corriente del cliente" },
  ]
}
