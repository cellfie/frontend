"use client"

import * as React from "react"
import { format, isAfter, isBefore, startOfDay, startOfMonth, subDays, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "react-toastify"

// Función helper para formatear fechas para el backend (zona horaria local)
export const formatDateForBackend = (date) => {
  if (!date) return null
  
  // Crear fecha en zona horaria local sin conversión a UTC
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Función helper para formatear fecha y hora para el backend
export const formatDateTimeForBackend = (date) => {
  if (!date) return null
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const presets = [
  {
    id: "today",
    name: "Hoy",
    description: "Ventas del día actual",
    getDate: () => {
      const today = new Date()
      return {
        from: today,
        to: today,
      }
    },
  },
  {
    id: "yesterday",
    name: "Ayer",
    description: "Ventas del día anterior",
    getDate: () => {
      const yesterday = subDays(new Date(), 1)
      return {
        from: yesterday,
        to: yesterday,
      }
    },
  },
  {
    id: "last-7",
    name: "Últimos 7 días",
    description: "Ventas de la última semana",
    getDate: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    id: "current-month",
    name: "Mes actual",
    description: "Ventas del mes en curso",
    getDate: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    id: "last-month",
    name: "Mes anterior",
    description: "Ventas del mes anterior",
    getDate: () => {
      const today = new Date()
      const firstDayLastMonth = startOfMonth(subMonths(today, 1))
      const lastDayLastMonth = subDays(startOfMonth(today), 1)
      return {
        from: firstDayLastMonth,
        to: lastDayLastMonth,
      }
    },
  },
]

export function DateRangePicker({ className, date, setDate, align = "center", showPresets = true, disableBefore }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState(null)
  const [calendarError, setCalendarError] = React.useState("")

  // Filtrar presets según la restricción de fecha
  const filteredPresets = React.useMemo(() => {
    if (!disableBefore) return presets

    return presets.filter((preset) => {
      const presetDate = preset.getDate()
      if (!presetDate.from) return true

      // Verificar si la fecha del preset es posterior a la fecha mínima permitida
      return !isBefore(startOfDay(presetDate.from), startOfDay(disableBefore))
    })
  }, [disableBefore])

  // Función para aplicar un preset
  const applyPreset = (preset) => {
    const newDate = preset.getDate()

    // Verificar si el preset está dentro del rango permitido
    if (disableBefore && newDate.from && isBefore(startOfDay(newDate.from), startOfDay(disableBefore))) {
      setCalendarError("No se pueden seleccionar fechas anteriores al límite permitido")
      return
    }

    // Asegurar que las fechas estén en el inicio y final del día en zona horaria local
    const adjustedDate = {
      from: newDate.from ? startOfDay(newDate.from) : null,
      to: newDate.to ? new Date(newDate.to.getFullYear(), newDate.to.getMonth(), newDate.to.getDate(), 23, 59, 59) : null
    }

    setDate(adjustedDate)
    setSelectedPreset(preset.id)
    setCalendarError("")
  }

  // Función para manejar cambios en el calendario
  const handleCalendarSelect = (range) => {
    if (range?.from) {
      // Verificar que la fecha "desde" no sea futura
      if (isAfter(startOfDay(range.from), startOfDay(new Date()))) {
        setCalendarError("No se pueden seleccionar fechas futuras")
        return
      }

      // Verificar que la fecha "desde" no sea anterior al límite permitido
      if (disableBefore && isBefore(startOfDay(range.from), startOfDay(disableBefore))) {
        setCalendarError("No se pueden seleccionar fechas anteriores al límite permitido")
        return
      }

      // Verificar que la fecha "hasta" no sea futura
      if (range.to && isAfter(startOfDay(range.to), startOfDay(new Date()))) {
        // Ajustar la fecha "hasta" a hoy
        range.to = new Date()
      }

      // Verificar que la fecha "desde" sea anterior a la fecha "hasta"
      if (range.to && isAfter(startOfDay(range.from), startOfDay(range.to))) {
        setCalendarError("La fecha inicial debe ser anterior a la fecha final")
        return
      }

      // Ajustar las fechas para cubrir todo el día en zona horaria local
      const adjustedRange = {
        from: startOfDay(range.from),
        to: range.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59) : null
      }

      setCalendarError("")
      setDate(adjustedRange)
      setSelectedPreset(null) // Limpiar preset seleccionado al elegir fechas manualmente
    }
  }

  // Función para limpiar el rango de fechas
  const clearDateRange = () => {
    // En lugar de establecer null, establecemos un objeto con propiedades vacías
    setDate({
      from: null,
      to: null,
    })
    setSelectedPreset(null)
    setCalendarError("")
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: es })} - {format(date.to, "dd/MM/yyyy", { locale: es })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
            {date?.from && (
              <X
                className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  clearDateRange()
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align} side="bottom">
          <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 p-3">
            {showPresets && filteredPresets.length > 0 && (
              <div className="sm:border-r pr-0 sm:pr-4">
                <div className="flex flex-col">
                  <h3 className="font-medium mb-2 text-sm">Períodos predefinidos</h3>
                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    {filteredPresets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant={selectedPreset === preset.id ? "default" : "outline"}
                        className="text-xs h-8 justify-start"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Calendario</h3>
                {calendarError && <span className="text-xs text-red-500">{calendarError}</span>}
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from || new Date()}
                selected={date}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                locale={es}
                disabled={(date) =>
                  isAfter(date, new Date()) || (disableBefore ? isBefore(date, disableBefore) : false)
                }
                className="rounded-md border"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearDateRange()
                    setIsOpen(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (date?.from) {
                      setIsOpen(false)
                    } else {
                      toast.error("Seleccione al menos una fecha")
                    }
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}