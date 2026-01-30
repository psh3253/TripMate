import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    kakao: any
  }
}

export interface SelectedPlace {
  name: string
  address: string
  lat: number
  lng: number
}

interface PlaceSearchMapProps {
  onSelectPlace: (place: SelectedPlace) => void
  initialCenter?: { lat: number; lng: number }
  destination?: string
}

export default function PlaceSearchMap({ onSelectPlace, initialCenter, destination }: PlaceSearchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null)
  const markerRef = useRef<any>(null)
  const psRef = useRef<any>(null)

  // 카카오맵 SDK 로드
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true)
      })
    }
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    const kakao = window.kakao

    // 기본 중심: 서울 또는 전달받은 위치
    const centerLat = initialCenter?.lat || 37.5665
    const centerLng = initialCenter?.lng || 126.9780

    const options = {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: 5,
    }

    const newMap = new kakao.maps.Map(mapRef.current, options)
    setMap(newMap)

    // 장소 검색 객체 생성
    psRef.current = new kakao.maps.services.Places()

    // 지도 클릭 이벤트
    kakao.maps.event.addListener(newMap, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng
      const lat = latlng.getLat()
      const lng = latlng.getLng()

      // 좌표로 주소 검색
      const geocoder = new kakao.maps.services.Geocoder()
      geocoder.coord2Address(lng, lat, (result: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          const address = result[0].road_address?.address_name || result[0].address.address_name
          const place: SelectedPlace = {
            name: '',
            address: address,
            lat: lat,
            lng: lng,
          }
          updateMarker(newMap, lat, lng, address)
          setSelectedPlace(place)
          onSelectPlace(place)
        }
      })
    })

    // 목적지가 있으면 해당 지역으로 이동
    if (destination) {
      searchByDestination(newMap, destination)
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
    }
  }, [isLoaded])

  // 목적지 기준으로 지도 이동
  const searchByDestination = useCallback((mapInstance: any, dest: string) => {
    if (!psRef.current) return

    psRef.current.keywordSearch(dest, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const place = data[0]
        const moveLatLng = new window.kakao.maps.LatLng(place.y, place.x)
        mapInstance.setCenter(moveLatLng)
        mapInstance.setLevel(6)
      }
    })
  }, [])

  // 마커 업데이트
  const updateMarker = useCallback((mapInstance: any, lat: number, lng: number, title: string) => {
    const kakao = window.kakao

    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(lat, lng),
      map: mapInstance,
    })

    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;font-size:12px;max-width:200px;">${title}</div>`,
    })
    infowindow.open(mapInstance, marker)

    markerRef.current = marker
  }, [])

  // 키워드 검색
  const handleSearch = useCallback(() => {
    if (!searchKeyword.trim() || !psRef.current) return

    setIsSearching(true)
    setSearchResults([])

    // 목적지와 함께 검색 (더 정확한 결과)
    const keyword = destination ? `${destination} ${searchKeyword}` : searchKeyword

    psRef.current.keywordSearch(keyword, (data: any, status: any) => {
      setIsSearching(false)
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data.slice(0, 5))
      } else {
        setSearchResults([])
      }
    })
  }, [searchKeyword, destination])

  // 검색 결과 선택
  const handleSelectResult = useCallback((result: any) => {
    if (!map) return

    const lat = parseFloat(result.y)
    const lng = parseFloat(result.x)
    const place: SelectedPlace = {
      name: result.place_name,
      address: result.road_address_name || result.address_name,
      lat: lat,
      lng: lng,
    }

    const moveLatLng = new window.kakao.maps.LatLng(lat, lng)
    map.setCenter(moveLatLng)
    map.setLevel(3)

    updateMarker(map, lat, lng, result.place_name)
    setSelectedPlace(place)
    setSearchResults([])
    setSearchKeyword('')
    onSelectPlace(place)
  }, [map, updateMarker, onSelectPlace])

  // Enter 키 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  if (!isLoaded) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 검색 입력 */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="장소 검색 (예: 카페, 맛집, 관광지)"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
          </button>
        </div>

        {/* 검색 결과 드롭다운 */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 text-sm"
              >
                <p className="font-medium text-gray-900">{result.place_name}</p>
                <p className="text-xs text-gray-500">{result.road_address_name || result.address_name}</p>
                {result.category_group_name && (
                  <span className="text-xs text-primary-600">{result.category_group_name}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지도 */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        <div ref={mapRef} style={{ width: '100%', height: '200px' }} />
        <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
          지도를 클릭하여 위치 선택
        </div>
      </div>

      {/* 선택된 장소 정보 */}
      {selectedPlace && (
        <div className="flex items-start gap-2 p-2 bg-primary-50 rounded-lg border border-primary-200">
          <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            {selectedPlace.name && (
              <p className="font-medium text-primary-800">{selectedPlace.name}</p>
            )}
            <p className="text-primary-600 text-xs">{selectedPlace.address}</p>
          </div>
        </div>
      )}
    </div>
  )
}
