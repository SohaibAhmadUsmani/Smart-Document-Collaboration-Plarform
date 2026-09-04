/**
 * historyModel.js
 * Owner: Aiman
 * 
 * Defines the data structure for document version snapshots and search indexing.
 * Pre-populated with initial sample version history containing full TipTap AST formatting.
 */

// Sample Rich-Text TipTap AST structure for Q3 Marketing Strategy
const SAMPLE_MARKETING_AST = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Q3 Marketing Strategy & Execution Plan' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "This document outlines our core marketing initiatives for the upcoming third quarter. Our primary focus is on expanding our enterprise footprint while maintaining the high retention rates we saw in Q2. We'll be leveraging our new collaborative features as the primary value proposition.",
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '1. Executive Summary' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Our target is a 25% increase in MQLs (Marketing Qualified Leads) through a combination of targeted LinkedIn campaigns, a revamped webinar series, and strategic partnerships with industry influencers in the DevOps space.',
        },
      ],
    },
    {
      type: 'callout',
      attrs: { variant: 'quote' },
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '“The goal isn’t just more users; it’s more high-intent teams that can benefit from DocSync Pro’s real-time collaboration engine.” — Marketing Director',
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '2. Core Objectives' }],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Launch "DocSync for Enterprise" campaign highlighting SOC2 compliance.',
                },
              ],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Host 3 regional networking events for CTOs and Engineering Managers.',
                },
              ],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Decrease customer acquisition cost (CAC) by 15% through organic SEO optimization.',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// In-memory data store for versions pre-populated with initial sample version history
export const inMemoryVersionStore = [
  {
    id: 'ver_seed_201',
    documentId: '66cc00000000000000000001',
    versionNumber: 1,
    title: 'Q3 Marketing Strategy & Execution Plan',
    content: JSON.stringify(SAMPLE_MARKETING_AST),
    createdBy: 'Muzammil Tanveer',
    changeSummary: 'Initial document draft created',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'ver_seed_202',
    documentId: '66cc00000000000000000001',
    versionNumber: 2,
    title: 'Q3 Marketing Strategy & Execution Plan',
    content: JSON.stringify(SAMPLE_MARKETING_AST),
    createdBy: 'Marcus Thorne',
    changeSummary: 'Added LinkedIn and webinar distribution plan',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
  },
  {
    id: 'ver_seed_203',
    documentId: '66cc00000000000000000001',
    versionNumber: 3,
    title: 'Q3 Marketing Strategy & Execution Plan',
    content: JSON.stringify(SAMPLE_MARKETING_AST),
    createdBy: 'Sarah Chen',
    changeSummary: 'Updated Core Objectives and MQL targets',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hour ago
  },
  {
    id: 'ver_seed_101',
    documentId: 'doc_123',
    versionNumber: 1,
    title: 'Project Architectural Proposal',
    content: 'This is the initial draft of the smart document collaboration project architecture proposal.',
    createdBy: 'Sarah Chen',
    changeSummary: 'Initial project outline & architecture draft',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ver_seed_102',
    documentId: 'doc_123',
    versionNumber: 2,
    title: 'Project Architectural Proposal (V2)',
    content: 'This is the updated version of the document with Section 6 Version History requirements added.',
    createdBy: 'Marcus Thorne',
    changeSummary: 'Added Version History requirements & API specs',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

/**
 * Creates a formatted Version object record.
 * 
 * @param {Object} params
 * @param {string} params.documentId - The ID of the document this version belongs to.
 * @param {string} params.title - Document title at the time of snapshot.
 * @param {string} params.content - Full document text/content snapshot.
 * @param {string} params.createdBy - User ID or name who created this version.
 * @param {string} [params.changeSummary] - Description of changes made.
 * @returns {Object} A new version snapshot record object.
 */
export function createVersionRecord({ documentId, title, content, createdBy, changeSummary = 'Saved version' }) {
  const documentVersions = inMemoryVersionStore.filter(v => v.documentId === String(documentId));
  const maxVersion = documentVersions.reduce((max, v) => Math.max(max, v.versionNumber || 0), 0);
  const versionNumber = maxVersion + 1;

  const authorName =
    createdBy && createdBy !== 'Unknown User' && createdBy !== 'Unknown' && !createdBy.startsWith('66cc')
      ? createdBy
      : 'Active Editor';

  const versionRecord = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    documentId: String(documentId),
    versionNumber,
    title: title || 'Untitled Document',
    content: typeof content === 'object' ? JSON.stringify(content) : (content || ''),
    createdBy: authorName,
    changeSummary,
    createdAt: new Date().toISOString()
  };

  inMemoryVersionStore.push(versionRecord);
  return versionRecord;
}
