import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Search } from 'lucide-react'
import { useCompanions } from '@/hooks/useCompanions'
import { useAuthStore } from '@/stores/authStore'
import CompanionCard from '@/components/CompanionCard'
import Button from '@/components/Button'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Input from '@/components/Input'

export default function CompanionsPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useCompanions()

  const companions = data?.content || []
  const filteredCompanions = companions.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.trip?.destination.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">동행 모집</h1>
        {isAuthenticated && (
          <Link to="/companions/create">
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              모집하기
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="목적지 또는 제목으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : filteredCompanions.length > 0 ? (
        <div className="space-y-4">
          {filteredCompanions.map((companion) => (
            <CompanionCard key={companion.id} companion={companion} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="모집 중인 동행이 없어요"
          description={isAuthenticated ? '첫 번째 동행을 모집해보세요' : '로그인 후 동행을 모집할 수 있어요'}
          action={
            isAuthenticated ? (
              <Link to="/companions/create">
                <Button>동행 모집하기</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="kakao">로그인하기</Button>
              </Link>
            )
          }
        />
      )}
    </div>
  )
}
