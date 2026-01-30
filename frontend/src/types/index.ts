export interface User {
  id: number
  kakaoId: string
  nickname: string
  profileImage: string | null
  email: string | null
  createdAt: string
}

export interface Trip {
  id: number
  userId: number
  title: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  themes: TripTheme[]
  status: TripStatus
  schedules?: TripSchedule[]
  createdAt: string
}

export type TripTheme = 'HEALING' | 'ADVENTURE' | 'FOOD' | 'CULTURE' | 'SHOPPING' | 'NATURE'
export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface TripSchedule {
  id: number
  tripId: number
  dayNumber: number
  time: string
  placeName: string
  placeType: PlaceType
  description: string | null
  lat: number | null
  lng: number | null
}

export type PlaceType = 'ACCOMMODATION' | 'RESTAURANT' | 'ATTRACTION' | 'TRANSPORT' | 'ACTIVITY'

export interface Companion {
  id: number
  tripId: number
  userId: number
  user?: User
  trip?: Trip
  title: string
  content: string
  maxMembers: number
  currentMembers: number
  status: CompanionStatus
  createdAt: string
}

export type CompanionStatus = 'RECRUITING' | 'CLOSED' | 'CANCELLED'

export interface CompanionApplication {
  id: number
  companionId: number
  userId: number
  user?: User
  message: string
  status: ApplicationStatus
  createdAt: string
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ChatRoom {
  id: number
  companionId: number
  createdAt: string
}

export interface ChatMessage {
  id: number
  roomId: number
  userId: number
  user?: User
  content: string
  createdAt: string
}

export interface AIRecommendation {
  schedules: TripSchedule[]
  summary: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
