import { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import type { Candidate, CandidatesFilter } from '../types/candidates';
import type { CandidateProfile } from '../types/candidates';
import { Dispatch, SetStateAction } from 'react';

export interface UseCandidatesReturn {
  loading: boolean;
  error: string | null;
  candidates: Candidate[];
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  filteredCandidates: Candidate[];
  filters: CandidatesFilter;
  setFilters: Dispatch<SetStateAction<CandidatesFilter>>;
  refresh: () => Promise<void>;
  totalCount: number;
  filteredCount: number;
  maleCount: number;
  femaleCount: number;
  searchResults: {
    term: string;
    count: number;
    male: number;
    female: number;
  } | null;
  exportCandidates: (candidates: Candidate[], filters: CandidatesFilter) => Promise<void>;
  updateCandidate: (id: string, updates: Partial<CandidateProfile>) => Promise<void>;
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  setSorting: (field: string, direction: 'asc' | 'desc') => void;
  searchSuggestions: (term: string) => Promise<Candidate[]>;
}

interface CandidateWithSearchScore extends Candidate {
  _searchScore?: number;
}
export const useCandidates = (initialFilters: CandidatesFilter = {}): UseCandidatesReturn => {
  // Base states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidatesFilter>(initialFilters);
  const [searchResults, setSearchResults] = useState<{
    term: string;
    count: number;
    male: number;
    female: number;
  } | null>(null);
  const [sorting, setSortingState] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>({
    field: 'lastActive',
    direction: 'desc',
  });

  // Helper function to calculate age
  const calculateAge = useCallback((birthDate: Date): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Fetch candidates data
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/matchmaker/clients');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
     
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load candidates');
      }
  
      setCandidates(data.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set sorting field and direction
  const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortingState({ field, direction });
  }, []);

  // Search suggestions based on a term
  const searchSuggestions = useCallback(async (term: string): Promise<Candidate[]> => {
    if (!term || term.length < 2) return [];
    
    // Local search implementation for quick response
    const searchTerm = term.toLowerCase();
    return candidates.filter(candidate => {
      const searchableText = `
        ${candidate.firstName} 
        ${candidate.lastName} 
        ${candidate.profile.occupation || ''} 
        ${candidate.profile.city || ''}
        ${candidate.profile.religiousLevel || ''}
      `.toLowerCase();
      
      return searchableText.includes(searchTerm);
    }).slice(0, 10);
    
    // Alternatively, you can implement an API call for server-side search
    // if the dataset is very large
  }, [candidates]);

  const sortCandidates = useCallback((candidatesList: Candidate[], field: string, direction: 'asc' | 'desc') => {
    return [...candidatesList].sort((a, b) => {
      let valueA, valueB;
      
      switch (field) {
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'age':
          valueA = calculateAge(a.profile.birthDate);
          valueB = calculateAge(b.profile.birthDate);
          break;
        case 'city':
          valueA = (a.profile.city || '').toLowerCase();
          valueB = (b.profile.city || '').toLowerCase();
          break;
        case 'religiousLevel':
          valueA = (a.profile.religiousLevel || '').toLowerCase();
          valueB = (b.profile.religiousLevel || '').toLowerCase();
          break;
        case 'lastActive':
          valueA = a.profile.lastActive ? new Date(a.profile.lastActive).getTime() : 0;
          valueB = b.profile.lastActive ? new Date(b.profile.lastActive).getTime() : 0;
          break;
        case 'registrationDate':
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
        case 'height':
          valueA = a.profile.height || 0;
          valueB = b.profile.height || 0;
          break;
        default:
          valueA = 0;
          valueB = 0;
      }
      
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [calculateAge]);
  
  // Filter candidates based on current filters
  const filteredCandidates = useMemo(() => {
    let results = candidates.filter(candidate => {
      // Gender filter
      if (filters.gender && candidate.profile.gender !== filters.gender) {
        return false;
      }

      // Age filter
      if (filters.ageRange) {
        const age = calculateAge(candidate.profile.birthDate)
        if (age < filters.ageRange.min || age > filters.ageRange.max) {
          return false;
        }
      }

      // Height filter
      if (filters.heightRange && candidate.profile.height) {
        if (
          candidate.profile.height < filters.heightRange.min || 
          candidate.profile.height > filters.heightRange.max
        ) {
          return false;
        }
      }

      // Religious level filter
      if (filters.religiousLevel && candidate.profile.religiousLevel !== filters.religiousLevel) {
        return false;
      }

      // Cities filter
      if (filters.cities?.length && candidate.profile.city) {
        if (!filters.cities.includes(candidate.profile.city)) {
          return false;
        }
      }

      // Occupations filter
      if (filters.occupations?.length && candidate.profile.occupation) {
        if (!filters.occupations.includes(candidate.profile.occupation)) {
          return false;
        }
      }

      // Education level filter
      if (filters.educationLevel && candidate.profile.education !== filters.educationLevel) {
        return false;
      }

      // Marital status filter
      if (filters.maritalStatus && candidate.profile.maritalStatus !== filters.maritalStatus) {
        return false;
      }

      // Availability status filter
      if (filters.availabilityStatus && 
          candidate.profile.availabilityStatus !== filters.availabilityStatus) {
        return false;
      }

      // Verification filter
      if (filters.isVerified !== undefined && candidate.isVerified !== filters.isVerified) {
        return false;
      }

      // References filter
      if (filters.hasReferences && 
          !candidate.profile.referenceName1 && 
          !candidate.profile.referenceName2) {
        return false;
      }

      // Last active days filter
      if (filters.lastActiveDays && candidate.profile.lastActive) {
        const lastActive = new Date(candidate.profile.lastActive);
        const daysDiff = (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > filters.lastActiveDays) {
          return false;
        }
      }

      // Profile completeness filter
      if (filters.isProfileComplete !== undefined && 
          candidate.isProfileComplete !== filters.isProfileComplete) {
        return false;
      }

      // Search query filter - enhanced with highlighting and better matching
// Search query filter - with improved handling
if (filters.searchQuery) {
  // טיפול טוב יותר במחרוזת החיפוש - הסרת רווחים מיותרים 
  const searchTerm = (filters.searchQuery || '').trim().toLowerCase();
  
  // אם אין מחרוזת חיפוש אחרי הטיפול, לא נסנן
  if (!searchTerm) {
    // חשוב: אם מחרוזת החיפוש ריקה, נחזיר true כדי לא לסנן
    return true;
  }
  
  // חיפוש פשוט יותר שיעבוד בוודאות - בודק אם המחרוזת נמצאת בשדות העיקריים
  const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
  const city = (candidate.profile.city || '').toLowerCase();
  const occupation = (candidate.profile.occupation || '').toLowerCase();
  const religiousLevel = (candidate.profile.religiousLevel || '').toLowerCase();
  
  // בדיקה אם המחרוזת מופיעה באחד השדות החשובים
  if (fullName.includes(searchTerm) || 
      city.includes(searchTerm) || 
      occupation.includes(searchTerm) || 
      religiousLevel.includes(searchTerm)) {
    // החיפוש מוצלח - לא צריך להוסיף ניקוד מורכב בשלב זה
    return true;
  }
  
  // אם הגענו לכאן, לא מצאנו התאמה
  return false;
}

      return true;
    });

    // Sort results
    if (filters.searchQuery) {
      // Sort by search relevance if search query exists
      results = results.sort((a, b) => {
        return ((b as CandidateWithSearchScore)._searchScore || 0) - 
               ((a as CandidateWithSearchScore)._searchScore || 0);
      });
      // Update search results stats
      const maleResults = results.filter(c => c.profile.gender === 'MALE').length;
      const femaleResults = results.filter(c => c.profile.gender === 'FEMALE').length;
      
      setSearchResults({
        term: filters.searchQuery,
        count: results.length,
        male: maleResults,
        female: femaleResults
      });
    } else {
      // Otherwise sort by selected field
      results = sortCandidates(results, sorting.field, sorting.direction);
      setSearchResults(null);
    }

    return results;
  }, [candidates, filters, calculateAge, sorting.field, sorting.direction, sortCandidates]);

  


  // Split candidates by gender
  const maleCandidates = useMemo(() => 
    filteredCandidates.filter(c => c.profile.gender === 'MALE'),
    [filteredCandidates]
  );

  const femaleCandidates = useMemo(() => 
    filteredCandidates.filter(c => c.profile.gender === 'FEMALE'),
    [filteredCandidates]
  );

  // Export candidates to CSV
  const exportCandidates = async (
    candidates: Candidate[], 
    filters: CandidatesFilter
  ): Promise<void> => {
    try {
      // Prepare data for export
      const exportData = candidates.map(candidate => ({
        'שם פרטי': candidate.firstName,
        'שם משפחה': candidate.lastName,
        'גיל': calculateAge(candidate.profile.birthDate),
        'מגדר': candidate.profile.gender === 'MALE' ? 'זכר' : 'נקבה',
        'עיר': candidate.profile.city || '',
        'גובה': candidate.profile.height || '',
        'רמת דתיות': candidate.profile.religiousLevel || '',
        'תעסוקה': candidate.profile.occupation || '',
        'השכלה': candidate.profile.education || '',
        'מצב משפחתי': candidate.profile.maritalStatus || '',
        'סטטוס זמינות': candidate.profile.availabilityStatus || '',
        'מאומת': candidate.isVerified ? 'כן' : 'לא',
        'פעילות אחרונה': candidate.profile.lastActive 
          ? new Date(candidate.profile.lastActive).toLocaleDateString('he-IL')
          : ''
      }));

      // Add filter info to filename
      const filenameSegments = ['candidates'];
      
      if (filters.gender) {
        filenameSegments.push(filters.gender === 'MALE' ? 'male' : 'female');
      }
      
      if (filters.religiousLevel) {
        filenameSegments.push(filters.religiousLevel.replace(/ /g, '-'));
      }
      
      if (filters.cities?.length === 1) {
        filenameSegments.push(filters.cities[0].replace(/ /g, '-'));
      }
      
      // Convert to CSV
      const csv = Papa.unparse(exportData);
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filenameSegments.join('_')}_${timestamp}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting candidates:', error);
      throw new Error('Failed to export candidates');
    }
  };

  // Update candidate
  const updateCandidate = async (
    id: string, 
    updates: Partial<CandidateProfile>
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/matchmaker/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update candidate');
      }
      
      // Refresh candidates list after update
      await fetchCandidates();
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  };

  // Load candidates on mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  // Return interface
  return {
    loading,
    error,
    candidates,
    filteredCandidates,
    maleCandidates,
    femaleCandidates,
    filters,
    setFilters,
    refresh: fetchCandidates,
    totalCount: candidates.length,
    filteredCount: filteredCandidates.length,
    maleCount: maleCandidates.length,
    femaleCount: femaleCandidates.length,
    searchResults,
    exportCandidates,
    updateCandidate,
    sorting,
    setSorting,
    searchSuggestions
  };
};

export default useCandidates;