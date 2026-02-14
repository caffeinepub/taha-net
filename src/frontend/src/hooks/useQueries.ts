import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Subscriber, Package, BulkImportInput, BulkImportResult, DeleteAllSubscribersResult, MonthlyBillsResult, CallerPaymentDue, SubscriberResult, SubscriberLoginInput } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Package Queries
export function useGetAllPackages() {
  const { actor, isFetching } = useActor();

  return useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPackages();
    },
    enabled: !!actor && !isFetching,
  });
}

// Bulk Import
export function useBulkCreateSubscribers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkImportInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkCreateSubscribers(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });
}

// Create Single Subscriber
export function useCreateSubscriber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      fullName: string;
      phone: string;
      packageId: bigint;
      subscriptionStartDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createSubscriber(
        input.fullName,
        input.phone,
        input.packageId,
        input.subscriptionStartDate
      );
      
      // If backend returned an error, throw it
      if (result.error) {
        throw new Error(result.error);
      }
      
      // If no result was returned, throw a generic error
      if (!result.result) {
        throw new Error('Failed to create subscriber');
      }
      
      return result.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });
}

// Delete All Subscribers
export function useDeleteAllSubscribers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAllSubscribers();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['totals'] });
    },
  });
}

// Monthly Billing Query
export function useMonthlyBills(year: number, month: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyBillsResult>({
    queryKey: ['billing', 'month', year, month],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.fetchMonthlyBills(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// Caller Monthly Due Query
export function useGetCallerMonthlyDue(year: number, month: number) {
  const { actor, isFetching } = useActor();

  return useQuery<CallerPaymentDue>({
    queryKey: ['callerDue', year, month],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerMonthlyDue(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// Subscriber Claim Mutation
export function useClaimSubscriber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { phone: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      const loginInput: SubscriberLoginInput = {
        phone: input.phone,
        name: input.name,
        subscriberId: undefined,
      };
      
      const result = await actor.loginClaimSubscriber(loginInput);
      
      // If backend returned an error, throw it
      if (result.error) {
        throw new Error(result.error);
      }
      
      // If no result was returned, throw a generic error
      if (!result.result) {
        throw new Error('فشل ربط الحساب');
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful claim
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['callerDue'] });
    },
  });
}
