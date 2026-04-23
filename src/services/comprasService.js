const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener compras con paginación
export const getComprasPaginadas = async (page = 1, limit = 50, filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== "todos",
    ),
  )

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...cleanFilters,
  })

  const response = await fetch(`${API_URL}/compras/paginadas?${queryParams}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener compras" }))
    throw new Error(errorData.message || "Error al obtener compras")
  }

  const data = await response.json()

  if (!data || !Array.isArray(data.compras)) {
    throw new Error("Respuesta inválida del servidor de compras")
  }

  return data
}

// Obtener una compra por ID
export const getCompraById = async (id) => {
  const response = await fetch(`${API_URL}/compras/${id}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener la compra" }))
    throw new Error(errorData.message || "Error al obtener la compra")
  }

  return await response.json()
}

// Crear una nueva compra
export const createCompra = async (compraData) => {
  if (!compraData || typeof compraData !== "object") {
    throw new Error("Datos de compra inválidos")
  }

  if (!compraData.proveedor_id) {
    throw new Error("El proveedor es obligatorio")
  }

  if (!compraData.punto_venta_id) {
    throw new Error("El punto de venta es obligatorio")
  }

  if (!Array.isArray(compraData.productos) || compraData.productos.length === 0) {
    throw new Error("Debe agregar al menos un producto a la compra")
  }

  const backendData = {
    proveedor_id: Number(compraData.proveedor_id),
    punto_venta_id: Number(compraData.punto_venta_id),
    porcentaje_descuento: Number(compraData.porcentaje_descuento) || 0,
    productos: compraData.productos.map((p) => ({
      id: Number(p.id),
      cantidad: Number(p.cantidad),
      costo_unitario: Number(p.costo_unitario),
      precio_venta: Number(p.precio_venta),
    })),
    pagos: Array.isArray(compraData.pagos)
      ? compraData.pagos.map((p) => ({
          monto: Number(p.monto),
          tipo_pago: p.tipo_pago,
        }))
      : [],
    notas: compraData.notas || "",
  }

  const response = await fetch(`${API_URL}/compras`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(backendData),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al crear la compra" }))
    throw new Error(errorData.message || "Error al crear la compra")
  }

  return await response.json()
}

// Anular una compra
export const anularCompra = async (id, motivo) => {
  if (!id || isNaN(Number(id))) {
    throw new Error("ID de compra inválido")
  }

  if (!motivo || motivo.trim().length === 0) {
    throw new Error("El motivo de anulación es requerido")
  }

  const response = await fetch(`${API_URL}/compras/${id}/anular`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ motivo: motivo.trim() }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al anular la compra" }))
    throw new Error(errorData.message || "Error al anular la compra")
  }

  return await response.json()
}

