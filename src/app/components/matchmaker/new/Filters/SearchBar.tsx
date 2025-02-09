// /components/matchmaker/Filters/SearchBar.tsx
"use client";
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Candidate } from "../types/candidates";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (candidate: Candidate) => void;
  recentSearches?: string[];
  suggestions?: Candidate[];
  loading?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSelect,
  recentSearches = [],
  suggestions = [],
  loading = false,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => setOpen(true)}
          placeholder="חיפוש מועמדים..."
          className="pl-10 text-right pr-10"
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="הקלד לחיפוש..." />
          <CommandList>
            <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
            {recentSearches.length > 0 && (
              <CommandGroup heading="חיפושים אחרונים">
                {recentSearches.map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      onChange(search);
                      setOpen(false);
                    }}
                    className="text-right"
                  >
                    {search}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading="הצעות">
                {suggestions.map((candidate) => (
                  <CommandItem
                    key={candidate.id}
                    onSelect={() => {
                      onSelect?.(candidate);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 text-right"
                  >
                    <div className="flex-1">
                      <div>{`${candidate.firstName} ${candidate.lastName}`}</div>
                      <div className="text-sm text-gray-500">
                        {candidate.profile.city &&
                          `${candidate.profile.city}, `}
                        {candidate.profile.occupation}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
};

export default SearchBar;
