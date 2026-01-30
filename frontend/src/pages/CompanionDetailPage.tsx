import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Calendar, Users, MessageCircle, Trash2, Check, X, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  useCompanion,
  useDeleteCompanion,
  useUpdateCompanion,
  useApplyCompanion,
  useCompanionApplications,
  useApproveApplication,
  useRejectApplication,
} from '@/hooks/useCompanions'
import { useConfirm } from '@/components/ConfirmModal'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Loading from '@/components/Loading'
import Input from '@/components/Input'

export default function CompanionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const confirm = useConfirm()

  const { data: companion, isLoading } = useCompanion(Number(id))
  const { data: applications } = useCompanionApplications(Number(id))
  const deleteMutation = useDeleteCompanion()
  const updateMutation = useUpdateCompanion()
  const applyMutation = useApplyCompanion()
  const approveMutation = useApproveApplication()
  const rejectMutation = useRejectApplication()

  const isOwner = user?.id === companion?.userId
  const canApply = isAuthenticated && !isOwner && companion?.status === 'RECRUITING'

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '모집글 삭제',
      message: '정말 이 모집글을 삭제하시겠습니까?\n삭제된 모집글은 복구할 수 없습니다.',
      confirmText: '삭제',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(Number(id))
      toast.success('모집글이 삭제되었습니다')
      navigate('/companions')
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  const handleClose = async () => {
    const confirmed = await confirm({
      title: '모집 마감',
      message: '모집을 마감하시겠습니까?\n마감 후에는 새로운 신청을 받을 수 없습니다.',
      confirmText: '마감',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await updateMutation.mutateAsync({
        id: Number(id),
        data: { status: 'CLOSED' },
      })
      toast.success('모집이 마감되었습니다')
    } catch {
      toast.error('마감 처리에 실패했습니다')
    }
  }

  const handleApply = async () => {
    try {
      await applyMutation.mutateAsync({
        companionId: Number(id),
        message: applyMessage,
      })
      setShowApplyModal(false)
      setApplyMessage('')
      toast.success('신청이 완료되었습니다')
    } catch {
      toast.error('신청에 실패했습니다')
    }
  }

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync({ companionId: Number(id), userId })
      toast.success('신청을 승인했습니다')
    } catch {
      toast.error('승인에 실패했습니다')
    }
  }

  const handleReject = async (userId: number) => {
    const confirmed = await confirm({
      title: '신청 거절',
      message: '이 신청을 거절하시겠습니까?',
      confirmText: '거절',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await rejectMutation.mutateAsync({ companionId: Number(id), userId })
      toast.success('신청을 거절했습니다')
    } catch {
      toast.error('거절에 실패했습니다')
    }
  }

  if (isLoading) return <Loading />
  if (!companion) return null

  return (
    <div className="px-4 py-6 space-y-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              companion.status === 'RECRUITING'
                ? 'bg-green-100 text-green-700'
                : companion.status === 'CLOSED'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {companion.status === 'RECRUITING' ? '모집중' : companion.status === 'CLOSED' ? '모집마감' : '취소됨'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{companion.title}</h1>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              {companion.status === 'RECRUITING' && (
                <button
                  onClick={handleClose}
                  disabled={updateMutation.isPending}
                  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg disabled:opacity-50"
                  title="모집 마감"
                >
                  <UserX className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title="삭제"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <p className="text-gray-700 whitespace-pre-wrap mb-4">{companion.content}</p>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span className="text-primary-600 font-medium">{companion.currentMembers}</span>
          <span>/ {companion.maxMembers}명</span>
        </div>
      </Card>

      {companion.trip && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">여행 정보</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{companion.trip.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(companion.trip.startDate), 'yyyy년 M월 d일', { locale: ko })} -{' '}
                {format(new Date(companion.trip.endDate), 'M월 d일', { locale: ko })}
              </span>
            </div>
          </div>
          <Link to={`/trips/${companion.tripId}`} className="block mt-3">
            <Button variant="outline" size="sm" className="w-full">
              여행 상세 보기
            </Button>
          </Link>
        </Card>
      )}

      {companion.user && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">모집자</h3>
          <div className="flex items-center gap-3">
            {companion.user.profileImage ? (
              <img
                src={companion.user.profileImage}
                alt={companion.user.nickname}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
            <span className="font-medium">{companion.user.nickname}</span>
          </div>
        </Card>
      )}

      {isOwner && applications && applications.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">신청 현황</h3>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {app.user?.profileImage ? (
                    <img
                      src={app.user.profileImage}
                      alt={app.user.nickname}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{app.user?.nickname}</p>
                    <p className="text-xs text-gray-500">{app.message}</p>
                  </div>
                </div>
                {app.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(app.userId)}
                      className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(app.userId)}
                      className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {app.status !== 'PENDING' && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {app.status === 'APPROVED' ? '승인' : '거절'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        {canApply && (
          <Button
            onClick={() => setShowApplyModal(true)}
            className="flex-1"
          >
            동행 신청하기
          </Button>
        )}
        {isOwner && companion.status === 'RECRUITING' && (
          <Button
            variant="warning"
            onClick={handleClose}
            isLoading={updateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <UserX className="w-5 h-5" />
            모집 마감
          </Button>
        )}
        {isOwner && (
          <Link to={`/chat`} className="flex-1">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              채팅방
            </Button>
          </Link>
        )}
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <Card className="w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">동행 신청</h3>
            <Input
              label="신청 메시지"
              placeholder="자기소개나 신청 이유를 작성해주세요"
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowApplyModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleApply}
                isLoading={applyMutation.isPending}
                className="flex-1"
              >
                신청하기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
