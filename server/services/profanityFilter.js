// List of common vulgar/inappropriate words to filter
const vulgarWords = [
  // English
  'fuck', 'fucking', 'shit', 'shitty', 'ass', 'asshole', 'bitch', 'bitching', 
  'damn', 'dammit', 'crap', 'crappy', 'hell', 'bastard', 'bloody', 'piss',
  'cock', 'dick', 'pussy', 'slut', 'whore', 'douche', 'douchebag', 'cunt',
  'bullshit', 'bullshitted', 'fucked', 'shithead', 'dickhead', 'asshat',

  // Hindi (Roman script / transliterated)
  'chutiya', 'chutiye', 'chutiyapa', 'madarchod', 'behenchod', 'bhenchod',
  'randi', 'randibaaz', 'gandu', 'gaand', 'gandmasti', 'lund', 'lauda',
  'laude', 'loda', 'lode', 'harami', 'haramzada', 'haramzadi', 'kutta',
  'kutti', 'kamina', 'kamini', 'bhosdi', 'bhosdike', 'bhosda', 'saala',
  'saali', 'chodu', 'chod', 'jhaant', 'jhaantu', 'bakchod', 'bakchodi'
];

// Create a regex pattern for all vulgar words with word boundaries
const createProfanityRegex = () => {
  const escapedWords = vulgarWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
};

const profanityRegex = createProfanityRegex();

export const filterProfanity = (text) => {
  if (!text) return text;
  return text.replace(profanityRegex, (match) => {
    // Replace with asterisks of same length
    return '*'.repeat(match.length);
  });
};

export const containsProfanity = (text) => {
  if (!text) return false;
  return profanityRegex.test(text);
};

export const cleanMessage = (text) => {
  return filterProfanity(text);
};

export default {
  filterProfanity,
  containsProfanity,
  cleanMessage
};
