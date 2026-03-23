'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import Autocomplete from 'react-google-autocomplete';

interface GooglePlacesFieldProps {
  id: string;
  label: string;
  value: string | undefined | null;
  isEditing: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: React.ReactNode;
  /** Google Places autocomplete types (e.g., ['(cities)'], ['country']) */
  placeTypes: string[];
  /** address_component type to extract (e.g., 'locality', 'country') */
  extractType: string;
  /** Country restrictions for the autocomplete */
  componentRestrictions?: { country: string };
  /** Fields to request from the Places API */
  fields?: string[];
  labelClassName?: string;
}

const GooglePlacesField: React.FC<GooglePlacesFieldProps> = ({
  id,
  label,
  value,
  isEditing,
  onChange,
  placeholder,
  emptyText,
  placeTypes,
  extractType,
  componentRestrictions,
  fields = ['address_components', 'formatted_address'],
  labelClassName = 'block mb-1 text-xs font-medium text-gray-600',
}) => {
  const [inputValue, setInputValue] = useState(value || '');

  // Sync local state when the external value changes (e.g., on cancel/reset)
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const displayValue = () => {
    if (!value) {
      return emptyText || <span className="italic text-gray-500">{placeholder}</span>;
    }
    return value;
  };

  return (
    <div>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {isEditing ? (
        <Autocomplete
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
          id={id}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.target.value);
          }}
          onPlaceSelected={(place) => {
            if (!place || !place.address_components) {
              onChange(inputValue);
              return;
            }
            const component = place.address_components.find(
              (c) => c.types.includes(extractType)
            );
            const selected = component?.long_name || place.formatted_address || inputValue;
            onChange(selected);
            setInputValue(selected);
          }}
          onBlur={() => {
            if (inputValue !== (value || '')) {
              setInputValue(value || '');
            }
          }}
          options={{
            types: placeTypes,
            ...(componentRestrictions && { componentRestrictions }),
            fields,
          }}
          className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
          placeholder={placeholder}
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium mt-0.5">{displayValue()}</p>
      )}
    </div>
  );
};

export default GooglePlacesField;
