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

### Helpers on every clock

Every clock can show the same helpers, and they follow **the time on that clock**, not the level, because children can drag the hands anywhere. A **Hulp aan/uit** switch in the top bar hides them once a child is ready.

- **Words ring** around the rim shows what you _say_ at each number, like Dutch classroom clocks: `5 10 kwart` (over), `10 5` (voor half), `half`, `5 10` (over half), `kwart 10 5` (voor), `uur`. It never shows 20, 25, 45, 50 or 55, because Dutch time never says them.
- **The 12 is start and finish** (checkered flag): _over_ = the long hand just left the start, _voor_ = it is almost back. Near the 12 the clock is split in two halves, **over** (right) and **voor** (left).
- **The 6 is the _halte_** (bus stop): around half (:20, :25, :35, :40) the clock switches to four quarters: over · voor half · over half · voor. Around half, and with _voor_, you name the **next** hour (`08:25 = vijf voor half negen`).
- **Jumps** labeled 5 and 10 run along the rim from the 12 or the halte, one after another; in Ontdek **Luister** counts along: _vijf… tien… tien voor tien_. The hour that is said lights up.
- Where the helpers would give the answer away (Oefen, Praat, before an answer), only the ring shows; the full helpers appear after a mistake or on _Waarom?_. Ontdek and the lessons always show them.

Mini-lessons open the first time their level is chosen, with a replay button in the Kloktruc card: **“Over en voor”** (level 4) and **“Rond half”** (level 5). Each ends with a drag-the-hand challenge. Oefen turns a wrong answer into three spoken steps; Praat has a _Waarom zeg je dit?_ button.

### Spelen

The **Spelen** tab holds four games, each based on a common way of teaching the clock:

- **Tel mee rond de klok**: tap 1 → 12; the long hand walks five minutes per tap and the time is spoken, so children hear where _over_ becomes _voor half_ and the hour word changes.
- **Korte wijzer eerst**: only the short hand is shown. Is it _net na 8 uur_, _ongeveer half 9_ or _bijna 9 uur_? Then the long hand appears.
- **Zet de klok**: hear a time and set the hands, then tap **Klaar!**. Five clocks from the chosen level; on the first three the short hand is already right. A wrong setting praises the hand that is right and says where the other goes (_zet …_). A clock missed on the first try comes back once at the end. First-try clocks count towards unlocking the next level.
- **Mijn dag**: set the clock for eight moments of a child's day (🌅 opstaan … 🛏️ naar bed). Earns stars but doesn't unlock levels.

Stars: one per answer right on the first try, plus a bonus per finished game. Times a child misses (per minute pattern, e.g. :25) come back more often in Oefen and Zet de klok.

All of it comes from `explainTime()` in `lib/time-explainer.ts`, so every screen explains a time the same way.

Progress and stars are stored only in the current browser. There are no accounts, ads, or analytics. Tijdmaatjes does not retain recordings; when speech recognition is used, the browser's own speech service handles that processing.

## Run locally

Requirements: Node.js 22.18 or newer (tests and speech scripts run TypeScript directly) and pnpm 11.25.0 (pinned in `package.json`).

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

The first install takes about 40 seconds. Run the unit tests with `pnpm test`.

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
pnpm speech:check      # transcribes every clip and lists ones that don't match their text
```

## Structure

```text
app/                            App shell, styles, and server-side TTS proxy
components/clock-face.tsx       Accessible draggable SVG clock
components/tijdmaatjes-app.tsx  Learning, practice, speech, and progress flows
components/clock-lesson.tsx     Mini-lesson dialog (“Over en voor”, “Rond half”)
components/time-explanation.tsx Phrase chips and step-by-step explanation
components/games-hub.tsx        “Spelen” tab and its game cards
components/set-clock-exercise.tsx Zet de klok and Mijn dag
components/count-around-game.tsx  Tel mee rond de klok
components/hour-hand-game.tsx     Korte wijzer eerst
lib/dutch-time.ts               Pure Dutch time-language rules
lib/time-explainer.ts           Halte model: zones, jumps, chips, and steps per time
lib/lessons.ts                  Mini-lesson content
lib/speech-clips.ts             Every spoken text and its clip file name
lib/set-clock-mission.ts        Missions, answer checks, and “zet …” instructions
lib/clock-geometry.ts           Pointer angle → hour/minute for dragging hands
lib/clock-ring.ts               Dutch words ring and when to show halves or quarters
lib/games.ts                    Game rules, Mijn dag moments, and their spoken lines
tests/                          Unit tests (`pnpm test`, Node's built-in runner)
public/favicon.svg              App icon
```

## Adaptive roles used in the design

- **Dutch educator:** correct time conventions and five-stage progression.
- **Child UX designer:** large touch targets, short loops, hints, and positive feedback.
- **Pronunciation coach:** slowed playback, phrase chunking, and forgiving checks.
- **Accessibility reviewer:** keyboard-operable hands, semantic labels, contrast, and reduced motion.
- **Deployment engineer:** secrets stay server-side; browser fallback keeps the app usable everywhere.
