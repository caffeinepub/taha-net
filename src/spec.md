# Specification

## Summary
**Goal:** Add a subscriber phone-number claim/login flow (10 digits starting with “09”) so authenticated users can link their profile and access “My Dues” using that phone.

**Planned changes:**
- Add a new Subscriber Login/Claim page with a single phone input (digits only), placeholder hint “09xxxxxxxx”, inline validation/error messaging, and a submit button disabled until valid.
- Implement a backend method to claim/link a subscriber by finding an active `Subscriber` whose `fullName` contains the provided phone substring; handle no match, multiple matches (ambiguity), and “already has real phone” cases as explicit errors; on success set `Subscriber.phone` and update `phoneToSubscriberId`.
- Integrate the new claim flow into the existing auth/profile flow so authenticated users without a saved profile can navigate to Subscriber Login; on successful claim, save `UserProfile.phone` and a display name derived from the claimed subscriber (or a fallback).
- Ensure the app transitions to/refreshes the existing “My Dues” flow after a successful claim without manual refresh by updating/invalidating React Query caches as needed.
- Apply a distinctive RTL-friendly visual theme for the new screen using existing shadcn + Tailwind components, avoiding a blue/purple-dominant palette and working in light/dark modes (if already supported).

**User-visible outcome:** An authenticated user without a saved profile can open a new Subscriber Login screen, enter a valid phone number in the format “09xxxxxxxx”, claim/link their subscriber account, and then view their “My Dues” results immediately.
