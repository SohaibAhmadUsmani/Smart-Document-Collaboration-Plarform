/**
 * @file mockData.js
 * @description High-fidelity mock fixtures and fallback data for the DocSync Pro Document Editor.
 * Matches reference UI: "Q3 Marketing Strategy & Execution Plan" with collaborators, comments, and history.
 * @module frontend/src/modules/editor/services/mockData
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file DocSync Pro ke realistic mock datasets provide karti hai.
 * Initial template document, active collaborators, comments threads, aur version history
 * ka sample data yahan mojood hai jo offline aur fallback mode mein use hota hai.
 */

export const MOCK_CURRENT_USER = {
  id: 'usr_muzammil',
  name: 'Muzammil Tanveer',
  email: 'muzammil@docsync.pro',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  role: 'owner',
};

export const MOCK_COLLABORATORS = [
  {
    id: 'usr_sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@docsync.pro',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    role: 'editor',
    status: 'editing',
    color: '#2563eb',
    lastActive: 'Active now',
  },
  {
    id: 'usr_marcus',
    name: 'Marcus Thorne',
    email: 'marcus.t@docsync.pro',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    role: 'editor',
    status: 'viewing',
    color: '#059669',
    lastActive: '5m ago',
  },
  {
    id: 'usr_elena',
    name: 'Elena Rodriguez',
    email: 'elena.r@docsync.pro',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    role: 'commenter',
    status: 'idle',
    color: '#d97706',
    lastActive: '12m ago',
  },
];

export const MOCK_COMMENTS = [
  {
    id: 'cmt_1',
    author: {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    timestamp: '10m ago',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    body: 'Should we increase the target to 30%? Q2 was particularly strong.',
    resolved: false,
    replies: [],
    anchor: {
      exactQuote: 'target is a 25% increase in MQLs',
    },
  },
  {
    id: 'cmt_2',
    author: {
      id: 'usr_marcus',
      name: 'Marcus Thorne',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    timestamp: '1h ago',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    body: "I've already started the LinkedIn draft for the SOC2 campaign. Ready for review by Friday.",
    resolved: false,
    replies: [],
    anchor: {
      exactQuote: 'Launch "DocSync for Enterprise" campaign',
    },
  },
  {
    id: 'cmt_3',
    author: {
      id: 'usr_elena',
      name: 'Elena Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
    timestamp: '3h ago',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    body: 'Confirmed. The Interactive Video Tutorials will be ready for the Q3 kickoff.',
    resolved: false,
    replies: [],
    anchor: {
      exactQuote: 'Interactive Video Tutorials',
    },
  },
];

export const MOCK_HISTORY = [
  {
    id: 'v_3',
    version: 3,
    author: { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    summary: 'Updated Core Objectives and MQL targets',
    timestamp: '5 mins ago',
  },
  {
    id: 'v_2',
    version: 2,
    author: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    summary: 'Added LinkedIn and webinar distribution plan',
    timestamp: '2 hours ago',
  },
  {
    id: 'v_1',
    version: 1,
    author: { name: 'Muzammil Tanveer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    summary: 'Initial document draft created',
    timestamp: 'Yesterday at 4:15 PM',
  },
];

export const MOCK_INITIAL_DOCUMENT = {
  id: 'doc_q3_marketing_strategy',
  _id: 'doc_q3_marketing_strategy',
  title: 'Q3 Marketing Strategy & Execution Plan',
  workspaceId: 'workspace_marketing',
  workspaceName: 'Workspaces',
  folderName: 'Marketing / Strategies',
  isFavorite: true,
  tags: ['Q3-Planning', 'Marketing', 'Enterprise-Growth'],
  wordCount: 482,
  characterCount: 3105,
  lastEditedBy: 'Sarah Chen',
  lastEditedAt: '5 mins ago',
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, blockId: 'blk_h1_title' },
        content: [{ type: 'text', text: 'Q3 Marketing Strategy & Execution Plan' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'blk_lead_para' },
        content: [
          {
            type: 'text',
            text: "This document outlines our core marketing initiatives for the upcoming third quarter. Our primary focus is on expanding our enterprise footprint while maintaining the high retention rates we saw in Q2. We'll be leveraging our new collaborative features as the primary value proposition.",
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'blk_h2_exec' },
        content: [{ type: 'text', text: '1. Executive Summary' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'blk_para_exec' },
        content: [
          {
            type: 'text',
            text: 'Our target is a 25% increase in MQLs (Marketing Qualified Leads) through a combination of targeted LinkedIn campaigns, a revamped webinar series, and strategic partnerships with industry influencers in the DevOps space.',
          },
        ],
      },
      {
        type: 'callout',
        attrs: { blockId: 'blk_callout_quote', variant: 'quote' },
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
        attrs: { level: 2, blockId: 'blk_h2_obj' },
        content: [{ type: 'text', text: '2. Core Objectives' }],
      },
      {
        type: 'taskList',
        attrs: { blockId: 'blk_task_list' },
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
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'blk_h2_roadmap' },
        content: [{ type: 'text', text: '3. Content Roadmap' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'blk_para_roadmap1' },
        content: [
          {
            type: 'text',
            text: 'Our content strategy will pivot towards "Success Stories" and "Workflow Deep Dives". We want to show, not just tell, how teams are using DocSync Pro to ship products faster.',
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'blk_para_roadmap2' },
        content: [
          {
            type: 'text',
            text: 'We will be focusing heavily on Interactive Video Tutorials that allow users to follow along within their own workspace environments. This was a top-requested feature from our last user survey.',
          },
        ],
      },
    ],
  },
};
