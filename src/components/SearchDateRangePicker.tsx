import { useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/DateRangePicker";
import { cn } from "@/lib/utils";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface SearchDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function SearchDateRangePicker({
  value,
  onChange,
  className = "",
}: SearchDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = (range: DateRange) => {
    onChange(range);
    setIsOpen(false);
  };

  const displayText = value.startDate && value.endDate
    ? `${format(value.startDate, "dd/MM/yyyy", { locale: es })} – ${format(value.endDate, "dd/MM/yyyy", { locale: es })}`
    : "Selecciona fechas";

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
          <Calendar className="mr-2 h-5 w-5" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DateRangePicker
          value={value}
          onChange={handleConfirm}
          minDate={new Date()}
          unavailableDates={[]}
          pendingDates={[]}
        />
      </PopoverContent>
    </Popover>
  );
}
