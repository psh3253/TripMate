import api from './api'
import type { ChatRoom, ChatMessage, ApiResponse } from '@/types'

export const chatService = {
  getRooms: async (): Promise<ChatRoom[]> => {
    const response = await api.get<ApiResponse<ChatRoom[]>>('/chat/rooms')
    return response.data.data
  },

  getRoom: async (roomId: number): Promise<ChatRoom> => {
    const response = await api.get<ApiResponse<ChatRoom>>(`/chat/rooms/${roomId}`)
    return response.data.data
  },

  getMessages: async (roomId: number, page = 0, size = 50): Promise<ChatMessage[]> => {
    const response = await api.get<ApiResponse<ChatMessage[]>>(`/chat/rooms/${roomId}/messages`, {
      params: { page, size },
    })
    return response.data.data
  },
}
