TanStack Start + Convex + shadcn Rules

Routing & Files
- Use file-based routing under `src/routes`. Create routes with `createFileRoute`.
- Keep the app shell in `src/routes/__root.tsx` using `shellComponent`.
- Do not introduce Next.js or non-Start routing patterns.

Styling & UI
- Tailwind v4 only; import `src/styles.css` in the root. Avoid adding separate global CSS files.
- Place shadcn/ui components in `src/components/ui/*`. Prefer composition over heavy props.

Convex Integration
- Use `ConvexProvider` in `__root.tsx` via `src/lib/convex.ts` client.
- Server functions must import `query`, `mutation` from `./_generated/server`.
- For OAuth, use provider links:
  - Sign in: `/api/auth/signin?provider=github|google`
  - Sign out: `/api/auth/signout`
- After sign-in, call `users.ensureUser` once on load.

Imports & Aliases
- Use relative imports for `convex/_generated/*` (`../../convex/_generated/api`).
- Avoid absolute path aliases unless configured in `vite.config.ts`.

React
- React 19 strict mode semantics; prefer functional components and hooks.
- Avoid top-level async in components. Use route loaders or client hooks.

Testing & Build
- Ensure `pnpm build` passes after changes. Keep demo routes removed.

