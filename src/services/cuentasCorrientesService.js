// cuentaCorrienteService.js
const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener todas las cuentas corrientes
export const getCuentasCorrientes = async () => {
  try {
    const response = await fetch(`${API_URL}/cuentas-corrientes`, {
      method: "GET",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener cuentas corrientes")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getCuentasCorrientes:", error)
    throw error
  }
}

// Obtener cuenta corriente por ID de cliente
export const getCuentaCorrienteByCliente = async (clienteId) => {
  try {
    const response = await fetch(`${API_URL}/cuentas-corrientes/cliente/${clienteId}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Sesión expirada o no autorizada")
        // Podríamos redirigir al login o manejar de otra forma
        return null
      }

      if (response.status === 404) {
        // Si el cliente no tiene cuenta corriente, devolver un objeto con valores predeterminados
        return {
          id: null,
          cliente_id: clienteId,
          saldo: 0,
          limiteCredito: 0,
          activo: true,
          movimientos: [],
        }
      }

      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener cuenta corriente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getCuentaCorrienteByCliente:", error)
    throw error
  }
}

// Crear o actualizar cuenta corriente
export const createOrUpdateCuentaCorriente = async (cuentaData) => {
  try {
    const response = await fetch(`${API_URL}/cuentas-corrientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuentaData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear/actualizar la cuenta corriente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createOrUpdateCuentaCorriente:", error)
    throw error
  }
}

// Registrar pago en cuenta corriente
export const registrarPago = async (pagoData) => {
  try {
    const response = await fetch(`${API_URL}/cuentas-corrientes/pago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagoData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al registrar el pago")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en registrarPago:", error)
    throw error
  }
}

// NUEVA FUNCIÓN: Registrar ajuste de cuenta corriente
export const registrarAjuste = async (ajusteData) => {
  try {
    const response = await fetch(`${API_URL}/cuentas-corrientes/ajuste`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ajusteData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al registrar el ajuste")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en registrarAjuste:", error)
    throw error
  }
}

// Función para obtener los movimientos de una cuenta corriente
export const getMovimientosCuentaCorriente = async (cuentaId, params = {}) => {
  try {
    // Construir la URL con los parámetros de consulta
    let url = `${API_URL}/cuentas-corrientes/${cuentaId}/movimientos`

    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams()

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value)
        }
      }

      url += `?${queryParams.toString()}`
    }

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Error al obtener los movimientos de la cuenta corriente")
    }

    const data = await response.json()

    // Procesar los datos para asegurar que los valores numéricos sean números
    return data.map((movimiento) => ({
      ...movimiento,
      monto: Number(movimiento.monto),
      saldo_anterior: Number(movimiento.saldo_anterior),
      saldo_nuevo: Number(movimiento.saldo_nuevo),
      fecha: movimiento.fecha,
      tipo: movimiento.tipo,
      notas: movimiento.notas || "",
      tipo_referencia: movimiento.tipo_referencia || "",
    }))
  } catch (error) {
    console.error("Error en getMovimientosCuentaCorriente:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptCuentaCorrienteToFrontend = (cuenta) => {
  return {
    id: cuenta.id,
    cliente: {
      id: cuenta.cliente_id,
      nombre: cuenta.cliente_nombre,
      telefono: cuenta.cliente_telefono,
      documento: cuenta.cliente_documento,
    },
    limiteCredito: Number.parseFloat(cuenta.limite_credito) || 0,
    saldo: Number.parseFloat(cuenta.saldo) || 0,
    fechaUltimoMovimiento: cuenta.fecha_ultimo_movimiento,
    activo: cuenta.activo === 1,
    fechaCreacion: cuenta.fecha_creacion,
    movimientos: cuenta.movimientos
      ? cuenta.movimientos.map((mov) => ({
          id: mov.id,
          tipo: mov.tipo,
          monto: Number.parseFloat(mov.monto) || 0,
          saldoAnterior: Number.parseFloat(mov.saldo_anterior) || 0,
          saldoNuevo: Number.parseFloat(mov.saldo_nuevo) || 0,
          referenciaId: mov.referencia_id,
          tipoReferencia: mov.tipo_referencia,
          fecha: mov.fecha,
          notas: mov.notas,
          usuario: {
            nombre: mov.usuario_nombre,
          },
        }))
      : [],
  }
}

// Función para obtener el nombre descriptivo del tipo de referencia
export const getTipoReferenciaDescripcion = (tipoReferencia) => {
  const tipos = {
    venta: "Venta de productos",
    venta_equipo: "Venta de equipo",
    reparacion: "Servicio de reparación",
    ajuste: "Ajuste manual",
    cancelacion_reparacion: "Cancelación de reparación",
    otro: "Otro",
  }

  return tipos[tipoReferencia] || tipoReferencia
}

// NUEVA FUNCIÓN: Obtener tipos de ajuste disponibles
export const getTiposAjuste = () => {
  return [
    {
      id: "pago",
      nombre: "Pago",
      descripcion: "Registrar un pago que reduce el saldo de la cuenta",
      icono: "minus",
      color: "green",
    },
    {
      id: "cargo",
      nombre: "Cargo",
      descripcion: "Agregar un cargo que aumenta el saldo de la cuenta",
      icono: "plus",
      color: "red",
    },
  ]
}

// NUEVA FUNCIÓN: Validar datos de ajuste antes de enviar
export const validarDatosAjuste = (ajusteData) => {
  const errores = []

  // Validar cliente_id
  if (!ajusteData.cliente_id || !Number.isInteger(Number(ajusteData.cliente_id))) {
    errores.push("ID de cliente inválido")
  }

  // Validar monto
  const monto = Number.parseFloat(ajusteData.monto)
  if (isNaN(monto) || monto <= 0) {
    errores.push("El monto debe ser un número mayor a cero")
  }

  // Validar tipo_ajuste
  if (!["pago", "cargo"].includes(ajusteData.tipo_ajuste)) {
    errores.push('El tipo de ajuste debe ser "pago" o "cargo"')
  }

  // Validar motivo
  if (!ajusteData.motivo || ajusteData.motivo.trim().length < 5) {
    errores.push("El motivo debe tener al menos 5 caracteres")
  }

  if (ajusteData.motivo && ajusteData.motivo.length > 500) {
    errores.push("El motivo no puede exceder los 500 caracteres")
  }

  return {
    esValido: errores.length === 0,
    errores,
  }
}
