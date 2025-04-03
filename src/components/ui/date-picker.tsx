import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  DateRange,
  SelectRangeEventHandler,
  SelectSingleEventHandler,
} from "react-day-picker";

interface DatePickerProps {
  value?: {
    from?: Date;
    to?: Date;
  };
  onChange?: (date: { from: Date | undefined; to: Date | undefined }) => void;
  isRange?: boolean;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  isRange = false,
  placeholder = "בחר תאריך",
  className,
}) => {
  const [date, setDate] = useState<DateRange | undefined>(
    value?.from
      ? {
          from: value.from,
          to: value.to,
        }
      : undefined
  );

  useEffect(() => {
    if (value?.from) {
      setDate({
        from: value.from,
        to: value.to,
      });
    } else {
      setDate(undefined);
    }
  }, [value]);

  const handleSelectSingle: SelectSingleEventHandler = (day) => {
    if (onChange) {
      onChange({ from: day, to: undefined });
    }
  };

  const handleSelectRange: SelectRangeEventHandler = (range) => {
    if (onChange) {
      onChange({
        from: range?.from,
        to: range?.to,
      });
    }
  };

  const formatDateRange = () => {
    if (!date?.from) return placeholder;

    if (isRange && date.to) {
      return `${format(date.from, "dd/MM/yyyy", { locale: he })} - ${format(
        date.to,
        "dd/MM/yyyy",
        { locale: he }
      )}`;
    }

    return format(date.from, "dd/MM/yyyy", { locale: he });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-right direction-rtl",
            !date?.from && "text-gray-400",
            className
          )}
        >
          <span>{formatDateRange()}</span>
          <CalendarIcon className="h-4 w-4 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {isRange ? (
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelectRange}
            numberOfMonths={2}
            locale={he}
            className="rounded-md border"
          />
        ) : (
          <Calendar
            mode="single"
            defaultMonth={date?.from}
            selected={date?.from}
            onSelect={handleSelectSingle}
            locale={he}
            className="rounded-md border"
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
