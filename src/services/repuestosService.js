const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener todos los repuestos
export const getRepuestos = async () => {
  try {
    const response = await fetch(`${API_URL}/repuestos`, {
      method: "GET",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener repuestos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getRepuestos:", error)
    throw error
  }
}

// Obtener un repuesto por ID
export const getRepuestoById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/repuestos/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el repuesto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getRepuestoById:", error)
    throw error
  }
}

// Buscar repuestos con filtros
export const searchRepuestos = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.query) queryParams.append("query", params.query)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.min_stock !== undefined) queryParams.append("min_stock", params.min_stock)
    if (params.max_stock !== undefined) queryParams.append("max_stock", params.max_stock)
    // Agregar filtros de precio si están presentes
    if (params.min_precio !== undefined) queryParams.append("min_precio", params.min_precio)
    if (params.max_precio !== undefined) queryParams.append("max_precio", params.max_precio)

    const url = `${API_URL}/repuestos/search?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al buscar repuestos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchRepuestos:", error)
    throw error
  }
}

// Crear un nuevo repuesto
export const createRepuesto = async (repuestoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      nombre: repuestoData.name,
      descripcion: repuestoData.description || "",
      precio: repuestoData.price || 0, // Agregamos el campo precio
      punto_venta_id: Number(repuestoData.punto_venta_id),
      stock: repuestoData.stock,
    }

    console.log("Datos enviados al backend:", backendData)

    const response = await fetch(`${API_URL}/repuestos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el repuesto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createRepuesto:", error)
    throw error
  }
}

// Actualizar un repuesto existente
export const updateRepuesto = async (id, repuestoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      nombre: repuestoData.name,
      descripcion: repuestoData.description || "",
      precio: repuestoData.price || 0, // Agregamos el campo precio
      punto_venta_id: Number(repuestoData.punto_venta_id),
      stock: repuestoData.stock,
    }

    console.log("Datos enviados al backend para actualizar:", backendData)

    const response = await fetch(`${API_URL}/repuestos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el repuesto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateRepuesto:", error)
    throw error
  }
}

// Eliminar un repuesto
export const deleteRepuesto = async (id) => {
  try {
    const response = await fetch(`${API_URL}/repuestos/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar el repuesto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteRepuesto:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptRepuestoToFrontend = (repuesto) => {
  return {
    id: repuesto.id,
    name: repuesto.nombre,
    description: repuesto.descripcion,
    price: repuesto.precio || 0, // Cambiado de precio a price para consistencia en el frontend
    stock: repuesto.stock || 0,
    pointOfSale: repuesto.punto_venta,
    punto_venta_id: repuesto.punto_venta_id,
  }
}

// Obtener repuestos por punto de venta
export const getRepuestosByPuntoVenta = async (puntoVentaId) => {
  try {
    // Utilizamos la función de búsqueda existente con el filtro de punto de venta
    return await searchRepuestos({ punto_venta_id: puntoVentaId })
  } catch (error) {
    console.error("Error en getRepuestosByPuntoVenta:", error)
    throw error
  }
}

// Función para formatear el precio en formato de moneda argentina
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}