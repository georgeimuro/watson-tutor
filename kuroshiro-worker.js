// Kuroshiro Web Worker — Japanese text processing off the main thread
// Dictionary + J-E lookup all local, zero API calls

importScripts('/kuroshiro.min.js');
importScripts('/kuroshiro-analyzer-kuromoji.min.js');

const KuroshiroClass = self.Kuroshiro.default;
const AnalyzerClass = self.KuromojiAnalyzer;

let kuroshiro = null;
let analyzer = null;
let ready = false;
let jdict = {};

// Katakana → romaji lookup (faster than calling kuroshiro.convert per word)
const KANA_ROMAJI = {
  'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o',
  'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
  'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so',
  'タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
  'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no',
  'ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
  'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo',
  'ヤ':'ya','ユ':'yu','ヨ':'yo',
  'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro',
  'ワ':'wa','ヲ':'wo','ン':'n',
  'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go',
  'ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo',
  'ダ':'da','ヂ':'di','ヅ':'du','デ':'de','ド':'do',
  'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo',
  'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po',
  'キャ':'kya','キュ':'kyu','キョ':'kyo',
  'シャ':'sha','シュ':'shu','ショ':'sho',
  'チャ':'cha','チュ':'chu','チョ':'cho',
  'ニャ':'nya','ニュ':'nyu','ニョ':'nyo',
  'ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo',
  'ミャ':'mya','ミュ':'myu','ミョ':'myo',
  'リャ':'rya','リュ':'ryu','リョ':'ryo',
  'ギャ':'gya','ギュ':'gyu','ギョ':'gyo',
  'ジャ':'ja','ジュ':'ju','ジョ':'jo',
  'ビャ':'bya','ビュ':'byu','ビョ':'byo',
  'ピャ':'pya','ピュ':'pyu','ピョ':'pyo',
  'ッ':'(double)','ー':'ō',
};

function katakanaToRomaji(katakana) {
  if (!katakana) return '';
  let result = '';
  let i = 0;
  while (i < katakana.length) {
    // Try two-char combo first (for きゃ etc)
    if (i + 1 < katakana.length) {
      const two = katakana[i] + katakana[i+1];
      if (KANA_ROMAJI[two]) { result += KANA_ROMAJI[two]; i += 2; continue; }
    }
    // Single char
    const one = katakana[i];
    if (one === 'ッ' && i + 1 < katakana.length) {
      // Double consonant: peek next char's romaji and double the first consonant
      const nextTwo = (i + 2 < katakana.length) ? katakana[i+1] + katakana[i+2] : '';
      const nextOne = katakana[i+1];
      const nextRomaji = KANA_ROMAJI[nextTwo] || KANA_ROMAJI[nextOne] || '';
      if (nextRomaji) result += nextRomaji[0];
      i++; continue;
    }
    if (KANA_ROMAJI[one]) { result += KANA_ROMAJI[one]; }
    else { result += one; } // Pass through unknown chars
    i++;
  }
  return result;
}

async function init() {
  // Load J-E dictionary
  try {
    const resp = await fetch('/jdict.json');
    jdict = await resp.json();
  } catch(e) { jdict = {}; }

  analyzer = new AnalyzerClass({ dictPath: '/dict/' });
  kuroshiro = new KuroshiroClass();
  await kuroshiro.init(analyzer);
  ready = true;
  postMessage({ type: 'ready', dictSize: Object.keys(jdict).length });
}

self.onmessage = async (e) => {
  const { type, id, text } = e.data;

  if (type === 'init') {
    try { await init(); }
    catch (err) { postMessage({ type: 'error', error: String(err) + ' | ' + (err?.message || '') }); }
    return;
  }

  if (type === 'convert' && ready) {
    try {
      // Only 2 kuroshiro calls (full sentence), not per-word
      const romaji = await kuroshiro.convert(text, { to: 'romaji', romajiSystem: 'hepburn' });
      const furigana = await kuroshiro.convert(text, { mode: 'furigana', to: 'hiragana' });

      // Tokenize (instant — just array manipulation)
      const tokens = analyzer._analyzer.tokenize(text);
      const words = [];
      for (const t of tokens) {
        if (!t.surface_form || !t.surface_form.trim()) continue;
        if (/^[。、！？「」\s.,!?'"…\-:;]+$/.test(t.surface_form)) continue;

        // Romaji from katakana reading (instant lookup, no kuroshiro call)
        const wordRomaji = katakanaToRomaji(t.reading || '');

        // English meaning from local dictionary (instant)
        const meaning = jdict[t.surface_form] || jdict[t.basic_form] || '';

        // Convert katakana reading to hiragana
        const hiraganaReading = (t.reading || '').replace(/[\u30A0-\u30FF]/g, ch =>
          String.fromCharCode(ch.charCodeAt(0) - 0x60)
        );

        words.push({
          surface: t.surface_form,
          reading: hiraganaReading,
          romaji: wordRomaji,
          meaning: meaning,
          basic: t.basic_form || t.surface_form,
        });
      }

      postMessage({ type: 'result', id, romaji, furigana, words });
    } catch (err) {
      postMessage({ type: 'error', id, error: err.message });
    }
  }
};
