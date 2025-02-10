import React, { useState, useCallback, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateAge } from "@/lib/utils";
import type { Candidate } from "../types/candidates";

interface CandidateSelectorProps {
  value: Candidate | null;
  onChange: (candidate: Candidate | null) => void;
  otherParty?: Candidate | null;
  label: string;
  candidates: Candidate[];
  className?: string;
  fieldName: string;
  error?: string;
}

const CandidateSelector: React.FC<CandidateSelectorProps> = ({
  value,
  onChange,
  otherParty,
  label,
  candidates,
  className,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredCandidates = candidates.filter((candidate) => {
    if (otherParty && candidate.id === otherParty.id) return false;

    if (inputValue) {
      const searchTerm = inputValue.toLowerCase();
      return (
        candidate.firstName.toLowerCase().includes(searchTerm) ||
        candidate.lastName.toLowerCase().includes(searchTerm) ||
        candidate.profile.city?.toLowerCase().includes(searchTerm) ||
        candidate.profile.occupation?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const formatCandidateDisplay = useCallback((candidate: Candidate) => {
    const age = calculateAge(new Date(candidate.profile.birthDate));
    return `${candidate.firstName} ${candidate.lastName}, ${age}${
      candidate.profile.city ? `, ${candidate.profile.city}` : ""
    }`;
  }, []);

  const handleSelect = useCallback(
    (candidate: Candidate) => {
      onChange(candidate);
      setOpen(false);
      setInputValue("");
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredCandidates.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredCandidates.length) {
          handleSelect(filteredCandidates[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={value ? formatCandidateDisplay(value) : inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (!open) setOpen(true);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onClick={() => !open && setOpen(true)}
                placeholder="בחר/י מועמד/ת..."
                className="pl-10 text-right cursor-pointer"
                role="combobox"
                aria-expanded={open}
                aria-controls="candidate-listbox"
                aria-activedescendant={
                  activeIndex >= 0
                    ? `candidate-${filteredCandidates[activeIndex]?.id}`
                    : undefined
                }
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[400px]"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="חיפוש מועמדים..."
                value={inputValue}
                onValueChange={(value) => {
                  setInputValue(value);
                  setActiveIndex(-1);
                }}
              />
              <CommandList
                className="max-h-[300px] overflow-auto"
                id="candidate-listbox"
                role="listbox"
              >
                <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
                <CommandGroup>
                  {filteredCandidates.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      onClick={() => handleSelect(candidate)}
                      className={`flex items-center gap-2 text-right p-2 hover:bg-accent/50 cursor-pointer ${
                        index === activeIndex ? "bg-accent" : ""
                      }`}
                      role="option"
                      id={`candidate-${candidate.id}`}
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatCandidateDisplay(candidate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.profile.religiousLevel} |
                          {candidate.profile.occupation &&
                            ` ${candidate.profile.occupation} |`}
                          {candidate.profile.education &&
                            ` ${candidate.profile.education}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {value && (
        <Card className="mt-2 p-4">
          <div className="flex justify-between items-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                /* Add view profile handler */
              }}
              className="text-primary"
            >
              צפה בפרופיל מלא
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="text-destructive"
            >
              הסר בחירה
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CandidateSelector;
