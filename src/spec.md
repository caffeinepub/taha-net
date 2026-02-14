# Specification

## Summary
**Goal:** Show each active subscriber’s full name alongside the amount owed for a selected month/year (including March) in the Monthly Billing view.

**Planned changes:**
- Add an admin-only Motoko query in `backend/main.mo` that accepts `(year: Nat, month: Nat)` and returns entries including `subscriberId`, `fullName`, and `amountUsd`, computed from the subscriber’s package price for active subscribers eligible for that month.
- Add a typed React Query hook in `frontend/src/hooks/useQueries.ts` to call the new backend query, with a cache key parameterized by `year` and `month`, and consistent handling when the actor is unavailable.
- Update `frontend/src/pages/BillingPage.tsx` to fetch billing entries for the selected month/year and render a table/list with “Subscriber Name” and “Amount Owed (USD)”, including loading (skeleton/equivalent) and error (English alert) states, and remove/replace the existing “billing unavailable” placeholder.

**User-visible outcome:** Admin users can select a month/year (e.g., March = 3) on the Monthly Billing page and see a list of subscriber names with their corresponding amount owed for that month.
