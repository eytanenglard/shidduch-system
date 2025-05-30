// @/components/ui/date-picker.tsx (או הנתיב שלך)
"use client"; // אם רלוונטי לסביבה שלך

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale"; // Locale מ-date-fns
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // ודא שהנתיב נכון
import { Button } from "@/components/ui/button";
import { Calendar, CalendarProps } from "@/components/ui/calendar"; // CalendarProps הוא בעצם DayPickerProps
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  DateRange,
  SelectRangeEventHandler,
  SelectSingleEventHandler,
  // אין צורך לייבא טיפוסים נוספים מ-react-day-picker לצורך CommonOnlyCalendarProps בגישת ה-Pick
} from "react-day-picker";

interface DatePickerProps {
  value?: {
    from?: Date;
    to?: Date; // ישמש רק אם isRange=true
  };
  onChange?: (date: { from: Date | undefined; to: Date | undefined }) => void;
  isRange?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: CalendarProps["disabled"]; // CalendarProps["disabled"] הוא Matcher | Matcher[] | ...
}

// הגדרת טיפוס למאפיינים המשותפים באמצעות Pick
// נבחר במפורש את המאפיינים שאנו רוצים שיהיו חלק מ-commonCalendarProps.
// הבסיס הוא CalendarProps (שהוא DayPickerProps).
type CommonOnlyCalendarProps = Pick<
  CalendarProps,
  | "defaultMonth"
  | "locale"
  | "className" // className של הקומפוננטה הפנימית של react-day-picker
  | "classNames" // classNames של הקומפוננטה הפנימית
  | "captionLayout"
  | "fromYear"
  | "toYear"
  | "fromMonth"
  | "toMonth"
  | "fromDate"
  | "toDate"
  | "disabled"
  | "hidden"
  | "showOutsideDays"
  | "pagedNavigation"
  | "fixedWeeks"
  | "weekStartsOn"
  | "ISOWeek"
  // ניתן להוסיף עוד מאפיינים בסיסיים שתרצה להעביר דרך commonCalendarProps
  // כמו: 'modifiers', 'modifiersClassNames', 'formatters', 'labels' וכו'
  // הימנע מהוספת: 'mode', 'selected', 'onSelect', 'numberOfMonths', 'onDayClick'
  // שאותם אנו מגדירים בנפרד.
>;

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  isRange = false,
  placeholder = "בחר תאריך",
  className, // זהו ה-className שמועבר לרכיב ה-Button החיצוני
  disabled, // זהו ה-disabled שמועבר ל-Calendar הפנימי
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectSingle: SelectSingleEventHandler = (day) => {
    if (onChange) {
      onChange({ from: day, to: undefined });
    }
    if (day) {
      setIsOpen(false);
    }
  };

  const handleSelectRange: SelectRangeEventHandler = (range) => {
    if (onChange) {
      onChange({ from: range?.from, to: range?.to });
    }
  };

  const displayValue = useMemo(() => {
    const fromDate = value?.from;
    const toDate = value?.to;

    if (!fromDate) return placeholder;

    const formatStringSingle = "d בMMMM yyyy";
    const formatStringRange = "d MMM yy";

    if (isRange && toDate) {
      return `${format(fromDate, formatStringRange, { locale: he })} - ${format(
        toDate,
        formatStringRange,
        { locale: he }
      )}`;
    }
    return format(fromDate, formatStringSingle, { locale: he });
  }, [value, isRange, placeholder]);

  const currentYear = new Date().getFullYear();
  const fromYearDatePicker = currentYear - 120; // שינוי שם כדי למנוע התנגשות עם fromYear מ-props
  const toYearDatePicker = currentYear + 10; // שינוי שם

  // מאפיינים משותפים לשני מצבי ה-Calendar
  const commonCalendarProps: CommonOnlyCalendarProps = {
    defaultMonth: value?.from || new Date(),
    locale: he,
    className: "rounded-md border shadow-sm", // זה ה-className של Calendar הפנימי
    captionLayout: "dropdown",
    fromYear: fromYearDatePicker, // שימוש בשם המתוקן
    toYear: toYearDatePicker, // שימוש בשם המתוקן
    disabled: disabled, // ה-disabled prop שהועבר
    showOutsideDays: true,
    // אין צורך להגדיר את כל המאפיינים מ-CommonOnlyCalendarProps,
    // רק את אלו שאנו רוצים להעביר ערכים עבורם.
    // מאפיינים שלא יוגדרו כאן יקבלו את ערכי ברירת המחדל של react-day-picker
    // או שיהיו undefined.
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          dir="rtl"
          variant="outline"
          className={cn( // כאן משתמשים ב-className החיצוני שהועבר ל-DatePicker
            "w-full justify-between text-right font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <span>{displayValue}</span>
          <CalendarIcon className="mr-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir="rtl">
        {isRange ? (
          <Calendar
            mode="range"
            selected={value as DateRange | undefined}
            onSelect={handleSelectRange}
            numberOfMonths={2}
            {...commonCalendarProps}
          />
        ) : (
          <Calendar
            mode="single"
            selected={value?.from}
            onSelect={handleSelectSingle}
            numberOfMonths={1}
            {...commonCalendarProps}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};