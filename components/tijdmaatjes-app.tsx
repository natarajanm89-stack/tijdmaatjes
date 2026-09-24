"use client";

import {
  ArrowRight,
  Check,
  Clock3,
  Ear,
  Eye,
  EyeOff,
  Hand,
  Lightbulb,
  LockKeyhole,
  Mic,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ClockFace } from "@/components/clock-face";
import { lessonScreenSpeech, RondHalfLesson } from "@/components/rond-half-lesson";
import { ExplanationSteps, PhraseChips, stepsToSpeech } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDigitalTime,
  formatDutchTime,
  LEARNING_STEPS,
  normalizeHour,
  normalizeSpokenText,
  pronunciationScore,
  type LearningLevel,
} from "@/lib/dutch-time";
import { speechClipPath } from "@/lib/speech-clips";
import { explainTime } from "@/lib/time-explainer";

type AppTab = "discover" | "practice" | "speak";
type AnswerState = "idle" | "wrong" | "correct";
type AudioState = "idle" | "loading" | "playing";

// ElevenLabs voices can arrive far below full scale (~-17 dBFS peaks), so each
// clip is peak-normalized to just under 0 dBFS, with a cap so silence stays silent.
const TARGET_PEAK = 0.89; // -1 dBFS
const MAX_GAIN = 8; // +18 dB

function normalizingGain(buffer: AudioBuffer) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) {
      peak = Math.max(peak, Math.abs(samples[index]));
    }
  }
  return peak > 0 ? Math.min(TARGET_PEAK / peak, MAX_GAIN) : 1;
}

type Question = {
  id: string;
  hour: number;
  minute: number;
  correct: string;
  choices: string[];
};

type SavedProgress = {
  stars: number;
  streak: number;
  unlockedLevel: LearningLevel;
  levelWins: Partial<Record<LearningLevel, number>>;
  seenRondHalfLesson: boolean;
};

type RecognitionResultEvent = {
  results: { [key: number]: { [key: number]: { transcript: string } } };
};

type RecognitionErrorEvent = { error: string };

type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => RecognitionInstance;

type ModelTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};

type ModelContextDocument = Document & {
  modelContext?: {
    registerTool: (tool: ModelTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
  };
};

const DEFAULT_PROGRESS: SavedProgress = {
  stars: 0,
  streak: 0,
  // The supplied worksheet starts at kwartieren; keep earlier skills open for review.
  unlockedLevel: 3,
  levelWins: {},
  seenRondHalfLesson: false,
};

const STORAGE_KEY = "tijdmaatjes-progress-v1";

// Progress lives in localStorage as an external store: the server renders the
// defaults and React swaps in the saved progress right after hydration.
const progressListeners = new Set<() => void>();
let progressSnapshot: SavedProgress | undefined;

function readProgress() {
  if (!progressSnapshot) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      progressSnapshot = saved ? { ...DEFAULT_PROGRESS, ...JSON.parse(saved) } : DEFAULT_PROGRESS;
    } catch {
      // The app remains fully usable when private browsing blocks storage.
      progressSnapshot = DEFAULT_PROGRESS;
    }
  }
  return progressSnapshot as SavedProgress;
}

function subscribeProgress(listener: () => void) {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

function updateProgress(update: (current: SavedProgress) => SavedProgress) {
  progressSnapshot = update(readProgress());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressSnapshot));
  } catch {
    // Progress simply remains session-only.
  }
  progressListeners.forEach((listener) => listener());
}

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createQuestion(level: LearningLevel): Question {
  const minutes = LEARNING_STEPS[level - 1].minutes;
  const hour = Math.floor(Math.random() * 12) + 1;
  const minute = minutes[Math.floor(Math.random() * minutes.length)];
  const correct = formatDutchTime(hour, minute);
  const distractors = new Set<string>();
  const minuteIndex = minutes.indexOf(minute);
  const nearby = [
    { hour: normalizeHour(hour + 1), minute },
    { hour: normalizeHour(hour - 1), minute },
    { hour: normalizeHour(hour + 2), minute },
    { hour, minute: minutes[(minuteIndex + 1) % minutes.length] },
  ];

  for (const option of nearby) {
    const candidate = formatDutchTime(option.hour, option.minute);
    if (candidate !== correct) distractors.add(candidate);
  }

  while (distractors.size < 3) {
    const otherHour = Math.floor(Math.random() * 12) + 1;
    const otherMinute = minutes[Math.floor(Math.random() * minutes.length)];
    const candidate = formatDutchTime(otherHour, otherMinute);
    if (candidate !== correct) distractors.add(candidate);
  }

  return {
    id: `${hour}-${minute}-${Math.random().toString(36).slice(2)}`,
    hour,
    minute,
    correct,
    choices: shuffle([correct, ...Array.from(distractors).slice(0, 3)]),
  };
}

const INITIAL_QUESTION: Question = {
  id: "initial-quarter-question",
  hour: 10,
  minute: 45,
  correct: "kwart voor elf",
  choices: ["kwart over tien", "kwart voor tien", "kwart over elf", "kwart voor elf"],
};

function getRecognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function TijdmaatjesApp() {
  const [activeTab, setActiveTab] = useState<AppTab>("discover");
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(15);
  const [showDigital, setShowDigital] = useState(false);
  const [level, setLevel] = useState<LearningLevel>(3);
  const progress = useSyncExternalStore(subscribeProgress, readProgress, () => DEFAULT_PROGRESS);
  const setProgress = updateProgress;
  const [question, setQuestion] = useState<Question>(INITIAL_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [speakTime, setSpeakTime] = useState({ hour: 8, minute: 15 });
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [speechFeedback, setSpeechFeedback] = useState("");
  const audioCache = useRef(new Map<string, { buffer: AudioBuffer; gain: number }>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackRef = useRef(0);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonRun, setLessonRun] = useState(0);
  const [showSpeakWhy, setShowSpeakWhy] = useState(false);
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  const phrase = formatDutchTime(hour, minute);
  const speakPhrase = formatDutchTime(speakTime.hour, speakTime.minute);
  const explanation = useMemo(() => explainTime(hour, minute), [hour, minute]);
  const questionExplanation = useMemo(() => explainTime(question.hour, question.minute), [question]);
  const speakExplanation = useMemo(() => explainTime(speakTime.hour, speakTime.minute), [speakTime]);
  const currentStep = LEARNING_STEPS[level - 1];
  const levelWins = progress.levelWins[level] ?? 0;
  const levelProgress = Math.min(100, (levelWins / 3) * 100);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const loadClip = useCallback(async (context: AudioContext, text: string) => {
    let clip = audioCache.current.get(text);
    if (!clip) {
      // Prefer the pre-generated clip; only ask ElevenLabs for phrases without one.
      let response = await fetch(speechClipPath(text));
      if (!response.ok || !response.headers.get("content-type")?.startsWith("audio/")) {
        response = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      }
      if (!response.ok) throw new Error("Hosted voice is not configured");
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      clip = { buffer, gain: normalizingGain(buffer) };
      audioCache.current.set(text, clip);
    }
    return clip;
  }, []);

  /** Stops whatever is playing; any running `speak` sequence ends at its next step. */
  const stopSpeech = useCallback(() => {
    playbackRef.current += 1;
    try {
      currentSourceRef.current?.stop();
    } catch {
      // Already stopped.
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setAudioState("idle");
  }, []);

  /** Speaks one text, or several in order with a short pause between them. */
  const speak = useCallback(async (input: string | string[]) => {
    if (typeof window === "undefined") return;
    const texts = Array.isArray(input) ? input : [input];
    stopSpeech();
    const playback = playbackRef.current;
    setAudioState("loading");

    try {
      // Create/resume inside the tap handler, before any await, so Safari allows playback.
      audioContextRef.current ??= new AudioContext();
      const context = audioContextRef.current;
      const resumed = context.resume();
      const clips = await Promise.all(texts.map((text) => loadClip(context, text)));
      await resumed;

      for (const [index, clip] of clips.entries()) {
        if (playback !== playbackRef.current) return;
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, 350));
        if (playback !== playbackRef.current) return;
        setAudioState("playing");
        await new Promise<void>((resolve) => {
          const source = context.createBufferSource();
          const gain = context.createGain();
          source.buffer = clip.buffer;
          gain.gain.value = clip.gain;
          source.connect(gain).connect(context.destination);
          source.onended = () => resolve();
          currentSourceRef.current = source;
          source.start();
        });
      }
      if (playback === playbackRef.current) setAudioState("idle");
    } catch {
      if (playback !== playbackRef.current) return;
      const voice = window.speechSynthesis
        .getVoices()
        .find((candidate) => candidate.lang.toLowerCase().startsWith("nl"));
      texts.forEach((text, index) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "nl-NL";
        utterance.rate = 0.78;
        utterance.pitch = 1.04;
        if (voice) utterance.voice = voice;
        if (index === 0) utterance.onstart = () => setAudioState("playing");
        if (index === texts.length - 1) {
          utterance.onend = () => setAudioState("idle");
          utterance.onerror = () => setAudioState("idle");
        }
        window.speechSynthesis.speak(utterance);
      });
    }
  }, [loadClip, stopSpeech]);

  const chooseLevel = useCallback((nextLevel: LearningLevel) => {
    const sample = LEARNING_STEPS[nextLevel - 1].sample;
    setLevel(nextLevel);
    setHour(sample.hour);
    setMinute(sample.minute);
    setQuestion(createQuestion(nextLevel));
    setSelectedAnswer(null);
    setAnswerState("idle");
  }, []);

  function openLesson() {
    setLessonRun((run) => run + 1);
    setLessonOpen(true);
    speak(lessonScreenSpeech(0));
  }

  function closeLesson() {
    setLessonOpen(false);
    stopSpeech();
    setProgress((current) => ({ ...current, seenRondHalfLesson: true }));
  }

  // Mission buttons are a child's tap, so the first visit to "Rond half" may start the lesson with sound.
  function selectMission(nextLevel: LearningLevel) {
    chooseLevel(nextLevel);
    if (nextLevel === 5 && !progress.seenRondHalfLesson) {
      setActiveTab("discover");
      openLesson();
    }
  }

  function adjustTime(kind: "hour" | "minute", amount: number) {
    if (kind === "hour") {
      setHour((value) => normalizeHour(value + amount));
      return;
    }
    const total = hour * 60 + minute + amount;
    const wrapped = ((total % 720) + 720) % 720;
    setHour(normalizeHour(Math.floor(wrapped / 60)));
    setMinute(wrapped % 60);
  }

  function answer(choice: string) {
    if (answerState === "correct") return;
    setSelectedAnswer(choice);
    if (choice !== question.correct) {
      setAnswerState("wrong");
      setProgress((current) => ({ ...current, streak: 0 }));
      speak(stepsToSpeech(questionExplanation.steps));
      return;
    }

    setAnswerState("correct");
    setProgress((current) => {
      const wins = (current.levelWins[level] ?? 0) + 1;
      const nextUnlocked = wins >= 3 && level < 5
        ? Math.max(current.unlockedLevel, level + 1) as LearningLevel
        : current.unlockedLevel;
      return {
        ...current,
        stars: current.stars + 1,
        streak: current.streak + 1,
        unlockedLevel: nextUnlocked,
        levelWins: { ...current.levelWins, [level]: wins },
      };
    });
  }

  function nextQuestion() {
    stopSpeech();
    setQuestion(createQuestion(level));
    setSelectedAnswer(null);
    setAnswerState("idle");
  }

  function nextSpeakPrompt() {
    const minutes = currentStep.minutes;
    setSpeakTime({
      hour: Math.floor(Math.random() * 12) + 1,
      minute: minutes[Math.floor(Math.random() * minutes.length)],
    });
    setSpokenText("");
    setSpeechFeedback("");
    setShowSpeakWhy(false);
  }

  function startListening() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setSpeechFeedback("Deze browser kan je stem nog niet controleren. Luister en zeg de zin hardop na.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = "nl-NL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const score = pronunciationScore(speakPhrase, transcript);
      setSpokenText(transcript);
      if (normalizeSpokenText(transcript) === normalizeSpokenText(speakPhrase) || score >= 0.9) {
        setSpeechFeedback("Knap uitgesproken! Dat klonk duidelijk.");
        setProgress((current) => ({ ...current, stars: current.stars + 1 }));
      } else if (score >= 0.55) {
        setSpeechFeedback("Bijna! Luister nog één keer en spreek rustig mee.");
      } else {
        setSpeechFeedback("Goed geprobeerd. Luister naar elk stukje en probeer opnieuw.");
      }
    };
    recognition.onerror = () => {
      setSpeechFeedback("Ik kon je stem niet goed horen. Probeer het nog eens op een rustige plek.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    setSpokenText("");
    setSpeechFeedback("Ik luister…");
    recognition.start();
  }

  useEffect(() => {
    const context = (document as ModelContextDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = () => undefined;

    try {
      void Promise.resolve(context.registerTool({
        name: "set_learning_clock",
        title: "Zet de leerklok",
        description: "Set the visible learning clock to a Dutch 12-hour time in five-minute steps.",
        inputSchema: {
          type: "object",
          properties: {
            hour: { type: "integer", minimum: 1, maximum: 12 },
            minute: { type: "integer", minimum: 0, maximum: 55, multipleOf: 5 },
          },
          required: ["hour", "minute"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const value = input as { hour?: number; minute?: number };
          if (!Number.isInteger(value.hour) || !Number.isInteger(value.minute) ||
              (value.hour ?? 0) < 1 || (value.hour ?? 13) > 12 ||
              (value.minute ?? -1) < 0 || (value.minute ?? 60) > 55 ||
              (value.minute ?? 1) % 5 !== 0) {
            throw new Error("hour must be 1–12 and minute must be 0–55 in steps of five");
          }
          setHour(value.hour as number);
          setMinute(value.minute as number);
          setActiveTab("discover");
          return {
            hour: value.hour,
            minute: value.minute,
            dutch: formatDutchTime(value.hour as number, value.minute as number),
          };
        },
      }, { signal: lifecycle.signal })).catch(report);

      void Promise.resolve(context.registerTool({
        name: "start_clock_practice",
        title: "Start klokoefening",
        description: "Open Dutch clock practice at a selected learning level from 1 to 5.",
        inputSchema: {
          type: "object",
          properties: { level: { type: "integer", minimum: 1, maximum: 5 } },
          required: ["level"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const value = input as { level?: number };
          if (!Number.isInteger(value.level) || (value.level ?? 0) < 1 || (value.level ?? 6) > 5) {
            throw new Error("level must be an integer from 1 to 5");
          }
          chooseLevel(value.level as LearningLevel);
          setActiveTab("practice");
          return { level: value.level, status: "practice_started" };
        },
      }, { signal: lifecycle.signal })).catch(report);
    } catch {
      // Unsupported or experimental WebMCP implementations must not affect play.
    }

    return () => lifecycle.abort();
  }, [chooseLevel]);

  const phraseParts = useMemo(() => phrase.split(" "), [phrase]);

  return (
    <main className="app-shell">
      <div className="sky-shape sky-shape--one" aria-hidden="true" />
      <div className="sky-shape sky-shape--two" aria-hidden="true" />

      <header className="topbar">
        <div className="brand" aria-label="Tijdmaatjes">
          <span className="brand-mark"><Clock3 aria-hidden="true" /></span>
          <span>
            <strong>Tijdmaatjes</strong>
            <small>Nederlands leren met de klok</small>
          </span>
        </div>
        <div className="scoreboard" aria-label={`${progress.stars} sterren, reeks ${progress.streak}`}>
          <span><Star aria-hidden="true" fill="currentColor" /> {progress.stars}</span>
          <span className="streak"><Sparkles aria-hidden="true" /> Reeks {progress.streak}</span>
        </div>
      </header>

      <section className="mission-panel" aria-labelledby="mission-title">
        <div className="mission-heading">
          <span className="eyebrow">Jouw klokkenpad</span>
          <h1 id="mission-title">Welke missie kies je?</h1>
        </div>
        <div className="mission-steps" role="list" aria-label="Oefenniveaus">
          {LEARNING_STEPS.map((step) => {
            const unlocked = step.id <= progress.unlockedLevel;
            return (
              <button
                key={step.id}
                type="button"
                className={`mission-step ${level === step.id ? "is-active" : ""} ${unlocked ? "is-unlocked" : ""}`}
                onClick={() => selectMission(step.id)}
                aria-pressed={level === step.id}
                title={unlocked ? step.title : "Je mag alvast even kijken"}
              >
                <span className="step-number">{step.id}</span>
                <span className="step-copy">
                  <strong>{step.shortTitle}</strong>
                  <small>{unlocked ? (step.id < progress.unlockedLevel ? "Geoefend" : "Jouw niveau") : "Nog te ontdekken"}</small>
                </span>
                {!unlocked && <LockKeyhole aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppTab)} className="learning-tabs">
        <TabsList className="mode-tabs" aria-label="Kies een speelstand">
          <TabsTrigger value="discover"><Hand aria-hidden="true" /> Ontdek</TabsTrigger>
          <TabsTrigger value="practice"><Sparkles aria-hidden="true" /> Oefen</TabsTrigger>
          <TabsTrigger value="speak"><Mic aria-hidden="true" /> Praat</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="workspace-card discover-grid">
          <section className="clock-workbench" aria-label="Interactieve leerklok">
            <div className="card-kicker"><Hand aria-hidden="true" /> Probeer het zelf</div>
            <ClockFace
              hour={hour}
              minute={minute}
              interactive
              guide={level === 5 ? explanation : null}
              onChange={(nextHour, nextMinute) => {
                setHour(nextHour);
                setMinute(nextMinute);
              }}
            />
            <div className="clock-controls" aria-label="Verplaats de wijzers met knoppen">
              <div>
                <span>Uur</span>
                <Button variant="outline" size="icon" onClick={() => adjustTime("hour", -1)} aria-label="Eén uur terug">−</Button>
                <Button variant="outline" size="icon" onClick={() => adjustTime("hour", 1)} aria-label="Eén uur vooruit">+</Button>
              </div>
              <div>
                <span>Minuten</span>
                <Button variant="outline" size="icon" onClick={() => adjustTime("minute", -5)} aria-label="Vijf minuten terug">−</Button>
                <Button variant="outline" size="icon" onClick={() => adjustTime("minute", 5)} aria-label="Vijf minuten vooruit">+</Button>
              </div>
            </div>
          </section>

          <section className="answer-stage" aria-labelledby="current-phrase">
            <div className="lesson-badge">Missie {level} · {currentStep.title}</div>
            <p className="question-label">Hoe laat is het?</p>
            <div className="spoken-phrase" id="current-phrase">
              <PhraseChips explanation={explanation} />
            </div>
            <p className="say-slowly">Zeg rustig mee: {phraseParts.join(" · ")}</p>

            <div className="primary-actions">
              <Button className="listen-button" size="lg" onClick={() => speak(phrase)} disabled={audioState !== "idle"}>
                <Volume2 aria-hidden="true" />
                {audioState === "loading" ? "Stem laden…" : audioState === "playing" ? "Luister…" : "Luister"}
              </Button>
              <Button className="digital-button" variant="outline" size="lg" onClick={() => setShowDigital((value) => !value)}>
                {showDigital ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                {showDigital ? "Verberg cijfers" : "Toon cijfers"}
              </Button>
            </div>

            {showDigital && <output className="digital-reveal" aria-live="polite">{formatDigitalTime(hour, minute)}</output>}

            <div className="rule-card">
              <span className="rule-icon"><Lightbulb aria-hidden="true" /></span>
              <div>
                <strong>Kloktruc</strong>
                <p>{currentStep.description}</p>
                {level === 5 && (
                  <Button variant="outline" size="sm" className="lesson-open-button" onClick={openLesson}>
                    <Sparkles aria-hidden="true" /> Uitleg: de halte
                  </Button>
                )}
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="practice" className="workspace-card practice-layout">
          <section className="practice-question" aria-labelledby="practice-title">
            <div className="practice-meta">
              <div>
                <span className="eyebrow">Missie {level}</span>
                <h2 id="practice-title">Kies het goede antwoord</h2>
              </div>
              <div className="mini-progress" aria-label={`${Math.round(levelProgress)} procent van dit niveau geoefend`}>
                <span>{Math.min(levelWins, 3)} / 3</span>
                <Progress value={levelProgress} />
              </div>
            </div>
            <ClockFace
              hour={question.hour}
              minute={question.minute}
              compact
              guide={answerState === "wrong" ? questionExplanation : null}
            />
            <Button variant="outline" className="hear-question" onClick={() => speak(question.correct)}>
              <Ear aria-hidden="true" /> Hoor de tijd
            </Button>
          </section>

          <section className="choice-panel" aria-label="Antwoorden">
            <p className="choice-instruction">Tik op de zin die bij de klok hoort.</p>
            <div className="answer-choices">
              {question.choices.map((choice) => {
                const isCorrect = choice === question.correct;
                const isSelected = choice === selectedAnswer;
                const stateClass = answerState === "correct" && isCorrect
                  ? "is-correct"
                  : answerState === "wrong" && isSelected
                    ? "is-wrong"
                    : "";
                return (
                  <button
                    type="button"
                    key={choice}
                    className={`answer-choice ${stateClass}`}
                    onClick={() => answer(choice)}
                    disabled={answerState === "correct"}
                  >
                    <span>{choice}</span>
                    {stateClass === "is-correct" && <Check aria-hidden="true" />}
                    {stateClass === "is-wrong" && <RotateCcw aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div className={`feedback-box ${answerState}`} aria-live="polite">
              {answerState === "idle" && <p>Kijk eerst naar de lange wijzer.</p>}
              {answerState === "wrong" && (
                <div className="hint-explanation">
                  <p><Lightbulb aria-hidden="true" /> Bijna! Zo kijk je naar de klok:</p>
                  <ExplanationSteps steps={questionExplanation.steps} />
                  <Button variant="outline" size="sm" onClick={() => speak(stepsToSpeech(questionExplanation.steps))}>
                    <Volume2 aria-hidden="true" /> Hoor de uitleg
                  </Button>
                </div>
              )}
              {answerState === "correct" && (
                <div>
                  <p><Sparkles aria-hidden="true" /> Goed gedaan! Je verdient een ster.</p>
                  <Button onClick={nextQuestion}>Volgende klok <ArrowRight aria-hidden="true" /></Button>
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="speak" className="workspace-card speaking-layout">
          <section className="speaking-clock">
            <div className="card-kicker"><Mic aria-hidden="true" /> Luister, spreek, groei</div>
            <ClockFace hour={speakTime.hour} minute={speakTime.minute} compact guide={showSpeakWhy ? speakExplanation : null} />
            <Button variant="outline" onClick={nextSpeakPrompt}>Andere klok <RotateCcw aria-hidden="true" /></Button>
          </section>

          <section className="pronunciation-coach" aria-labelledby="say-title">
            <span className="eyebrow">Uitspraakmaatje</span>
            <h2 id="say-title" aria-label={speakPhrase}>
              <PhraseChips explanation={speakExplanation} />
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="why-button"
              aria-expanded={showSpeakWhy}
              onClick={() => {
                setShowSpeakWhy(true);
                speak(stepsToSpeech(speakExplanation.steps));
              }}
            >
              <Lightbulb aria-hidden="true" /> Waarom zeg je dit?
            </Button>
            {showSpeakWhy && <ExplanationSteps steps={speakExplanation.steps} />}
            <div className="pronunciation-steps">
              <div><span>1</span><p><strong>Luister</strong><small>Hoor de zin rustig.</small></p></div>
              <div><span>2</span><p><strong>Spreek</strong><small>Zeg de hele zin.</small></p></div>
              <div><span>3</span><p><strong>Probeer weer</strong><small>Herhalen maakt je sterker.</small></p></div>
            </div>
            <div className="speak-actions">
              <Button className="listen-button" size="lg" onClick={() => speak(speakPhrase)}>
                <Volume2 aria-hidden="true" /> Eerst luisteren
              </Button>
              <Button className={`record-button ${isListening ? "is-listening" : ""}`} size="lg" onClick={startListening} disabled={isListening}>
                <Mic aria-hidden="true" /> {isListening ? "Ik luister…" : "Nu inspreken"}
              </Button>
            </div>
            <div className="speech-result" aria-live="polite">
              {spokenText && <p className="heard-text">Ik hoorde: “{spokenText}”</p>}
              <p>{speechFeedback || "Tijdmaatjes slaat je stem niet op. Je browser verwerkt de spraakherkenning."}</p>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <details className="grownup-panel">
        <summary>Voor ouder of leerkracht</summary>
        <div className="grownup-content">
          <div>
            <strong>Adaptief oefenen</strong>
            <p>Na drie goede antwoorden gaat het volgende niveau open. Een fout geeft een concrete wijzer-hint, zonder punten af te trekken.</p>
          </div>
          <div>
            <strong>Nederlandse kloktaal</strong>
            <p>De app oefent hele uren, half, kwart over/voor en de vijf- en tienminutenstructuren rond half.</p>
          </div>
          <div>
            <strong>Privacyvriendelijk</strong>
            <p>Voortgang staat alleen in deze browser. Tijdmaatjes bewaart geen stemopnames en gebruikt geen advertenties, accounts of trackers.</p>
          </div>
        </div>
      </details>

      <RondHalfLesson
        key={lessonRun}
        open={lessonOpen}
        onOpenChange={(open) => (open ? setLessonOpen(true) : closeLesson())}
        speak={speak}
        onChallengeSolved={() => setProgress((current) => ({ ...current, stars: current.stars + 1 }))}
      />

      <footer className="app-footer">Gemaakt om samen hardop te oefenen · Voor kinderen van 6–8 jaar</footer>
    </main>
  );
}
