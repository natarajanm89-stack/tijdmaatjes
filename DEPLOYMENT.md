# Deployment

## Requirements

- Node.js 22.13 or newer
- pnpm 11.25.0 — via Corepack on Node 22–24, or `npx pnpm@11.25.0 …` on Node 25+ (see the README)
- A Cloudflare account when deploying outside ChatGPT Sites

## Local verification

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

The build produces a Cloudflare Worker in `dist/server`.

## Deploy to Cloudflare Workers

Authenticate once, build, and deploy the generated Worker configuration:

```bash
pnpm exec wrangler login
pnpm build
pnpm exec wrangler deploy --config dist/server/wrangler.json
```

The app works without paid voice infrastructure by falling back to the browser's Dutch `nl-NL` voice.

## Optional ElevenLabs voice

For a consistent voice across devices, configure these production secrets without putting their values in Git:

```bash
pnpm exec wrangler secret put ELEVENLABS_API_KEY --config dist/server/wrangler.json
pnpm exec wrangler secret put ELEVENLABS_VOICE_ID --config dist/server/wrangler.json
```

Build and deploy again after changing runtime configuration. The API key is only read by the server-side `/api/tts` route.

## Before publishing for children

- Confirm microphone and speech-recognition behavior on the target browsers.
- Add your own privacy notice if the site will be used beyond the family or classroom.
- Keep analytics and advertising disabled unless you have completed the appropriate child-privacy review.
