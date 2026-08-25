# UI_FLOWS.md — Farm SaaS v1.0.0

Design reference: FotMob — dense but scannable, card-based lists, strong use of color for status states, minimal chrome, bottom-tab navigation on mobile / sidebar on web.

## Platform Layout Strategy
- **Mobile (iOS/Android)**: bottom tab bar (Dashboard, Animals, Records, Alerts, More).
- **Web**: same route tree, left sidebar nav instead of bottom tabs, multi-column layouts at wider breakpoints (NativeWind responsive classes: `md:`, `lg:`).
- Single Expo Router route tree drives both — layout components branch on platform/breakpoint, not separate codebases.

## Route Map

```
(auth)/
  sign-in
  sign-up
  invite-accept/[token]        -- vet accepting a farm invite

(app)/
  farm-select                  -- shown if user belongs to 2+ farms, or after login
  [farmId]/
    dashboard                  -- rule-based analytics + alerts summary
    animals/
      index                    -- list, filter by status/breed/sex
      add
      [animalId]                -- detail: profile, lineage, linked vet/feed records
      [animalId]/edit
      import                   -- CSV mapping wizard
    vet-records/
      index
      add
      [recordId]
    feed-records/
      index
      add
      [recordId]
    notifications/
      index
    farm-settings/
      index                    -- farm details
      members                  -- invite/manage owner+vet access
    profile
```

## Key User Flows

### 1. Owner — First-Time Onboarding
1. Sign up → create first farm (name, location).
2. Prompted: "Import existing records?" → CSV upload → column-mapping preview → confirm import.
3. Land on Dashboard (empty-state guidance if no import).

### 2. Owner — Adding an Animal
1. Animals tab → "+" → form (Sheep ID, DOB, Sex, Breed, Sire/Dam picker — searches existing animals, Family Line, Status, Notes).
2. Save → returns to Animals list, new entry highlighted.

### 3. Owner/Vet — Logging a Treatment
1. From Animal detail → "Log Treatment" (or Vet Records tab → Add → animal picker).
2. Form includes withdrawal period days — app immediately shows computed withdrawal-end date on save confirmation.
3. If this pushes the animal into an active withdrawal window, a badge appears on the animal's card everywhere it's listed.

### 4. Owner — Attempting to Sell an Animal Under Withdrawal
1. Animal detail → change status to "Sold".
2. If withdrawal active → modal warning with withdrawal-end date, requires explicit override + reason text to proceed, or cancel.

### 5. Vet — Servicing Multiple Farms
1. Vet logs in → Farm Select screen (only shown farms they're a member of).
2. Within a farm, vet has read access to animals, write access to vet-records and can push a farm-wide alert notification (e.g. "Suspected outbreak — isolate affected animals").

### 6. Owner — Managing Multiple Farms
1. Farm Select screen (or farm switcher in header) lists all farms owned/joined.
2. Switching farm re-scopes all data (animals, records, dashboard) — no cross-farm bleed.

### 7. Any Member — Notifications
1. Bell icon badge (unread count) → Notifications list, grouped by type (Withdrawal, Vaccination Due, Vet Alert, General).
2. Tapping a notification deep-links to the related animal or record.

## Component/Screen Notes
- Status badges (Active/Sold/Culled, Withdrawal Active) reused consistently across list and detail views — single source-of-truth color mapping.
- Dashboard cards: Herd Composition, Treatment Frequency, Feed Trends, Withdrawal Compliance — each a tap-through to the fuller analytics view.
- Empty states throughout (no animals yet, no records yet) nudge toward Add or Import actions rather than showing blank screens.
