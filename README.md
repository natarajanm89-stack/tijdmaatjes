# Tijdmaatjes

Tijdmaatjes is a privacy-friendly Dutch clock-learning web app for children aged 6–8. It turns the photographed worksheet progression into three short, interactive loops:

- **Ontdek** — drag the hour and minute hands and hear the Dutch time phrase.
- **Oefen** — answer adaptive multiple-choice questions with supportive hints.
- **Praat** — listen, repeat, and optionally check pronunciation with the browser's Dutch speech recognition.

## Curriculum

1. Hele uren
2. Halve uren — including the Dutch “look ahead” rule (`08:30 = half negen`)
3. Kwart over / kwart voor
4. Vijf en tien over / voor
5. Vijf en tien voor / over half

### Explaining “voor half” and “over half”

Children learn one picture: **the 6 is the _halte_ (bus stop)**. Each number is one jump of five minutes. Just before the halte you say _voor half_, just after it _over half_, and around half you always name the **next** hour (`08:25 = vijf voor half negen`).

- **Ontdek** (level 5) colors the clock in four zones (over · voor half · over half · voor), marks the halte, draws numbered jump arcs, and lights up the hour that is said. The phrase is shown as chips in matching colors: blue count = long hand, orange hour = short hand.
- **Mini-lesson “Rond half”** opens the first time level 5 is chosen (replay via _Uitleg: de halte_): five spoken screens and a drag-the-hand challenge.
- **Oefen** turns a wrong answer into three spoken steps on a guided clock.
- **Praat** has a _Waarom zeg je dit?_ button with the same steps.

All of it comes from `explainTime()` in `lib/time-explainer.ts`, so every screen explains a time the same way.

Progress and stars are stored only in the current browser. There are no accounts, ads, or analytics. Tijdmaatjes does not retain recordings; when speech recognition is used, the browser's own speech service handles that processing.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm 11.25.0 (pinned in `package.json`).

Node.js 25+ no longer bundles Corepack, so pick whichever way of getting pnpm works for your Node version:

```bash
# Node 22–24 (Corepack is bundled)
corepack enable
pnpm install
pnpm dev

# Node 25+ (no Corepack) — run the pinned pnpm through npx
npx pnpm@11.25.0 install
npx pnpm@11.25.0 dev

# …or install Corepack yourself once, then use plain `pnpm`
npm install -g corepack && corepack enable
```

The dev server runs at <http://localhost:5173>. If that port is already taken, pass another one:

```bash
pnpm dev --port 5174
```

The pnpm store is kept inside the project at `.sites-runtime/pnpm-store` (ignored by Git). The first install takes about 40 seconds.

Create a production build with:

```bash
pnpm build
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a clean Cloudflare deployment path and optional ElevenLabs configuration.

## Dutch text-to-speech

The app works without configuration by using the device's `nl-NL` browser voice. For one consistent voice across devices, copy `.env.example` to `.env.local` and set:

```text
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

The key stays server-side. `/api/tts` uses ElevenLabs' multilingual model and the client automatically falls back to the browser voice if the service is not configured or temporarily unavailable.

All 144 clock phrases (12 hours × 5-minute steps) plus the explanation and mini-lesson lines are pre-generated into `public/audio/` and served as static files, so the app normally never calls ElevenLabs at runtime. The client plays `public/audio/<phrase>.mp3` first, then `/api/tts`, then the browser voice. After changing the voice or its settings in `lib/elevenlabs.ts`, delete `public/audio/` and regenerate:

```bash
pnpm speech:generate   # skips clips that already exist
```

## Structure

```text
app/                            App shell, styles, and server-side TTS proxy
components/clock-face.tsx       Accessible draggable SVG clock
components/tijdmaatjes-app.tsx  Learning, practice, speech, and progress flows
components/rond-half-lesson.tsx “Rond half” mini-lesson dialog
components/time-explanation.tsx Phrase chips and step-by-step explanation
lib/dutch-time.ts               Pure Dutch time-language rules
lib/time-explainer.ts           Halte model: zones, jumps, chips, and steps per time
lib/rond-half-lesson.ts         Mini-lesson content
lib/speech-clips.ts             Every spoken text and its clip file name
tests/                          Unit tests (`pnpm test`, Node's built-in runner)
public/favicon.svg              App icon
```

## Adaptive roles used in the design

- **Dutch educator:** correct time conventions and five-stage progression.
- **Child UX designer:** large touch targets, short loops, hints, and positive feedback.
- **Pronunciation coach:** slowed playback, phrase chunking, and forgiving checks.
- **Accessibility reviewer:** keyboard-operable hands, semantic labels, contrast, and reduced motion.
- **Deployment engineer:** secrets stay server-side; browser fallback keeps the app usable everywhere.
