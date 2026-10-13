import type { Item, Bill, Category } from '../types';

/**
 * Normalizes a string for robust, typo-tolerant search:
 * - Lowercases and trims
 * - Removes non-alphanumeric punctuation
 * - Collapses consecutive whitespace
 * - Standardizes Indian transliterations (e.g. 'ee' -> 'i', 'oo' -> 'u', 'sh' -> 's', 'v' -> 'w')
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Phonetic / Transliteration phonetic key generator for Indian food dishes:
 * E.g., 'biryani' == 'biriyani' == 'bryani', 'paneer' == 'panir' == 'panneer'
 */
export function getPhoneticKey(str: string): string {
  let s = normalizeSearchTerm(str);
  s = s
    .replace(/ee+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/ea+/g, 'i')
    .replace(/ou+/g, 'u')
    .replace(/sch/g, 's')
    .replace(/sh+/g, 's')
    .replace(/ch+/g, 'c')
    .replace(/kh+/g, 'k')
    .replace(/gh+/g, 'g')
    .replace(/th+/g, 't')
    .replace(/dh+/g, 'd')
    .replace(/bh+/g, 'b')
    .replace(/ph+/g, 'f')
    .replace(/v+/g, 'w')
    .replace(/z+/g, 'j')
    .replace(/([a-z])\1+/g, '$1'); // deduplicate double letters
  return s;
}

/**
 * Calculates Damerau-Levenshtein Distance between two strings (handles insertions, deletions, substitutions, and transpositions)
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let min = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        min = Math.min(min, matrix[i - 2][j - 2] + cost);
      }

      matrix[i][j] = min;
    }
  }

  return matrix[al][bl];
}

/**
 * Compute fuzzy similarity score between 0.0 and 1.0
 */
export function fuzzySimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = damerauLevenshteinDistance(a, b);
  return Math.max(0, 1.0 - dist / maxLen);
}

/**
 * Extracts initials/acronym from a dish name (e.g. "Masala Dosa" -> "md", "Filter Coffee" -> "fc")
 */
export function getAcronym(str: string): string {
  const words = normalizeSearchTerm(str).split(' ').filter(Boolean);
  return words.map((w) => w[0]).join('');
}

export interface MatchScoreResult {
  score: number;
  isMatch: boolean;
  matchedField?: string;
}

/**
 * Advanced Multi-Factor Matching Algorithm for Menu Items:
 * Evaluates exact, prefix, word-start, acronym, substring, phonetic, and typo-tolerant fuzzy distance.
 */
export function calculateItemSearchScore(
  item: Item,
  query: string,
  categoryName?: string
): MatchScoreResult {
  const rawQuery = query.trim();
  if (!rawQuery) {
    return { score: 100, isMatch: true };
  }

  const cleanQuery = normalizeSearchTerm(rawQuery);
  if (!cleanQuery) {
    return { score: 0, isMatch: false };
  }

  const queryTokens = cleanQuery.split(' ').filter(Boolean);
  const queryPhonetic = getPhoneticKey(rawQuery);

  const cleanName = normalizeSearchTerm(item.name);
  const cleanShort = item.shortName ? normalizeSearchTerm(item.shortName) : '';
  const cleanHindi = item.nameHindi ? item.nameHindi.toLowerCase().trim() : '';
  const cleanCategory = categoryName ? normalizeSearchTerm(categoryName) : '';

  const nameWords = cleanName.split(' ').filter(Boolean);
  const itemAcronym = getAcronym(item.name);
  const shortAcronym = cleanShort ? getAcronym(item.shortName || '') : '';

  let totalScore = 0;
  let hasMatched = false;

  // 1. Direct Item Code / Short Code Match (Highest Priority)
  if (cleanShort && (cleanShort === cleanQuery || cleanShort.startsWith(cleanQuery))) {
    totalScore += 1200;
    hasMatched = true;
  }

  // 2. Acronym / Initials Match (e.g. "MD" for "Masala Dosa", "CB" for "Chicken Biryani")
  if (
    cleanQuery.length >= 2 &&
    (itemAcronym === cleanQuery || shortAcronym === cleanQuery || itemAcronym.startsWith(cleanQuery))
  ) {
    totalScore += 950;
    hasMatched = true;
  }

  // 3. Exact Full Name Match
  if (cleanName === cleanQuery) {
    totalScore += 1000;
    hasMatched = true;
  }
  // 4. Exact Name Prefix (e.g. "Dosa" -> "Dosa Masala")
  else if (cleanName.startsWith(cleanQuery)) {
    totalScore += 850;
    hasMatched = true;
  }
  // 5. Name Substring Match (e.g. "Coffee" in "Hot Filter Coffee")
  else if (cleanName.includes(cleanQuery)) {
    totalScore += 700;
    hasMatched = true;
  }

  // 6. Hindi Name Match
  if (cleanHindi && cleanHindi.includes(rawQuery.toLowerCase())) {
    totalScore += 800;
    hasMatched = true;
  }

  // 7. Multi-Token Coverage (Words typed in any order, e.g. "special paneer" matches "Paneer Butter Masala Special")
  if (queryTokens.length > 1) {
    let tokensFound = 0;
    for (const qToken of queryTokens) {
      const foundInWords = nameWords.some(
        (nw) => nw.startsWith(qToken) || nw.includes(qToken) || fuzzySimilarity(nw, qToken) >= 0.75
      );
      if (foundInWords || (cleanCategory && cleanCategory.includes(qToken))) {
        tokensFound++;
      }
    }
    if (tokensFound === queryTokens.length) {
      totalScore += 650 + tokensFound * 80;
      hasMatched = true;
    } else if (tokensFound > 0 && tokensFound >= Math.ceil(queryTokens.length * 0.6)) {
      totalScore += 350 + tokensFound * 50;
      hasMatched = true;
    }
  }

  // 8. Individual Word-Start Match (e.g. "bur" matches "Burger" in "Veg Cheese Burger")
  for (const word of nameWords) {
    if (word.startsWith(cleanQuery)) {
      totalScore += 600;
      hasMatched = true;
      break;
    }
  }

  // 9. Phonetic Transliteration Match (e.g. "biriyani" matches "biryani", "cofe" matches "coffee")
  const namePhonetic = getPhoneticKey(item.name);
  if (namePhonetic === queryPhonetic) {
    totalScore += 550;
    hasMatched = true;
  } else if (namePhonetic.includes(queryPhonetic) || queryPhonetic.includes(namePhonetic)) {
    totalScore += 450;
    hasMatched = true;
  }

  // 10. Typo-Tolerant Fuzzy Match across entire dish name & individual words
  if (!hasMatched) {
    // Max allowed distance: 1 typo for 3-4 chars, 2 typos for 5-8 chars, 3 typos for 9+ chars
    const maxAllowedDist = cleanQuery.length <= 4 ? 1 : cleanQuery.length <= 8 ? 2 : 3;

    // Check full name distance
    const fullDist = damerauLevenshteinDistance(cleanName, cleanQuery);
    if (fullDist <= maxAllowedDist) {
      const sim = 1 - fullDist / Math.max(cleanName.length, cleanQuery.length);
      totalScore += Math.round(sim * 400);
      hasMatched = true;
    }

    // Check per-word fuzzy distance
    if (!hasMatched) {
      for (const word of nameWords) {
        if (word.length < 3 && cleanQuery.length > 2) continue;
        const wordDist = damerauLevenshteinDistance(word, cleanQuery);
        const wordMaxDist = word.length <= 4 ? 1 : 2;
        if (wordDist <= wordMaxDist) {
          const sim = 1 - wordDist / Math.max(word.length, cleanQuery.length);
          totalScore += Math.round(sim * 380);
          hasMatched = true;
          break;
        }

        // Fuzzy sub-string / phonetic word match
        const wordPhonetic = getPhoneticKey(word);
        if (wordPhonetic === queryPhonetic || damerauLevenshteinDistance(wordPhonetic, queryPhonetic) <= 1) {
          totalScore += 350;
          hasMatched = true;
          break;
        }
      }
    }
  }

  // 11. Category Match bonus
  if (cleanCategory && (cleanCategory.includes(cleanQuery) || cleanCategory.startsWith(cleanQuery))) {
    totalScore += 200;
    hasMatched = true;
  }

  return {
    score: totalScore,
    isMatch: hasMatched,
  };
}

/**
 * Intelligent Fast Menu Item Search:
 * Returns items matching the query, sorted with the highest relevance match at the top.
 */
export function searchMenuItems(
  items: Item[],
  query: string,
  categories?: Category[],
  categoryMap?: Map<string, string>
): Item[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return items.filter((it) => !it.isDeleted);
  }

  const catMap =
    categoryMap ||
    (categories
      ? new Map(categories.map((c) => [c.id, c.name]))
      : new Map<string, string>());

  const scored: { item: Item; score: number }[] = [];

  for (const item of items) {
    if (item.isDeleted) continue;
    const catName = catMap.get(item.categoryId);
    const { score, isMatch } = calculateItemSearchScore(item, trimmed, catName);
    if (isMatch && score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort descending by match relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.item);
}

/**
 * Fuzzy Search for Bills / Invoices:
 * Matches Bill No (e.g. "B2627-000019", "000019", "19"), Order No (#00017),
 * Customer Name, Phone, Table No, or item names inside the bill.
 */
export function searchBills(bills: Bill[], query: string): Bill[] {
  const raw = query.trim();
  if (!raw) return bills;

  const clean = normalizeSearchTerm(raw);
  const rawDigits = raw.replace(/\D/g, '');

  return bills.filter((b) => {
    // 1. Bill Number Match
    if (b.billNo.toLowerCase().includes(clean)) return true;
    if (rawDigits && b.billNo.includes(rawDigits)) return true;

    // 2. Order / Token No Match
    const orderStr = (b.orderNo || b.tokenNo || '').toString();
    if (orderStr === rawDigits || orderStr.includes(rawDigits)) return true;

    // 3. Customer Info Match
    if (b.customerName && normalizeSearchTerm(b.customerName).includes(clean)) return true;
    if (b.customerPhone && b.customerPhone.includes(rawDigits)) return true;

    // 4. Table No Match
    if (b.tableNo && b.tableNo.toLowerCase().includes(clean)) return true;

    // 5. Dish name in bill items
    const hasItemMatch = b.items.some((it) =>
      normalizeSearchTerm(it.nameSnapshot).includes(clean) ||
      (it.shortNameSnapshot && normalizeSearchTerm(it.shortNameSnapshot).includes(clean))
    );
    if (hasItemMatch) return true;

    return false;
  });
}
