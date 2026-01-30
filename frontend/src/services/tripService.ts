import api from './api'
import type { Trip, TripSchedule, AIRecommendation, ApiResponse, PageResponse } from '@/types'

interface CreateTripRequest {
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  theme: string
}

interface UpdateTripRequest extends Partial<CreateTripRequest> {
  status?: string
}

export const tripService = {
  getTrips: async (page = 0, size = 10): Promise<PageResponse<Trip>> => {
    const response = await api.get<ApiResponse<PageResponse<Trip>>>('/trips', {
      params: { page, size },
    })
    return response.data.data
  },

  getMyTrips: async (): Promise<Trip[]> => {
    const response = await api.get<ApiResponse<Trip[]>>('/trips/my')
    return response.data.data
  },

  getTrip: async (id: number): Promise<Trip> => {
    const response = await api.get<ApiResponse<Trip>>(`/trips/${id}`)
    return response.data.data
  },

  createTrip: async (data: CreateTripRequest): Promise<Trip> => {
    const response = await api.post<ApiResponse<Trip>>('/trips', data)
    return response.data.data
  },

  updateTrip: async (id: number, data: UpdateTripRequest): Promise<Trip> => {
    const response = await api.put<ApiResponse<Trip>>(`/trips/${id}`, data)
    return response.data.data
  },

  deleteTrip: async (id: number): Promise<void> => {
    await api.delete(`/trips/${id}`)
  },

  getSchedules: async (tripId: number): Promise<TripSchedule[]> => {
    const response = await api.get<ApiResponse<TripSchedule[]>>(`/trips/${tripId}/schedules`)
    return response.data.data
  },

  updateSchedules: async (tripId: number, schedules: Partial<TripSchedule>[]): Promise<TripSchedule[]> => {
    const response = await api.put<ApiResponse<TripSchedule[]>>(`/trips/${tripId}/schedules`, schedules)
    return response.data.data
  },

  getAIRecommendation: async (tripId: number): Promise<AIRecommendation> => {
    const response = await api.post<ApiResponse<AIRecommendation>>(`/trips/${tripId}/ai-recommend`)
    return response.data.data
  },
}
