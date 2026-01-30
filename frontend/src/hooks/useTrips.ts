import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tripService } from '@/services/tripService'

export function useTrips(page = 0, size = 10) {
  return useQuery({
    queryKey: ['trips', page, size],
    queryFn: () => tripService.getTrips(page, size),
  })
}

export function useMyTrips() {
  return useQuery({
    queryKey: ['trips', 'my'],
    queryFn: () => tripService.getMyTrips(),
  })
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => tripService.getTrip(id),
    enabled: !!id,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tripService.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof tripService.updateTrip>[1] }) =>
      tripService.updateTrip(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tripService.deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useAIRecommendation() {
  return useMutation({
    mutationFn: tripService.getAIRecommendation,
  })
}

export function useUpdateSchedules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, schedules }: { tripId: number; schedules: Parameters<typeof tripService.updateSchedules>[1] }) =>
      tripService.updateSchedules(tripId, schedules),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
    },
  })
}
