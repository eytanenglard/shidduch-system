// src/lib/services/questionnaireService.ts
import type { 
    QuestionnaireResponse,
    QuestionnaireVersion,
    QuestionnaireAutosave,
    TempQuestionnaireSession,
    QuestionnaireUpdatePayload,
    QuestionnaireApiResponse,
    QuestionnaireMetadata,
    QuestionnaireAnalysis
  } from '@/components/questionnaire/types/responses';
  
  class QuestionnaireService {
    private static readonly AUTOSAVE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
    private static readonly TEMP_SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
    private static readonly API_BASE = '/api/questionnaire';
  
    // Helper method for API calls
    private async fetchApi<T>(
      endpoint: string, 
      options: RequestInit = {}
    ): Promise<QuestionnaireApiResponse<T>> {
      try {
        const response = await fetch(`${QuestionnaireService.API_BASE}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
  
        const data = await response.json();
  
        if (!data.success) {
          throw new Error(data.error.message);
        }
  
        return data;
      } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
      }
    }
  
    // Save or update permanent response
    async saveResponse(userId: string, data: QuestionnaireUpdatePayload): Promise<QuestionnaireResponse> {
      const response = await this.fetchApi<QuestionnaireResponse>('', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          ...data,
          metadata: {
            ...data.metadata,
            lastSaveType: 'manual',
            lastActiveTime: new Date(),
          },
        }),
      });
  
      return response.data!;
    }
  
    // Save temporary session for non-authenticated users
    async saveTempSession(
      sessionToken: string, 
      data: QuestionnaireUpdatePayload
    ): Promise<TempQuestionnaireSession> {
      const response = await this.fetchApi<TempQuestionnaireSession>('/temp', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken,
          ...data,
          expiresAt: new Date(Date.now() + QuestionnaireService.TEMP_SESSION_EXPIRY),
          metadata: {
            ...data.metadata,
            lastSaveType: 'temporary',
            lastActiveTime: new Date(),
          },
        }),
      });
  
      return response.data!;
    }
  
    // Auto-save functionality
    async autoSave(
      responseId: string, 
      data: QuestionnaireUpdatePayload
    ): Promise<QuestionnaireAutosave> {
      const response = await this.fetchApi<QuestionnaireAutosave>('/autosave', {
        method: 'POST',
        body: JSON.stringify({
          responseId,
          ...data,
          expiresAt: new Date(Date.now() + QuestionnaireService.AUTOSAVE_EXPIRY),
          metadata: {
            ...data.metadata,
            lastSaveType: 'auto',
            lastActiveTime: new Date(),
          },
        }),
      });
  
      return response.data!;
    }
  
    // Version control
    async createVersion(
      responseId: string, 
      data: QuestionnaireUpdatePayload, 
      reason?: string
    ): Promise<QuestionnaireVersion> {
      const response = await this.fetchApi<QuestionnaireVersion>('/version', {
        method: 'POST',
        body: JSON.stringify({
          responseId,
          ...data,
          reason,
          metadata: {
            ...data.metadata,
            lastSaveType: 'version',
            lastActiveTime: new Date(),
          },
        }),
      });
  
      return response.data!;
    }
  
    // Convert temporary session to permanent
    async convertTempToResponse(
      sessionToken: string, 
      userId: string
    ): Promise<QuestionnaireResponse> {
      const response = await this.fetchApi<QuestionnaireResponse>('/convert', {
        method: 'POST',
        body: JSON.stringify({ sessionToken, userId }),
      });
  
      return response.data!;
    }
  
    // Fetch existing response
    async getResponse(responseId: string): Promise<QuestionnaireResponse> {
      const response = await this.fetchApi<QuestionnaireResponse>(`?responseId=${responseId}`);
      return response.data!;
    }
  
    // Get temporary session
    async getTempSession(sessionToken: string): Promise<TempQuestionnaireSession> {
      const response = await this.fetchApi<TempQuestionnaireSession>(`/temp/${sessionToken}`);
      return response.data!;
    }
  
    // Clean up expired data
    async cleanupExpiredData(): Promise<void> {
      await this.fetchApi('/cleanup', { method: 'POST' });
    }
  
    // Generate analysis
    async generateAnalysis(responseId: string): Promise<QuestionnaireAnalysis> {
      const response = await this.fetchApi<QuestionnaireAnalysis>(`/analysis/${responseId}`, {
        method: 'POST',
      });
      return response.data!;
    }
  
    // Update metadata
    async updateMetadata(
      responseId: string, 
      metadata: Partial<QuestionnaireMetadata>
    ): Promise<QuestionnaireResponse> {
      const response = await this.fetchApi<QuestionnaireResponse>(`/metadata/${responseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ metadata }),
      });
      return response.data!;
    }
  
    // Mark questionnaire as completed
    async markCompleted(responseId: string): Promise<QuestionnaireResponse> {
      const response = await this.fetchApi<QuestionnaireResponse>(`/complete/${responseId}`, {
        method: 'POST',
      });
      return response.data!;
    }
  
 
async getStatistics(responseId: string): Promise<QuestionnaireStatistics> {
    const response = await this.fetchApi<QuestionnaireStatistics>(`/statistics/${responseId}`);
    
    if (!response.data) {
      throw new Error('Failed to fetch statistics');
    }
    
    // המרת ה-lastActive לאובייקט Date
    return {
      ...response.data,
      lastActive: new Date(response.data.lastActive)
    };
   }
  }
  
  export const questionnaireService = new QuestionnaireService();