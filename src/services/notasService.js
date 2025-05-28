const API_URL = "https://api.sistemacellfierm22.site/api"

// Función para formatear fechas de Argentina (suma 3 horas)
export const formatearFechaArgentina = (fechaString) => {
  if (!fechaString) return ""

  try {
    // Manejar fechas que vienen de la base de datos
    let fecha

    if (fechaString.includes("T") || fechaString.includes("+")) {
      // La fecha ya tiene información de timezone
      fecha = new Date(fechaString)
    } else {
      // La fecha viene sin timezone desde MySQL, asumimos que está en Argentina
      // Agregamos el offset de Argentina (-03:00)
      fecha = new Date(fechaString + " GMT-0300")
    }

    if (isNaN(fecha.getTime())) return ""

    // Sumar 3 horas para corregir el desfase
    fecha.setHours(fecha.getHours() + 3)

    return fecha.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return ""
  }
}

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

    const notas = await response.json()

    // Formatear las fechas antes de devolver las notas
    return notas.map((nota) => ({
      ...nota,
      fecha_creacion: formatearFechaArgentina(nota.fecha_creacion),
      fecha_completada: nota.fecha_completada ? formatearFechaArgentina(nota.fecha_completada) : null,
    }))
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

    const result = await response.json()

    // Formatear las fechas de la nota creada
    if (result.nota) {
      result.nota.fecha_creacion = formatearFechaArgentina(result.nota.fecha_creacion)
      if (result.nota.fecha_completada) {
        result.nota.fecha_completada = formatearFechaArgentina(result.nota.fecha_completada)
      }
    }

    return result
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

    const result = await response.json()

    // Formatear las fechas de la nota actualizada
    if (result.nota) {
      result.nota.fecha_creacion = formatearFechaArgentina(result.nota.fecha_creacion)
      if (result.nota.fecha_completada) {
        result.nota.fecha_completada = formatearFechaArgentina(result.nota.fecha_completada)
      }
    }

    return result
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

    const result = await response.json()

    // Formatear las fechas de la nota actualizada
    if (result.nota) {
      result.nota.fecha_creacion = formatearFechaArgentina(result.nota.fecha_creacion)
      if (result.nota.fecha_completada) {
        result.nota.fecha_completada = formatearFechaArgentina(result.nota.fecha_completada)
      }
    }

    return result
  } catch (error) {
    console.error("Error en toggleNotaCompletada:", error)
    throw error
  }
}
