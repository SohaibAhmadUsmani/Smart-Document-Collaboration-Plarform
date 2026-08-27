/**
 * Converts a plain text character offset (from editor.getText()) back
 * to a ProseMirror node position suitable for setTextSelection().
 *
 * getText() returns plain text with \n\n between top-level block nodes.
 * This function walks the document tree in the same order, accumulating
 * text, and returns the ProseMirror position corresponding to the target offset.
 *
 * @param {Object} doc - ProseMirror document node (editor.state.doc)
 * @param {number} targetOffset - Character offset in the plain text output
 * @returns {number} ProseMirror node position
 */
export function plainTextOffsetToProseMirrorPos(doc, targetOffset) {
  if (targetOffset <= 0) return 0;

  let accumulated = 0;

  function walk(node, pos) {
    if (node.isText) {
      const textLen = node.text.length;
      if (accumulated + textLen >= targetOffset) {
        return pos + (targetOffset - accumulated);
      }
      accumulated += textLen;
      return null;
    }

    if (!node.content || node.content.size === 0) return null;

    const children = [];
    node.content.forEach((child) => children.push(child));

    let childPos = pos;
    let prevEnd = null;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      // Add separator between top-level block siblings (matches getText() behavior)
      if (i > 0 && node.type.name === 'doc') {
        accumulated += 2; // '\n\n'
      }

      // If target lands on a separator boundary, return position after previous block
      if (accumulated >= targetOffset) {
        return prevEnd !== null ? prevEnd : pos;
      }

      const found = walk(child, childPos);
      if (found !== null) return found;

      prevEnd = childPos + child.nodeSize;
      childPos += child.nodeSize;
    }

    return null;
  }

  const result = walk(doc, 0);
  return result !== null ? result : doc.content.size;
}
