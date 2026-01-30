import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

declare global {
  interface Window {
    kakao: any
  }
}

export interface MapMarker {
  lat: number
  lng: number
  name: string
  type?: string
  day?: number
  order?: number
}

interface KakaoMapProps {
  markers: MapMarker[]
  height?: string
  showRoute?: boolean
  selectedDay?: number | null
}

const typeColors: Record<string, string> = {
  TRANSPORT: '#3B82F6',
  ACCOMMODATION: '#8B5CF6',
  RESTAURANT: '#F97316',
  ATTRACTION: '#22C55E',
  ACTIVITY: '#EC4899',
}

const dayColors = [
  '#3B82F6', // Day 1 - blue
  '#F97316', // Day 2 - orange
  '#22C55E', // Day 3 - green
  '#8B5CF6', // Day 4 - purple
  '#EC4899', // Day 5 - pink
  '#EAB308', // Day 6 - yellow
  '#06B6D4', // Day 7 - cyan
]

export default function KakaoMap({ markers, height = '300px', showRoute = true, selectedDay }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])

  // 카카오맵 SDK 로드
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true)
      })
    } else {
      setError('카카오맵 SDK를 불러올 수 없습니다')
    }
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || markers.length === 0) return

    const kakao = window.kakao

    // 첫 번째 마커 위치를 중심으로
    const centerLat = markers[0]?.lat || 33.450701
    const centerLng = markers[0]?.lng || 126.570667

    const options = {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: 7,
    }

    const newMap = new kakao.maps.Map(mapRef.current, options)
    setMap(newMap)

    // 지도 컨트롤 추가
    const zoomControl = new kakao.maps.ZoomControl()
    newMap.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT)

    return () => {
      // cleanup
      markersRef.current.forEach(marker => marker.setMap(null))
      polylinesRef.current.forEach(polyline => polyline.setMap(null))
      markersRef.current = []
      polylinesRef.current = []
    }
  }, [isLoaded, markers.length])

  // 마커 및 경로 업데이트
  useEffect(() => {
    if (!map || !isLoaded || markers.length === 0) return

    const kakao = window.kakao

    // 기존 마커/폴리라인 제거
    markersRef.current.forEach(marker => marker.setMap(null))
    polylinesRef.current.forEach(polyline => polyline.setMap(null))
    markersRef.current = []
    polylinesRef.current = []

    // 필터링 (선택된 day가 있으면 해당 day만)
    const filteredMarkers = selectedDay
      ? markers.filter(m => m.day === selectedDay)
      : markers

    if (filteredMarkers.length === 0) return

    const bounds = new kakao.maps.LatLngBounds()

    // 마커 추가
    filteredMarkers.forEach((marker, index) => {
      const position = new kakao.maps.LatLng(marker.lat, marker.lng)
      bounds.extend(position)

      const color = marker.day ? dayColors[(marker.day - 1) % dayColors.length] : typeColors[marker.type || 'ATTRACTION']

      // 커스텀 오버레이로 번호 표시
      const content = document.createElement('div')
      content.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -100%);
        ">
          <div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${marker.order || index + 1}</div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${color};
            margin-top: -1px;
          "></div>
        </div>
      `

      const customOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 0,
      })
      customOverlay.setMap(map)
      markersRef.current.push(customOverlay)

      // 인포윈도우
      const infoContent = `
        <div style="padding: 8px 12px; font-size: 13px; min-width: 120px;">
          <strong>${marker.name}</strong>
          ${marker.day ? `<br><span style="color: #666; font-size: 11px;">Day ${marker.day}</span>` : ''}
        </div>
      `
      const infowindow = new kakao.maps.InfoWindow({
        content: infoContent,
      })

      // 클릭 가능한 투명 마커
      const clickMarker = new kakao.maps.Marker({
        position: position,
        map: map,
        opacity: 0,
      })
      markersRef.current.push(clickMarker)

      kakao.maps.event.addListener(clickMarker, 'click', () => {
        infowindow.open(map, clickMarker)
        setTimeout(() => infowindow.close(), 3000)
      })
    })

    // 경로선 그리기 (showRoute이고 마커가 2개 이상일 때)
    if (showRoute && filteredMarkers.length >= 2) {
      // Day별로 그룹화
      const dayGroups: Record<number, MapMarker[]> = {}
      filteredMarkers.forEach(m => {
        const day = m.day || 1
        if (!dayGroups[day]) dayGroups[day] = []
        dayGroups[day].push(m)
      })

      // 각 Day별로 경로선 그리기
      Object.entries(dayGroups).forEach(([day, dayMarkers]) => {
        if (dayMarkers.length < 2) return

        const path = dayMarkers.map(m => new kakao.maps.LatLng(m.lat, m.lng))
        const color = dayColors[(Number(day) - 1) % dayColors.length]

        const polyline = new kakao.maps.Polyline({
          path: path,
          strokeWeight: 3,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
        })
        polyline.setMap(map)
        polylinesRef.current.push(polyline)
      })
    }

    // 모든 마커가 보이도록 bounds 조정
    if (filteredMarkers.length === 1) {
      map.setCenter(new kakao.maps.LatLng(filteredMarkers[0].lat, filteredMarkers[0].lng))
      map.setLevel(5)
    } else {
      map.setBounds(bounds, 50)
    }
  }, [map, markers, isLoaded, showRoute, selectedDay])

  if (error) {
    return (
      <div
        style={{ height }}
        className="bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500"
      >
        <MapPin className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-1">카카오 개발자 콘솔에서 JavaScript 키를 설정해주세요</p>
      </div>
    )
  }

  if (markers.length === 0) {
    return (
      <div
        style={{ height }}
        className="bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500"
      >
        <MapPin className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm">표시할 장소가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapRef} style={{ width: '100%', height }} />
      {!isLoaded && (
        <div
          style={{ height }}
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
        >
          <div className="animate-pulse text-gray-500">지도 로딩 중...</div>
        </div>
      )}
    </div>
  )
}
