import { forwardRef } from "react"

const TicketThermal = forwardRef(
  ({ numeroTicket, fechaActual, horaActual, cliente, equipo, total, pago, formatearPrecio }, ref) => {
    // Función para crear línea divisoria
    const dividerLine = () => <div className="border-t border-b border-gray-400 my-1 w-full"></div>

    return (
      <div
        ref={ref}
        className="bg-white p-2 font-mono text-xs overflow-hidden"
        style={{ width: "100%", maxWidth: "58mm" }}
      >
        <div className="text-center font-bold">CELL-FIE</div>
        <div className="text-center">TICKET DE REPARACION</div>
        {dividerLine()}
        <div className="flex justify-between">
          <span>Fecha: {fechaActual}</span>
          <span>Hora: {horaActual}</span>
        </div>
        <div>Ticket N: {numeroTicket}</div>
        {dividerLine()}

        <div className="font-bold">CLIENTE:</div>
        <div>{cliente.nombre}</div>
        <br />

        <div className="font-bold">EQUIPO:</div>
        <div>Marca: {equipo.marca}</div>
        {equipo.modelo && <div>Modelo: {equipo.modelo}</div>}
        {equipo.imei && <div>IMEI: {equipo.imei}</div>}
        {equipo.password && <div>Contraseña: {equipo.password}</div>}
        {dividerLine()}

        {equipo.descripcion && <div>Observaciones: {equipo.descripcion}</div>}
        {dividerLine()}
        <div className="flex justify-between">
          <span className="font-bold">TOTAL:</span>
          <span>{formatearPrecio(total)}</span>
        </div>

        {pago && pago.realizaPago && Number.parseFloat(pago.monto) > 0 && (
          <>
            <br />
            <div className="font-bold">PAGO:</div>
            <div className="flex justify-between">
              <span>Monto pagado:</span>
              <span>{formatearPrecio(pago.monto)}</span>
            </div>
            <div>Método: {pago.nombreMetodo}</div>

            {total - Number.parseFloat(pago.monto) > 0 && (
              <div className="flex justify-between">
                <span>Saldo pendiente:</span>
                <span>{formatearPrecio(total - Number.parseFloat(pago.monto))}</span>
              </div>
            )}
          </>
        )}

        {dividerLine()}
        <div className="text-center font-bold">Presente este ticket</div>
        <div className="text-center font-bold">al retirar su equipo</div>
        <br />

        {/* Disclaimer con texto más pequeño */}
        <div className="text-[8px] leading-tight w-full">
          Pasado los 30 dias habiles de la
          <br />
          recepcion del equipo el cliente
          <br />
          perdera cualquier derecho de
          <br />
          reclamo sobre lo anterior
          <br />
          mencionado.
        </div>

        {/* Espacio en blanco adicional al final */}
        <div className="mt-4"></div>
      </div>
    )
  },
)

TicketThermal.displayName = "TicketThermal"

export default TicketThermal
