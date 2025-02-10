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
  filters: CandidatesFilter;
  setFilters: Dispatch<SetStateAction<CandidatesFilter>>;
  refresh: () => Promise<void>;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  exportCandidates: (candidates: Candidate[], filters: CandidatesFilter) => Promise<void>;
  updateCandidate: (id: string, updates: Partial<CandidateProfile>) => Promise<void>;
}

export const useCandidates = (): UseCandidatesReturn => {
  // Base states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidatesFilter>({});

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

  // Filter candidates based on current filters
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Gender filter
      if (filters.gender && candidate.profile.gender !== filters.gender) {
        return false;
      }

      // Age filter
      if (filters.ageRange) {
        const age = calculateAge(candidate.profile.birthDate )
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

      // Search query filter
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.toLowerCase();
        const searchableText = `
          ${candidate.firstName} 
          ${candidate.lastName} 
          ${candidate.profile.occupation || ''} 
          ${candidate.profile.city || ''}
          ${candidate.profile.religiousLevel || ''}
          ${candidate.profile.about || ''}
        `.toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, filters, calculateAge]);

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
        'פעילות אחרונה': candidate.profile.lastActive || ''
      }));

      // Convert to CSV
      const csv = Papa.unparse(exportData);
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `candidates_export_${new Date().toISOString()}.csv`);
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
    candidates: filteredCandidates,
    maleCandidates,
    femaleCandidates,
    filters,
    setFilters,
    refresh: fetchCandidates,
    totalCount: candidates.length,
    maleCount: maleCandidates.length,
    femaleCount: femaleCandidates.length,
    exportCandidates,
    updateCandidate
  };
};

export default useCandidates;