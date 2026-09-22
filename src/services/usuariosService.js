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

export const getCuentaCorrienteEmpleado = async (usuarioId, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio)
  if (filters.fecha_fin) params.append("fecha_fin", filters.fecha_fin)
  const qs = params.toString()
  const response = await fetch(
    `${API_URL}/usuarios/${usuarioId}/cuenta-corriente${qs ? `?${qs}` : ""}`,
    { method: "GET", credentials: "include" },
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener cuenta corriente" }))
    throw new Error(errorData.message || "Error al obtener cuenta corriente del empleado")
  }
  return response.json()
}

export const registrarPagoCuentaCorrienteEmpleado = async (usuarioId, { monto, notas }) => {
  const response = await fetch(`${API_URL}/usuarios/${usuarioId}/cuenta-corriente/pagos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monto: Number(monto), notas: notas || "" }),
    credentials: "include",
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al registrar pago" }))
    throw new Error(errorData.message || "Error al registrar pago de cuenta corriente")
  }
  return response.json()
}

