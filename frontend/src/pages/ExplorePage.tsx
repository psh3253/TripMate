import { useState } from 'react'
import { Search, MapPin, Utensils, Hotel, PartyPopper, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAreaCodes, useSigunguCodes, useTourPlaces, useTourSearch } from '@/hooks/useTour'
import { CONTENT_TYPES } from '@/services/tourService'
import TourPlaceCard from '@/components/TourPlaceCard'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Input from '@/components/Input'
import Button from '@/components/Button'

const tabs = [
  { id: 'all', label: '전체', icon: Search },
  { id: 'attraction', label: '관광지', icon: MapPin, typeId: CONTENT_TYPES.ATTRACTION },
  { id: 'restaurant', label: '맛집', icon: Utensils, typeId: CONTENT_TYPES.RESTAURANT },
  { id: 'accommodation', label: '숙박', icon: Hotel, typeId: CONTENT_TYPES.ACCOMMODATION },
  { id: 'festival', label: '축제', icon: PartyPopper, typeId: CONTENT_TYPES.FESTIVAL },
]

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('all')
  const [areaCode, setAreaCode] = useState('')
  const [sigunguCode, setSigunguCode] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)

  const { data: areas } = useAreaCodes()
  const { data: sigungus } = useSigunguCodes(areaCode)

  const currentTab = tabs.find((t) => t.id === activeTab)
  const contentTypeId = currentTab?.typeId

  const { data: placesData, isLoading: placesLoading } = useTourPlaces({
    areaCode: areaCode || undefined,
    sigunguCode: sigunguCode || undefined,
    contentTypeId,
    pageNo: page,
    numOfRows: 20,
  })

  const { data: searchData, isLoading: searchLoading } = useTourSearch({
    keyword: searchKeyword,
    areaCode: areaCode || undefined,
    sigunguCode: sigunguCode || undefined,
    contentTypeId,
    pageNo: page,
    numOfRows: 20,
  })

  const isSearching = !!searchKeyword
  const data = isSearching ? searchData : placesData
  const isLoading = isSearching ? searchLoading : placesLoading

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchKeyword(keyword)
    setPage(1)
  }

  const handleAreaChange = (code: string) => {
    setAreaCode(code)
    setSigunguCode('')
    setPage(1)
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.location.href = `/explore/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
        },
        () => {
          toast.error('위치 정보를 가져올 수 없습니다')
        }
      )
    }
  }

  return (
    <div className="pb-6">
      {/* 검색 영역 */}
      <div className="sticky top-14 z-40 bg-white border-b px-4 py-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="여행지, 맛집, 숙소 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" size="sm">검색</Button>
        </form>

        {/* 필터 */}
        <div className="flex gap-2 mt-3">
          <select
            value={areaCode}
            onChange={(e) => handleAreaChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">전체 지역</option>
            {areas?.map((area) => (
              <option key={area.code} value={area.code}>
                {area.name}
              </option>
            ))}
          </select>

          {areaCode && sigungus && sigungus.length > 0 && (
            <select
              value={sigunguCode}
              onChange={(e) => {
                setSigunguCode(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">전체 시군구</option>
              {sigungus.map((sg) => (
                <option key={sg.code} value={sg.code}>
                  {sg.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleGetLocation}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
          >
            <Navigation className="w-4 h-4" />
            내 주변
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="sticky top-[145px] z-30 bg-white border-b">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 결과 */}
      <div className="px-4 pt-4">
        {isSearching && searchKeyword && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              '<span className="font-medium">{searchKeyword}</span>' 검색 결과
              {data && ` ${data.totalCount}건`}
            </p>
            <button
              onClick={() => {
                setKeyword('')
                setSearchKeyword('')
              }}
              className="text-sm text-primary-600"
            >
              검색 초기화
            </button>
          </div>
        )}

        {isLoading ? (
          <Loading />
        ) : data && data.items.length > 0 ? (
          <>
            <div className="space-y-3">
              {data.items.map((place) => (
                <TourPlaceCard key={place.contentId} place={place} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {data.totalCount > data.numOfRows && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <span className="px-4 py-2 text-sm">
                  {page} / {Math.ceil(data.totalCount / data.numOfRows)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(data.totalCount / data.numOfRows)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Search className="w-12 h-12" />}
            title="검색 결과가 없습니다"
            description="다른 검색어나 지역을 선택해보세요"
          />
        )}
      </div>
    </div>
  )
}
