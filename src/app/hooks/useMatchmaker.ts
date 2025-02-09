// src/app/hooks/useMatchmaker.ts
"use client";
import { useState, useEffect } from 'react';
import type { Client } from '@/app/types/matchmaker';
import type { Suggestion } from '@/app/types/suggestions';

export const useMatchmaker = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // טעינת נתונים ראשונית
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [clientsResponse, suggestionsResponse] = await Promise.all([
          fetch('/api/matchmaker/clients'),
          fetch('/api/matchmaker/suggestions')
        ]);

        if (!clientsResponse.ok) {
          throw new Error('שגיאה בטעינת רשימת המועמדים');
        }

        if (!suggestionsResponse.ok) {
          throw new Error('שגיאה בטעינת רשימת ההצעות');
        }

        const clientsData = await clientsResponse.json();
        console.log('Raw clients data:', clientsData); // לדיבוג

        // וידוא שהנתונים מכילים את השדות הנדרשים
        if (!clientsData || !clientsData.clients) {
          console.error('Invalid clients data structure:', clientsData);
          throw new Error('פורמט נתוני המועמדים אינו תקין');
        }

        // המרת הנתונים לפורמט הנכון
        const formattedClients: Client[] = Array.isArray(clientsData.clients) 
          ? clientsData.clients.map((client: any) => ({
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              gender: client.gender,
              birthDate: client.birthDate,
              status: client.status,
              personalInfo: {
                height: client.profile?.height || null,
                maritalStatus: client.profile?.maritalStatus || null,
                occupation: client.profile?.occupation || null,
                education: client.profile?.education || null,
                religiousLevel: client.profile?.religiousLevel || null,
                city: client.profile?.city || null,
              },
              contactPreferences: [{
                method: client.profile?.contactPreference || 'EMAIL',
                value: client.email || ''
              }],
              location: client.profile?.city || '',
              lastActive: client.profile?.lastActive?.toISOString() || new Date().toISOString(),
              invitation: client.receivedInvitation ? {
                status: client.receivedInvitation.status,
                email: client.receivedInvitation.email,
                expiresAt: client.receivedInvitation.expires,
              } : undefined
            }))
          : [];

        console.log('Formatted clients:', formattedClients); // לדיבוג
        setClients(formattedClients);

        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);

      } catch (err) {
        console.error('Error loading matchmaker data:', err);
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
        setClients([]); // במקרה של שגיאה, נאתחל למערך ריק
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // יצירת הצעת שידוך חדשה
  const createSuggestion = async (suggestionData: Partial<Suggestion>) => {
    try {
      const response = await fetch('/api/matchmaker/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(suggestionData),
      });

      if (!response.ok) {
        throw new Error('שגיאה ביצירת ההצעה');
      }

      const newSuggestion = await response.json();
      setSuggestions(prev => [...prev, newSuggestion]);
      return newSuggestion;
    } catch (err) {
      throw err;
    }
  };

  // עדכון הצעת שידוך קיימת
  const updateSuggestion = async (suggestionData: Partial<Suggestion>) => {
    try {
      const response = await fetch(`/api/matchmaker/suggestions/${suggestionData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(suggestionData),
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון ההצעה');
      }

      const updatedSuggestion = await response.json();
      setSuggestions(prev => 
        prev.map(suggestion => 
          suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
        )
      );
      return updatedSuggestion;
    } catch (err) {
      throw err;
    }
  };

  return {
    clients,
    suggestions,
    isLoading,
    error,
    createSuggestion,
    updateSuggestion,
  };
};