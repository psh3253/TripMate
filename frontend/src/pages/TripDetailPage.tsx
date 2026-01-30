import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Calendar, Wallet, Sparkles, Clock, Trash2, Users, Plus, Edit2, GripVertical, X, Map } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useTrip, useDeleteTrip, useAIRecommendation, useUpdateSchedules } from '@/hooks/useTrips'
import { useConfirm } from '@/components/ConfirmModal'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Loading from '@/components/Loading'
import KakaoMap, { type MapMarker } from '@/components/KakaoMap'
import PlaceSearchMap, { type SelectedPlace } from '@/components/PlaceSearchMap'
import type { TripSchedule } from '@/types'

const themeLabels: Record<string, string> = {
  HEALING: '힐링',
  ADVENTURE: '모험',
  FOOD: '맛집',
  CULTURE: '문화',
  SHOPPING: '쇼핑',
  NATURE: '자연',
}

const placeTypeLabels: Record<string, { label: string; color: string }> = {
  ACCOMMODATION: { label: '숙소', color: 'bg-purple-100 text-purple-700' },
  RESTAURANT: { label: '맛집', color: 'bg-orange-100 text-orange-700' },
  ATTRACTION: { label: '관광', color: 'bg-blue-100 text-blue-700' },
  TRANSPORT: { label: '이동', color: 'bg-gray-100 text-gray-700' },
  ACTIVITY: { label: '액티비티', color: 'bg-green-100 text-green-700' },
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<TripSchedule[]>([])
  const [aiSummary, setAiSummary] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<TripSchedule | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingToDay, setAddingToDay] = useState<number>(1)

  const { data: trip, isLoading } = useTrip(Number(id))
  const deleteTripMutation = useDeleteTrip()
  const aiRecommendMutation = useAIRecommendation()
  const updateSchedulesMutation = useUpdateSchedules()
  const confirm = useConfirm()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '여행 삭제',
      message: '정말 이 여행을 삭제하시겠습니까?\n일정과 관련 데이터가 모두 삭제됩니다.',
      confirmText: '삭제',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteTripMutation.mutateAsync(Number(id))
      toast.success('여행이 삭제되었습니다')
      navigate('/trips')
    } catch (error: any) {
      const message = error.response?.data?.message || '삭제에 실패했습니다.'
      toast.error(message)
    }
  }

  const handleAIRecommend = async () => {
    const result = await aiRecommendMutation.mutateAsync(Number(id))
    setSchedules(result.schedules)
    setAiSummary(result.summary)
  }

  const handleSaveSchedules = async () => {
    try {
      await updateSchedulesMutation.mutateAsync({
        tripId: Number(id),
        schedules: displaySchedules,
      })
      setSchedules([])
      setIsEditMode(false)
      toast.success('일정이 저장되었습니다')
    } catch {
      toast.error('일정 저장에 실패했습니다')
    }
  }

  const handleDeleteSchedule = (targetSchedule: TripSchedule) => {
    const currentSchedules = schedules.length > 0 ? schedules : [...(trip?.schedules || [])]
    setSchedules(currentSchedules.filter(s =>
      !(s.dayNumber === targetSchedule.dayNumber &&
        s.time === targetSchedule.time &&
        s.placeName === targetSchedule.placeName)
    ))
  }

  const handleEditSchedule = (schedule: TripSchedule, index: number) => {
    setEditingSchedule({ ...schedule })
    setEditingIndex(index)
  }

  const handleSaveEdit = () => {
    if (!editingSchedule || editingIndex < 0) return
    const currentSchedules = schedules.length > 0 ? schedules : [...(trip?.schedules || [])]
    const newSchedules = [...currentSchedules]
    newSchedules[editingIndex] = editingSchedule
    setSchedules(newSchedules)
    setEditingSchedule(null)
    setEditingIndex(-1)
  }

  const handleAddSchedule = (newSchedule: Omit<TripSchedule, 'id'>) => {
    const currentSchedules = schedules.length > 0 ? schedules : [...(trip?.schedules || [])]
    setSchedules([...currentSchedules, newSchedule as TripSchedule])
    setShowAddModal(false)
  }

  // 지도 표시 상태
  const [selectedMapDay, setSelectedMapDay] = useState<number | null>(null)

  if (isLoading) return <Loading />
  if (!trip) return null

  const displaySchedules = schedules.length > 0 ? schedules : trip.schedules || []
  const hasChanges = schedules.length > 0
  const tripDays = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
  const groupedSchedules = displaySchedules.reduce((acc, schedule) => {
    const day = schedule.dayNumber
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<number, TripSchedule[]>)

  // 지도 마커 생성
  const mapMarkers: MapMarker[] = displaySchedules
    .filter(s => s.lat && s.lng)
    .map((s, index) => ({
      lat: s.lat,
      lng: s.lng,
      name: s.placeName,
      type: s.placeType,
      day: s.dayNumber,
      order: index + 1,
    }))

  return (
    <div className="px-4 py-6 space-y-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
          <button
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-gray-600">
          <div className="flex items-center gap-3 flex-wrap">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span>{trip.destination}</span>
            {trip.themes?.map((theme) => (
              <span key={theme} className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-sm">
                {themeLabels[theme]}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span>
              {format(new Date(trip.startDate), 'yyyy년 M월 d일', { locale: ko })} -{' '}
              {format(new Date(trip.endDate), 'M월 d일', { locale: ko })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-gray-400" />
            <span>예산: {trip.budget.toLocaleString()}원</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleAIRecommend}
          isLoading={aiRecommendMutation.isPending}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          AI 일정 추천
        </Button>
        <Link to={`/companions/create?tripId=${trip.id}`} className="flex-1">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            동행 모집
          </Button>
        </Link>
      </div>

      {aiSummary && (
        <Card className="bg-primary-50 border-primary-200">
          <h3 className="font-semibold text-primary-800 mb-2">AI 추천 요약</h3>
          <p className="text-sm text-primary-700">{aiSummary}</p>
        </Card>
      )}

      {/* 지도 */}
      {mapMarkers.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold">여행 지도</h3>
            </div>
            <div className="flex gap-1 flex-wrap">
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
              {Array.from({ length: tripDays }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedMapDay(day)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedMapDay === day
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Day {day}
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

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">일정</h2>
          <div className="flex gap-2">
            {displaySchedules.length > 0 && (
              <Button
                size="sm"
                variant={isEditMode ? "primary" : "outline"}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                {isEditMode ? '편집 완료' : '일정 편집'}
              </Button>
            )}
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSaveSchedules}
                isLoading={updateSchedulesMutation.isPending}
              >
                저장
              </Button>
            )}
          </div>
        </div>

        {Object.keys(groupedSchedules).length > 0 ? (
          Object.entries(groupedSchedules)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, daySchedules]) => (
              <Card key={day}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Day {day}</h3>
                  {isEditMode && (
                    <button
                      onClick={() => { setAddingToDay(Number(day)); setShowAddModal(true) }}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      장소 추가
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {daySchedules
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((schedule, index) => {
                      const placeType = placeTypeLabels[schedule.placeType] || placeTypeLabels.ACTIVITY
                      return (
                        <div key={index} className="flex gap-3 group">
                          {isEditMode && (
                            <div className="flex flex-col items-center pt-1">
                              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                            </div>
                          )}
                          <div className="flex flex-col items-center">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div className="flex-1 w-px bg-gray-200 my-1" />
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500">{schedule.time}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${placeType.color}`}>
                                {placeType.label}
                              </span>
                              {isEditMode && (
                                <div className="flex gap-1 ml-auto">
                                  <button
                                    onClick={() => {
                                      const idx = displaySchedules.findIndex(s =>
                                        s.dayNumber === schedule.dayNumber &&
                                        s.time === schedule.time &&
                                        s.placeName === schedule.placeName
                                      )
                                      handleEditSchedule(schedule, idx)
                                    }}
                                    className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchedule(schedule)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{schedule.placeName}</h4>
                            {schedule.description && (
                              <p className="text-sm text-gray-600 mt-1">{schedule.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </Card>
            ))
        ) : (
          <Card className="text-center py-8 text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="mb-4">AI 추천을 받거나 직접 일정을 추가해보세요</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setAddingToDay(1); setShowAddModal(true) }}
            >
              <Plus className="w-4 h-4 mr-1" />
              직접 일정 추가
            </Button>
          </Card>
        )}
      </section>

      {/* 일정 수정 모달 */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">일정 수정</h3>
              <button onClick={() => { setEditingSchedule(null); setEditingIndex(-1) }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장소명</label>
                <input
                  type="text"
                  value={editingSchedule.placeName}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, placeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={editingSchedule.dayNumber}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, dayNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Array.from({ length: tripDays }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>Day {day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                  <select
                    value={editingSchedule.placeType}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, placeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="ATTRACTION">관광</option>
                    <option value="RESTAURANT">맛집</option>
                    <option value="ACCOMMODATION">숙소</option>
                    <option value="ACTIVITY">액티비티</option>
                    <option value="TRANSPORT">이동</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
                <TimeSelector
                  value={editingSchedule.time}
                  onChange={(time) => setEditingSchedule({ ...editingSchedule, time })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={editingSchedule.description || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setEditingSchedule(null); setEditingIndex(-1) }} className="flex-1">
                취소
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 장소 추가 모달 */}
      {showAddModal && (
        <AddScheduleModal
          dayNumber={addingToDay}
          totalDays={tripDays}
          destination={trip.destination}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSchedule}
        />
      )}
    </div>
  )
}

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00',
]

function TimeSelector({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1">
      {TIME_SLOTS.map((time) => (
        <button
          key={time}
          type="button"
          onClick={() => onChange(time)}
          className={`py-1.5 px-2 text-sm rounded-lg transition-colors ${
            value === time
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {time}
        </button>
      ))}
    </div>
  )
}

function AddScheduleModal({
  dayNumber,
  totalDays,
  destination,
  onClose,
  onAdd,
}: {
  dayNumber: number
  totalDays: number
  destination: string
  onClose: () => void
  onAdd: (schedule: Omit<TripSchedule, 'id'>) => void
}) {
  const [form, setForm] = useState({
    dayNumber: dayNumber,
    placeName: '',
    time: '10:00',
    placeType: 'ATTRACTION',
    description: '',
    lat: 0,
    lng: 0,
  })

  const handlePlaceSelect = (place: SelectedPlace) => {
    setForm(prev => ({
      ...prev,
      placeName: place.name || prev.placeName,
      lat: place.lat,
      lng: place.lng,
      description: place.address,
    }))
  }

  const handleSubmit = () => {
    if (!form.placeName.trim()) {
      toast.error('장소명을 입력해주세요')
      return
    }
    onAdd({
      dayNumber: form.dayNumber,
      placeName: form.placeName,
      time: form.time,
      placeType: form.placeType,
      description: form.description,
      // 좌표가 0이면 null로 처리 (유효하지 않은 좌표)
      lat: form.lat && form.lat !== 0 ? form.lat : null as any,
      lng: form.lng && form.lng !== 0 ? form.lng : null as any,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">장소 추가</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 지도 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              장소 검색
            </label>
            <PlaceSearchMap
              onSelectPlace={handlePlaceSelect}
              destination={destination}
            />
          </div>

          {/* 장소명 (검색으로 자동 입력 또는 직접 입력) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장소명 *</label>
            <input
              type="text"
              value={form.placeName}
              onChange={(e) => setForm({ ...form, placeName: e.target.value })}
              placeholder="검색하거나 직접 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={form.dayNumber}
                onChange={(e) => setForm({ ...form, dayNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={form.placeType}
                onChange={(e) => setForm({ ...form, placeType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ATTRACTION">관광</option>
                <option value="RESTAURANT">맛집</option>
                <option value="ACCOMMODATION">숙소</option>
                <option value="ACTIVITY">액티비티</option>
                <option value="TRANSPORT">이동</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
            <TimeSelector value={form.time} onChange={(time) => setForm({ ...form, time })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="예: 고궁 투어 및 수문장 교대식 관람"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            추가
          </Button>
        </div>
      </div>
    </div>
  )
}
