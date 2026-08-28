/**
 * historyModel.js
 * Owner: Aiman
 * 
 * Defines the data structure for document version snapshots and search indexing.
 * Pre-populated with dummy seed data for testing Version History & Search features.
 */

// In-memory data store for versions pre-populated with initial sample version history
export const inMemoryVersionStore = [
  {
    id: 'ver_seed_201',
    documentId: '66cc00000000000000000001',
    versionNumber: 1,
    title: 'Q3 Marketing Strategy & Execution Plan',
    content: `Q3 Marketing Strategy & Execution Plan

This document outlines our core marketing initiatives for the upcoming third quarter. Our primary focus is on expanding our enterprise footprint while maintaining the high retention rates we saw in Q2. We'll be leveraging our new collaborative features as the primary value proposition.

1. Executive Summary
Our target is a 25% increase in MQLs (Marketing Qualified Leads) through a combination of targeted LinkedIn campaigns, a revamped webinar series, and strategic partnerships with industry influencers in the DevOps space.

“The goal isn’t just more users; it’s more high-intent teams that can benefit from DocSync Pro’s real-time collaboration engine.” — Marketing Director`,
    createdBy: 'Muzammil Tanveer',
    changeSummary: 'Initial document draft created',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'ver_seed_202',
    documentId: '66cc00000000000000000001',
    versionNumber: 2,
    title: 'Q3 Marketing Strategy & Execution Plan',
    content: `Q3 Marketing Strategy & Execution Plan

This document outlines our core marketing initiatives for the upcoming third quarter. Our primary focus is on expanding our enterprise footprint while maintaining the high retention rates we saw in Q2.

1. Executive Summary
Our target is a 25% increase in MQLs (Marketing Qualified Leads) through a combination of targeted LinkedIn campaigns, a revamped webinar series, and strategic partnerships with industry influencers in the DevOps space.

2. Core Objectives
[x] Launch "DocSync for Enterprise" campaign highlighting SOC2 compliance.
[x] Host 3 regional networking events for CTOs and Engineering Managers.
[x] Decrease customer acquisition cost (CAC) by 15% through organic SEO optimization.`,
    createdBy: 'Marcus Thorne',
    changeSummary: 'Added LinkedIn and webinar distribution plan',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
  },
  {
    id: 'ver_seed_203',
    documentId: '66cc00000000000000000001',
    versionNumber: 3,
    title: 'Q3 Marketing Strategy & Execution Plan',
    content: `Q3 Marketing Strategy & Execution Plan

This document outlines our core marketing initiatives for the upcoming third quarter. Our primary focus is on expanding our enterprise footprint while maintaining the high retention rates we saw in Q2. We'll be leveraging our new collaborative features as the primary value proposition.

1. Executive Summary
Our target is a 25% increase in MQLs (Marketing Qualified Leads) through a combination of targeted LinkedIn campaigns, a revamped webinar series, and strategic partnerships with industry influencers in the DevOps space.

“The goal isn’t just more users; it’s more high-intent teams that can benefit from DocSync Pro’s real-time collaboration engine.” — Marketing Director

2. Core Objectives
[x] Launch "DocSync for Enterprise" campaign highlighting SOC2 compliance.
[x] Host 3 regional networking events for CTOs and Engineering Managers.
[x] Decrease customer acquisition cost (CAC) by 15% through organic SEO optimization.

3. Content Roadmap
Our content strategy will pivot towards "Success Stories" and "Workflow Deep Dives". We want to show, not just tell, how teams are using DocSync Pro to ship products faster.
We will be focusing heavily on Interactive Video Tutorials that allow users to follow along within their own workspace environments.`,
    createdBy: 'Sarah Chen',
    changeSummary: 'Updated Core Objectives and MQL targets',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hour ago
  },
  {
    id: 'ver_seed_101',
    documentId: 'doc_123',
    versionNumber: 1,
    title: 'Project Architectural Proposal',
    content: 'This is the initial draft of the smart document collaboration project architecture proposal created by Aiman.',
    createdBy: 'Aiman',
    changeSummary: 'Initial project outline & architecture draft',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'ver_seed_102',
    documentId: 'doc_123',
    versionNumber: 2,
    title: 'Project Architectural Proposal (V2)',
    content: 'This is the updated version of the document with Section 6 Version History requirements added.',
    createdBy: 'Aiman',
    changeSummary: 'Added Version History requirements & API specs',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
  },
  {
    id: 'ver_seed_103',
    documentId: 'doc_456',
    versionNumber: 1,
    title: 'Sprint Planning Meeting Notes',
    content: 'Notes from the project kickoff meeting with all module team members.',
    createdBy: 'Maira',
    changeSummary: 'Initial sprint meeting notes',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
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
  const versionNumber = documentVersions.length + 1;

  const versionRecord = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    documentId: String(documentId),
    versionNumber,
    title: title || 'Untitled Document',
    content: content || '',
    createdBy: createdBy || 'Anonymous',
    changeSummary,
    createdAt: new Date().toISOString()
  };

  inMemoryVersionStore.push(versionRecord);
  return versionRecord;
}
