import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Plane,
  Hotel,
  Utensils,
  MapPin,
  Wallet,
  Calendar,
  Users,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowRight,
  Map
} from 'lucide-react'
import { useAreaCodes } from '@/hooks/useTour'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import KakaoMap, { type MapMarker } from '@/components/KakaoMap'
import api from '@/services/api'

// AI 전문가 정보
const agents = [
  { id: 'coordinator', name: '총괄 플래너', icon: Bot, color: 'text-purple-500', bgColor: 'bg-purple-100', description: '전체 계획 조율' },
  { id: 'transport', name: '교통 전문가', icon: Plane, color: 'text-blue-500', bgColor: 'bg-blue-100', description: '교통편 분석' },
  { id: 'accommodation', name: '숙소 전문가', icon: Hotel, color: 'text-amber-500', bgColor: 'bg-amber-100', description: '숙소 추천' },
  { id: 'restaurant', name: '맛집 전문가', icon: Utensils, color: 'text-orange-500', bgColor: 'bg-orange-100', description: '맛집 추천' },
  { id: 'activity', name: '관광 전문가', icon: MapPin, color: 'text-green-500', bgColor: 'bg-green-100', description: '관광지 추천' },
  { id: 'optimizer', name: '예산 전문가', icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-100', description: '예산 최적화' },
]

// 인기 여행지
const popularDestinations = [
  { code: '39', name: '제주도', emoji: '🏝️' },
  { code: '6', name: '부산', emoji: '🌊' },
  { code: '1', name: '서울', emoji: '🏙️' },
  { code: '32', name: '강원도', emoji: '⛰️' },
]

// 여행 선호도
const preferenceOptions = [
  { value: 'healing', label: '힐링', emoji: '🧘' },
  { value: 'food', label: '맛집', emoji: '🍽️' },
  { value: 'adventure', label: '모험', emoji: '🏔️' },
  { value: 'culture', label: '문화', emoji: '🏛️' },
  { value: 'nature', label: '자연', emoji: '🌿' },
  { value: 'shopping', label: '쇼핑', emoji: '🛍️' },
]

interface AgentResult {
  agent: string
  status: string
  recommendations: any[]
  notes: string
}

interface ScheduleItem {
  time: string
  type: string
  name: string
  description?: string
  duration?: string
  cost?: number
  tips?: string
  lat?: number
  lng?: number
}

interface DaySchedule {
  day: number
  date?: string
  theme?: string
  items: ScheduleItem[]
}

interface PlanResult {
  success: boolean
  destination: string
  schedule: DaySchedule[]
  budgetPlan: any
  agentResults: Record<string, AgentResult>
  messages: string[]
  errors: string[]
  processingTime?: string
}

export default function MultiAgentPlannerPage() {
  const navigate = useNavigate()
  const { data: areas } = useAreaCodes()

  // 폼 상태
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [travelers, setTravelers] = useState('2')
  const [preferences, setPreferences] = useState<string[]>(['healing'])
  const [showAllAreas, setShowAllAreas] = useState(false)

  // 실행 상태
  const [isPlanning, setIsPlanning] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [result, setResult] = useState<PlanResult | null>(null)
  const [error, setError] = useState('')

  // 결과 표시 상태
  const [expandedDay, setExpandedDay] = useState<number | null>(1)
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [selectedMapDay, setSelectedMapDay] = useState<number | null>(null)

  // 지도 마커 생성
  const mapMarkers = useMemo<MapMarker[]>(() => {
    if (!result?.schedule) return []

    const markers: MapMarker[] = []
    let orderCounter = 1

    result.schedule.forEach((day) => {
      (day.items || []).forEach((item) => {
        if (item.lat && item.lng) {
          markers.push({
            lat: item.lat,
            lng: item.lng,
            name: item.name,
            type: item.type,
            day: day.day,
            order: orderCounter++,
          })
        }
      })
    })

    return markers
  }, [result])

  const handlePreferenceToggle = (value: string) => {
    setPreferences(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    )
  }

  const simulateAgentProgress = async () => {
    const agentOrder = ['coordinator', 'transport', 'accommodation', 'restaurant', 'activity', 'optimizer']
    for (const agent of agentOrder) {
      setCurrentAgent(agent)
      await new Promise(resolve => setTimeout(resolve, 500))
      setCompletedAgents(prev => [...prev, agent])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setCompletedAgents([])
    setCurrentAgent(null)

    if (!destination || !startDate || !endDate || !budget) {
      setError('모든 필수 정보를 입력해주세요.')
      return
    }

    if (preferences.length === 0) {
      setError('최소 1개 이상의 여행 선호도를 선택해주세요.')
      return
    }

    setIsPlanning(true)

    // AI 진행 시뮬레이션 시작
    simulateAgentProgress()

    try {
      const response = await api.post('/ai/multi-agent-plan', {
        destination,
        startDate,
        endDate,
        budget: parseInt(budget),
        travelers: parseInt(travelers),
        preferences,
      })

      setResult(response.data.data)
      setCurrentAgent(null)
      setExpandedDay(1)
    } catch (err: any) {
      setError(err.response?.data?.message || '계획 생성 중 오류가 발생했습니다.')
    } finally {
      setIsPlanning(false)
      setCompletedAgents(agents.map(a => a.id))
    }
  }

  const handleCreateTrip = () => {
    if (!result) return

    // 일정 데이터를 TripCreatePage로 전달 (좌표 포함)
    const schedules = (result.schedule || []).flatMap(day =>
      (day.items || []).map(item => ({
        dayNumber: day.day,
        time: item.time,
        placeName: item.name,
        placeType: item.type,
        description: item.description,
        lat: item.lat || null,
        lng: item.lng || null,
      }))
    )

    navigate('/trips/create', {
      state: {
        destination,
        startDate,
        endDate,
        budget: parseInt(budget),
        aiSchedule: {
          schedules,
          summary: `${destination} ${(result.schedule || []).length}일 여행`,
          tips: result.budgetPlan?.savings_tips || [],
        },
      },
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TRANSPORT': return <Plane className="w-4 h-4" />
      case 'ACCOMMODATION': return <Hotel className="w-4 h-4" />
      case 'RESTAURANT': return <Utensils className="w-4 h-4" />
      case 'ATTRACTION': return <MapPin className="w-4 h-4" />
      default: return <Sparkles className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TRANSPORT': return 'bg-blue-100 text-blue-700'
      case 'ACCOMMODATION': return 'bg-purple-100 text-purple-700'
      case 'RESTAURANT': return 'bg-orange-100 text-orange-700'
      case 'ATTRACTION': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TRANSPORT': return '교통'
      case 'ACCOMMODATION': return '숙소'
      case 'RESTAURANT': return '맛집'
      case 'ATTRACTION': return '관광'
      case 'ACTIVITY': return '액티비티'
      default: return type
    }
  }

  return (
    <div className="px-4 py-6 pb-24">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">AI 여행 플래너</h1>
        </div>
        <p className="text-sm text-gray-600">
          6개의 전문 AI가 협업하여 최적의 여행 계획을 만들어드려요
        </p>
      </div>

      {/* AI 분석 현황 */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">AI 전문가</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {agents.map((agent) => {
            const Icon = agent.icon
            const isCompleted = completedAgents.includes(agent.id)
            const isCurrent = currentAgent === agent.id
            return (
              <div
                key={agent.id}
                className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-all ${
                  isCurrent ? 'bg-white shadow-md scale-105' :
                  isCompleted ? 'bg-white/80' : 'bg-white/50'
                }`}
              >
                <div className={`p-2 rounded-full ${agent.bgColor} relative`}>
                  <Icon className={`w-4 h-4 ${agent.color}`} />
                  {isCompleted && (
                    <CheckCircle className="w-3 h-3 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-3 h-3 text-purple-500 absolute -top-1 -right-1 bg-white rounded-full animate-spin" />
                  )}
                </div>
                <span className="text-[10px] text-gray-600 mt-1 text-center whitespace-nowrap">
                  {agent.description}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {!result ? (
        /* 입력 폼 */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 목적지 */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              목적지
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {popularDestinations.map((dest) => (
                <button
                  key={dest.code}
                  type="button"
                  onClick={() => setDestination(dest.name)}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    destination === dest.name
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg block">{dest.emoji}</span>
                  <span className="text-xs">{dest.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAllAreas(!showAllAreas)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllAreas ? 'rotate-180' : ''}`} />
              전체 지역 보기
            </button>
            {showAllAreas && areas && (
              <div className="grid grid-cols-4 gap-1.5 mt-2 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                {areas.map((area) => (
                  <button
                    key={area.code}
                    type="button"
                    onClick={() => setDestination(area.name)}
                    className={`px-2 py-1 rounded text-xs ${
                      destination === area.name
                        ? 'bg-primary-500 text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* 날짜 & 인원 */}
          <Card className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="출발일"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="복귀일"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="예산 (원)"
                placeholder="500000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <Input
                type="number"
                label="인원"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                min="1"
                max="10"
              />
            </div>
          </Card>

          {/* 선호도 */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              여행 선호도 (복수 선택)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {preferenceOptions.map((pref) => (
                <button
                  key={pref.value}
                  type="button"
                  onClick={() => handlePreferenceToggle(pref.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    preferences.includes(pref.value)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{pref.emoji}</span>
                  <span className="text-xs block">{pref.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPlanning}
          >
            {isPlanning ? 'AI가 여행 계획 생성 중...' : '여행 계획 만들기'}
          </Button>
        </form>
      ) : (
        /* 결과 표시 */
        <div className="space-y-4">
          {/* 성공/실패 배너 */}
          <Card className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h3 className="font-semibold">
                  {result.success ? '계획 완성!' : '계획 생성 중 문제 발생'}
                </h3>
                <p className="text-sm text-gray-600">
                  {result.success
                    ? `${destination} ${(result.schedule || []).length}일 여행 계획이 준비되었습니다`
                    : (result.errors || []).join(', ') || '알 수 없는 오류'
                  }
                </p>
                {result.processingTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    처리 시간: {result.processingTime}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 예산 요약 */}
          {result.budgetPlan?.budget_breakdown && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold">예산 계획</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(result.budgetPlan.budget_breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {key === 'transport' ? '교통' :
                       key === 'accommodation' ? '숙소' :
                       key === 'food' ? '식비' :
                       key === 'activities' ? '액티비티' :
                       key === 'miscellaneous' ? '기타' :
                       key === 'total' ? '총합' : key}
                    </span>
                    <span className={key === 'total' ? 'font-bold text-primary-600' : ''}>
                      {(value as number).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
              {result.budgetPlan.savings_tips && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">절약 팁</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {result.budgetPlan.savings_tips.map((tip: string, i: number) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* 지도 */}
          {result.schedule && result.schedule.length > 0 && mapMarkers.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold">여행 지도</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedMapDay(null)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedMapDay === null
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  {result.schedule.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setSelectedMapDay(day.day)}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedMapDay === day.day
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Day {day.day}
                    </button>
                  ))}
                </div>
              </div>
              <KakaoMap
                markers={mapMarkers}
                height="250px"
                showRoute={true}
                selectedDay={selectedMapDay}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                마커를 클릭하면 장소 정보를 볼 수 있습니다
              </p>
            </Card>
          )}

          {/* 일정 */}
          {result.schedule && result.schedule.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold">상세 일정</h3>
            </div>
            <div className="space-y-2">
              {result.schedule.map((day) => (
                <div key={day.day} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary-500 text-white rounded-full text-sm font-bold">
                        {day.day}
                      </span>
                      <div className="text-left">
                        <span className="font-medium">Day {day.day}</span>
                        {day.theme && (
                          <span className="text-sm text-gray-500 ml-2">{day.theme}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${expandedDay === day.day ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedDay === day.day && day.items && (
                    <div className="p-3 space-y-2">
                      {day.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-2 bg-white border rounded-lg">
                          <div className="flex flex-col items-center">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{item.time}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getTypeColor(item.type)}`}>
                                {getTypeIcon(item.type)}
                                {getTypeLabel(item.type)}
                              </span>
                              {item.cost && item.cost > 0 && (
                                <span className="text-xs text-gray-500">
                                  {item.cost.toLocaleString()}원
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            {item.tips && (
                              <p className="text-xs text-primary-600 mt-1">💡 {item.tips}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          )}

          {/* AI별 결과 */}
          {result.agentResults && Object.keys(result.agentResults).length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">AI 분석 결과</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(result.agentResults || {}).filter(([_, agentResult]) =>
                agentResult && agentResult.status
              ).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  분석 결과가 없습니다
                </p>
              ) : (
                Object.entries(result.agentResults || {}).map(([key, agentResult]) => {
                  const agent = agents.find(a => a.id === key)
                  // 빈 객체이거나 status가 없으면 스킵
                  if (!agent || !agentResult || !agentResult.status) return null
                  const Icon = agent.icon
                  const recommendations = agentResult.recommendations || []
                  return (
                    <div key={key} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedAgent(expandedAgent === key ? null : key)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${agent.bgColor}`}>
                            <Icon className={`w-4 h-4 ${agent.color}`} />
                          </div>
                          <span className="font-medium">{agent.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            agentResult.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : agentResult.status === 'pending'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {agentResult.status === 'success' ? '완료' : agentResult.status === 'pending' ? '대기' : '실패'}
                          </span>
                          {recommendations.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ({recommendations.length}건)
                            </span>
                          )}
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${expandedAgent === key ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedAgent === key && (
                        <div className="p-3 bg-gray-50 border-t">
                          {recommendations.length > 0 ? (
                            <div className="space-y-2">
                              {recommendations.slice(0, 5).map((rec: any, idx: number) => (
                                <div key={idx} className="p-2 bg-white rounded border text-sm">
                                  <p className="font-medium">{rec.name || rec.type || '추천 항목'}</p>
                                  {rec.recommendation_reason && (
                                    <p className="text-gray-600 text-xs mt-1">{rec.recommendation_reason}</p>
                                  )}
                                  {rec.why_recommended && (
                                    <p className="text-gray-600 text-xs mt-1">{rec.why_recommended}</p>
                                  )}
                                  {rec.description && (
                                    <p className="text-gray-600 text-xs mt-1">{rec.description}</p>
                                  )}
                                  {rec.price_per_night && (
                                    <p className="text-primary-600 text-xs mt-1">₩{rec.price_per_night.toLocaleString()}/박</p>
                                  )}
                                  {rec.estimated_cost && (
                                    <p className="text-primary-600 text-xs mt-1">₩{rec.estimated_cost.toLocaleString()}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">추천 항목이 없습니다</p>
                          )}
                          {agentResult.notes && (
                            <p className="text-xs text-gray-500 mt-2 pt-2 border-t">{agentResult.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </Card>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setResult(null)
                setCompletedAgents([])
              }}
            >
              다시 계획하기
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateTrip}
            >
              여행 만들기
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
