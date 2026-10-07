# IPM Assistant

## What was added

- An authenticated staff workspace at `/staff/assistant` for lead, existing-owner, and general-IPM drafts.
- Pasted/typewritten client messages, multiple attachments, drag/drop, clipboard images, and editable optional lead/property details.
- Ready-to-send response text; copy with confirmation; regenerate, shorter, friendlier, professional, natural, follow-up, objection, plan-explanation, onboarding, and English/Spanish actions.
- Private persisted conversations with inferred/editable sales stages, saved edits, and Good/Needs Improvement feedback. Feedback is stored, not used to retrain the model.
- Existing captured-lead selection with contact details and prior public conversation context imported into the staff member's private thread.
- Personal saved-response CRUD, renaming, categories, search, and copy at `/staff/saved-responses`.
- Administrator-only approved knowledge CRUD at `/staff/ai-knowledge`.
- Captured-lead access at `/staff/leads`, protected existing analytics, and Clerk sign-in/sign-up pages.
- Signed-in users land in the staff workspace from the homepage; `?embedded=true` always keeps the public chatbot.

## Initial inspection and reuse

The existing application used React/Vite, Express, Drizzle/PostgreSQL, TanStack Query, Wouter, Tailwind/shadcn, and an OpenAI GPT-4o-mini chatbot through Replit AI Integrations. Existing storage already handled leads and public conversations. There was no login, role system, or private-upload storage to reuse.

The assistant reuses that stack, the existing database connection and lead storage, the visual theme/components, and the existing AI credentials/model. `server/services/ai-provider.ts` now shares the AI client between public and staff modes. The public chatbot's prompt/knowledge and embed behavior remain separate; this work does not perform the separately proposed model upgrade.

New staff facts are initially seeded from `server/knowledge/lead-response.json`. Administrator changes are subsequently read from the database. Deleted seed items are not silently restored. The immutable server safety instructions are not editable through the knowledge screen.

## Database changes

Four additive tables were applied to the development database:

| Table | Purpose |
| --- | --- |
| `assistant_threads` | Staff-owned lead metadata, selected language/type, sales stage, timestamps |
| `assistant_messages` | Client context, drafts, attachment summaries/metadata, edits, feedback; cascade-delete with its thread |
| `saved_responses` | Staff-owned reusable replies and categories |
| `ai_knowledge` | Admin-managed approved facts and seed-initialization marker |

Indexes support staff/thread lookups. Existing properties, leads, and public chat tables were not replaced or deleted.

## Authentication and privacy

Replit-managed Clerk was added because the original app had no authentication. A verified Clerk email must be present in a configured allowlist. Signing up alone grants no staff permissions.

- `IPM_STAFF_EMAILS`: comma-separated verified staff emails.
- `IPM_ADMIN_EMAILS`: comma-separated verified administrator emails; administrators also have staff access.
- Neither list configured: staff requests fail closed.
- Missing session: 401; unauthorized account/admin action: 403.
- Conversation/template queries enforce ownership independently of UI visibility.
- Lead/analytics reads are staff-only. Public chatbot, property browsing, and lead submission remain public.
- Staff API reads reject cross-origin browser access; mutations additionally require same-origin requests.
- Request logs omit response bodies, client text, lead details, files, and provider errors.
- Generation is limited to 12 attempts per minute per staff member, with one active generation per member per server process. This limit is in-memory, not a distributed autoscaling quota.

## Attachments

Supported extensions: JPG, JPEG, PNG, WEBP, PDF, TXT, DOC, DOCX.

Limits: five files, 8 MB per file, 25 MB combined, 15,000 message characters, and 50,000 extracted document characters per request. Extensions, MIME types, and signatures are validated. DOCX archives are checked against actual bounded decompression, including forged expansion-size declarations.

Images and PDFs—including scanned pages—are passed directly to the existing vision-capable model using inline request data. TXT, DOC, and DOCX text is extracted server-side. No unnecessary OCR pipeline or persistent provider file upload is introduced.

Original buffers are processed in memory and discarded/cleared after the request. The app does not save originals to a public directory or issue public file URLs. Private conversation text, filenames, and relevant AI-produced attachment summaries are retained for continuity. The existing AI provider processes the submitted content under its own service retention terms.

Unreadable, encrypted, malformed, or excessive documents fail explicitly. Upload only relevant pages; excessively large PDF context may be rejected by the provider.

## New APIs

All routes below require staff authentication; knowledge routes additionally require administrator authorization.

| Methods | Path |
| --- | --- |
| GET | `/api/staff/me` |
| GET | `/api/staff/leads` |
| GET, POST | `/api/assistant/threads` |
| GET, PATCH, DELETE | `/api/assistant/threads/:id` |
| POST (multipart) | `/api/assistant/threads/:id/generate` |
| PATCH | `/api/assistant/messages/:id` |
| POST | `/api/assistant/messages/:id/feedback` |
| GET, POST | `/api/assistant/saved-responses` |
| PATCH, DELETE | `/api/assistant/saved-responses/:id` |
| GET, POST | `/api/assistant/knowledge` |
| PATCH, DELETE | `/api/assistant/knowledge/:id` |

Existing GET `/api/leads`, GET `/api/leads/session/:sessionId`, and GET `/api/analytics` now require staff authentication. The managed Clerk production proxy is mounted before body parsing at `/api/__clerk`.

## Environment and production configuration

Existing AI/database credentials are reused:

- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `DATABASE_URL`

Managed authentication provisioned:

- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

The canonical Clerk setup also uses `VITE_CLERK_PROXY_URL` when supplied by the managed environment. Do not manually copy or expose credentials.

Required before staff use: configure the two email allowlists for the appropriate environments, then restart the development server or republish for production changes. Use verified login emails; no accounts are automatically made administrators.

Before production use, ensure the database used by production has the four additive tables/indexes, and review the approved knowledge there. Build remains `npm run build`; production run remains `npm start` (`NODE_ENV=production`). Preserve the root `public` assets and `server/knowledge` files used by the existing server. This is a full-stack app, not a static-only deployment.

No new OpenAI key, second AI backend, replacement database, WhatsApp/email connection, or automatic sending integration is required.

## Verification

- `npm run check` and `npm run build` pass.
- `npm run test:assistant`: eight tests covering staff/admin boundaries, cross-origin protection, input/file limits and validation, TXT/native-PDF handling, DOCX extraction and decompression-bomb rejection.
- `npm run test:assistant:integration`: five tests covering real development-database ownership/persistence/edit/feedback/template CRUD; live AI fees, context, translation, unknown-policy/prompt-injection handling; PDF reading; Spanish screenshot reading; and the original public chatbot.
- Integration tests use synthetic fixtures, clean them up, refuse `NODE_ENV=production`, and make real AI requests. The screenshot test requires ImageMagick/fontconfig; these are test tools, not app runtime dependencies.
- Visitor previews and unauthenticated access checks are performed separately. The signed-in staff UI cannot be visually verified in the preview capture browser; it is not bypassed for testing.

Non-blocking existing build warnings include stale Browserslist data, a PostCSS warning, and the large client bundle. A dependency spot-check also found legacy warnings outside this feature; the Express 4 dependency was patched and `proxy-addr` was constrained to its security-fixed version without a major Express migration. This is not a claim that the entire legacy project has passed a full security audit.

## Public-chat picture uploads

The user subsequently explicitly requested pictures in the public **IPM Property Expert** chat. It now has a **Photo/Imagen** button, removable previews, drag/drop, clipboard image paste, and image-only sends, including in the embedded widget.

- Public `POST /api/chat/images` accepts multipart `message`, `sessionId`, and up to three `files` (JPG/JPEG, PNG, WEBP), 5 MB each and 12 MB combined.
- Uses the same AI client/model and signature validator. It reads pictures directly with vision and answers the question in the screenshot; it does **not** load private staff knowledge.
- Original image buffers are transient. Only the question text and a bounded, identifier-minimized context summary enter existing public conversation history; previews are local browser object URLs and are never stored on the server.
- Text-only JSON `POST /api/chat` remains supported, including follow-ups to a picture question. The last user question is no longer duplicated in AI history, and generated session IDs are consistent across both stored messages and the response.
- Invalid uploads retain the unsent text/pictures and show an error. Client/server enforce format, signature, count, and size limits. Anonymous image requests also have per-process budgets (12/minute per server-observed remote IP, 30/minute overall, four concurrent); no forwarded-header IP is blindly trusted.
- No database schema or credentials changed for this addition.

Verification commands: `npm run test:public-images` (eight input/HTTP upload-validation checks) and `npm run test:public-images:browser` (real development-site mobile Chromium interaction with real AI, synthetic fixtures, and cleanup). Browser testing uses Chromium, ImageMagick, and fontconfig available in the development environment; these are not production runtime requirements.
