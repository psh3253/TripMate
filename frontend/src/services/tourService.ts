import api from './api'
import type { ApiResponse } from '@/types'

export interface TourPlace {
  contentId: string
  contentTypeId: string
  title: string
  addr1: string
  addr2: string | null
  areaCode: string
  sigunguCode: string
  cat1: string
  cat2: string
  cat3: string
  firstImage: string | null
  firstImage2: string | null
  mapX: string
  mapY: string
  tel: string | null
  overview: string | null
  dist: number | null
}

export interface TourDetail extends TourPlace {
  homepage: string | null
  useTime: string | null
  restDate: string | null
  parking: string | null
  chkCreditCard: string | null
  infocenter: string | null
  firstMenu: string | null
  treatMenu: string | null
  openTime: string | null
  checkInTime: string | null
  checkOutTime: string | null
  roomCount: string | null
  reservationUrl: string | null
}

export interface AreaCode {
  code: string
  name: string
}

export interface TourPageResponse<T> {
  items: T[]
  totalCount: number
  pageNo: number
  numOfRows: number
}

export const CONTENT_TYPES = {
  ATTRACTION: 12,
  CULTURE: 14,
  FESTIVAL: 15,
  COURSE: 25,
  LEISURE: 28,
  ACCOMMODATION: 32,
  SHOPPING: 38,
  RESTAURANT: 39,
} as const

export const CONTENT_TYPE_LABELS: Record<number, string> = {
  12: '관광지',
  14: '문화시설',
  15: '축제/행사',
  25: '여행코스',
  28: '레저/스포츠',
  32: '숙박',
  38: '쇼핑',
  39: '음식점',
}

export const tourService = {
  // 지역 코드 조회
  getAreaCodes: async (): Promise<AreaCode[]> => {
    const response = await api.get<ApiResponse<AreaCode[]>>('/tour/areas')
    return response.data.data
  },

  // 시군구 코드 조회
  getSigunguCodes: async (areaCode: string): Promise<AreaCode[]> => {
    const response = await api.get<ApiResponse<AreaCode[]>>(`/tour/areas/${areaCode}/sigungu`)
    return response.data.data
  },

  // 지역 기반 관광정보 조회
  getPlaces: async (params: {
    areaCode?: string
    sigunguCode?: string
    contentTypeId?: number
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/places', { params })
    return response.data.data
  },

  // 키워드 검색
  search: async (params: {
    keyword: string
    areaCode?: string
    sigunguCode?: string
    contentTypeId?: number
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/search', { params })
    return response.data.data
  },

  // 위치 기반 조회
  getNearby: async (params: {
    mapX: number
    mapY: number
    radius?: number
    contentTypeId?: number
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/nearby', { params })
    return response.data.data
  },

  // 상세 정보 조회
  getDetail: async (contentId: string, contentTypeId?: number): Promise<TourDetail> => {
    const response = await api.get<ApiResponse<TourDetail>>(`/tour/places/${contentId}`, {
      params: { contentTypeId },
    })
    return response.data.data
  },

  // 관광지 목록
  getAttractions: async (params: {
    areaCode?: string
    sigunguCode?: string
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/attractions', { params })
    return response.data.data
  },

  // 음식점 목록
  getRestaurants: async (params: {
    areaCode?: string
    sigunguCode?: string
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/restaurants', { params })
    return response.data.data
  },

  // 숙박 목록
  getAccommodations: async (params: {
    areaCode?: string
    sigunguCode?: string
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/accommodations', { params })
    return response.data.data
  },

  // 축제/행사 목록
  getFestivals: async (params: {
    areaCode?: string
    sigunguCode?: string
    pageNo?: number
    numOfRows?: number
  }): Promise<TourPageResponse<TourPlace>> => {
    const response = await api.get<ApiResponse<TourPageResponse<TourPlace>>>('/tour/festivals', { params })
    return response.data.data
  },
}
