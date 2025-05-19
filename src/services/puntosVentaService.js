const API_URL = "https://api.sistemacellfierm22.site/api" 

// Obtener todos los puntos de venta
export const getPuntosVenta = async () => {
  try {
    const response = await fetch(`${API_URL}/puntos-venta`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al obtener puntos de venta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getPuntosVenta:", error);
    throw error;
  }
};

// Obtener un punto de venta por ID
export const getPuntoVentaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/puntos-venta/${id}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al obtener el punto de venta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getPuntoVentaById:", error);
    throw error;
  }
};

// Obtener inventario por punto de venta
export const getInventarioPorPuntoVenta = async (id) => {
  try {
    const response = await fetch(`${API_URL}/puntos-venta/${id}/inventario`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al obtener el inventario del punto de venta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getInventarioPorPuntoVenta:", error);
    throw error;
  }
};

// Crear un nuevo punto de venta
export const createPuntoVenta = async (puntoVentaData) => {
  try {
    const response = await fetch(`${API_URL}/puntos-venta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(puntoVentaData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al crear el punto de venta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createPuntoVenta:", error);
    throw error;
  }
};

// Actualizar un punto de venta existente
export const updatePuntoVenta = async (id, puntoVentaData) => {
  try {
    const response = await fetch(`${API_URL}/puntos-venta/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(puntoVentaData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al actualizar el punto de venta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en updatePuntoVenta:", error);
    throw error;
  }
};

// Eliminar un punto de venta
export const deletePuntoVenta = async (id) => {
  try {
    const response = await fetch(`${API_URL}/puntos-venta/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al eliminar el punto de venta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en deletePuntoVenta:", error);
    throw error;
  }
};

// Función para obtener el ID del punto de venta a partir del nombre
export const getPuntoVentaIdByNombre = async (nombre) => {
  try {
    const puntosVenta = await getPuntosVenta();
    const puntoVenta = puntosVenta.find(pv => pv.nombre === nombre);
    return puntoVenta ? puntoVenta.id : null;
  } catch (error) {
    console.error("Error en getPuntoVentaIdByNombre:", error);
    throw error;
  }
};

// Función para obtener el nombre del punto de venta a partir del ID
export const getPuntoVentaNombreById = async (id) => {
  try {
    const puntosVenta = await getPuntosVenta();
    const puntoVenta = puntosVenta.find(pv => pv.id === id);
    return puntoVenta ? puntoVenta.nombre : null;
  } catch (error) {
    console.error("Error en getPuntoVentaNombreById:", error);
    throw error;
  }
};

export const searchProductos = async (query) => {
  try {
    const response = await fetch(`${API_URL}/productos/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al buscar productos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchProductos:", error)
    throw error
  }
}
