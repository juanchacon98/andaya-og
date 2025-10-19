import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { format, addDays, isSameDay, isWithinInterval, isBefore, isAfter, startOfDay, addHours, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "sonner";

dayjs.extend(utc);
dayjs.extend(timezone);

interface DateTimeRange {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}

interface SearchDateRangePickerProps {
  value: DateTimeRange;
  onChange: (range: DateTimeRange) => void;
  className?: string;
}

// Generar intervalos de 30 minutos
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function SearchDateRangePicker({
  value,
  onChange,
  className = "",
}: SearchDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(value.startDate || undefined);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(value.endDate || undefined);
  const [tempStartTime, setTempStartTime] = useState(value.startTime || "10:00");
  const [tempEndTime, setTempEndTime] = useState(value.endTime || "18:00");
  const [hoverDate, setHoverDate] = useState<Date | undefined>();

  const handleDateClick = (date: Date) => {
    const normalizedDate = startOfDay(date);
    
    // Si no hay fecha de inicio, establecerla
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(normalizedDate);
      setTempEndDate(undefined);
      return;
    }

    // Si ya hay fecha de inicio, establecer fecha de fin
    if (tempStartDate && !tempEndDate) {
      // Permitir seleccionar la misma fecha
      if (isSameDay(normalizedDate, tempStartDate)) {
        setTempEndDate(normalizedDate);
        return;
      }
      
      // Si la fecha clickeada es anterior a tempStartDate, intercambiar
      if (isBefore(normalizedDate, tempStartDate)) {
        setTempEndDate(tempStartDate);
        setTempStartDate(normalizedDate);
      } else {
        setTempEndDate(normalizedDate);
      }
    }
  };

  const validateRange = (): boolean => {
    if (!tempStartDate || !tempEndDate) {
      toast.error("Selecciona fecha de inicio y fin");
      return false;
    }

    const startDateTime = dayjs.tz(
      `${format(tempStartDate, 'yyyy-MM-dd')} ${tempStartTime}`,
      'America/Caracas'
    );
    const endDateTime = dayjs.tz(
      `${format(tempEndDate, 'yyyy-MM-dd')} ${tempEndTime}`,
      'America/Caracas'
    );
    const now = dayjs.tz(new Date(), 'America/Caracas');

    // Lead time mínimo: 4 horas
    const minLeadTime = now.add(4, 'hours');
    if (startDateTime.isBefore(minLeadTime)) {
      toast.error("La reserva debe ser al menos 4 horas en el futuro");
      return false;
    }

    // Duración mínima: 24 horas
    const durationHours = endDateTime.diff(startDateTime, 'hours', true);
    if (durationHours < 24) {
      toast.error("La duración mínima es de 24 horas");
      return false;
    }

    // Validar que endDateTime > startDateTime
    if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
      toast.error("La devolución debe ser después del retiro");
      return false;
    }

    return true;
  };

  const handleApply = () => {
    if (!validateRange()) return;

    onChange({
      startDate: tempStartDate,
      endDate: tempEndDate,
      startTime: tempStartTime,
      endTime: tempEndTime,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setTempStartTime("10:00");
    setTempEndTime("18:00");
    onChange({
      startDate: null,
      endDate: null,
      startTime: "10:00",
      endTime: "18:00",
    });
  };

  const handlePreset = (type: 'weekend' | '3days' | 'week') => {
    const now = dayjs.tz(new Date(), 'America/Caracas');
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;

    switch (type) {
      case 'weekend':
        // Próximo viernes a las 10:00
        const daysUntilFriday = (5 - now.day() + 7) % 7 || 7;
        start = now.add(daysUntilFriday, 'days').hour(10).minute(0);
        end = start.add(2, 'days').hour(18).minute(0); // Domingo 18:00
        break;
      case '3days':
        start = now.add(1, 'day').hour(10).minute(0);
        end = start.add(3, 'days').hour(18).minute(0);
        break;
      case 'week':
        start = now.add(1, 'day').hour(10).minute(0);
        end = start.add(7, 'days').hour(18).minute(0);
        break;
    }

    setTempStartDate(start.toDate());
    setTempEndDate(end.toDate());
    setTempStartTime(start.format('HH:mm'));
    setTempEndTime(end.format('HH:mm'));
  };

  const isInRange = (date: Date): boolean => {
    if (!tempStartDate || !tempEndDate) {
      if (tempStartDate && hoverDate && !tempEndDate) {
        const start = isBefore(tempStartDate, hoverDate) ? tempStartDate : hoverDate;
        const end = isAfter(tempStartDate, hoverDate) ? tempStartDate : hoverDate;
        try {
          return isWithinInterval(date, { start, end }) && !isSameDay(date, start) && !isSameDay(date, end);
        } catch {
          return false;
        }
      }
      return false;
    }

    try {
      return isWithinInterval(date, { start: tempStartDate, end: tempEndDate }) && 
             !isSameDay(date, tempStartDate) && 
             !isSameDay(date, tempEndDate);
    } catch {
      return false;
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    const normalizedDate = startOfDay(date);
    const today = startOfDay(new Date());
    return isBefore(normalizedDate, today);
  };

  const modifiers = {
    start: tempStartDate ? [tempStartDate] : [],
    end: tempEndDate ? [tempEndDate] : [],
    range: (date: Date) => isInRange(date),
    disabled: isDateDisabled,
  };

  const modifiersClassNames = {
    start: "bg-primary text-primary-foreground rounded-l-md hover:bg-primary hover:text-primary-foreground",
    end: "bg-primary text-primary-foreground rounded-r-md hover:bg-primary hover:text-primary-foreground",
    range: "bg-primary/10 text-foreground",
    disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
    today: "font-bold",
  };

  const displayText = value.startDate && value.endDate
    ? `${format(value.startDate, "d MMM", { locale: es })} ${value.startTime} → ${format(value.endDate, "d MMM", { locale: es })} ${value.endTime}`
    : "Selecciona fechas y horarios";

  const getInstructionText = (): string => {
    if (!tempStartDate) {
      return "Selecciona la fecha de retiro";
    }
    if (tempStartDate && !tempEndDate) {
      return "Selecciona la fecha de devolución";
    }
    return "Ajusta los horarios y confirma";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-12 px-3",
            !value.startDate && "text-muted-foreground",
            className
          )}
          type="button"
        >
          <Calendar className="mr-2 h-5 w-5 flex-shrink-0" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start" side="bottom">
        <div className="space-y-4">
          {/* Presets rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset('weekend')}
              className="text-xs"
            >
              Este fin de semana
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset('3days')}
              className="text-xs"
            >
              3 días
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset('week')}
              className="text-xs"
            >
              1 semana
            </Button>
          </div>

          {/* Instrucción */}
          <div className="text-sm font-medium text-center">
            {getInstructionText()}
          </div>

          {/* Calendario */}
          <div className="rounded-md border p-3">
            <DayPicker
              mode="default"
              locale={es}
              numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
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

          {/* Time pickers */}
          {tempStartDate && tempEndDate && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Retiro
                </label>
                <Select value={tempStartTime} onValueChange={setTempStartTime}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time} className="text-sm">
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Devolución
                </label>
                <Select value={tempEndTime} onValueChange={setTempEndTime}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time} className="text-sm">
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Limpiar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="flex-1"
              disabled={!tempStartDate || !tempEndDate}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
