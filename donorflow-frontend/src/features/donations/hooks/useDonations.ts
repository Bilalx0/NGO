import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Donation, PaginatedResponse } from '@/types/api';
import type { RecordDonationInput, DonationFiltersInput } from '../schemas/donation.schema';
import { toast } from 'sonner';

export function useDonations(filters: DonationFiltersInput) {
  return useQuery<PaginatedResponse<Donation>>({
    queryKey: ['donations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.campaignId) params.append('campaignId', filters.campaignId.toString());
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);

      const response = await api.get(`/donations?${params.toString()}`);
      return response.data;
    },
  });
}

export function useDonationReceipt(id: number) {
  return useQuery<Donation>({
    queryKey: ['donation-receipt', id],
    queryFn: async () => {
      const response = await api.get(`/donations/${id}/receipt`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useRecordDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RecordDonationInput) => {
      const response = await api.post('/donations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Donation recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record donation');
    },
  });
}