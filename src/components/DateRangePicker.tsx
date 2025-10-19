import { useState, useEffect } from "react";
import { format, addDays, isSameDay, isWithinInterval, isBefore, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface DateRangePickerProps {
  value?: DateRange;
  minDate?: Date;
  maxDate?: Date;
  unavailableDates?: string[]; // Array de fechas ISO (yyyy-MM-dd) bloqueadas (rojo)
  pendingDates?: string[]; // Array de fechas ISO (yyyy-MM-dd) pendientes (amarillo)
  onChange: (range: DateRange) => void;
  onConfirm?: (range: DateRange) => void;
}

export const DateRangePicker = ({
  value,
  minDate = new Date(),
  maxDate,
  unavailableDates = [],
  pendingDates = [],
  onChange,
  onConfirm,
}: DateRangePickerProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(value?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(value?.endDate);
  const [hoverDate, setHoverDate] = useState<Date | undefined>();

  useEffect(() => {
    if (value) {
      setStartDate(value.startDate);
      setEndDate(value.endDate);
    }
  }, [value]);

  // Convertir fechas no disponibles a objetos Date
  const unavailableDateObjects = unavailableDates.map(dateStr => new Date(dateStr));
  const pendingDateObjects = pendingDates.map(dateStr => new Date(dateStr));

  const handleDateClick = (date: Date) => {
    const normalizedDate = startOfDay(date);
    
    // Verificar si la fecha está bloqueada
    if (isDateUnavailable(normalizedDate)) {
      return;
    }

    // Si no hay fecha de inicio, establecerla
    if (!startDate || (startDate && endDate)) {
      setStartDate(normalizedDate);
      setEndDate(undefined);
      onChange({ startDate: normalizedDate, endDate: undefined });
      return;
    }

    // Si ya hay fecha de inicio, establecer fecha de fin
    if (startDate && !endDate) {
      // Permitir seleccionar la misma fecha (alquiler de 1 día)
      if (isSameDay(normalizedDate, startDate)) {
        setEndDate(normalizedDate);
        onChange({ startDate, endDate: normalizedDate });
        return;
      }
      
      // Si la fecha clickeada es anterior a startDate, intercambiar
      if (isBefore(normalizedDate, startDate)) {
        setEndDate(startDate);
        setStartDate(normalizedDate);
        onChange({ startDate: normalizedDate, endDate: startDate });
      } else {
        // Verificar si hay fechas bloqueadas en el rango
        if (hasUnavailableDatesInRange(startDate, normalizedDate)) {
          // No permitir seleccionar el rango
          return;
        }
        setEndDate(normalizedDate);
        onChange({ startDate, endDate: normalizedDate });
      }
    }
  };

  const isDateUnavailable = (date: Date): boolean => {
    return unavailableDateObjects.some(unavailableDate => 
      isSameDay(date, unavailableDate)
    );
  };

  const isDatePending = (date: Date): boolean => {
    return pendingDateObjects.some(pendingDate => 
      isSameDay(date, pendingDate)
    );
  };

  const hasUnavailableDatesInRange = (start: Date, end: Date): boolean => {
    const hasUnavailable = unavailableDateObjects.some(unavailableDate => {
      try {
        return isWithinInterval(unavailableDate, { start, end });
      } catch {
        return false;
      }
    });

    const hasPending = pendingDateObjects.some(pendingDate => {
      try {
        return isWithinInterval(pendingDate, { start, end });
      } catch {
        return false;
      }
    });

    return hasUnavailable || hasPending;
  };

  const isDateDisabled = (date: Date): boolean => {
    const normalizedDate = startOfDay(date);
    
    // Deshabilitar fechas pasadas
    if (isBefore(normalizedDate, startOfDay(minDate))) {
      return true;
    }

    // Deshabilitar fechas después del máximo (si existe)
    if (maxDate && isAfter(normalizedDate, startOfDay(maxDate))) {
      return true;
    }

    // Deshabilitar fechas no disponibles
    if (isDateUnavailable(normalizedDate)) {
      return true;
    }

    // Deshabilitar fechas pendientes
    if (isDatePending(normalizedDate)) {
      return true;
    }

    return false;
  };

  const isInRange = (date: Date): boolean => {
    if (!startDate || !endDate) {
      // Si solo tenemos startDate y estamos hovering, mostrar el rango temporal
      if (startDate && hoverDate && !endDate) {
        const start = isBefore(startDate, hoverDate) ? startDate : hoverDate;
        const end = isAfter(startDate, hoverDate) ? startDate : hoverDate;
        try {
          return isWithinInterval(date, { start, end }) && !isSameDay(date, start) && !isSameDay(date, end);
        } catch {
          return false;
        }
      }
      return false;
    }

    try {
      return isWithinInterval(date, { start: startDate, end: endDate }) && 
             !isSameDay(date, startDate) && 
             !isSameDay(date, endDate);
    } catch {
      return false;
    }
  };

  const isRangeValid = (): boolean => {
    // Permitir rangos del mismo día (alquiler de 1 día)
    return !!(startDate && endDate && (isBefore(startDate, endDate) || isSameDay(startDate, endDate)));
  };

  const handleConfirm = () => {
    if (isRangeValid() && onConfirm) {
      onConfirm({ startDate, endDate });
    }
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setHoverDate(undefined);
    onChange({ startDate: undefined, endDate: undefined });
  };

  const getInstructionText = (): string => {
    if (!startDate) {
      return "Selecciona la fecha de inicio";
    }
    if (startDate && !endDate) {
      return "Selecciona la fecha de finalización";
    }
    return `${format(startDate, "d 'de' MMMM", { locale: es })} - ${format(endDate!, "d 'de' MMMM, yyyy", { locale: es })}`;
  };

  const modifiers = {
    start: startDate ? [startDate] : [],
    end: endDate ? [endDate] : [],
    range: (date: Date) => isInRange(date),
    disabled: isDateDisabled,
    unavailable: (date: Date) => isDateUnavailable(date),
    pending: (date: Date) => isDatePending(date),
  };

  const modifiersClassNames = {
    start: "bg-primary text-primary-foreground rounded-l-md hover:bg-primary hover:text-primary-foreground",
    end: "bg-primary text-primary-foreground rounded-r-md hover:bg-primary hover:text-primary-foreground",
    range: "bg-primary/10 text-foreground",
    disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
    unavailable: "!bg-destructive/20 !text-destructive line-through",
    pending: "!bg-yellow-100 dark:!bg-yellow-900/30 !text-yellow-900 dark:!text-yellow-100",
    today: "font-bold",
  };

  return (
    <div className="space-y-4">
      {/* Instrucciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{getInstructionText()}</span>
        </div>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs"
          >
            Reiniciar
          </Button>
        )}
      </div>

      {/* Calendario */}
      <div className="rounded-md border p-3">
        <DayPicker
          mode="default"
          locale={es}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDateClick}
          onDayMouseEnter={setHoverDate}
          onDayMouseLeave={() => setHoverDate(undefined)}
          className="pointer-events-auto"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
              "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            ),
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/10 border border-primary/20"></div>
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500/20"></div>
          <span className="text-muted-foreground">Pendiente de aprobación</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30"></div>
          <span className="text-muted-foreground">No disponible</span>
        </div>
      </div>

      {/* Mensaje de advertencia si hay fechas bloqueadas en el rango */}
      {startDate && hoverDate && !endDate && hasUnavailableDatesInRange(
        isBefore(startDate, hoverDate) ? startDate : hoverDate,
        isAfter(startDate, hoverDate) ? startDate : hoverDate
      ) && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          El rango seleccionado contiene fechas no disponibles o pendientes de aprobación
        </div>
      )}

      {/* Botón de confirmación */}
      {onConfirm && (
        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={!isRangeValid()}
        >
          Confirmar fechas
        </Button>
      )}
    </div>
  );
};