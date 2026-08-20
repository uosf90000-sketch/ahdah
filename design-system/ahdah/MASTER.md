# Ahdah Design System

Source of truth for the Arabic RTL, mobile-first product UI. Direction derived from UI/UX Pro Max searches for P2P marketplaces, logistics/delivery, trust, mobile forms, and Next.js.

## Product direction

- Style: Minimalism / Swiss-inspired, with a calm travel-tech personality.
- Brand promise: a documented chain of custody, not a generic delivery marketplace.
- Mobile priority: one primary action per screen, 48px minimum touch targets, bottom navigation with four destinations.
- Avoid: decorative gradients on every card, excessive pills, emoji icons, low-contrast gray text, and long single-screen forms.

## Color tokens

- Ink / navigation: `#0B1F33`
- Primary: `#146EF5`
- Primary hover: `#0E56C9`
- Accent / route marker: `#F36B3D`
- Success: `#0E9F6E`
- Background: `#F5F7FB`
- Surface: `#FFFFFF`
- Main text: `#10243E`
- Secondary text: `#52647A`
- Border: `#DDE4ED`
- Error: `#D92D20`

## Typography

- Family: IBM Plex Sans Arabic for both Arabic and Latin UI text.
- Screen title: 32–48px / 700.
- Section heading: 20–24px / 700.
- Body: 16px / 400, line-height 1.7.
- Labels and buttons: 14–16px / 600.
- Use tabular figures for prices, OTPs, dates, and shipment references.

## Layout and components

- Spacing: 4/8px rhythm; section gaps 32/48/64px.
- Mobile gutters: 16px; tablet 24px; desktop 32px.
- Cards: 20–24px radius, 1px neutral border, restrained shadow.
- Inputs: 56px high, visible label, helper or inline error where needed.
- Motion: opacity/transform only, 160–240ms; disable non-essential motion for `prefers-reduced-motion`.
- Fixed navigation must respect safe-area insets and never cover scroll content.

## Core journeys

- Registration: one account with an explicit recommended “sender + traveler” role.
- Shipment: three visible steps — route, shipment details, recipient/review.
- Trip: one short form, then matching results.
- Custody: status timeline, original photos, inspection acknowledgement, new inspection photos, QR/OTP handover.

## Quality gate

- Test at 375px, 768px, 1024px, and 1440px.
- Text contrast at least 4.5:1; non-text controls at least 3:1.
- Keyboard focus visible and not obscured by sticky navigation.
- All icon controls have accessible names; decorative icons are hidden.
- Never use color as the only status indicator.
