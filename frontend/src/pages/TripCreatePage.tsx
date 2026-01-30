import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCreateTrip, useUpdateSchedules } from '@/hooks/useTrips'
import { useAreaCodes, useSigunguCodes } from '@/hooks/useTour'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { Bot, Clock, Sparkles, ChevronDown, MapPin } from 'lucide-react'

// 인기 여행지 (Tour API 지역 코드와 매핑)
const popularDestinations = [
  { code: '39', name: '제주도', emoji: '🏝️' },
  { code: '6', name: '부산', emoji: '🌊' },
  { code: '1', name: '서울', emoji: '🏙️' },
  { code: '32', name: '강원도', emoji: '⛰️' },
  { code: '5', name: '광주', emoji: '🎨' },
  { code: '35', name: '경상북도', emoji: '🏛️' },
]

const themes = [
  { value: 'HEALING', label: '힐링', emoji: '🧘' },
  { value: 'ADVENTURE', label: '모험', emoji: '🏔️' },
  { value: 'FOOD', label: '맛집', emoji: '🍽️' },
  { value: 'CULTURE', label: '문화', emoji: '🏛️' },
  { value: 'SHOPPING', label: '쇼핑', emoji: '🛍️' },
  { value: 'NATURE', label: '자연', emoji: '🌿' },
]

interface LocationState {
  destination?: string
  startDate?: string
  endDate?: string
  theme?: string
  budget?: number
  aiSchedule?: {
    schedules: Array<{
      dayNumber: number
      time: string
      placeName: string
      placeType: string
      description?: string
      lat?: number | null
      lng?: number | null
    }>
    summary: string
    tips: string[]
  }
}

const placeTypeLabels: Record<string, { label: string; color: string }> = {
  ACCOMMODATION: { label: '숙소', color: 'bg-purple-100 text-purple-700' },
  RESTAURANT: { label: '맛집', color: 'bg-orange-100 text-orange-700' },
  ATTRACTION: { label: '관광', color: 'bg-blue-100 text-blue-700' },
  TRANSPORT: { label: '이동', color: 'bg-gray-100 text-gray-700' },
  ACTIVITY: { label: '액티비티', color: 'bg-green-100 text-green-700' },
}

export default function TripCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const createTripMutation = useCreateTrip()
  const updateSchedulesMutation = useUpdateSchedules()
  const locationState = location.state as LocationState | null

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
  })
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])

  // 지역 선택 관련 상태
  const [selectedAreaCode, setSelectedAreaCode] = useState('')
  const [selectedSigunguCode, setSelectedSigunguCode] = useState('')
  const [showAllAreas, setShowAllAreas] = useState(false)

  const { data: areas } = useAreaCodes()
  const { data: sigungus } = useSigunguCodes(selectedAreaCode)

  // AI 플래너에서 전달된 데이터가 있으면 자동 입력
  useEffect(() => {
    if (locationState) {
      setFormData(prev => ({
        ...prev,
        destination: locationState.destination || prev.destination,
        startDate: locationState.startDate || prev.startDate,
        endDate: locationState.endDate || prev.endDate,
        budget: locationState.budget?.toString() || prev.budget,
        title: locationState.destination ? `${locationState.destination} 여행` : prev.title,
      }))
      if (locationState.theme) {
        setSelectedThemes([locationState.theme])
      }

      // 목적지가 있으면 해당 지역 코드 찾아서 선택
      if (locationState.destination) {
        const destination = locationState.destination
        // 인기 여행지에서 먼저 찾기
        const popularMatch = popularDestinations.find(d =>
          destination.includes(d.name)
        )
        if (popularMatch) {
          setSelectedAreaCode(popularMatch.code)
        }
      }
    }
  }, [locationState])

  // areas 로드 후 AI 플래너 목적지 매핑
  useEffect(() => {
    if (areas && locationState?.destination && !selectedAreaCode) {
      const destination = locationState.destination
      const areaMatch = areas.find(a => destination.includes(a.name))
      if (areaMatch) {
        setSelectedAreaCode(areaMatch.code)
      }
    }
  }, [areas, locationState, selectedAreaCode])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 지역 선택 핸들러
  const handleAreaSelect = (areaCode: string, areaName: string) => {
    setSelectedAreaCode(areaCode)
    setSelectedSigunguCode('')
    setFormData(prev => ({ ...prev, destination: areaName }))
  }

  // 시군구 선택 핸들러
  const handleSigunguSelect = (sigunguCode: string, sigunguName: string) => {
    setSelectedSigunguCode(sigunguCode)
    const areaName = areas?.find(a => a.code === selectedAreaCode)?.name || ''
    setFormData(prev => ({
      ...prev,
      destination: sigunguName ? `${areaName} ${sigunguName}` : areaName
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = '여행 이름을 입력해주세요'
    if (!formData.destination.trim()) newErrors.destination = '목적지를 선택해주세요'
    if (!formData.startDate) newErrors.startDate = '시작일을 선택해주세요'
    if (!formData.endDate) newErrors.endDate = '종료일을 선택해주세요'
    if (!formData.budget) newErrors.budget = '예산을 입력해주세요'
    if (selectedThemes.length === 0) newErrors.theme = '테마를 선택해주세요'

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '종료일은 시작일 이후여야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const trip = await createTripMutation.mutateAsync({
      title: formData.title,
      destination: formData.destination,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: Number(formData.budget),
      themes: selectedThemes,
    })

    // AI 일정이 있으면 함께 저장 (좌표 포함)
    if (locationState?.aiSchedule?.schedules?.length) {
      try {
        await updateSchedulesMutation.mutateAsync({
          tripId: trip.id,
          schedules: locationState.aiSchedule.schedules.map(s => ({
            dayNumber: s.dayNumber,
            time: s.time,
            placeName: s.placeName,
            placeType: s.placeType,
            description: s.description || '',
            // 좌표가 없거나 0이면 null로 처리
            lat: s.lat && s.lat !== 0 ? s.lat : null,
            lng: s.lng && s.lng !== 0 ? s.lng : null,
          })),
        })
      } catch (error) {
        console.error('Failed to save AI schedules:', error)
      }
    }

    navigate(`/trips/${trip.id}`)
  }

  const aiSchedule = locationState?.aiSchedule
  const hasAiSchedule = aiSchedule?.schedules && aiSchedule.schedules.length > 0

  // AI 일정을 일자별로 그룹화
  const groupedSchedules = aiSchedule?.schedules?.reduce((acc, schedule) => {
    const day = schedule.dayNumber
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<number, typeof aiSchedule.schedules>) || {}

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">새 여행 계획</h1>

      {/* AI 플래너에서 온 경우 안내 메시지 */}
      {hasAiSchedule && (
        <Card className="mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-800">AI 플래너 일정이 준비되었습니다</h3>
              <p className="text-sm text-primary-700 mt-1">
                {aiSchedule?.summary || '아래 정보를 확인하고 여행을 만들어보세요. 일정이 함께 저장됩니다.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <Input
            label="여행 이름"
            placeholder="예: 제주도 힐링 여행"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />

          {/* 목적지 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              목적지
            </label>

            {/* 인기 여행지 */}
            <p className="text-xs text-gray-500 mb-2">인기 여행지</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {popularDestinations.map((dest) => (
                <button
                  key={dest.code}
                  type="button"
                  onClick={() => handleAreaSelect(dest.code, dest.name)}
                  className={`p-2.5 rounded-lg border-2 transition-all text-center ${
                    selectedAreaCode === dest.code
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl block">{dest.emoji}</span>
                  <span className="text-xs mt-1 block font-medium">{dest.name}</span>
                </button>
              ))}
            </div>

            {/* 전체 지역 보기 토글 */}
            <button
              type="button"
              onClick={() => setShowAllAreas(!showAllAreas)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-2"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllAreas ? 'rotate-180' : ''}`} />
              {showAllAreas ? '접기' : '전체 지역 보기'}
            </button>

            {/* 전체 지역 목록 */}
            {showAllAreas && areas && (
              <div className="grid grid-cols-4 gap-1.5 mb-3 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                {areas.map((area) => (
                  <button
                    key={area.code}
                    type="button"
                    onClick={() => handleAreaSelect(area.code, area.name)}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      selectedAreaCode === area.code
                        ? 'bg-primary-500 text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            )}

            {/* 시군구 선택 (지역 선택 시 표시) */}
            {selectedAreaCode && sigungus && sigungus.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">세부 지역 (선택)</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSigunguSelect('', '')}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      !selectedSigunguCode
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                  {sigungus.map((sg) => (
                    <button
                      key={sg.code}
                      type="button"
                      onClick={() => handleSigunguSelect(sg.code, sg.name)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        selectedSigunguCode === sg.code
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {sg.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 선택된 목적지 표시 */}
            {formData.destination && (
              <div className="mt-3 px-3 py-2 bg-primary-50 rounded-lg border border-primary-200">
                <span className="text-sm text-primary-700">
                  선택된 목적지: <strong>{formData.destination}</strong>
                </span>
              </div>
            )}

            {errors.destination && (
              <p className="mt-2 text-sm text-red-500">{errors.destination}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="시작일"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              error={errors.startDate}
            />
            <Input
              type="date"
              label="종료일"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              error={errors.endDate}
            />
          </div>

          <Input
            type="number"
            label="예산 (원)"
            placeholder="500000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            error={errors.budget}
          />
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            여행 테마 (복수 선택 가능)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => {
              const isSelected = selectedThemes.includes(theme.value)
              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => {
                    setSelectedThemes(prev =>
                      isSelected
                        ? prev.filter(t => t !== theme.value)
                        : [...prev, theme.value]
                    )
                  }}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="block text-sm mt-1">{theme.label}</span>
                </button>
              )
            })}
          </div>
          {errors.theme && (
            <p className="mt-2 text-sm text-red-500">{errors.theme}</p>
          )}
        </Card>

        {/* AI 일정 미리보기 */}
        {hasAiSchedule && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900">AI 추천 일정 미리보기</h2>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(groupedSchedules)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, daySchedules]) => (
                  <div key={day} className="border-l-2 border-primary-200 pl-3">
                    <h3 className="font-medium text-gray-800 mb-2">Day {day}</h3>
                    <div className="space-y-2">
                      {daySchedules
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((schedule, index) => {
                          const placeType = placeTypeLabels[schedule.placeType] || placeTypeLabels.ACTIVITY
                          return (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                              <span className="text-gray-500 w-12">{schedule.time}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${placeType.color}`}>
                                {placeType.label}
                              </span>
                              <span className="text-gray-700 flex-1">{schedule.placeName}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
            </div>

            {aiSchedule?.tips && aiSchedule.tips.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">여행 팁</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {aiSchedule.tips.map((tip, index) => (
                    <li key={index}>- {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createTripMutation.isPending || updateSchedulesMutation.isPending}
        >
          {hasAiSchedule ? 'AI 일정으로 여행 만들기' : '여행 만들기'}
        </Button>
      </form>
    </div>
  )
}
