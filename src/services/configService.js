// URL base de la API
export const API_URL = "https://api.sistemacellfierm22.site/api" 

// Función para formatear fechas
export const formatDate = (dateString) => {
  if (!dateString) return ""

  const date = new Date(dateString)
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Función para formatear moneda
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount)
}

// Colores para los estados de reparación
export const estadosReparacionColors = {
  pendiente: "bg-orange-500",
  terminada: "bg-blue-500",
  entregada: "bg-green-500",
  cancelada: "bg-red-500",
}

// Nombres para los estados de reparación
export const estadosReparacionNames = {
  pendiente: "Pendiente",
  terminada: "Terminada",
  entregada: "Entregada",
  cancelada: "Cancelada",
}
