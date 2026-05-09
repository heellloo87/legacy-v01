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

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TanStack Start 1.167 |
| Routing | TanStack Router (file-based) |
| Backend / DB | Supabase (Postgres + Realtime + Storage) |
| Auth | Supabase Auth with RLS |
| 3D Rendering | Three.js r184 + React Three Fiber 9 + Drei 10 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Data Fetching | TanStack Query v5 |
| Deployment | Cloudflare Workers via Vite |
| Language | TypeScript 5.8 |

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
