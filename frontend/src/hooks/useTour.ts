import { useQuery } from '@tanstack/react-query'
import { tourService } from '@/services/tourService'

export function useAreaCodes() {
  return useQuery({
    queryKey: ['tour', 'areas'],
    queryFn: () => tourService.getAreaCodes(),
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

export function useSigunguCodes(areaCode: string) {
  return useQuery({
    queryKey: ['tour', 'sigungu', areaCode],
    queryFn: () => tourService.getSigunguCodes(areaCode),
    enabled: !!areaCode,
    staleTime: 1000 * 60 * 60,
  })
}

export function useTourPlaces(params: {
  areaCode?: string
  sigunguCode?: string
  contentTypeId?: number
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'places', params],
    queryFn: () => tourService.getPlaces(params),
  })
}

export function useTourSearch(params: {
  keyword: string
  areaCode?: string
  sigunguCode?: string
  contentTypeId?: number
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'search', params],
    queryFn: () => tourService.search(params),
    enabled: !!params.keyword,
  })
}

export function useNearbyPlaces(params: {
  mapX: number
  mapY: number
  radius?: number
  contentTypeId?: number
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'nearby', params],
    queryFn: () => tourService.getNearby(params),
    enabled: !!params.mapX && !!params.mapY,
  })
}

export function useTourDetail(contentId: string, contentTypeId?: number) {
  return useQuery({
    queryKey: ['tour', 'detail', contentId, contentTypeId],
    queryFn: () => tourService.getDetail(contentId, contentTypeId),
    enabled: !!contentId,
  })
}

export function useAttractions(params: {
  areaCode?: string
  sigunguCode?: string
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'attractions', params],
    queryFn: () => tourService.getAttractions(params),
  })
}

export function useRestaurants(params: {
  areaCode?: string
  sigunguCode?: string
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'restaurants', params],
    queryFn: () => tourService.getRestaurants(params),
  })
}

export function useAccommodations(params: {
  areaCode?: string
  sigunguCode?: string
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'accommodations', params],
    queryFn: () => tourService.getAccommodations(params),
  })
}

export function useFestivals(params: {
  areaCode?: string
  sigunguCode?: string
  pageNo?: number
  numOfRows?: number
}) {
  return useQuery({
    queryKey: ['tour', 'festivals', params],
    queryFn: () => tourService.getFestivals(params),
  })
}
