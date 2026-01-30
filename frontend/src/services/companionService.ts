import api from './api'
import type { Companion, CompanionApplication, ApiResponse, PageResponse } from '@/types'

interface CreateCompanionRequest {
  tripId: number
  title: string
  content: string
  maxMembers: number
}

interface UpdateCompanionRequest extends Partial<CreateCompanionRequest> {
  status?: string
}

interface CompanionFilters {
  destination?: string
  theme?: string
  startDate?: string
  endDate?: string
}

export const companionService = {
  getCompanions: async (page = 0, size = 10, filters?: CompanionFilters): Promise<PageResponse<Companion>> => {
    const response = await api.get<ApiResponse<PageResponse<Companion>>>('/companions', {
      params: { page, size, ...filters },
    })
    return response.data.data
  },

  getCompanion: async (id: number): Promise<Companion> => {
    const response = await api.get<ApiResponse<Companion>>(`/companions/${id}`)
    return response.data.data
  },

  createCompanion: async (data: CreateCompanionRequest): Promise<Companion> => {
    const response = await api.post<ApiResponse<Companion>>('/companions', data)
    return response.data.data
  },

  updateCompanion: async (id: number, data: UpdateCompanionRequest): Promise<Companion> => {
    const response = await api.put<ApiResponse<Companion>>(`/companions/${id}`, data)
    return response.data.data
  },

  deleteCompanion: async (id: number): Promise<void> => {
    await api.delete(`/companions/${id}`)
  },

  apply: async (companionId: number, message: string): Promise<CompanionApplication> => {
    const response = await api.post<ApiResponse<CompanionApplication>>(`/companions/${companionId}/apply`, {
      message,
    })
    return response.data.data
  },

  getApplications: async (companionId: number): Promise<CompanionApplication[]> => {
    const response = await api.get<ApiResponse<CompanionApplication[]>>(`/companions/${companionId}/applications`)
    return response.data.data
  },

  approveApplication: async (companionId: number, userId: number): Promise<void> => {
    await api.post(`/companions/${companionId}/approve/${userId}`)
  },

  rejectApplication: async (companionId: number, userId: number): Promise<void> => {
    await api.post(`/companions/${companionId}/reject/${userId}`)
  },
}
