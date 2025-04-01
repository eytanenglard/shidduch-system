// /Filters/SearchBar.tsx - גרסה עם לוגים לדיבאג
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "../types/candidates";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (candidate: Candidate) => void;
  recentSearches?: string[];
  onSaveSearch?: (value: string) => void;
  onClearRecentSearches?: () => void;
  suggestions?: Candidate[];
  loading?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  // הוספת שדה לציון לאיזה מגדר החיפוש מכוון
  genderTarget?: "male" | "female" | "all";
  // הוספת שדה לציון האם החיפוש מופעל במצב נפרד
  separateMode?: boolean;
}

const SEARCH_CATEGORIES = [
  { id: "name", label: "שם", placeholder: "חיפוש לפי שם..." },
  { id: "city", label: "עיר", placeholder: "חיפוש לפי עיר..." },
  {
    id: "occupation",
    label: "תחום עיסוק",
    placeholder: "חיפוש לפי תחום עיסוק...",
  },
  { id: "all", label: "הכל", placeholder: "חיפוש בכל השדות..." },
];

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSelect,
  recentSearches = [],
  onSaveSearch,
  onClearRecentSearches,
  suggestions = [],
  loading = false,
  className = "",
  placeholder = "חיפוש מועמדים...",
  autoFocus = false,
  genderTarget = "all",
  separateMode = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [inputValue, setInputValue] = useState(value);
  const [showClearButton, setShowClearButton] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // לוג מצב התחלתי
  console.log("SearchBar mounted/updated. Props:", {
    initialValue: value,
    suggestionsCount: suggestions.length,
    recentSearchesCount: recentSearches.length,
  });

  // Sync input value with prop value
  useEffect(() => {
    console.log("Value prop changed:", value);
    setInputValue(value);
    setShowClearButton(Boolean(value));
  }, [value]);

  // Handle search when user presses Enter or selects a suggestion
  const handleSearch = (searchValue: string) => {
    console.log(
      `handleSearch called with: ${searchValue}, gender: ${genderTarget}, separate: ${separateMode}`
    );

    if (searchValue.trim()) {
      onChange(searchValue.trim());

      if (onSaveSearch) {
        // שמירת החיפוש בהיסטוריה
        // אפשר גם לשמור את המגדר אם יש צורך
        onSaveSearch(searchValue.trim());
      }
    }
  };
  // כשמשתמשים בחיפוש נפרד, נעדכן את הפלייסהולדר בהתאם
  const getSearchPlaceholder = () => {
    if (separateMode) {
      // מצא את ה-placeholder של הקטגוריה "all" או השתמש בברירת מחדל
      const allCategoryPlaceholder =
        SEARCH_CATEGORIES.find((cat) => cat.id === "all")?.placeholder ||
        "חיפוש בכל השדות...";

      if (genderTarget === "male") {
        return `חיפוש מועמדים - ${allCategoryPlaceholder}`;
      }
      if (genderTarget === "female") {
        return `חיפוש מועמדות - ${allCategoryPlaceholder}`;
      }
    }

    // אם לא במצב סינון נפרד, השתמש בקטגוריה הנוכחית שנבחרה
    const category = SEARCH_CATEGORIES.find((cat) => cat.id === searchCategory);
    return category?.placeholder || placeholder;
  };
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("handleInputChange:", { oldValue: inputValue, newValue });

    setInputValue(newValue);
    setShowClearButton(Boolean(newValue));

    // CRITICAL: הפעלת onChange בכל הקלדה כדי שהחיפוש יקרה בזמן אמת
    console.log(
      "Calling onChange directly from handleInputChange with:",
      newValue
    );
    onChange(newValue);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("handleKeyDown:", e.key);

    if (e.key === "Enter" && inputValue.trim()) {
      console.log("Enter pressed with value:", inputValue);
      handleSearch(inputValue);
      setOpen(false);
    } else if (e.key === "Escape") {
      console.log("Escape pressed, closing dropdown");
      setOpen(false);
    }
  };

  // Clear search input
  const handleClear = () => {
    console.log("handleClear called");
    setInputValue("");
    console.log("Calling onChange with empty string from handleClear");
    onChange("");
    setShowClearButton(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = (candidate: Candidate) => {
    console.log(
      "handleSuggestionSelect called with candidate:",
      `${candidate.firstName} ${candidate.lastName}`
    );

    if (onSelect) {
      console.log("Calling onSelect for the candidate");
      onSelect(candidate);
    } else {
      // אם אין פונקציית בחירה, התייחס לכך כחיפוש טקסט
      const searchText = `${candidate.firstName} ${candidate.lastName}`;
      console.log("No onSelect provided, using as text search:", searchText);
      setInputValue(searchText);
      console.log("Calling onChange with:", searchText);
      onChange(searchText);
    }
    setOpen(false);
  };

  // Get current placeholder based on selected category
  const getCurrentPlaceholder = () => {
    const category = SEARCH_CATEGORIES.find((cat) => cat.id === searchCategory);
    return category?.placeholder || placeholder;
  };

  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      {/* Search Input Field */}
      <div className="relative flex items-center rounded-lg border border-input bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-blue-200">
        <Search className="absolute right-3 h-4 w-4 text-muted-foreground" />

        {/* הכנסת שדה הקלט */}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => {
            console.log("Search input clicked, opening dropdown");
            setOpen(true);
          }}
          placeholder={getSearchPlaceholder()}
          className={`border-0 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            separateMode ? "pl-16" : ""
          }`}
          autoFocus={autoFocus}
        />

        {/* תווית המגדר כתווית קבועה שלא חופפת את יתר האלמנטים */}
        {separateMode && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Badge
              variant="outline"
              className={
                genderTarget === "male"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : genderTarget === "female"
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : ""
              }
            >
              {genderTarget === "male"
                ? "מועמדים"
                : genderTarget === "female"
                ? "מועמדות"
                : "הכל"}
            </Badge>
          </div>
        )}

        {/* כפתור ניקוי עם מיקום משופר */}
        {showClearButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className={`absolute ${
              separateMode ? "left-16" : "left-3 md:left-40"
            } top-1/2 -translate-y-1/2 h-7 w-7 z-10`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown - Custom Styled */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {/* Search Input for Filtering */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Dropdown filter input changed:", {
                    oldValue: inputValue,
                    newValue,
                  });
                  setInputValue(newValue);

                  // CRITICAL: וודא שהערך מועבר להורה בזמן הקלדה
                  console.log(
                    "Calling onChange from dropdown filter with:",
                    newValue
                  );
                  onChange(newValue);
                }}
                className="w-full border rounded-md px-3 pr-9 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                placeholder="סנן תוצאות..."
                autoFocus
              />
            </div>
          </div>

          {/* No Results */}
          {suggestions.length === 0 && recentSearches.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              {loading ? "טוען..." : "לא נמצאו תוצאות"}
            </div>
          )}

          {/* Recent Searches Section */}
          {recentSearches.length > 0 && (
            <div className="border-b">
              <div className="px-2 py-1.5 text-xs text-gray-500 flex justify-between">
                <span className="font-medium">חיפושים אחרונים</span>
                {onClearRecentSearches && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Clear recent searches clicked");
                      onClearRecentSearches();
                    }}
                  >
                    נקה היסטוריה
                  </Button>
                )}
              </div>
              <div className="p-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <div
                    key={`recent-${index}`}
                    className="flex items-center gap-2 text-right px-3 py-1.5 hover:bg-blue-50 rounded-md cursor-pointer"
                    onClick={() => {
                      console.log("Recent search clicked:", search);
                      handleSearch(search);
                      setOpen(false);
                    }}
                  >
                    <History className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">{search}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          {suggestions.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">
                תוצאות
              </div>
              <div className="p-1">
                {suggestions.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center gap-2 text-right px-3 py-2 hover:bg-blue-50 rounded-md cursor-pointer"
                    onClick={() => {
                      console.log(
                        "Suggestion clicked:",
                        `${candidate.firstName} ${candidate.lastName}`
                      );
                      handleSuggestionSelect(candidate);
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {`${candidate.firstName} ${candidate.lastName}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {[
                          candidate.profile.city,
                          candidate.profile.occupation,
                          candidate.profile.religiousLevel,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Search Categories on Mobile */}
          <div className="md:hidden border-t">
            <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">
              חפש לפי
            </div>
            <div className="flex flex-wrap gap-1 p-2">
              {SEARCH_CATEGORIES.map((category) => (
                <Badge
                  key={category.id}
                  variant={
                    searchCategory === category.id ? "default" : "outline"
                  }
                  className={`cursor-pointer ${
                    searchCategory === category.id
                      ? "bg-blue-500 text-white"
                      : "bg-transparent hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    console.log("Mobile category changed to:", category.id);
                    setSearchCategory(category.id);
                  }}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
