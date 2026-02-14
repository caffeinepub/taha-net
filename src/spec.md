# Specification

## Summary
**Goal:** Add an admin-only “Delete all subscribers” bulk action that removes all subscribers and all subscriber-related billing/derived state across backend and frontend.

**Planned changes:**
- Add an admin-only backend API in `backend/main.mo` to delete all subscribers and all subscriber-keyed derived/billing state, returning the number of subscriber records deleted.
- Add a React Query mutation hook in `frontend/src/hooks/useQueries.ts` to call the bulk-delete API and invalidate/refetch affected queries (subscribers, billing, totals).
- Add an admin-only control in `frontend/src/pages/SubscribersPage.tsx` to trigger the bulk delete with an irreversible confirmation dialog, pending-state disabling, and success/error feedback.

**User-visible outcome:** Admins can delete all subscribers (and related billing data) from the Subscribers page after confirming; the UI refreshes to show an empty subscriber list and cleared totals/billing, while non-admins do not see the action.
