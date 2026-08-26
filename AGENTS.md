<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git workflow

- `main` is a protected release branch. Do not develop features or fixes directly on it.
- Before changing code, create a topic branch from the latest `main`. Codex-created branches must use the `codex/` prefix, for example `codex/ai-project-recruitment`.
- Every change must reach `main` through a pull request. Direct pushes, force pushes, and branch deletion are prohibited.
- Pull requests must pass the repository `quality` check and resolve all review conversations before merging.
- Keep commits focused. Do not commit databases, environment files, credentials, internal source documents, or local working artifacts.
- Run `npm run lint`, `npx tsc --noEmit`, `npx prisma validate`, and `npm run build` before requesting merge.
