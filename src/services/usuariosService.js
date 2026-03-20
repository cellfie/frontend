const API_URL = "https://api.sistemacellfierm22.site/api"

export const getUsuarios = async () => {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener usuarios" }))
    throw new Error(errorData.message || "Error al obtener usuarios")
  }

  return response.json()
}

export const createUsuario = async (usuarioData) => {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuarioData),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al crear usuario" }))
    throw new Error(errorData.message || "Error al crear usuario")
  }

  return response.json()
}

export const updateUsuario = async (id, usuarioData) => {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuarioData),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al actualizar usuario" }))
    throw new Error(errorData.message || "Error al actualizar usuario")
  }

  return response.json()
}

export const deleteUsuario = async (id) => {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al desactivar usuario" }))
    throw new Error(errorData.message || "Error al desactivar usuario")
  }

  return response.json()
}

