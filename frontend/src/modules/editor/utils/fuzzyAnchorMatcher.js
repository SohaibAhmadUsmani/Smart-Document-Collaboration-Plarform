/**
 * Resolves a text-anchored comment within mutated document text using context matching.
 * Handles offset shifts caused by concurrent typing.
 *
 * @param {string} fullDocumentText - Complete current plain text of the document
 * @param {Object} anchor - The original anchor object
 * @param {number} anchor.from - Original starting character offset
 * @param {number} anchor.to - Original ending character offset
 * @param {string} anchor.exactQuote - The highlighted string
 * @param {string} [anchor.prefixContext=''] - Preceding characters at time of selection
 * @param {string} [anchor.suffixContext=''] - Succeeding characters at time of selection
 * @returns {{ from: number, to: number, confidence: number } | null}
 */
export function resolveCommentAnchorPosition(fullDocumentText, anchor) {
  if (!fullDocumentText || !anchor || !anchor.exactQuote) return null;

  const { exactQuote, prefixContext = '', suffixContext = '', from, to } = anchor;

  // 1. Exact match at original offset
  if (fullDocumentText.slice(from, to) === exactQuote) {
    return { from, to, confidence: 1.0 };
  }

  // 2. Exact match with prefix + quote + suffix
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
