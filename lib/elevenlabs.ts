// Shared by the /api/tts route and scripts/generate-speech-clips.mjs so that
// pre-generated clips and on-demand clips sound identical.
export function requestElevenLabsSpeech(apiKey: string, voiceId: string, text: string) {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        accept: "audio/mpeg",
        "content-type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        language_code: "nl",
        voice_settings: {
          stability: 0.62,
          similarity_boost: 0.78,
          style: 0.12,
          use_speaker_boost: true,
        },
      }),
    },
  );
}
