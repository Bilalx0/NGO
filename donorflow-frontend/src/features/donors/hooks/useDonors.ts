import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Donor, PaginatedResponse } from '@/types/api';
import type { DonorInput, DonorFiltersInput } from '../schemas/donor.schema';
import { toast } from 'sonner';

export function useDonors(filters: DonorFiltersInput) {
  return useQuery<PaginatedResponse<Donor>>({
    queryKey: ['donors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/donors?${params.toString()}`);
      return response.data;
    },
  });
}

export function useDonor(id: number) {
  return useQuery<Donor & { donations?: any[] }>({
    queryKey: ['donor', id],
    queryFn: async () => {
      const response = await api.get(`/donors/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DonorInput) => {
      const response = await api.post('/donors', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      toast.success('Donor created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create donor');
    },
  });
}

export function useUpdateDonor(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DonorInput>) => {
      const response = await api.patch(`/donors/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donor', id] });
      toast.success('Donor updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update donor');
    },
  });
}

export function useDeleteDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/donors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      toast.success('Donor deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate donor');
    },
  });
}