# VolleyPro - Beach Volleyball Tournament Management System

## Original Problem Statement
Build a beach volleyball tournament management system with:
- Group Phase followed by Knockout Phase
- Tournament creation with configurable match rules
- Team management with player names
- Round-robin group matches with standings tables
- Single-elimination knockout brackets
- Match score entry with set-by-set scoring
- PDF/Text export of results
- Mobile-friendly interface

## User Choices
- JWT-based custom authentication (email/password)
- MongoDB database for persistence
- PDF export feature (implemented as text export)
- Single view (no separate spectator view)
- Beach/tropical theme (Sunset Orange, Ocean Turquoise, Sand White)

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI with async MongoDB (Motor)
- **Database**: MongoDB
- **Auth**: JWT tokens with bcrypt password hashing

## User Personas
1. **Tournament Organizer**: Creates/manages tournaments, enters scores, manages teams
2. **Team Captain**: Views standings, bracket, and schedule

## Core Requirements (Static)
- [x] User authentication (register/login)
- [x] Tournament CRUD operations
- [x] Team management with player names
- [x] Group phase with round-robin fixtures
- [x] Standings table with tiebreakers
- [x] Knockout bracket generation
- [x] Match score entry (set-by-set)
- [x] Results export
- [x] Mobile-responsive design

## What's Been Implemented (Feb 2026)
### Backend
- JWT authentication endpoints (register, login, me)
- Tournament CRUD with configurable rules
- Team management (add, update, delete)
- Auto group assignment with round-robin match generation
- Match scoring with winner calculation
- Standings update with tiebreaker sorting
- Knockout phase generation with seeding
- Text export endpoint

### Frontend
- Login/Register pages with beach theme
- Dashboard with tournament list
- Tournament creation wizard
- Team management UI
- Group standings tables
- Bracket view with round selector (swipe-deck pattern)
- Big-tap score input modal
- Export functionality

## P0 Features (Done)
- [x] Auth flow
- [x] Tournament creation
- [x] Team management
- [x] Group phase
- [x] Knockout phase
- [x] Score entry
- [x] Export

## P1 Features (Next Phase)
- [ ] Real PDF generation (with reportlab)
- [ ] Match scheduling with courts/time slots
- [ ] Manual group assignment UI
- [ ] Public spectator view

## P2 Features (Future)
- [ ] Multiple simultaneous courts
- [ ] Tournament history/stats
- [ ] Team rankings across tournaments
- [ ] Real-time score updates (WebSockets)

## Next Tasks
1. Add proper PDF generation with tournament brackets
2. Implement match scheduling with calendar
3. Add public shareable link for spectators
4. Improve mobile score entry with vibration feedback
