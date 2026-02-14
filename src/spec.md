# Specification

## Summary
**Goal:** Build an internet center subscriber accounting app that manages subscribers and USD monthly billing, including totals reporting.

**Planned changes:**
- Create backend data models and CRUD APIs for subscribers (name, WhatsApp phone, start date, packageId, active status) including deactivate/reactivate behavior.
- Create backend data model and API for USD-priced packages, pre-seeded with exactly: 1MB = $5/month, 2MB = $10/month.
- Implement backend monthly billing tracking per subscriber per (year, month) with due/paid status and due amount derived from the subscriber’s package USD price.
- Add backend reporting endpoints for monthly and yearly totals in USD (based on active subscribers).
- Build frontend screens to list/search subscribers, add/edit subscriber details, and deactivate/reactivate subscribers with immediate UI updates.
- Add a one-click “Open WhatsApp” action per subscriber that opens a wa.me link (with validation when missing/invalid).
- Build a monthly billing screen to select year/month, view active subscribers with package, USD due amount, and toggle paid/unpaid with persistence.
- Build a totals/reporting dashboard showing monthly and yearly totals in USD and display “TAHA @NET” in the app header.
- Apply a consistent UI theme (colors/typography/layout) suitable for an internet center billing tool, avoiding blue and purple.

**User-visible outcome:** Users can manage subscribers and packages, open WhatsApp chats from subscriber records, track monthly USD dues and paid status per subscriber, and view monthly/yearly USD totals in a themed app labeled “TAHA @NET”.
