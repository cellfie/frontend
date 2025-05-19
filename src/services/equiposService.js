const API_URL = "https://api.sistemacellfierm22.site/api" 

// Obtener todos los equipos
export const getEquipos = async () => {
  try {
    const response = await fetch(`${API_URL}/equipos`, {
      method: "GET",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener equipos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getEquipos:", error)
    throw error
  }
}

// Obtener un equipo por ID
export const getEquipoById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/equipos/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getEquipoById:", error)
    throw error
  }
}

// Buscar equipos con filtros
export const searchEquipos = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    // No necesitamos modificar nada aquí, ya que simplemente pasamos el query tal cual
    // y el backend se encargará de dividirlo en términos
    if (params.query) queryParams.append("query", params.query)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.min_precio !== undefined) queryParams.append("min_precio", params.min_precio)
    if (params.max_precio !== undefined) queryParams.append("max_precio", params.max_precio)
    if (params.min_bateria !== undefined) queryParams.append("min_bateria", params.min_bateria)
    if (params.max_bateria !== undefined) queryParams.append("max_bateria", params.max_bateria)
    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.incluir_vendidos !== undefined) queryParams.append("incluir_vendidos", params.incluir_vendidos)
    if (params.solo_canjes !== undefined) queryParams.append("solo_canjes", params.solo_canjes)

    const url = `${API_URL}/equipos/search?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al buscar equipos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchEquipos:", error)
    throw error
  }
}

// Crear un nuevo equipo
export const createEquipo = async (equipoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      marca: equipoData.marca,
      modelo: equipoData.modelo,
      memoria: equipoData.memoria || null,
      color: equipoData.color || null,
      bateria: equipoData.bateria || null,
      precio: equipoData.precio,
      descripcion: equipoData.descripcion || "",
      imei: equipoData.imei,
      fecha_ingreso: equipoData.fecha_ingreso,
      punto_venta_id: equipoData.punto_venta_id,
      tipo_cambio: equipoData.tipo_cambio || 1200.0,
      es_canje: equipoData.es_canje || false,
      cliente_canje_id: equipoData.cliente_canje_id || null,
      venta_canje_id: equipoData.venta_canje_id || null,
    }

    const response = await fetch(`${API_URL}/equipos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createEquipo:", error)
    throw error
  }
}

// Actualizar un equipo existente
export const updateEquipo = async (id, equipoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      marca: equipoData.marca,
      modelo: equipoData.modelo,
      memoria: equipoData.memoria,
      color: equipoData.color,
      bateria: equipoData.bateria,
      precio: equipoData.precio,
      descripcion: equipoData.descripcion,
      imei: equipoData.imei,
      fecha_ingreso: equipoData.fecha_ingreso,
      punto_venta_id: equipoData.punto_venta_id,
      es_canje: equipoData.es_canje,
      cliente_canje_id: equipoData.cliente_canje_id,
      venta_canje_id: equipoData.venta_canje_id,
      // No enviamos tipo_cambio ni tipo_cambio_original, el servidor los manejará
    }

    const response = await fetch(`${API_URL}/equipos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateEquipo:", error)
    throw error
  }
}

// Eliminar un equipo
export const deleteEquipo = async (id) => {
  try {
    const response = await fetch(`${API_URL}/equipos/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar el equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteEquipo:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptEquipoToFrontend = (equipo) => {
  return {
    id: equipo.id,
    marca: equipo.marca,
    modelo: equipo.modelo,
    memoria: equipo.memoria || "",
    color: equipo.color || "",
    bateria: equipo.bateria || 0,
    precio: equipo.precio,
    descripcion: equipo.descripcion || "",
    imei: equipo.imei,
    fechaIngreso: equipo.fecha_ingreso,
    tipoCambio: equipo.tipo_cambio,
    tipoCambioOriginal: equipo.tipo_cambio_original,
    vendido: equipo.vendido === 1,
    ventaId: equipo.venta_id,
    es_canje: equipo.es_canje === 1,
    cliente_canje: equipo.cliente_canje || null,
    venta_canje: equipo.venta_canje || null,
    cliente_canje_id: equipo.cliente_canje_id || null,
    venta_canje_id: equipo.venta_canje_id || null,
    puntoVenta: {
      id: equipo.punto_venta_id,
      nombre: equipo.punto_venta,
    },
  }
}
