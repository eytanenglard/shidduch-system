// src/app/components/matchmaker/suggestions/NewSuggestionForm/CandidateSelector.tsx

import React, { useState, useCallback, KeyboardEvent } from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  User,
  Crown,
  Star,
  Heart,
  Sparkles,
  MapPin,
  Award,
  Zap,
  Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  calculateAge,
  cn,
  getRelativeCloudinaryPath,
  getInitials,
} from '@/lib/utils';
import type { Candidate } from '../../new/types/candidates';
import { toast } from 'sonner';

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

const EnhancedCandidateCard: React.FC<{
  candidate: Candidate;
  onClick: () => void;
  isActive: boolean;
  isBlocked: boolean;
}> = ({ candidate, onClick, isActive, isBlocked }) => {
  const age = calculateAge(new Date(candidate.profile.birthDate));
  const mainImage = candidate.images.find((img) => img.isMain)?.url;

  const getStatusInfo = () => {
    if (isBlocked) {
      return {
        icon: Shield,
        label: 'חסום',
        className:
          'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse',
        description: `בהצעה פעילה עם ${candidate.suggestionStatus?.withCandidateName}`,
      };
    }

    if (candidate.suggestionStatus?.status === 'PENDING') {
      return {
        icon: Clock,
        label: 'ממתין',
        className: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
        description: `הצעה ממתינה עם ${candidate.suggestionStatus.withCandidateName}`,
      };
    }

    return {
      icon: Star,
      label: 'זמין',
      className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      description: 'זמין להצעה חדשה',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer',
        'bg-gradient-to-br from-white via-gray-50/30 to-white border-2 shadow-lg hover:shadow-2xl',
        isActive && 'ring-4 ring-purple-500 ring-opacity-50 border-purple-300',
        isBlocked && 'opacity-60 cursor-not-allowed',
        !isBlocked && 'hover:scale-105 hover:border-purple-300'
      )}
      onClick={!isBlocked ? onClick : undefined}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      </div>

      <div className="relative z-10 p-4 space-y-4">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <Badge className={cn('shadow-lg font-bold', statusInfo.className)}>
            <StatusIcon className="w-3 h-3 ml-1" />
            {statusInfo.label}
          </Badge>

          {candidate.profile.religiousLevel && (
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
              <Crown className="w-3 h-3 ml-1" />
              {candidate.profile.religiousLevel}
            </Badge>
          )}
        </div>

        {/* Profile section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16 border-4 border-white shadow-xl ring-2 ring-purple-200 group-hover:ring-purple-400 transition-all duration-300">
              {mainImage ? (
                <AvatarImage
                  src={getRelativeCloudinaryPath(mainImage)}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                  {getInitials(`${candidate.firstName} ${candidate.lastName}`)}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-400 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors">
              {candidate.firstName} {candidate.lastName}
            </h3>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <User className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{age} שנים</span>
              </div>

              {candidate.profile.city && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="truncate">{candidate.profile.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {candidate.profile.occupation && (
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 shadow-sm">
              <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-700 truncate">
                {candidate.profile.occupation}
              </span>
            </div>
          )}

          {candidate.profile.education && (
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-medium text-purple-700 truncate">
                {candidate.profile.education}
              </span>
            </div>
          )}
        </div>

        {/* Status description */}
        {isBlocked && (
          <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">לא ניתן לבחור</p>
                <p className="text-xs">{statusInfo.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

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
  const [inputValue, setInputValue] = useState('');
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
      candidate.profile.city ? `, ${candidate.profile.city}` : ''
    }`;
  }, []);

  const handleSelect = useCallback(
    (candidate: Candidate) => {
      if (candidate.suggestionStatus?.status === 'BLOCKED') {
        toast.error('לא ניתן לבחור מועמד זה', {
          description: `${candidate.firstName} ${candidate.lastName} כבר נמצא/ת בהצעה פעילה עם ${candidate.suggestionStatus.withCandidateName}.`,
        });
        return;
      }

      onChange(candidate);
      setOpen(false);
      setInputValue('');
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredCandidates.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredCandidates.length) {
          handleSelect(filteredCandidates[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Enhanced Label */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <User className="w-5 h-5" />
          </div>
          <label className="text-lg font-bold text-gray-800">{label}</label>
        </div>

        {/* Enhanced Search Input */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                <Input
                  value={value ? formatCandidateDisplay(value) : inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (!open) setOpen(true);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onClick={() => !open && setOpen(true)}
                  placeholder="חפש/י מועמד/ת..."
                  className={cn(
                    'h-14 pr-14 text-right text-lg border-2 transition-all duration-300 rounded-2xl shadow-lg',
                    'bg-white/80 backdrop-blur-sm',
                    'border-purple-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200',
                    'placeholder:text-gray-400',
                    error &&
                      'border-red-300 focus:border-red-500 focus:ring-red-200'
                  )}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="candidate-listbox"
                  aria-activedescendant={
                    activeIndex >= 0
                      ? `candidate-${filteredCandidates[activeIndex]?.id}`
                      : undefined
                  }
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
              </div>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="p-0 w-[500px] border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm"
            align="start"
            side="bottom"
            sideOffset={8}
          >
            <Command shouldFilter={false}>
              <div className="relative">
                <CommandInput
                  placeholder="חיפוש מועמדים..."
                  value={inputValue}
                  onValueChange={setInputValue}
                  className="h-12 border-0 text-right text-lg bg-gradient-to-r from-purple-50 to-pink-50"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-purple-400" />
                </div>
              </div>

              <CommandList
                className="max-h-[400px] overflow-auto p-2"
                id="candidate-listbox"
                role="listbox"
              >
                {/* START: Manual rendering fix */}
                {filteredCandidates.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      לא נמצאו תוצאות
                    </h3>
                    <p className="text-gray-600">נסה לשנות את מונחי החיפוש</p>
                  </div>
                ) : (
                  <CommandGroup>
                    <div className="grid gap-3">
                      {filteredCandidates.map((candidate, index) => {
                        const isBlocked =
                          candidate.suggestionStatus?.status === 'BLOCKED';
                        return (
                          <EnhancedCandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            onClick={() => handleSelect(candidate)}
                            isActive={index === activeIndex}
                            isBlocked={isBlocked}
                          />
                        );
                      })}
                    </div>
                  </CommandGroup>
                )}
                {/* END: Manual rendering fix */}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Selected Candidate Display */}
      {value && (
        <Card className="mt-4 border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">
                  מועמד/ת נבחר/ת
                </h4>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300"
              >
                <Zap className="w-4 h-4 ml-1" />
                הסר בחירה
              </Button>
            </div>

            <EnhancedCandidateCard
              candidate={value}
              onClick={() => {}}
              isActive={true}
              isBlocked={false}
            />

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  /* Implement view profile handler */
                }}
                className="flex-1 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-300"
              >
                <User className="w-4 h-4 ml-2" />
                צפה בפרופיל מלא
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateSelector;
