// Tamil voice for the explanations ("Uitleg: தமிழ்"). The screen stays Dutch;
// only the spoken explanation changes. Each Dutch narration line maps to Tamil
// parts: plain strings are spoken by the Tamil voice, `{ nl }` parts by the
// Dutch voice, so the words the child is learning always sound right.
//
// Tamil wording is kept simple and warm for 6–8 year olds:
// பெரிய முள் = long hand, சின்ன முள் = short hand, தாவல் = jump,
// பஸ் நிறுத்தம் = the halte at the 6, தொடக்கம் / முடிவுக் கோடு = start / finish.

export type SpeechPart = string | { nl: string };

const THEN = "அதனால்:";

export const TAMIL: Record<string, SpeechPart[]> = {
  // --- Reading a clock (explainTime steps) ---
  "De lange wijzer staat op de 12.": ["பெரிய முள் 12-இல் இருக்கிறது."],
  "Staat hij precies op de 12? Dan zeg je uur.": ["பெரிய முள் சரியாக 12-இல் இருந்தால், நாம் சொல்வது:", { nl: "uur" }],
  "De korte wijzer wijst het uur aan:": ["சின்ன முள் மணியைக் காட்டுகிறது:"],
  "De lange wijzer is net voorbij de 12.": ["பெரிய முள் 12-ஐ இப்போதுதான் தாண்டியிருக்கிறது."],
  "Eén sprong na de 12: vijf over.": ["12-க்குப் பிறகு ஒரு தாவல். " + THEN, { nl: "vijf over" }],
  "Noem het uur van de korte wijzer:": ["சின்ன முள் காட்டும் மணியைச் சொல்:"],
  "Twee sprongen na de 12: tien over.": ["12-க்குப் பிறகு இரண்டு தாவல்கள். " + THEN, { nl: "tien over" }],
  "De lange wijzer staat op de 3.": ["பெரிய முள் 3-இல் இருக்கிறது."],
  "Een kwart van de klok na de 12: kwart over.": ["12-இலிருந்து கடிகாரத்தின் கால் பகுதி கடந்துவிட்டது. " + THEN, { nl: "kwart over" }],
  "De lange wijzer staat vlak vóór de halte bij de 6.": ["பெரிய முள் 6-இல் உள்ள பஸ் நிறுத்தத்துக்குச் சற்று முன்னால் இருக்கிறது."],
  "Nog twee sprongen tot de halte: tien voor half.": ["பஸ் நிறுத்தத்துக்கு இன்னும் இரண்டு தாவல்கள். " + THEN, { nl: "tien voor half" }],
  "Bij half noem je het volgende uur:": [{ nl: "half" }, "என்று சொல்லும்போது, அடுத்த மணியைச் சொல்வோம்:"],
  "Nog één sprong tot de halte: vijf voor half.": ["பஸ் நிறுத்தத்துக்கு இன்னும் ஒரு தாவல். " + THEN, { nl: "vijf voor half" }],
  "De lange wijzer staat op de halte bij de 6.": ["பெரிய முள் 6-இல் உள்ள பஸ் நிறுத்தத்தில் இருக்கிறது."],
  "Op de halte zeg je half.": ["பஸ் நிறுத்தத்தில் நாம் சொல்வது:", { nl: "half" }],
  "De lange wijzer is net voorbij de halte bij de 6.": ["பெரிய முள் 6-இல் உள்ள பஸ் நிறுத்தத்தை இப்போதுதான் தாண்டியிருக்கிறது."],
  "Eén sprong na de halte: vijf over half.": ["பஸ் நிறுத்தத்துக்குப் பிறகு ஒரு தாவல். " + THEN, { nl: "vijf over half" }],
  "Twee sprongen na de halte: tien over half.": ["பஸ் நிறுத்தத்துக்குப் பிறகு இரண்டு தாவல்கள். " + THEN, { nl: "tien over half" }],
  "De lange wijzer staat op de 9.": ["பெரிய முள் 9-இல் இருக்கிறது."],
  "Nog een kwart tot de 12: kwart voor.": ["12-க்கு இன்னும் கால் பகுதி இருக்கிறது. " + THEN, { nl: "kwart voor" }],
  "Noem het volgende uur:": ["அடுத்த மணியைச் சொல்:"],
  "De lange wijzer gaat bijna naar de 12.": ["பெரிய முள் கிட்டத்தட்ட 12-ஐ நெருங்கிவிட்டது."],
  "Nog twee sprongen tot de 12: tien voor.": ["12-க்கு இன்னும் இரண்டு தாவல்கள். " + THEN, { nl: "tien voor" }],
  "Nog één sprong tot de 12: vijf voor.": ["12-க்கு இன்னும் ஒரு தாவல். " + THEN, { nl: "vijf voor" }],

  // --- Lesson "Over en voor" ---
  "Kijk naar de 12. Daar is de start en de finish.": ["12-ஐப் பார். அதுதான் ஓட்டப் பந்தயத்தின் தொடக்கமும் முடிவும்."],
  "De lange wijzer loopt steeds een rondje, net als een hardloper.": ["பெரிய முள், ஓட்டப் பந்தய வீரர் போல, எப்போதும் சுற்றிச் சுற்றி ஓடுகிறது."],
  "De lange wijzer is één sprong voorbij de 12.": ["பெரிய முள் 12-ஐத் தாண்டி ஒரு தாவல் போயிருக்கிறது."],
  "Eén sprong is vijf minuten. Kijk maar: naast de 1 staat een groene 5.": ["ஒரு தாவல் என்றால் ஐந்து நிமிடம். பார், 1-க்குப் பக்கத்தில் ஒரு பச்சை 5 இருக்கிறது."],
  "Net na de start zeg je: over.": ["தொடக்கத்துக்குச் சற்றுப் பின்னால் நாம் சொல்வது:", { nl: "over" }],
  "Twee sprongen na de 12. Tel mee: vijf, tien.": ["12-க்குப் பிறகு இரண்டு தாவல்கள். என்னோடு சேர்ந்து எண்ணு:", { nl: "vijf" }, { nl: "tien" }],
  "Dus is het tien over.": ["அதனால் இது:", { nl: "tien over" }],
  "Nu is de lange wijzer bijna terug bij de 12.": ["இப்போது பெரிய முள் கிட்டத்தட்ட மீண்டும் 12-க்கு வந்துவிட்டது."],
  "Nog twee sprongen tot de finish. Dat is tien minuten.": ["முடிவுக் கோட்டுக்கு இன்னும் இரண்டு தாவல்கள். அது பத்து நிமிடம்."],
  "Vlak vóór de finish zeg je: voor.": ["முடிவுக் கோட்டுக்குச் சற்று முன்னால் நாம் சொல்வது:", { nl: "voor" }],
  "Nog één sprong tot de finish: vijf voor.": ["முடிவுக் கோட்டுக்கு இன்னும் ஒரு தாவல். " + THEN, { nl: "vijf voor" }],
  "Als je voor zegt, noem je het volgende uur. Dat komt eraan.": [
    { nl: "voor" },
    "என்று சொல்லும்போது, அடுத்த மணியைச் சொல்வோம். ஏனென்றால் அந்த மணி வரப்போகிறது.",
  ],
  "Zet de klok op tien voor negen.": ["கடிகாரத்தை இந்த நேரத்துக்கு வை:", { nl: "tien voor negen" }],
  "Sleep de lange blauwe wijzer.": ["நீல நிறப் பெரிய முள்ளை இழுத்து நகர்த்து."],
  "Super! Dat is tien voor negen.": ["சூப்பர்! இதுதான்:", { nl: "tien voor negen" }],

  // --- Lesson "Rond half" ---
  "Kijk naar de 6. Dat is de halte.": ["6-ஐப் பார். அதுதான் பஸ் நிறுத்தம். டச்சு மொழியில்:", { nl: "halte" }],
  "Staat de lange wijzer op de halte? Dan is het half.": ["பெரிய முள் பஸ் நிறுத்தத்தில் இருந்தால், அது:", { nl: "half" }],
  "De korte wijzer is halverwege naar de 9.": ["சின்ன முள் 9-ஐ நோக்கிப் பாதி வழியில் இருக்கிறது."],
  "De lange wijzer staat één sprong vóór de halte.": ["பெரிய முள் பஸ் நிறுத்தத்துக்கு ஒரு தாவல் முன்னால் இருக்கிறது."],
  "Eén sprong is vijf minuten.": ["ஒரு தாவல் என்றால் ஐந்து நிமிடம்."],
  "Vóór de halte zeg je: voor half.": ["பஸ் நிறுத்தத்துக்கு முன்னால் நாம் சொல்வது:", { nl: "voor half" }],
  "Nu zijn het twee sprongen tot de halte.": ["இப்போது பஸ் நிறுத்தத்துக்கு இரண்டு தாவல்கள் இருக்கின்றன."],
  "Twee sprongen is tien minuten.": ["இரண்டு தாவல்கள் என்றால் பத்து நிமிடம்."],
  "De lange wijzer is één sprong voorbij de halte.": ["பெரிய முள் பஸ் நிறுத்தத்தைத் தாண்டி ஒரு தாவல் போயிருக்கிறது."],
  "Voorbij de halte zeg je: over half.": ["பஸ் நிறுத்தத்தைத் தாண்டிய பிறகு நாம் சொல்வது:", { nl: "over half" }],
  "Twee sprongen voorbij de halte.": ["பஸ் நிறுத்தத்தைத் தாண்டி இரண்டு தாவல்கள்."],
  "Bij voor half en over half noem je altijd het volgende uur.": [
    { nl: "voor half" },
    "அல்லது",
    { nl: "over half" },
    "சொல்லும்போது, எப்போதும் அடுத்த மணியைச் சொல்வோம்.",
  ],
  "Zet de klok op vijf voor half negen.": ["கடிகாரத்தை இந்த நேரத்துக்கு வை:", { nl: "vijf voor half negen" }],
  "Super! Dat is vijf voor half negen.": ["சூப்பர்! இதுதான்:", { nl: "vijf voor half negen" }],

  // --- Zet de klok / Mijn dag feedback ---
  "Zet de klok op": ["கடிகாரத்தை இந்த நேரத்துக்கு வை:"],
  "De lange wijzer staat goed!": ["பெரிய முள் சரியாக இருக்கிறது!"],
  "De korte wijzer staat goed!": ["சின்ன முள் சரியாக இருக்கிறது!"],
  "Kijk nu naar de korte wijzer.": ["இப்போது சின்ன முள்ளைப் பார்."],
  "Kijk nu naar de lange wijzer.": ["இப்போது பெரிய முள்ளைப் பார்."],
  "Missie klaar! Jij bent een klokkampioen.": ["மிஷன் முடிந்தது! நீ ஒரு கடிகாரச் சாம்பியன்!"],
  "Goed zo!": ["சபாஷ்!"],
  "Super!": ["சூப்பர்!"],
  "Knap gedaan!": ["அருமையாகச் செய்தாய்!"],
  "Zet de lange wijzer op de 12.": ["பெரிய முள்ளை 12-இல் வை."],
  "Vijf over: zet de lange wijzer één sprong na de 12.": [{ nl: "vijf over" }, "என்றால், பெரிய முள்ளை 12-க்குப் பிறகு ஒரு தாவலில் வை."],
  "Tien over: zet de lange wijzer twee sprongen na de 12.": [{ nl: "tien over" }, "என்றால், பெரிய முள்ளை 12-க்குப் பிறகு இரண்டு தாவல்களில் வை."],
  "Kwart over: zet de lange wijzer op de 3.": [{ nl: "kwart over" }, "என்றால், பெரிய முள்ளை 3-இல் வை."],
  "Tien voor half: zet de lange wijzer twee sprongen vóór de halte.": [
    { nl: "tien voor half" },
    "என்றால், பெரிய முள்ளை பஸ் நிறுத்தத்துக்கு இரண்டு தாவல் முன்னால் வை.",
  ],
  "Vijf voor half: zet de lange wijzer één sprong vóór de halte.": [
    { nl: "vijf voor half" },
    "என்றால், பெரிய முள்ளை பஸ் நிறுத்தத்துக்கு ஒரு தாவல் முன்னால் வை.",
  ],
  "Half: zet de lange wijzer op de halte bij de 6.": [{ nl: "half" }, "என்றால், பெரிய முள்ளை 6-இல் உள்ள பஸ் நிறுத்தத்தில் வை."],
  "Vijf over half: zet de lange wijzer één sprong na de halte.": [
    { nl: "vijf over half" },
    "என்றால், பெரிய முள்ளை பஸ் நிறுத்தத்துக்குப் பிறகு ஒரு தாவலில் வை.",
  ],
  "Tien over half: zet de lange wijzer twee sprongen na de halte.": [
    { nl: "tien over half" },
    "என்றால், பெரிய முள்ளை பஸ் நிறுத்தத்துக்குப் பிறகு இரண்டு தாவல்களில் வை.",
  ],
  "Kwart voor: zet de lange wijzer op de 9.": [{ nl: "kwart voor" }, "என்றால், பெரிய முள்ளை 9-இல் வை."],
  "Tien voor: zet de lange wijzer twee sprongen vóór de 12.": [{ nl: "tien voor" }, "என்றால், பெரிய முள்ளை 12-க்கு இரண்டு தாவல் முன்னால் வை."],
  "Vijf voor: zet de lange wijzer één sprong vóór de 12.": [{ nl: "vijf voor" }, "என்றால், பெரிய முள்ளை 12-க்கு ஒரு தாவல் முன்னால் வை."],
  "Zet de korte wijzer bij de": ["சின்ன முள்ளை இந்த எண்ணின் அருகில் வை:"],
  "Bij half staat de korte wijzer tussen twee getallen.": [{ nl: "half" }, "நேரத்தில் சின்ன முள் இரண்டு எண்களுக்கு நடுவில் இருக்கும்."],
  "Zet de korte wijzer vlak vóór het volgende uur:": ["சின்ன முள்ளை அடுத்த மணிக்குச் சற்று முன்னால் வை:"],

  // --- Spelen ---
  "Tik op de getallen, van 1 tot 12. Elke stap is vijf minuten.": ["1 முதல் 12 வரை எண்களைத் தொடு. ஒவ்வொரு அடியும் ஐந்து நிமிடம்."],
  "Zoek de": ["அடுத்த எண்ணைத் தேடு:"],
  "Rondje klaar! De lange wijzer liep een heel uur.": ["ஒரு சுற்று முடிந்தது! பெரிய முள் ஒரு முழு மணி நேரம் ஓடியது."],
  "Kijk alleen naar de korte wijzer. Hoe laat is het ongeveer?": ["சின்ன முள்ளை மட்டும் பார். இப்போது சுமார் எத்தனை மணி?"],
  "Kijk, zo laat is het precies:": ["பார், சரியான நேரம் இதுதான்:"],
  "Staat de korte wijzer vlak na een getal? Dan is het net na dat uur.": [
    "சின்ன முள் ஒரு எண்ணைச் சற்றுத் தாண்டியிருந்தால், அந்த மணி ஆகி கொஞ்ச நேரம்தான் ஆகியிருக்கிறது. டச்சு மொழியில்:",
    { nl: "net na" },
  ],
  "Staat hij midden tussen twee getallen? Dan is het ongeveer half.": [
    "சின்ன முள் இரண்டு எண்களுக்கு நடுவில் இருந்தால், அது சுமார் அரை மணி. டச்சு மொழியில்:",
    { nl: "ongeveer half" },
  ],
  "Staat hij vlak vóór een getal? Dan is het bijna dat uur.": [
    "சின்ன முள் ஒரு எண்ணுக்குச் சற்று முன்னால் இருந்தால், அந்த மணி ஆகப்போகிறது. டச்சு மொழியில்:",
    { nl: "bijna" },
  ],
  "Om zeven uur sta ik op.": ["காலையில் நான் எழுந்திருக்கும் நேரம்:", { nl: "zeven uur" }],
  "Om half acht eet ik mijn ontbijt.": ["நான் காலை உணவு சாப்பிடும் நேரம்:", { nl: "half acht" }],
  "Om kwart over acht ga ik naar school.": ["நான் பள்ளிக்குப் போகும் நேரம்:", { nl: "kwart over acht" }],
  "Om twaalf uur eet ik mijn boterham.": ["நான் மதிய உணவு சாப்பிடும் நேரம்:", { nl: "twaalf uur" }],
  "Om drie uur ga ik naar huis.": ["நான் வீட்டுக்குப் போகும் நேரம்:", { nl: "drie uur" }],
  "Om zes uur eten we samen.": ["நாம் எல்லோரும் சேர்ந்து இரவு உணவு சாப்பிடும் நேரம்:", { nl: "zes uur" }],
  "Om kwart voor zeven ga ik in bad.": ["நான் குளிக்கும் நேரம்:", { nl: "kwart voor zeven" }],
  "Om half acht ga ik naar bed.": ["நான் தூங்கப் போகும் நேரம்:", { nl: "half acht" }],
  "Zet de klok voor elk moment van jouw dag.": ["உன் நாளின் ஒவ்வொரு நேரத்துக்கும் கடிகாரத்தை வை."],
  "Wat een mooie dag! Jij kent de tijden van je dag.": ["எவ்வளவு அழகான நாள்! உன் நாளின் நேரங்கள் எல்லாம் உனக்குத் தெரியும்."],
};

export type ExplainLanguage = "nl" | "ta";

/** How a Dutch line is spoken in the chosen language; lines without Tamil stay Dutch. */
export function speechParts(text: string, language: ExplainLanguage): SpeechPart[] {
  if (language === "ta" && TAMIL[text]) return TAMIL[text];
  return [{ nl: text }];
}

/** FNV-1a, so Tamil clips get stable ASCII file names that change when the text changes. */
function hash(text: string) {
  let value = 0x811c9dc5;
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value.toString(16).padStart(8, "0");
}

export function tamilClipPath(text: string) {
  return `/audio/ta/${hash(text)}.mp3`;
}

/** Every distinct Tamil part and every Dutch fragment the Tamil lines use. */
export function allTamilParts() {
  const tamil = new Set<string>();
  const dutch = new Set<string>();
  for (const parts of Object.values(TAMIL)) {
    for (const part of parts) {
      if (typeof part === "string") tamil.add(part);
      else dutch.add(part.nl);
    }
  }
  return { tamil: [...tamil], dutch: [...dutch] };
}
