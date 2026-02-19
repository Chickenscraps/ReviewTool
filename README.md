<<<<<<< HEAD
# Tobie Dashboard

**Governed benefits communication platform for video production teams**

## Overview

Tobie Dashboard is a mobile-first, AI-powered project management dashboard designed for a 2-person video production startup (Josh & Ann). It provides centralized project management, task tracking, intelligent workflow recommendations, and (planned) integrated video review capabilities—all enhanced by AI assistance.

### Vision

Built on the principle that project management should be **simple, intuitive, and just work**. Tobie Dashboard focuses on what matters: upcoming deliverables, timelines, and collaboration, while hiding complexity until needed through progressive disclosure. An integrated AI "copilot" helps with planning, makes adjustments on command, logs all changes for audit, and intelligently handles project feedback.

### Key Value Proposition

- **For Leadership**: Auditability, compliance, measurable workflow efficiency, and AI-assisted decision making
- **For Team Members**: Clarity, calm, "tell me what this means right now" simplicity with AI guidance
- **For Clients** (planned): Streamlined video review with AI-powered feedback assistance
- **Governed Communication**: Approved once, deployed everywhere with complete traceability

## Project Status

✅ **Phase 1-3: COMPLETE** - Documentation, monorepo scaffold, database, authentication  
✅ **Phase 4: 90% COMPLETE** - Web UI with mobile responsiveness and brand styling  
🚧 **Phase 5-7: PLANNED** - Desktop agent, task recommender, testing

### What Works Right Now

- ✅ User authentication with NextAuth.js
- ✅ Role-based access control (Admin, Designer roles)
- ✅ Dashboard with priority tasks and bottleneck detection
- ✅ Project and task management
- ✅ Admin panel (user management, roles, audit logs)
- ✅ Mobile-responsive design (iPhone optimized)
- ✅ Brand-compliant UI (Tobie brand guide colors)

### Planned Features (See [Comprehensive Plan](./Project%20Management%20Dashboard%20with%20Integrated%20AI%20–%20Comprehensive%20Plan.txt))

- 🎯 **AI Integration**: Natural language task management, timeline planning, scope detection
- 🎯 **Video Review Portal**: Time-coded comments, AI chat assistant, automated transcripts
- 🎯 **Advanced Mobile UI**: Drag-drop scheduling, progressive disclosure, timeline focus
- 🎯 **File Storage**: Supabase integration for asset uploads and management
- 🎯 **Real-time Collaboration**: WebSocket notifications and live updates
- 🎯 **Client Portal**: External stakeholder access with video review capabilities

## Architecture

### Technology Stack

**Frontend:**
- Next.js 15.5.9 (App Router)
- React 18
- TypeScript
- Tailwind CSS (with Tobie brand colors)
- NextAuth.js v5 (beta.25) for authentication

**Backend:**
- Next.js API Routes
- Prisma ORM
- SQLite (development) / PostgreSQL (production ready)

**Monorepo:**
- pnpm workspaces
- Turborepo for build orchestration

**Shared Packages:**
- `@tobie/shared` - Types, validation (Zod), utilities
- `@tobie/agent-core` - Task recommendation engine
- `@tobie/audit` - Append-only audit logging

### Project Structure

```
ORG AI AGENT/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   │   ├── (dashboard)/
│   │   │   │   ├── login/
│   │   │   │   └── api/
│   │   │   └── lib/           # Auth, Prisma, permissions
│   │   └── prisma/
│   │       ├── schema.prisma  # Database schema
│   │       └── seed.ts        # Demo data
│   └── desktop/               # Tauri desktop app (planned)
│
├── packages/
│   ├── shared/                # Shared types & utilities
│   ├── agent-core/            # AI recommendation engine
│   └── audit/                 # Audit logging
│
├── docs/                      # Comprehensive documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── THREAT_MODEL.md
│   ├── DB_SCHEMA.prisma
│   ├── API_SPEC.yaml
│   └── MVP_PLAN.md
│
└── package.json               # Root monorepo config
```

## Database Schema

**Core Models:**
- **User** - Authentication, profile, role assignment
- **Role** - Admin, Designer, Client (extensible)
- **Permission** - Granular permissions (admin.viewUsers, projects.create, etc.)
- **Project** - Video production projects with templates
- **Task** - Kanban tasks with dependencies and status tracking
- **FileAttachment** - Indexed files with metadata
- **Notification** - In-app notifications
- **AuditLog** - Immutable audit trail
- **UserSettings** - Preferences and configuration

## Brand Identity

Following the official **Tobie Brand Guide**:

**Colors:**
- Background Dark: `#0F0F10`
- Brand Blue: `#3D85C6` (primary CTAs, accents)
- Surface Light: `#F4F4F4` (cards)
- Text Headline: `#FFFFFF`
- Text Secondary: `#BFC3C9`
- Success Green: `#4CAF50`
- Risk Red: `#E5593D`

**Typography:**
- Logo: "tobie.team" (lowercase)
- Tagline: "governed benefits communication"
- Font: Inter

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```powershell
# Clone repository (if not already local)
cd "C:\Users\josha\OneDrive\Desktop\ORG AI AGENT"

# Install dependencies
pnpm install

# Generate Prisma client
cd apps\web
npx prisma generate

# Initialize database with demo data
npx prisma db push
pnpm db:seed
```

### Running the Application

```powershell
# Start development server
cd apps\web
pnpm dev
```

Navigate to `http://localhost:3000`

### Demo Accounts

**Admin Account:**
- Email: `josh@tobie.team`
- Password: `TobieAdmin2026!`
- Permissions: Full access

**Designer Account:**
- Email: `ann@tobie.team`
- Password: `TobieDesigner2026!`
- Permissions: Limited (no admin panel)

## Key Features

### 1. Authentication & Authorization

- NextAuth.js credentials provider
- JWT session management (24-hour expiry)
- Password hashing with bcryptjs
- Audit logging for all login attempts
- Session-embedded RBAC data

### 2. Dashboard

- Personalized greeting
- Active project count
- Open tasks summary
- Due soon notifications
- Priority task recommendations
- Bottleneck detection
- Recent projects list

### 3. Project Management

- Create from templates ("30-Second Explainer", "Benefits Deep Dive")
- Progress tracking
- Task assignment
- Status indicators

### 4. Task Management

- Kanban board view
- Task dependencies
- Priority levels (Low, Medium, High)
- Status tracking (TODO, IN_PROGRESS, DONE)
- Assignee management

### 5. Admin Panel (RBAC Protected)

**Users Page:**
- User list with roles
- Permission viewer

**Roles Page:**
- Role management
- Permission assignment

**Audit Log:**
- Immutable event tracking
- User actions
- System events

### 6. Mobile Responsiveness

- Hamburger navigation menu
- Touch-optimized UI (44px+ targets)
- Responsive typography
- Single-column layouts on mobile
- Verified on iPhone dimensions (390x844)

### 7. AI-Powered Features (Implemented in `@tobie/agent-core`)

- **Priority Calculator**: Scores tasks based on urgency, dependencies, team capacity
- **Bottleneck Detector**: Identifies blocking tasks and resource constraints
- **Action Recommender**: Suggests next steps based on project state

## API Endpoints

### Authentication
- `POST /api/auth/callback/credentials` - Login
- `GET /api/auth/providers` - Auth providers
- `GET /api/auth/session` - Current session

### Projects (Planned)
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Project details
- `PATCH /api/projects/:id` - Update project

### Tasks (Planned)
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task

See [docs/API_SPEC.yaml](./docs/API_SPEC.yaml) for full OpenAPI specification.

## Security & Compliance

### Implemented Mitigations

1. **Authentication**
   - bcrypt password hashing (cost factor: 10)
   - JWT with short expiration
   - HTTPS enforcement (production)

2. **Authorization**
   - Permission checks on API routes
   - Server-side session validation
   - Role-based UI rendering

3. **Audit Logging**
   - All authentication attempts
   - User actions
   - Admin operations
   - Immutable log storage

4. **Input Validation**
   - Zod schema validation
   - SQL injection prevention (Prisma)
   - XSS prevention (React escaping)

See [docs/THREAT_MODEL.md](./docs/THREAT_MODEL.md) for complete threat analysis.

## Development

### Build Commands

```powershell
# Build all packages
pnpm build

# Build specific package
pnpm --filter @tobie/web build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Database Commands

```powershell
# Open Prisma Studio (database GUI)
pnpm --filter web db:studio

# Apply schema changes
pnpm --filter web db:push

# Re-seed database
pnpm --filter web db:seed

# Create migration (production)
pnpm --filter web db:migrate
```

### Environment Variables

Create `apps/web/.env.local`:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Technical Highlights

### NextAuth v5 Compatibility Fix

**Problem**: Initial implementation used Next.js 14.1.0 (deprecated) causing:
```
TypeError: next_dist_server_web_exports_next_request__WEBPACK_IMPORTED_MODULE_0__ is not a constructor
```

**Solution**: Upgraded to Next.js 15.5.9 + next-auth 5.0.0-beta.25

### Mobile-First Responsive Design

- Sliding sidebar with transform animations
- Touch-manipulation optimized
- Responsive breakpoints (md: 768px)
- Hamburger menu for mobile navigation

### Glassmorphism UI

- Backdrop blur effects
- Semi-transparent cards
- Layered depth
- Brand-compliant color overlays

## Roadmap

### Phase 1-4: Foundation (COMPLETE) ✅
- [x] Documentation, monorepo scaffold, database, authentication
- [x] Web UI with mobile responsiveness and brand styling
- [x] Core project and task management
- [x] Admin panel with RBAC

### Phase 5: AI Integration (PLANNED) 🎯
- [ ] Tobie Dashboard AI agent implementation (`@tobie/agent-core`)
- [ ] Natural language task management
- [ ] Timeline planning and suggestions
- [ ] OpenAI/Anthropic/Gemini multi-model integration
- [ ] Chat transcript storage and audit logging

### Phase 6: Video Review Portal (PLANNED) 🎯
- [ ] Video upload and playback interface
- [ ] Time-coded comments system
- [ ] AI chat assistant for feedback
- [ ] Version control for video assets
- [ ] Scope detection during review
- [ ] Automated transcript generation

### Phase 7: File Storage & Real-time (PLANNED) 🎯
- [ ] Supabase storage integration
- [ ] File upload UI across projects
- [ ] Real-time notifications via WebSocket
- [ ] Live collaboration features

### Phase 8: Advanced Features (PLANNED) 🎯
- [ ] Drag-drop timeline/Gantt view
- [ ] Client role and external portal
- [ ] Exportable AI-generated reports
- [ ] Advanced mobile optimizations
- [ ] Desktop agent (Tauri v2)

### Phase 9: Testing & Polish (FUTURE)
- [ ] Unit tests (Vitest)
- [ ] RBAC integration tests
- [ ] E2E browser tests
- [ ] Performance optimization
- [ ] Production deployment guide

## Documentation

Comprehensive documentation in `/docs`:

- **[PRD.md](./docs/PRD.md)** - Product requirements, personas, user journeys
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design, data flows
- **[THREAT_MODEL.md](./docs/THREAT_MODEL.md)** - Security analysis
- **[API_SPEC.yaml](./docs/API_SPEC.yaml)** - OpenAPI specification
- **[MVP_PLAN.md](./docs/MVP_PLAN.md)** - 3-milestone delivery plan
- **[CONFIG.md](./docs/CONFIG.md)** - Configuration guide
- **[DECISION_MEMO.md](./docs/DECISION_MEMO.md)** - Technology choices

## Contributors

- **Josh** - Owner, Admin (josh@tobie.team)
- **Ann** - Designer (ann@tobie.team)

## License

Proprietary - Internal use only

---

**Version**: 0.1.0  
**Last Updated**: January 23, 2026  
**Status**: Alpha - Core features operational, desktop agent pending
=======
# ReviewTool
Tobie Review tool
>>>>>>> 5ce99cb4da0a0849efda78d0656b8b57c51682f0
