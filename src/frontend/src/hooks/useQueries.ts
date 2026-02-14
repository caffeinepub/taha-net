import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Subscriber, Package, BillingEntryView } from '../backend';

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

// Subscriber Queries
export function useGetAllActiveSubscribers() {
  const { actor, isFetching } = useActor();

  return useQuery<Subscriber[]>({
    queryKey: ['subscribers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveSubscribers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSubscriber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fullName: string;
      phone: string;
      packageId: bigint;
      subscriptionStartDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createSubscriber(
        data.fullName,
        data.phone,
        data.packageId,
        data.subscriptionStartDate
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
  });
}

export function useUpdateSubscriber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      phone: string;
      fullName: string;
      packageId: bigint;
      active: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubscriber(data.phone, data.fullName, data.packageId, data.active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

// Billing Queries
export function useGetBillingState(phone: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BillingEntryView[]>({
    queryKey: ['billing', phone],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBillingState(phone);
    },
    enabled: !!actor && !isFetching && !!phone,
  });
}

export function useSetMonthBillingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      phone: string;
      year: bigint;
      month: bigint;
      due: boolean;
      paid: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setMonthBillingStatus(data.phone, data.year, data.month, data.due, data.paid);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing', variables.phone] });
      queryClient.invalidateQueries({ queryKey: ['totals'] });
    },
  });
}

// Totals Queries
export function useGetTotalDueForMonth(year: bigint, month: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totals', 'month', year.toString(), month.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalDueForMonth(year, month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalDueForYear(year: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totals', 'year', year.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalDueForYear(year);
    },
    enabled: !!actor && !isFetching,
  });
}
