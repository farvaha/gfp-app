// Multilingual abuse screen for the feedback box. This is a client-side
// first line of defence - the server runs its own screen as well, so
// bypassing this list does not bypass moderation.
//
// Covers English, Hindi (Devanagari + romanised "Hinglish"), and a few
// widely-used slurs from Spanish, French, German, and Arabic romanisation.
// Matching is case-insensitive, on word boundaries, with common
// letter-swap obfuscations (@ for a, 0 for o, etc.) normalised first.

const WORDS: string[] = [
  // English
  'fuck', 'fucker', 'fucking', 'fck', 'fcking', 'fuk', 'fuking', 'motherfucker',
  'shit', 'bullshit', 'bitch',
  'bastard', 'asshole', 'arsehole', 'dick', 'dickhead', 'prick', 'cunt',
  'slut', 'whore', 'faggot', 'retard', 'nigger', 'nigga', 'wanker', 'twat',
  // Hindi - Devanagari
  '\u092e\u093e\u0926\u0930\u091a\u094b\u0926', // madarchod
  '\u092d\u094b\u0938\u0921\u0940', // bhosdi
  '\u092d\u094b\u0938\u0921\u093c\u0940\u0915\u0947',
  '\u091a\u0942\u0924\u093f\u092f\u093e', // chutiya
  '\u091a\u0941\u0924\u093f\u092f\u093e',
  '\u0917\u093e\u0902\u0921', // gaand
  '\u0939\u0930\u093e\u092e\u0940', // haraami
  '\u0930\u0902\u0921\u0940', // randi
  '\u0932\u0902\u0921', // lund
  '\u092c\u0939\u0928\u091a\u094b\u0926', // behenchod
  // Hinglish / romanised Hindi-Urdu
  'madarchod', 'madarchodh', 'behenchod', 'behanchod', 'bhenchod', 'bc',
  'mc', 'bhosdike', 'bhosdi', 'bhosadike', 'chutiya', 'chutiye', 'chutia',
  'gaand', 'gaandu', 'gandu', 'harami', 'haraami', 'randi', 'lund', 'loda',
  'lauda', 'lawda', 'jhant', 'kamina', 'kamine', 'kutta', 'kutte', 'kutiya',
  'saala', 'saale', 'sala kutta', 'teri maa', 'teri maa ki', 'maa ki chut',
  // Spanish / French / German / misc
  'puta', 'puto', 'pendejo', 'cabron', 'mierda', 'putain', 'merde',
  'connard', 'salope', 'encule', 'scheisse', 'arschloch', 'hurensohn',
  'kanjar', 'khanzir', 'sharmuta',
];

// Normalise common obfuscations before matching.
function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[*]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1'); // fuuuuck -> fuuck
}

const SHORT = new Set(['bc', 'mc']);

/** Returns true when the text contains abusive language in any covered language. */
export function isAbusive(text: string): boolean {
  const norm = normalise(text);
  // \p{M} keeps combining marks (Devanagari matras) attached to their word.
  const padded = ' ' + norm.replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ') + ' ';
  for (const w of WORDS) {
    if (SHORT.has(w)) {
      // Two-letter abbreviations only match as standalone words.
      if (padded.includes(' ' + w + ' ')) return true;
      continue;
    }
    if (w.includes(' ')) {
      if (padded.includes(w)) return true;
      continue;
    }
    // Word-start match only: 'fuckers' matches 'fuck', but 'scunthorpe'
    // does not match 'cunt' (no false positives on innocent words).
    if (padded.includes(' ' + w)) return true;
  }
  return false;
}
