/**
 * @file fuzzyAnchorMatcher.js
 * @description Fuzzy text matching algorithm for resilient comment anchor repositioning.
 * Recalculates start and end offsets when concurrent edits shift document plain text.
 * @module frontend/src/modules/editor/utils/fuzzyAnchorMatcher
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Jab multiple users ek hi document par kaam kar rahe hon toh text add ya delete hone se
 * comment ke character offsets (from/to) shift ho jaate hain. Yeh algorithm 3-step fuzzy
 * search use karta hai (original offset, prefix/suffix context, aur closest match) taake
 * highlight mark sahi jagah par re-attach ho sake.
 */

/**
 * Resolves a text-anchored comment within mutated document text using multi-tier context matching.
 * Handles offset shifts caused by concurrent typing.
 *
 * [ROMAN URDU]:
 * Mutated document text mein comment anchor ki position dhoondta hai:
 * 1. Pehle exact offset check karta hai (Confidence 1.0)
 * 2. Phir prefix + quote + suffix context pattern search karta hai (Confidence 0.95)
 * 3. Aakhir mein original offset ke sab se qareeb wala occurrence match karta hai (Confidence 0.8)
 * Agar text delete ho chuka ho toh null return karta hai.
 *
 * @param {string} fullDocumentText - Complete current plain text of the document
 * @param {Object} anchor - The original anchor object
 * @param {number} anchor.from - Original starting character offset
 * @param {number} anchor.to - Original ending character offset
 * @param {string} anchor.exactQuote - The highlighted string
 * @param {string} [anchor.prefixContext=''] - Preceding characters at time of selection
 * @param {string} [anchor.suffixContext=''] - Succeeding characters at time of selection
 * @returns {{ from: number, to: number, confidence: number } | null} Resolved offsets or null
 */
export function resolveCommentAnchorPosition(fullDocumentText, anchor) {
  if (!fullDocumentText || !anchor || !anchor.exactQuote) return null;

  const { exactQuote, prefixContext = '', suffixContext = '', from, to } = anchor;

  // 1. Exact match at original offset
  if (fullDocumentText.slice(from, to) === exactQuote) {
    return { from, to, confidence: 1.0 };
  }

  // 2. Exact match with prefix + quote + suffix context
  if (prefixContext || suffixContext) {
    const fullSearchPattern = prefixContext + exactQuote + suffixContext;
    const fullIndex = fullDocumentText.indexOf(fullSearchPattern);
    if (fullIndex !== -1) {
      const matchedFrom = fullIndex + prefixContext.length;
      return { from: matchedFrom, to: matchedFrom + exactQuote.length, confidence: 0.95 };
    }
  }

  // 3. Search closest occurrence to original offset
  let bestIndex = -1;
  let minDistance = Infinity;
  let startIndex = 0;

  while ((startIndex = fullDocumentText.indexOf(exactQuote, startIndex)) !== -1) {
    const distance = Math.abs(startIndex - from);
    if (distance < minDistance) {
      minDistance = distance;
      bestIndex = startIndex;
    }
    startIndex += exactQuote.length;
  }

  if (bestIndex !== -1) {
    return { from: bestIndex, to: bestIndex + exactQuote.length, confidence: 0.8 };
  }

  return null; // Highlighted text was deleted or significantly altered
}
