const API_URL = "https://api.sistemacellfierm22.site/api" 

// Obtener todas las categorías
export const getCategorias = async (incluirInactivas = false) => {
  try {
    let url = `${API_URL}/categorias`
    if (incluirInactivas) {
      url += "?incluir_inactivas=true"
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener categorías")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getCategorias:", error)
    throw error
  }
}

// Obtener una categoría por ID
export const getCategoriaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/categorias/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la categoría")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getCategoriaById:", error)
    throw error
  }
}

// Crear una nueva categoría
export const createCategoria = async (categoriaData) => {
  try {
    const response = await fetch(`${API_URL}/categorias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoriaData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la categoría")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createCategoria:", error)
    throw error
  }
}

// Actualizar una categoría existente
export const updateCategoria = async (id, categoriaData) => {
  try {
    const response = await fetch(`${API_URL}/categorias/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoriaData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar la categoría")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateCategoria:", error)
    throw error
  }
}

// Eliminar una categoría
export const deleteCategoria = async (id) => {
  try {
    const response = await fetch(`${API_URL}/categorias/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar la categoría")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteCategoria:", error)
    throw error
  }
}

// Obtener estadísticas de categorías (productos por categoría)
export const getEstadisticasCategorias = async () => {
  try {
    const response = await fetch(`${API_URL}/categorias/estadisticas`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener estadísticas de categorías")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getEstadisticasCategorias:", error)
    throw error
  }
}

// Adaptar categoría para el frontend
export const adaptCategoriaToFrontend = (categoria) => {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || "",
    activo: categoria.activo === 1,
    fecha_creacion: categoria.fecha_creacion,
    fecha_actualizacion: categoria.fecha_actualizacion,
    productos: categoria.productos_count || 0,
  }
}
