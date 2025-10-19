import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthRange {
  startMonth: { month: number; year: number } | null;
  endMonth: { month: number; year: number } | null;
}

interface MonthRangePickerProps {
  value: MonthRange;
  onChange: (range: MonthRange) => void;
  className?: string;
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const MONTHS_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function MonthRangePicker({
  value,
  onChange,
  className = "",
}: MonthRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth();
  const currentYearNow = new Date().getFullYear();

  const handleMonthClick = (month: number, year: number) => {
    // No permitir meses pasados
    if (year < currentYearNow || (year === currentYearNow && month < currentMonth)) {
      return;
    }

    if (!value.startMonth) {
      // Primera selección
      onChange({
        startMonth: { month, year },
        endMonth: null,
      });
    } else if (!value.endMonth) {
      // Segunda selección
      const start = value.startMonth;
      const startTime = new Date(start.year, start.month).getTime();
      const endTime = new Date(year, month).getTime();

      if (endTime < startTime) {
        // Si se selecciona un mes anterior, intercambiar
        onChange({
          startMonth: { month, year },
          endMonth: start,
        });
      } else {
        onChange({
          startMonth: start,
          endMonth: { month, year },
        });
      }
    } else {
      // Reiniciar selección
      onChange({
        startMonth: { month, year },
        endMonth: null,
      });
    }
  };

  const handleConfirm = () => {
    if (value.startMonth && value.endMonth) {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange({
      startMonth: null,
      endMonth: null,
    });
  };

  const isMonthInRange = (month: number, year: number): boolean => {
    if (!value.startMonth || !value.endMonth) return false;
    
    const time = new Date(year, month).getTime();
    const startTime = new Date(value.startMonth.year, value.startMonth.month).getTime();
    const endTime = new Date(value.endMonth.year, value.endMonth.month).getTime();
    
    return time >= startTime && time <= endTime;
  };

  const isMonthDisabled = (month: number, year: number): boolean => {
    return year < currentYearNow || (year === currentYearNow && month < currentMonth);
  };

  const displayText = value.startMonth && value.endMonth
    ? `${MONTHS_FULL[value.startMonth.month]} ${value.startMonth.year} – ${MONTHS_FULL[value.endMonth.month]} ${value.endMonth.year}`
    : value.startMonth
    ? `${MONTHS_FULL[value.startMonth.month]} ${value.startMonth.year} (selecciona mes final)`
    : "Selecciona meses";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-12 px-3",
            !value.startMonth && "text-muted-foreground",
            className
          )}
          type="button"
        >
          <Calendar className="mr-2 h-5 w-5" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{currentYear}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {MONTHS.map((monthName, index) => {
              const isStart = value.startMonth?.month === index && value.startMonth?.year === currentYear;
              const isEnd = value.endMonth?.month === index && value.endMonth?.year === currentYear;
              const inRange = isMonthInRange(index, currentYear);
              const disabled = isMonthDisabled(index, currentYear);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleMonthClick(index, currentYear)}
                  disabled={disabled}
                  className={cn(
                    "py-2 px-3 text-sm rounded-md transition-colors",
                    disabled && "opacity-40 cursor-not-allowed",
                    !disabled && !isStart && !isEnd && !inRange && "hover:bg-secondary",
                    (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary/90",
                    inRange && !isStart && !isEnd && "bg-primary/20 hover:bg-primary/30"
                  )}
                >
                  {monthName}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
              type="button"
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!value.startMonth || !value.endMonth}
              className="flex-1"
              type="button"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
