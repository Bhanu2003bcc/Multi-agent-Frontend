# ResearchAI Frontend

A multi-agent research platform frontend built with **Angular 21**. The app lets authenticated users submit natural-language research queries, track pipeline execution in real-time (SSE with polling fallback), and review AI-synthesised answers with source citations and quality metrics.

---

## Angular Version Migration: 18 → 21

This project was originally written in Angular 18 and has been migrated to Angular 21. Below is a full summary of every change made during the migration.

---

### 1. Package & Builder Updates (`package.json`, `angular.json`)

| Item | Angular 18 | Angular 21 |
|---|---|---|
| All `@angular/*` packages | `^18.0.0` | `^21.0.0` |
| `zone.js` | `~0.14.3` | `~0.15.0` |
| `typescript` | `~5.4.0` | `~5.7.0` |
| `jasmine-core` | `~5.1.0` | `~5.4.0` |
| Build builder | `@angular-devkit/build-angular` | `@angular/build` |
| `angular.json` build target | `@angular-devkit/build-angular:application` | `@angular/build:application` |
| `angular.json` serve target | `@angular-devkit/build-angular:dev-server` | `@angular/build:dev-server` |
| `angular.json` test target | `@angular-devkit/build-angular:karma` | `@angular/build:karma` |
| `proxyConfig` location | Nested under `serve` architect key | Moved to `serve.options.proxyConfig` |

> **Note:** `@angular-devkit/build-angular` was the legacy builder package. Angular 21 ships with `@angular/build` as the unified builder. The builder strings in `angular.json` must be updated accordingly.

---

### 2. Built-in Control Flow (All Templates)

Angular 17 introduced the new built-in control flow syntax as stable. Angular 21 continues to recommend it as the standard approach. All structural directives have been replaced:

| Angular 18 (directive syntax) | Angular 21 (built-in block syntax) |
|---|---|
| `*ngIf="expr"` | `@if (expr) { ... }` |
| `*ngIf="expr; else ref"` | `@if (expr) { ... } @else { ... }` |
| `*ngFor="let x of list; trackBy: fn"` | `@for (x of list; track x.id) { ... }` |
| `*ngSwitch` / `*ngSwitchCase` | `@switch (expr) { @case (val) { ... } }` |

**Files changed:**
- `toast-container.component.ts` (inline template)
- `sidebar.component.html`
- `dashboard.component.html`
- `login.component.html`
- `register.component.html`
- `submit.component.html`
- `history.component.html`
- `result.component.html`

---

### 3. `CommonModule` Removed

Because `*ngIf` and `*ngFor` are now handled by the Angular compiler's built-in control flow (no directive import needed), `CommonModule` is no longer required in any component's `imports` array.

**Components updated:**
- `ToastContainerComponent` — `CommonModule` removed from imports
- `SidebarComponent` — `CommonModule` removed
- `DashboardComponent` — `CommonModule` removed
- `LoginComponent` — `CommonModule` removed
- `RegisterComponent` — `CommonModule` removed
- `SubmitComponent` — `CommonModule` removed
- `HistoryComponent` — `CommonModule` removed
- `ResultComponent` — `CommonModule` removed; replaced with explicit `DecimalPipe` and `SlicePipe` imports (these are still standalone pipes that must be imported individually)

---

### 4. Constructor Injection → `inject()` Function

Angular 14+ introduced the `inject()` function as the preferred DI pattern for standalone components. Angular 21 continues to support constructor injection but the `inject()` pattern is now idiomatic. All components and services were updated to use `inject()`.

**Pattern change:**

```typescript
// Angular 18 — constructor injection
export class MyComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
}

// Angular 21 — inject() function
export class MyComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
}
```

**Files updated:**
- `auth.service.ts`
- `research.service.ts`
- `sidebar.component.ts`
- `dashboard.component.ts`
- `login.component.ts`
- `register.component.ts`
- `submit.component.ts`
- `history.component.ts`
- `result.component.ts`

> `toast.service.ts`, `auth.guard.ts`, `auth.interceptor.ts`, `app.config.ts`, `app.component.ts`, `app.routes.ts`, and model/environment files required **no changes** — they were already compatible with Angular 21.

---

### 5. `FormGroup` Initialisation Pattern

In Angular 21, `FormBuilder` is injected via `inject()`. The form is now declared as `readonly` using direct initialisation rather than inside a constructor body:

```typescript
// Angular 18
form: FormGroup;
constructor(private fb: FormBuilder) {
  this.form = this.fb.group({ ... });
}

// Angular 21
private readonly fb = inject(FormBuilder);
readonly form = this.fb.group({ ... });
```

**Files updated:** `login.component.ts`, `register.component.ts`, `submit.component.ts`

---

### 6. `@for` Track Expression

The new `@for` syntax requires a mandatory `track` expression (replacing the optional `trackBy` function):

```html
<!-- Angular 18 -->
<div *ngFor="let job of jobs; trackBy: trackById">

<!-- Angular 21 -->
@for (job of jobs; track job.jobId) { ... }
```

Where a unique primitive field is unavailable, `track $index` may be used as a fallback.

---

### 7. Loop Index Access

In the new `@for` syntax, loop variables such as index are accessed via `$index` instead of destructuring:

```html
<!-- Angular 18 -->
*ngFor="let stage of stages; let i = index"

<!-- Angular 21 -->
@for (stage of stages; track stage.key; let i = $index) { ... }
```

---

## Project Structure

```
src/
├── app/
│   ├── app.component.ts          # Root component
│   ├── app.config.ts             # Application providers
│   ├── app.routes.ts             # Lazy-loaded routes
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts     # authGuard, guestGuard, adminGuard
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts  # JWT + refresh token logic
│   │   ├── models/
│   │   │   └── models.ts         # All TypeScript interfaces
│   │   └── services/
│   │       ├── auth.service.ts   # Auth state + API calls
│   │       ├── research.service.ts  # Research API + SSE streaming
│   │       └── toast.service.ts  # Global toast notifications
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/            # Login page
│   │   │   └── register/         # Registration page
│   │   ├── dashboard/            # Overview + recent jobs
│   │   └── research/
│   │       ├── submit/           # New query form
│   │       ├── history/          # Paginated job history
│   │       └── result/           # Job result viewer (SSE live)
│   └── shared/
│       └── components/
│           ├── sidebar/          # Collapsible nav sidebar
│           └── toast/            # Toast notification container
├── environments/
│   ├── environment.ts            # Default (points to dev)
│   ├── environment.dev.ts        # Development
│   └── environment.prod.ts       # Production
└── styles.scss                   # Global design tokens + utilities
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Angular CLI 21: `npm install -g @angular/cli@21`

### Install & Run

```bash
npm install
ng serve
```

The app starts at `http://localhost:4200` and proxies `/api/**` to the backend (configured in `proxy.conf.json`).

### Build for Production

```bash
ng build --configuration production
```

Output is written to `dist/research-frontend/`.

---

## Environment Configuration

| Variable | Description |
|---|---|
| `apiBaseUrl` | Backend API base URL (e.g. `http://localhost:8080/api`) |
| `pollingInterval` | SSE fallback polling interval in ms |
| `sseReconnectDelay` | Delay before SSE reconnect attempt |

---

## Key Features

- **JWT authentication** with automatic access token refresh via interceptor
- **SSE streaming** for real-time pipeline progress; falls back to polling on error
- **Reactive forms** with inline validation
- **Angular Signals** throughout for fine-grained reactivity
- **Lazy-loaded routes** for all feature modules
- **Collapsible sidebar** with role-based nav items
- **Markdown rendering** of research answers via `marked`
- **Confidence ring SVG** with animated stroke-dashoffset
- **Quality analysis tab** with critic feedback scores

---

## Docker

```bash
docker build -t research-frontend .
docker run -p 80:80 research-frontend
```

The `nginx.conf` serves the Angular build and proxies `/api` to the backend.
