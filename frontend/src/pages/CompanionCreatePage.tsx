import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateCompanion } from '@/hooks/useCompanions'
import { useMyTrips } from '@/hooks/useTrips'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Loading from '@/components/Loading'

export default function CompanionCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tripIdParam = searchParams.get('tripId')

  const { data: trips, isLoading: tripsLoading } = useMyTrips()
  const createMutation = useCreateCompanion()

  const [formData, setFormData] = useState({
    tripId: tripIdParam || '',
    title: '',
    content: '',
    maxMembers: '4',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.tripId) newErrors.tripId = '여행을 선택해주세요'
    if (!formData.title.trim()) newErrors.title = '제목을 입력해주세요'
    if (!formData.content.trim()) newErrors.content = '내용을 입력해주세요'
    if (!formData.maxMembers || Number(formData.maxMembers) < 2) {
      newErrors.maxMembers = '최소 2명 이상이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const companion = await createMutation.mutateAsync({
      tripId: Number(formData.tripId),
      title: formData.title,
      content: formData.content,
      maxMembers: Number(formData.maxMembers),
    })

    navigate(`/companions/${companion.id}`)
  }

  if (tripsLoading) return <Loading />

  const availableTrips = trips?.filter((t) => t.status === 'PLANNING' || t.status === 'CONFIRMED') || []

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">동행 모집하기</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              여행 선택
            </label>
            <select
              value={formData.tripId}
              onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">여행을 선택하세요</option>
              {availableTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title} ({trip.destination})
                </option>
              ))}
            </select>
            {errors.tripId && (
              <p className="mt-1 text-sm text-red-500">{errors.tripId}</p>
            )}
          </div>

          <Input
            label="모집 제목"
            placeholder="예: 제주도 힐링 여행 동행 구합니다"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모집 내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="여행 스타일, 선호 동행 타입, 예상 경비 등을 작성해주세요"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          <Input
            type="number"
            label="모집 인원"
            placeholder="4"
            min={2}
            max={10}
            value={formData.maxMembers}
            onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
            error={errors.maxMembers}
          />
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createMutation.isPending}
        >
          모집글 작성하기
        </Button>
      </form>
    </div>
  )
}
