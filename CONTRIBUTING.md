# Contributing to ClawHub

First off, thank you for considering contributing to **INFOHAS ClawHub**! It's people like you that make ClawHub such a great tool.

---

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Adding AI Providers](#adding-ai-providers)
- [Adding Tools](#adding-tools)
- [Adding Messaging Platforms](#adding-messaging-platforms)
- [Documentation](#documentation)
- [License](#license)

---

## Code of Conduct

This project and everyone participating in it is governed by the principle of respect. We are committed to providing a welcoming and inspiring community for all. Please be respectful, constructive, and helpful in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** or **Bun**
- **Git**
- A code editor (VS Code recommended with the recommended extensions)

### Quick Start

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/clawhub.git
cd clawhub

# Install dependencies
npm install --legacy-peer-deps

# Setup database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open **http://localhost:3000** and you should see the ClawHub dashboard.

---

## Development Setup

### Environment Variables

Copy `.env.example` to `.env` and fill in at least one AI provider key:

```env
DATABASE_URL="file:./db/custom.db"
ANTHROPIC_API_KEY=your-key-here
# or any other provider key
```

### Mini-Services (Optional)

If you want to work on the mini-services:

```bash
# Agent WebSocket (port 3003)
cd mini-services/agent-ws && npm install && npm start

# WhatsApp Bridge (port 3004) - requires Chromium
cd mini-services/whatsapp-bridge && npm install && npm start

# Messaging Gateway (port 3005)
cd mini-services/messaging-gateway && npm install && npm start
```

### Database

```bash
npx prisma db push      # Push schema changes
npx prisma generate     # Regenerate Prisma client
npx prisma studio       # Visual database browser
npx tsx prisma/seed.ts  # Re-seed data
```

---

## Project Structure

```
clawhub/
├── src/
│   ├── app/
│   │   ├── api/              # 71+ API Routes (Next.js App Router)
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Entry page
│   ├── components/
│   │   ├── dashboard/        # App-specific components
│   │   └── ui/               # shadcn/ui base components
│   ├── lib/
│   │   ├── api.ts            # API client functions
│   │   ├── db.ts             # Prisma singleton
│   │   ├── security.ts       # Security middleware
│   │   ├── store.ts          # Zustand global state
│   │   ├── types.ts          # TypeScript type definitions
│   │   └── utils.ts          # Utility functions
│   └── hooks/                # Custom React hooks
├── prisma/
│   ├── schema.prisma         # 19 database models
│   └── seed.ts               # Seed data
├── mini-services/
│   ├── agent-ws/             # WebSocket streaming service
│   ├── whatsapp-bridge/      # WhatsApp Web bridge
│   └── messaging-gateway/    # Telegram, Discord, Slack, Signal, HA
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Container orchestration
├── install.sh                # Linux/WSL/macOS installer
└── install.ps1               # Windows installer
```

---

## How to Contribute

### 1. Fork the Repository

Click the **Fork** button at the top right of the GitHub page.

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

### 3. Make Your Changes

Write clean, well-documented code following our coding standards.

### 4. Test Your Changes

```bash
# Build to check for errors
npm run build

# Lint
npm run lint

# Run the development server and verify manually
npm run dev
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

Go to the original repository and click **"New Pull Request"**. Fill in the PR template with:
- What changes you made
- Why you made them
- How to test them
- Any screenshots if UI changes

---

## Coding Standards

### TypeScript

- Use **TypeScript** for all new files (`.ts`, `.tsx`)
- Strict type checking — avoid `any` where possible
- Use proper interfaces and types from `src/lib/types.ts`
- Add new types to `types.ts` when introducing new data structures

### React Components

- Use `'use client'` directive for client components
- Functional components with hooks (no class components)
- Use shadcn/ui components as building blocks
- Follow the existing component naming: `PascalCase.tsx`
- Keep components focused — one responsibility per component
- Use `framer-motion` for animations (already installed)

### API Routes

- Follow Next.js App Router patterns (route handlers in `route.ts`)
- Use proper HTTP methods: GET for reads, POST for creates, PATCH for updates, DELETE for deletes
- Always wrap database operations in try/catch
- Return proper HTTP status codes and JSON responses
- Add new routes to `src/lib/api.ts` client functions

### State Management

- Use Zustand store (`src/lib/store.ts`) for global state
- Keep state minimal — don't store what can be derived
- Add new state fields with their setters and async loaders

### Styling

- Use **Tailwind CSS** classes exclusively
- Follow the existing design system (emerald accent, slate backgrounds)
- Use `cn()` from `src/lib/utils.ts` for conditional classes
- Respect dark/light theme — test both modes

### Database

- Add new models to `prisma/schema.prisma`
- Always add `@@index` for frequently queried fields
- Run `npx prisma db push` and `npx prisma generate` after schema changes
- Add seed data to `prisma/seed.ts` if introducing new default records

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, missing semicolons, etc.) |
| `refactor` | Code refactoring without feature changes |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `ci` | CI/CD configuration |

### Examples

```
feat(chat): add conversation export to markdown
fix(streaming): resolve SSE connection timeout on slow networks
docs(readme): update Docker deployment instructions
refactor(store): simplify message state management
```

---

## Pull Request Process

1. **Update documentation** if your changes affect the user-facing API or configuration
2. **Add types** to `src/lib/types.ts` for any new data structures
3. **Add API client functions** to `src/lib/api.ts` for any new API routes
4. **Update the store** in `src/lib/store.ts` if adding new global state
5. **Build must pass** — `npm run build` should complete with 0 errors
6. **One PR per feature** — keep PRs focused and reviewable
7. **PR description** must include:
   - Summary of changes
   - Motivation/context
   - Testing steps
   - Screenshots (for UI changes)

### PR Review Criteria

- Code follows project standards
- No TypeScript build errors
- No breaking changes without migration path
- Proper error handling
- Responsive design (mobile + desktop)

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/rachidSabah/clawhub/issues/new) with:

1. **Title**: Clear, descriptive summary
2. **Environment**: OS, Node.js version, browser
3. **Steps to reproduce**: Numbered list
4. **Expected behavior**: What should happen
5. **Actual behavior**: What happened instead
6. **Screenshots/logs**: If applicable
7. **Additional context**: Any other relevant information

---

## Suggesting Features

Open a [GitHub Issue](https://github.com/rachidSabah/clawhub/issues/new) with the `enhancement` label:

1. **Problem**: What problem does this feature solve?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: Other approaches you thought of
4. **Additional context**: Screenshots, mockups, references

---

## Adding AI Providers

ClawHub supports 31+ AI providers. To add a new one:

### 1. Add Provider Definition

In `src/lib/api.ts`, add to the `HERMES_PROVIDERS` array:

```typescript
{
  type: 'new-provider',
  label: 'New Provider',
  description: 'Description of the provider',
  authType: 'api-key', // or 'oauth', 'cli', 'device-code'
  envVar: 'NEW_PROVIDER_API_KEY',
  defaultBaseUrl: 'https://api.newprovider.com/v1',
}
```

### 2. Add to Seed Data

In `prisma/seed.ts`, add the provider to the seed array.

### 3. Test

- Add the provider key to your `.env`
- Verify it appears in the Providers list
- Test streaming via the chat interface

---

## Adding Tools

ClawHub has 48 AI tools. To add a new one:

### 1. Add Tool Definition

In `src/app/api/tools/route.ts`, add to the tools array:

```typescript
{
  name: 'new_tool',
  description: 'What this tool does',
  category: 'Category Name',
  riskLevel: 'low', // 'low', 'medium', or 'high'
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' },
    },
    required: ['param1'],
  },
  requiresApproval: false,
}
```

### 2. Implement Execution

In `src/app/api/tools/execute/route.ts`, add a case to the switch statement:

```typescript
case 'new_tool':
  // Your implementation
  result = { success: true, data: '...' }
  break
```

### 3. Test

- Verify the tool appears in GET `/api/tools`
- Test execution via POST `/api/tools/execute`
- Check security approval flow for medium/high risk tools

---

## Adding Messaging Platforms

ClawHub's Messaging Gateway supports 5 platforms. To add a new one:

### 1. Create Platform Module

Create a new file in `mini-services/messaging-gateway/platforms/`:

```typescript
// platforms/your-platform.ts
import type { PlatformModule } from '../types'

export const yourPlatform: PlatformModule = {
  name: 'your-platform',
  connect: async (config) => { /* ... */ },
  disconnect: async () => { /* ... */ },
  sendMessage: async (chatId, message) => { /* ... */ },
  getStatus: () => ({ connected: false, info: '' }),
}
```

### 2. Register in Gateway

Add the platform import in `mini-services/messaging-gateway/index.ts`.

### 3. Add to Status API

Update `/api/messaging/status/route.ts` to include the new platform.

---

## Documentation

When adding features, please update:

- **README.md** — For user-facing changes
- **CONTRIBUTING.md** — If the development workflow changes
- **`.env.example`** — For new environment variables
- **Inline code comments** — For complex logic
- **Type definitions** — In `src/lib/types.ts`

---

## License

By contributing to ClawHub, you agree that your contributions will be licensed under the MIT License.

---

<p align="center">
  Thank you for contributing to <strong>INFOHAS ClawHub</strong>! 🙏
</p>
