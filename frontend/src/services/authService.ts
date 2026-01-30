import api from './api'
import type { User, ApiResponse } from '@/types'

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authService = {
  kakaoLogin: async (code: string): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/kakao', { code })
    return response.data.data
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    )
    return response.data.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },

  updateProfile: async (data: { nickname?: string; profileImage?: string }): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/auth/me', data)
    return response.data.data
  },
}
