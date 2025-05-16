const centerText = (text, width = 32) => {
    if (text.length >= width) return text
    const leftPadding = Math.floor((width - text.length) / 2)
    return " ".repeat(leftPadding) + text
  }
  
  // Función para crear una línea divisoria
  const dividerLine = (char = "-", width = 32) => {
    return char.repeat(width)
  }
  
  // Función para formatear texto en dos columnas (descripción y precio)
  const formatTwoColumns = (left, right, width = 32) => {
    // Reservar espacio para el precio (10 caracteres)
    const priceWidth = 10
    const descWidth = width - priceWidth
  
    if (left.length <= descWidth) {
      return left + " ".repeat(descWidth - left.length) + right.padStart(priceWidth)
    } else {
      // Si la descripción es muy larga, la cortamos
      return left.substring(0, descWidth - 3) + "..." + right.padStart(priceWidth)
    }
  }
  
  // Función para formatear el ticket completo
  export const formatTicket = (data) => {
    const { numeroTicket, fechaActual, horaActual, cliente, equipo, total, pago } = data
  
    console.log("Formateando ticket con número:", numeroTicket) // Para depuración
  
    const ticketContent = []
  
    // Encabezado
    ticketContent.push(centerText(""))
    ticketContent.push(centerText("CELL-FIE"))
    ticketContent.push(centerText("TICKET DE REPARACION"))
    ticketContent.push(dividerLine())
    ticketContent.push(`Fecha: ${fechaActual}  Hora: ${horaActual}`)
    ticketContent.push(`Ticket N: ${numeroTicket || ""}`)
    ticketContent.push(dividerLine())
  
    // Datos del cliente
    ticketContent.push(`CLIENTE: ${cliente.nombre}`)
    ticketContent.push("")
  
    // Datos del equipo
    ticketContent.push("EQUIPO")
    ticketContent.push(`Marca: ${equipo.marca}`)
    if (equipo.modelo) {
      ticketContent.push(`Modelo: ${equipo.modelo}`)
    }
    if (equipo.imei) {
      ticketContent.push(`IMEI: ${equipo.imei}`)
    }
    if (equipo.password) {
      ticketContent.push(`Contrasena: ${equipo.password}`)
    }
    ticketContent.push(dividerLine())
  
    if (equipo.descripcion) {
      ticketContent.push(`Observaciones: ${equipo.descripcion}`)
    }
    if (equipo.descripcion) {
      ticketContent.push(dividerLine())
    }
  
    // Total
    ticketContent.push(
      formatTwoColumns("TOTAL:", `$${Number.parseFloat(total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`),
    )
  
    // Información de pago si existe
    if (pago && pago.realizaPago && Number.parseFloat(pago.monto) > 0) {
      ticketContent.push("")
      ticketContent.push(
        formatTwoColumns(
          "Monto pagado:",
          `$${Number.parseFloat(pago.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        ),
      )
      ticketContent.push(`Método: ${pago.nombreMetodo}`)
  
      const saldoPendiente = total - Number.parseFloat(pago.monto)
      if (saldoPendiente > 0) {
        ticketContent.push(
          formatTwoColumns(
            "Saldo pendiente:",
            `$${saldoPendiente.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          ),
        )
      }
    }
  
    ticketContent.push(dividerLine())
    // Texto de disclaimer con formato especial para indicar que es más pequeño
    ticketContent.push("<!-- disclaimer-start -->Pasado los 30 dias habiles de la")
    ticketContent.push("recepcion del equipo el cliente")
    ticketContent.push("perdera cualquier derecho de")
    ticketContent.push("reclamo sobre lo anterior")
    ticketContent.push("mencionado.<!-- disclaimer-end -->")
    ticketContent.push(centerText(""))
    ticketContent.push(centerText(""))
  
    ticketContent.push(centerText("Presente este ticket"))
    ticketContent.push(centerText(" al retirar su equipo."))
    ticketContent.push("")
    ticketContent.push(centerText(""))
    ticketContent.push(centerText(""))
    ticketContent.push(centerText(""))
  
    // Unir todo el contenido con saltos de línea
    return ticketContent.join("\n")
  }
  
  // Función para imprimir el ticket en una impresora térmica
  export const printTicket = async (ticketData) => {
    try {
      const formattedTicket = formatTicket(ticketData)
  
      // Aquí implementamos la lógica para enviar a la impresora
      // Esto dependerá de cómo esté configurada la impresora en el sistema
  
      // Opción 1: Usando la API de impresión del navegador
      const printWindow = window.open("", "_blank")
  
      // Extraer el contenido del disclaimer para reemplazarlo correctamente
      let disclaimerContent = ""
      const disclaimerMatch = formattedTicket.match(/<!-- disclaimer-start -->([\s\S]*?)<!-- disclaimer-end -->/)
  
      if (disclaimerMatch && disclaimerMatch[1]) {
        disclaimerContent = disclaimerMatch[1]
      }
  
      // Crear el HTML con el contenido del ticket
      printWindow.document.write(`
            <html>
              <head>
                <title>Ticket ${ticketData.numeroTicket}</title>
                <style>
                  @page {
                    size: 58mm auto;
                    margin: 0mm;
                  }
                  body {
                    font-family: monospace;
                    font-size: 12px;
                    width: 58mm;
                    margin: 0;
                    padding: 5px;
                    overflow: hidden;
                  }
                  pre {
                    white-space: pre-wrap;
                    margin: 0;
                    width: 100%;
                    overflow: hidden;
                  }
                  .disclaimer {
                    font-size: 8px;
                    line-height: 1.1;
                    display: block;
                    margin-top: 0;
                    margin-bottom: 0;
                  }
                  .footer-space {
                    height: 20px;
                  }
                </style>
              </head>
              <body>
                <pre>${formattedTicket.replace(
                  /<!-- disclaimer-start -->[\s\S]*?<!-- disclaimer-end -->/g,
                  `<span class="disclaimer">${disclaimerContent}</span>`,
                )}</pre>
                <div class="footer-space"></div>
              </body>
            </html>
          `)
      printWindow.document.close()
  
      // Esperar a que el contenido se cargue completamente
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 500)
      }, 500)
  
      return true
    } catch (error) {
      console.error("Error al imprimir ticket:", error)
      throw error
    }
  }
  