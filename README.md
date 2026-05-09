<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-a855f7?style=for-the-badge&labelColor=0d0d0d" />
<img src="https://img.shields.io/badge/deployed-cloudflare_workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white&labelColor=0d0d0d" />
<img src="https://img.shields.io/badge/stack-react_19_+_supabase-22d3ee?style=for-the-badge&labelColor=0d0d0d" />

<br /><br />

```
██╗     ███████╗ ██████╗  █████╗  ██████╗██╗   ██╗     █████╗ ██████╗
██║     ██╔════╝██╔════╝ ██╔══██╗██╔════╝╚██╗ ██╔╝    ██╔══██╗██╔══██╗
██║     █████╗  ██║  ███╗███████║██║      ╚████╔╝     ███████║██████╔╝
██║     ██╔══╝  ██║   ██║██╔══██║██║       ╚██╔╝      ██╔══██║██╔══██╗
███████╗███████╗╚██████╔╝██║  ██║╚██████╗   ██║       ██║  ██║██║  ██║
╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝
```

### A collaborative 3D design review platform for engineering teams

**[🚀 Live Demo →](https://legacy-v01.heellloo87.workers.dev/)**

</div>

---

## ✦ Overview

**Legacy AR** is a web-based collaborative platform built for design and engineering teams to upload, review, and iterate on 3D models in real time. Version 1 ships a complete end-to-end flow — from project creation to 3D model viewing, live commenting, team collaboration, and role-based access control.

---

## ✦ Features

### 🗂 Project Management
- Create projects with cover images and 3D design file uploads
- Track progress (0–100%) and status (`draft → in-progress → review → done`)
- Public, team, and private visibility controls
- Auto-versioning on every design upload (`v1 → v2 → v3 ...`)

### 🔮 3D Viewer
- Real-time GLB/GLTF model rendering powered by Three.js + React Three Fiber
- Split-panel layout — project picker on the left, live 3D canvas on the right
- Orbit controls with auto-rotate, zoom, pan
- Wireframe toggle, environment lighting, contact shadows
- Drag & drop local file loading

### 💬 Collaboration
- Version-scoped comments — leave feedback tied to a specific design version
- Live presence tracking — see who's online on a project
- Real-time notifications — get alerted on comments and project updates
- Team projects — share work across your entire organization

### 🔐 Auth & Roles
| Role | Access |
|------|--------|
| `admin` | Full platform access, user management, admin dashboard |
| `designer` | Create projects, upload designs, generative tools |
| `collaborator` | View and comment on team projects |
| `manufacturing_expert` | View, comment, and access generative design tools |

### 🤖 Generative Design *(v1 Preview)*
- Define material constraints, weight targets, and cost limits
- AI generates multiple design variants scored by feasibility and performance
- Filter and compare variants side by side

### 🛡 Admin Panel
- Live user management — view all users and change roles
- Platform-wide stats dashboard

---

## ✦ Tech Stack
## ✦ Tech Stack

**Frontend**
| | |
|---|---|
| React 19 | Latest concurrent rendering |
| TanStack Start 1.167 | Full-stack React meta-framework |
| TanStack Router | Type-safe file-based routing with code splitting |
| TanStack Query v5 | Server state, caching, realtime invalidation |
| TypeScript 5.8 | Strict end-to-end type safety |

**UI & Styling**
| | |
|---|---|
| Tailwind CSS v4 | Utility-first, zero-runtime CSS |
| shadcn/ui | Headless Radix UI components, fully customizable |
| Lucide React | Consistent icon system |
| Sonner | Toast notifications |
| Custom glass morphism | Design system with CSS variables |

**3D & Visualization**
| | |
|---|---|
| Three.js r184 | WebGL 3D engine |
| React Three Fiber 9 | Declarative Three.js for React |
| @react-three/drei 10 | OrbitControls, Stage, GLTF loader, Environment |

**Backend & Database**
| | |
|---|---|
| Supabase Postgres | Managed relational DB with REST API |
| Row Level Security | Policy-based data access per role |
| Supabase Realtime | Live comments, notifications, presence via WebSockets |
| Supabase Storage | CDN-backed file storage for covers and 3D assets |
| Postgres Triggers | Auto notifications on comment and project events |

**Auth**
| | |
|---|---|
| Supabase Auth | Email/password with JWT sessions |
| Custom role system | admin, designer, collaborator, manufacturing_expert |
| Route guards | Client + server enforcement per route |

**Infrastructure**
| | |
|---|---|
| Cloudflare Workers | Edge-deployed, globally distributed |
| Vite 7 | Lightning fast dev server and build |
| @cloudflare/vite-plugin | Workers-native Vite integration |

---

## ✦ Project Structure

```
src/
├── routes/
│   ├── index.tsx              # Landing page
│   ├── login.tsx              # Authentication
│   ├── register.tsx           # Sign up
│   ├── dashboard.tsx          # Main dashboard
│   ├── workspace.tsx          # Project workspace + comments
│   ├── viewer.tsx             # 3D viewer (split panel)
│   ├── viewer.$projectId.tsx  # Full-screen 3D viewer
│   ├── projects.new.tsx       # Create project
│   ├── generate.tsx           # Generative design
│   ├── admin.tsx              # Admin dashboard
│   └── admin.users.tsx        # User management
├── components/
│   ├── AppShell.tsx           # Layout wrapper
│   ├── AppSidebar.tsx         # Navigation sidebar
│   ├── Topbar.tsx             # Header + notifications
│   ├── RequireAuth.tsx        # Auth guard
│   └── ProtectedRoute.tsx     # Role guard
├── hooks/
│   ├── useComments.ts         # Comments + realtime
│   └── useNotifications.ts    # Notifications + realtime
├── lib/
│   ├── auth.tsx               # Auth context + provider
│   └── permissions.ts         # Role-based permissions
└── integrations/supabase/
    ├── client.ts              # Client-side Supabase
    ├── client.server.ts       # Server-side Supabase
    └── auth-middleware.ts     # Bearer token middleware
```

---

## ✦ Database

5 tables with Row Level Security enabled on all:

```
profiles              — user roles and metadata
projects              — design projects with versioning
comments              — version-scoped project feedback
collaboration_sessions — live presence tracking
notifications         — real-time activity alerts
```

Storage bucket `project-assets` with scoped policies for `covers/` and `designs/` paths.

---

## ✦ Getting Started

```bash
# Clone
git clone https://github.com/your-username/legacy-ar.git
cd legacy-ar

# Install
bun install

# Environment
cp .env.example .env
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Dev
bun run dev
```

> Requires a Supabase project with the schema applied and a `project-assets` storage bucket created.

---

## ✦ Deployment

Deployed on **Cloudflare Workers** via the `@cloudflare/vite-plugin`.

```bash
bun run build
# Deploy via Cloudflare dashboard or wrangler
```

**[→ Live at legacy-v01.heellloo87.workers.dev](https://legacy-v01.heellloo87.workers.dev/)**

---

## ✦ Version

```
v1.0.0 — May 2026
Initial release. Core platform complete.
```

Planned for v2:
- Real AI generative design integration
- AR model overlay via WebXR
- Export to manufacturing formats (STEP, STL)
- Granular per-project permissions
- Password reset flow

---

<div align="center">

Built with React, Supabase, and Three.js &nbsp;·&nbsp; Deployed on Cloudflare Workers

</div>
