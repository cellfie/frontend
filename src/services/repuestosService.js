import axios from "axios"

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptRepuestoToFrontend = (repuesto) => {
  return {
    id: repuesto.id,
    name: repuesto.nombre,
    description: repuesto.descripcion,
    stock: repuesto.stock || 0,
    punto_venta_id: repuesto.punto_venta_id,
    pointOfSale: repuesto.punto_venta,
    price: repuesto.precio || 0, // Aseguramos que siempre haya un precio
  }
}

// Obtener todos los repuestos
export const getRepuestos = async () => {
  try {
    const response = await axios.get("/api/repuestos")
    return response.data
  } catch (error) {
    console.error("Error al obtener repuestos:", error)
    throw new Error(error.response?.data?.message || "Error al obtener repuestos")
  }
}

// Buscar repuestos
export const searchRepuestos = async (params) => {
  try {
    const response = await axios.get("/api/repuestos/search", { params })
    return response.data
  } catch (error) {
    console.error("Error al buscar repuestos:", error)
    throw new Error(error.response?.data?.message || "Error al buscar repuestos")
  }
}

// Obtener un repuesto por ID
export const getRepuestoById = async (id) => {
  try {
    const response = await axios.get(`/api/repuestos/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener repuesto con ID ${id}:`, error)
    throw new Error(error.response?.data?.message || "Error al obtener repuesto")
  }
}

// Crear un nuevo repuesto
export const createRepuesto = async (repuestoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      nombre: repuestoData.name,
      descripcion: repuestoData.description,
      precio: repuestoData.price, // Agregamos el precio
      punto_venta_id: Number(repuestoData.punto_venta_id),
      stock: Number(repuestoData.stock),
    }

    const response = await axios.post("/api/repuestos", backendData)
    return response.data
  } catch (error) {
    console.error("Error al crear repuesto:", error)
    throw new Error(error.response?.data?.message || "Error al crear repuesto")
  }
}

// Actualizar un repuesto existente
export const updateRepuesto = async (id, repuestoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      nombre: repuestoData.name,
      descripcion: repuestoData.description,
      precio: repuestoData.price, // Agregamos el precio
      punto_venta_id: Number(repuestoData.punto_venta_id),
      stock: Number(repuestoData.stock),
    }

    const response = await axios.put(`/api/repuestos/${id}`, backendData)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar repuesto con ID ${id}:`, error)
    throw new Error(error.response?.data?.message || "Error al actualizar repuesto")
  }
}

// Eliminar un repuesto
export const deleteRepuesto = async (id) => {
  try {
    const response = await axios.delete(`/api/repuestos/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al eliminar repuesto con ID ${id}:`, error)
    throw new Error(error.response?.data?.message || "Error al eliminar repuesto")
  }
}
