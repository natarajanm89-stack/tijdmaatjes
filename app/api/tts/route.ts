import { env } from "cloudflare:workers";
import { requestElevenLabsSpeech } from "@/lib/elevenlabs";

const DUTCH_TEXT = /^[a-zA-ZÀ-ÿ0-9\s'.,:?!-]+$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text")?.trim() ?? "";

  if (!text || text.length > 80 || !DUTCH_TEXT.test(text)) {
    return Response.json({ error: "Ongeldige tekst" }, { status: 400 });
  }

  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) {
    return Response.json({ error: "ElevenLabs is niet ingesteld" }, { status: 503 });
  }

  const response = await requestElevenLabsSpeech(env.ELEVENLABS_API_KEY, env.ELEVENLABS_VOICE_ID, text);

  if (!response.ok || !response.body) {
    return Response.json({ error: "De stem is even niet beschikbaar" }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=86400",
    },
  });
}
