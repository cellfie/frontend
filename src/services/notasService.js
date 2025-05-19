const API_URL = "https://api.sistemacellfierm22.site/api" 

// Obtener todas las notas
export const getNotas = async (completadas) => {
  try {
    let url = `${API_URL}/notas`

    // Añadir parámetro de consulta si se especifica
    if (completadas !== undefined) {
      url += `?completadas=${completadas}`
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener notas")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getNotas:", error)
    throw error
  }
}

// Crear una nueva nota
export const createNota = async (notaData) => {
  try {
    const response = await fetch(`${API_URL}/notas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notaData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createNota:", error)
    throw error
  }
}

// Actualizar una nota existente
export const updateNota = async (id, notaData) => {
  try {
    const response = await fetch(`${API_URL}/notas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notaData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateNota:", error)
    throw error
  }
}

// Eliminar una nota
export const deleteNota = async (id) => {
  try {
    const response = await fetch(`${API_URL}/notas/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteNota:", error)
    throw error
  }
}

// Marcar una nota como completada o pendiente
export const toggleNotaCompletada = async (id) => {
  try {
    const response = await fetch(`${API_URL}/notas/${id}/toggle`, {
      method: "PATCH",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al cambiar el estado de la nota")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en toggleNotaCompletada:", error)
    throw error
  }
}
