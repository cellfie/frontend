const API_URL = "http://localhost:4486/api"

// Obtener todos los clientes
export const getClientes = async () => {
  try {
    const response = await fetch(`${API_URL}/clientes`, {
      method: "GET",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener clientes")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getClientes:", error)
    throw error
  }
}

// Obtener un cliente por ID
export const getClienteById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el cliente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getClienteById:", error)
    throw error
  }
}

// Buscar clientes
export const searchClientes = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return []
    }

    const response = await fetch(`${API_URL}/clientes/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 500) {
        console.error("Error del servidor al buscar clientes")
        return [] // Retornar un array vacío en lugar de lanzar un error
      }
      const errorData = await response.json().catch(() => ({ message: "Error desconocido" }))
      throw new Error(errorData.message || "Error al buscar clientes")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchClientes:", error)
    // En lugar de propagar el error, retornamos un array vacío
    return []
  }
}

// Obtener cliente con sus reparaciones
export const getClienteWithReparaciones = async (id) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}/reparaciones`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el cliente con reparaciones")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getClienteWithReparaciones:", error)
    throw error
  }
}

// Crear un nuevo cliente
export const createCliente = async (clienteData) => {
  try {
    const response = await fetch(`${API_URL}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clienteData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el cliente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createCliente:", error)
    throw error
  }
}

// Actualizar un cliente existente
export const updateCliente = async (id, clienteData) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clienteData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el cliente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateCliente:", error)
    throw error
  }
}

// Eliminar un cliente
export const deleteCliente = async (id) => {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar el cliente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteCliente:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptClienteToFrontend = (cliente) => {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono || "",
    dni: cliente.dni || "",
    cuentaCorriente: cliente.cuenta_corriente
      ? {
          id: cliente.cuenta_corriente.id,
          limiteCredito: cliente.cuenta_corriente.limite_credito,
          saldo: cliente.cuenta_corriente.saldo,
          activo: cliente.cuenta_corriente.activo === 1,
        }
      : null,
    reparaciones: cliente.reparaciones
      ? cliente.reparaciones.map((rep) => ({
          id: rep.id,
          numeroTicket: rep.numero_ticket,
          fechaIngreso: rep.fecha_ingreso,
          estado: rep.estado,
          marca: rep.marca,
          modelo: rep.modelo || "",
        }))
      : [],
  }
}
