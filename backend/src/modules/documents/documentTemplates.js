/**
 * @file documentTemplates.js
 * @description Starter document templates and schemas for DocSync Pro.
 * Provides pre-formatted ProseMirror AST blueprints for meeting notes, PRDs, and RFC architectures.
 * @module backend/src/modules/documents/documentTemplates
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file DocSync Pro ke pre-built starter templates (Meeting Notes, Product Requirement Document PRD,
 * aur Technical RFC) define karti hai. Naya document create karte waqt agar template choose kiya jaye
 * toh yeh ready-made ProseMirror AST structure provide karti hai.
 */

import { generateUuid } from './document.utils.js';

/**
 * Standard preset template configurations.
 *
 * [ROMAN URDU]:
 * Preset templates ka structured collection jisme headings, tables, callouts, aur task lists shamil hain.
 */
export const DOCUMENT_TEMPLATES = {
  meeting_notes: {
    id: 'meeting_notes',
    title: 'Weekly Sync / Meeting Notes',
    description: 'Structure team meetings with agenda, attendees, notes, and action items table.',
    icon: '📝',
    tags: ['meeting', 'sync', 'notes'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, blockId: 'tpl_mn_h1' },
          content: [{ type: 'text', text: 'Weekly Sync & Project Notes' }],
        },
        {
          type: 'callout',
          attrs: { blockId: 'tpl_mn_callout', type: 'info' },
          content: [
            {
              type: 'paragraph',
              attrs: { blockId: 'tpl_mn_p1' },
              content: [
                { type: 'text', text: '📅 Date: ' },
                { type: 'text', marks: [{ type: 'bold' }], text: 'August 26, 2026' },
                { type: 'text', text: ' | 👥 Facilitator: Team Lead' },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_mn_h2_1' },
          content: [{ type: 'text', text: '1. Attendees & Status' }],
        },
        {
          type: 'taskList',
          attrs: { blockId: 'tpl_mn_tasklist' },
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true, blockId: 'tpl_mn_task1' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Engineering (Muzammil, Khadija, Ayyan, Namra)' }] }],
            },
            {
              type: 'taskItem',
              attrs: { checked: true, blockId: 'tpl_mn_task2' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Product & Design (Maira, Shanza, Aiman)' }] }],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_mn_h2_2' },
          content: [{ type: 'text', text: '2. Discussion Topics' }],
        },
        {
          type: 'bulletList',
          attrs: { blockId: 'tpl_mn_bl1' },
          content: [
            {
              type: 'listItem',
              attrs: { blockId: 'tpl_mn_li1' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review sprint deliverables and active PR integrations' }] }],
            },
            {
              type: 'listItem',
              attrs: { blockId: 'tpl_mn_li2' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'MongoDB Atlas dedicated database provisioning and index tuning' }] }],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_mn_h2_3' },
          content: [{ type: 'text', text: '3. Action Items Matrix' }],
        },
        {
          type: 'table',
          attrs: { blockId: 'tpl_mn_tbl' },
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Task Item' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Owner' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Target Date' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Deploy Document Editor & UI/UX Pro Max Suite' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Muzammil' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'End of Sprint' }] }] },
              ],
            },
          ],
        },
      ],
    },
  },

  prd: {
    id: 'prd',
    title: 'Product Requirement Document (PRD)',
    description: 'Comprehensive PRD template with overview, user personas, requirements table, and technical scope.',
    icon: '🚀',
    tags: ['product', 'prd', 'specification'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, blockId: 'tpl_prd_h1' },
          content: [{ type: 'text', text: 'Product Requirement Document (PRD)' }],
        },
        {
          type: 'callout',
          attrs: { blockId: 'tpl_prd_callout', type: 'info' },
          content: [
            {
              type: 'paragraph',
              attrs: { blockId: 'tpl_prd_p1' },
              content: [{ type: 'text', text: 'Status: ' }, { type: 'text', marks: [{ type: 'bold' }], text: 'In Review' }, { type: 'text', text: ' | Target Release: v1.0.0' }],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_prd_h2_1' },
          content: [{ type: 'text', text: '1. Executive Summary' }],
        },
        {
          type: 'paragraph',
          attrs: { blockId: 'tpl_prd_p2' },
          content: [{ type: 'text', text: 'This document defines the requirements for the Smart Document Collaboration Platform, combining Notion-style workspace management with Google Docs-style real-time editing.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_prd_h2_2' },
          content: [{ type: 'text', text: '2. Functional Requirements' }],
        },
        {
          type: 'table',
          attrs: { blockId: 'tpl_prd_tbl' },
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'ID' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Requirement' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Priority' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'REQ-01' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich-text editing with tables, callouts, and code blocks' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'P0' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'REQ-02' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Offline autosave and optimistic concurrency control' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'P0' }] }] },
              ],
            },
          ],
        },
      ],
    },
  },

  technical_rfc: {
    id: 'technical_rfc',
    title: 'Technical Architecture RFC',
    description: 'System architecture proposal with component diagrams, API definitions, and code blocks.',
    icon: '⚡',
    tags: ['engineering', 'architecture', 'rfc'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, blockId: 'tpl_rfc_h1' },
          content: [{ type: 'text', text: 'RFC: Real-Time Document Synchronization Architecture' }],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_rfc_h2_1' },
          content: [{ type: 'text', text: '1. Architecture Overview' }],
        },
        {
          type: 'paragraph',
          attrs: { blockId: 'tpl_rfc_p1' },
          content: [{ type: 'text', text: 'The platform employs a layered micro-modular architecture integrating MongoDB Atlas for persistence and ProseMirror AST trees for rich content formatting.' }],
        },
        {
          type: 'heading',
          attrs: { level: 2, blockId: 'tpl_rfc_h2_2' },
          content: [{ type: 'text', text: '2. Node Implementation Code Example' }],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'javascript', blockId: 'tpl_rfc_cb' },
          content: [
            {
              type: 'text',
              text: 'export async function autosaveDocumentContent(documentId, payload, userId) {\n  const updated = await DocumentModel.findOneAndUpdate(\n    { _id: documentId, version: payload.baseVersion, isArchived: false },\n    { $set: { content: payload.content }, $inc: { version: 1 } },\n    { new: true }\n  );\n  return updated;\n}',
            },
          ],
        },
      ],
    },
  },
};

/**
 * Recursively rehydrates a template node tree with dynamic, fresh blockIds.
 * [Issue #43]: Re-generates dynamic unique blockIds (block_${generateUuid()}) on template hydration.
 *
 * [ROMAN URDU]: Template tree ke har node ko naya cryptographically unique blockId deta hai taake concurrent documents mein conflict na ho.
 *
 * @param {Object} node - AST node
 * @returns {Object} Hydrated AST node with fresh blockIds
 */
function rehydrateTemplateBlockIds(node) {
  if (!node || typeof node !== 'object') return node;

  const clone = { ...node };

  if (clone.type && clone.type !== 'text') {
    clone.attrs = {
      ...(clone.attrs || {}),
      blockId: `block_${generateUuid()}`,
    };
  }

  if (Array.isArray(clone.content)) {
    clone.content = clone.content.map(rehydrateTemplateBlockIds);
  }

  return clone;
}

/**
 * Retrieves a document template preset by its unique ID with fresh, dynamic blockIds.
 * [Issue #43]: Regenerates unique blockIds on every hydration to prevent block collision.
 *
 * [ROMAN URDU]:
 * Di gayi template ID (`meeting_notes`, `prd`, `technical_rfc`) ke mutabiq template object return karta hai,
 * aur uske tamam blocks ke liye fresh dynamic blockIds assign karta hai.
 *
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Hydrated template blueprint object or null
 */
export function getTemplateById(templateId) {
  const template = DOCUMENT_TEMPLATES[templateId];
  if (!template) return null;

  const hydrated = JSON.parse(JSON.stringify(template));
  hydrated.content = rehydrateTemplateBlockIds(hydrated.content);
  return hydrated;
}
