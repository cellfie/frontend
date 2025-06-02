const API_URL = "https://api.sistemacellfierm22.site/api"

// Cache simple para productos
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Función para convertir un precio formateado a número
const parseFormattedPrice = (price) => {
  if (typeof price === "number") return price

  // Eliminar el símbolo de moneda y espacios
  let cleanPrice = price.toString().replace(/\$ /g, "").replace(/\s/g, "")

  // Convertir formato argentino (1.234,56) a formato numérico (1234.56)
  cleanPrice = cleanPrice.replace(/\./g, "").replace(",", ".")

  return Number.parseFloat(cleanPrice)
}

// NUEVA FUNCIÓN: Obtener productos con paginación
export const getProductosPaginados = async (page = 1, limit = 50, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    })

    const cacheKey = `productos_${queryParams.toString()}`

    // Verificar cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
    }

    const response = await fetch(`${API_URL}/productos/paginados?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener productos")
    }

    const data = await response.json()

    // Guardar en cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    console.error("Error en getProductosPaginados:", error)
    throw error
  }
}

// NUEVA FUNCIÓN: Búsqueda rápida para autocompletado
export const searchProductosRapido = async (query) => {
  try {
    if (!query || query.length < 2) {
      return []
    }

    const response = await fetch(`${API_URL}/productos/search-rapido?q=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error en búsqueda rápida")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchProductosRapido:", error)
    throw error
  }
}

// Obtener todos los productos (optimizado para usar paginación)
export const getProductos = async () => {
  try {
    // Para mantener compatibilidad, obtener una página grande
    const result = await getProductosPaginados(1, 1000)
    return result.data || []
  } catch (error) {
    console.error("Error en getProductos:", error)
    throw error
  }
}

// Limpiar cache cuando sea necesario
export const clearProductosCache = () => {
  cache.clear()
}

// Obtener un producto por ID
export const getProductoById = async (id) => {
  try {
    const cacheKey = `producto_${id}`

    // Verificar cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
    }

    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el producto")
    }

    const data = await response.json()

    // Guardar en cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    console.error("Error en getProductoById:", error)
    throw error
  }
}

// Buscar productos con filtros (ahora usa paginación)
export const searchProductos = async (filters = {}) => {
  try {
    const result = await getProductosPaginados(1, 100, filters)
    return result.data || []
  } catch (error) {
    console.error("Error en searchProductos:", error)
    throw error
  }
}

// Crear un nuevo producto
export const createProducto = async (productoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      codigo: productoData.code,
      nombre: productoData.name,
      descripcion: productoData.description || "",
      precio: parseFormattedPrice(productoData.price),
      categoria_id: productoData.categoria_id === "0" ? null : Number(productoData.categoria_id),
      punto_venta_id: Number(productoData.punto_venta_id),
      stock: productoData.stock,
    }

    const response = await fetch(`${API_URL}/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el producto")
    }

    // Limpiar cache después de crear
    clearProductosCache()

    return await response.json()
  } catch (error) {
    console.error("Error en createProducto:", error)
    throw error
  }
}

// Actualizar un producto existente
export const updateProducto = async (id, productoData) => {
  try {
    // Obtener el producto actual para mantener su punto_venta_id
    const productoActual = await getProductoById(id)

    const categoria_id =
      productoData.categoria_id === "0"
        ? null
        : productoData.categoria_id === 0
          ? null
          : Number(productoData.categoria_id)

    // Manejar el precio correctamente
    let precio
    if (typeof productoData.price === "number") {
      precio = productoData.price
    } else {
      precio = parseFormattedPrice(productoData.price)
    }

    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      codigo: productoData.code,
      nombre: productoData.name,
      descripcion: productoData.description || "",
      precio: precio,
      categoria_id: categoria_id,
      punto_venta_id: productoActual.punto_venta_id,
      stock: productoData.stock,
    }

    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el producto")
    }

    // Limpiar cache después de actualizar
    clearProductosCache()

    return await response.json()
  } catch (error) {
    console.error("Error en updateProducto:", error)
    throw error
  }
}

// Eliminar un producto
export const deleteProducto = async (id) => {
  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar el producto")
    }

    // Limpiar cache después de eliminar
    clearProductosCache()

    return await response.json()
  } catch (error) {
    console.error("Error en deleteProducto:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptProductoToFrontend = (producto) => {
  return {
    id: producto.id,
    name: producto.nombre,
    code: producto.codigo,
    description: producto.descripcion,
    price: producto.precio,
    category: producto.categoria,
    categoria_id: producto.categoria_id,
    stock: producto.stock || 0,
    pointOfSale: producto.punto_venta,
    punto_venta_id: producto.punto_venta_id,
    discount:
      producto.descuento_id && producto.descuento_porcentaje
        ? {
            id: producto.descuento_id,
            percentage: producto.descuento_porcentaje,
            startDate: producto.descuento_fecha_inicio,
            endDate: producto.descuento_fecha_fin,
          }
        : null,
  }
}

// Obtener productos por punto de venta
export const getProductosByPuntoVenta = async (puntoVentaId) => {
  try {
    const result = await getProductosPaginados(1, 1000, { punto_venta_id: puntoVentaId })
    return result.data || []
  } catch (error) {
    console.error("Error en getProductosByPuntoVenta:", error)
    throw error
  }
}
