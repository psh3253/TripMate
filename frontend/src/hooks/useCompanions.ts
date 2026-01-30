import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companionService } from '@/services/companionService'

interface CompanionFilters {
  destination?: string
  theme?: string
  startDate?: string
  endDate?: string
}

export function useCompanions(page = 0, size = 10, filters?: CompanionFilters) {
  return useQuery({
    queryKey: ['companions', page, size, filters],
    queryFn: () => companionService.getCompanions(page, size, filters),
  })
}

export function useCompanion(id: number) {
  return useQuery({
    queryKey: ['companions', id],
    queryFn: () => companionService.getCompanion(id),
    enabled: !!id,
  })
}

export function useCreateCompanion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: companionService.createCompanion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companions'] })
    },
  })
}

export function useUpdateCompanion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof companionService.updateCompanion>[1] }) =>
      companionService.updateCompanion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companions', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['companions'] })
    },
  })
}

export function useDeleteCompanion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: companionService.deleteCompanion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companions'] })
    },
  })
}

export function useApplyCompanion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companionId, message }: { companionId: number; message: string }) =>
      companionService.apply(companionId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companions', variables.companionId] })
    },
  })
}

export function useCompanionApplications(companionId: number) {
  return useQuery({
    queryKey: ['companions', companionId, 'applications'],
    queryFn: () => companionService.getApplications(companionId),
    enabled: !!companionId,
  })
}

export function useApproveApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companionId, userId }: { companionId: number; userId: number }) =>
      companionService.approveApplication(companionId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companions', variables.companionId] })
    },
  })
}

export function useRejectApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companionId, userId }: { companionId: number; userId: number }) =>
      companionService.rejectApplication(companionId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companions', variables.companionId] })
    },
  })
}
