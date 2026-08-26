import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { DOCUMENT_TEMPLATES } from '../modules/documents/documentTemplates.js';

// Resolve DNS SRV queries on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch (err) {
  console.warn('[Seeder Notice]: Custom DNS servers could not be set:', err.message);
}

const TARGET_DB_URI = env.databaseUrl || 'mongodb://localhost:27017/smart_document_collaboration_platform';



// Rich Default Seed Document (matching MOCK_INITIAL_DOCUMENT)
const SEED_DOCUMENT = {
  _id: new mongoose.Types.ObjectId('66cc00000000000000000001'),
  workspaceId: 'ws_main_workspace_01',
  folderId: 'folder_specifications_01',
  title: 'Smart Document Collaboration Platform — System Architecture & Implementation Spec',
  plainText: 'Welcome to DocSync Pro — the high-performance real-time collaborative workspace. This document serves as the live architectural reference.',
  icon: '⚡',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
  tags: ['architecture', 'specification', 'v1.0', 'engineering'],
  favoritedBy: ['user_lead_muzammil_01'],
  version: 1,
  snapshotCheckpointVersion: 1,
  templateId: 'technical_rfc',
  createdBy: 'user_lead_muzammil_01',
  lastModifiedBy: 'user_lead_muzammil_01',
  isArchived: false,
  attachments: [
    {
      attachmentId: 'att_seed_arch_diagram_01',
      fileId: 'file_s3_arch_diagram_01',
      fileName: 'System_Architecture_Diagram_2026.pdf',
      fileSize: 2450000,
      mimeType: 'application/pdf',
      storageKey: 'uploads/workspaces/ws_main/arch_2026.pdf',
      downloadUrl: 'https://raw.githubusercontent.com/SohaibAhmadUsmani/Smart-Document-Collaboration-Plarform/main/README.md',
      uploadedBy: 'user_lead_muzammil_01',
      uploadedAt: new Date(),
    },
  ],
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, blockId: 'seed_block_h1' },
        content: [{ type: 'text', text: 'Smart Document Collaboration Platform (DocSync Pro)' }],
      },
      {
        type: 'callout',
        attrs: { blockId: 'seed_block_callout', type: 'info' },
        content: [
          {
            type: 'paragraph',
            attrs: { blockId: 'seed_block_p_callout' },
            content: [
              { type: 'text', text: '💡 ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'Production Status: ' },
              { type: 'text', text: 'Live connected to MongoDB Atlas Database: ' },
              { type: 'text', marks: [{ type: 'code' }], text: 'smart_document_collaboration_system' },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'seed_block_h2_1' },
        content: [{ type: 'text', text: '1. Executive Architecture Overview' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'seed_block_p1' },
        content: [
          {
            type: 'text',
            text: 'DocSync Pro combines the rich-text structure of Notion with the real-time editing velocity of Google Docs. Powered by a TipTap / ProseMirror core, debounced autosaving with Optimistic Concurrency Control, and decoupled peer module events.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'seed_block_h2_2' },
        content: [{ type: 'text', text: '2. Sprint Deliverables Checklist' }],
      },
      {
        type: 'taskList',
        attrs: { blockId: 'seed_block_tasklist' },
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true, blockId: 'seed_block_t1' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 1: MongoDB Atlas Dedicated Cluster Provisioning (smart_document_collaboration_system)' }] }],
          },
          {
            type: 'taskItem',
            attrs: { checked: true, blockId: 'seed_block_t2' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 2: Offline Autosave Queue & Optimistic Concurrency Control (OCC 409)' }] }],
          },
          {
            type: 'taskItem',
            attrs: { checked: true, blockId: 'seed_block_t3' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 3: Notion-Style Slash Command Palette (/) & Contextual Bubble Menu' }] }],
          },
          {
            type: 'taskItem',
            attrs: { checked: true, blockId: 'seed_block_t4' },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 4: Lowlight Code Syntax Highlighting & Interactive Table NodeViews' }] }],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'seed_block_h2_3' },
        content: [{ type: 'text', text: '3. Team Ownership Matrix' }],
      },
      {
        type: 'table',
        attrs: { blockId: 'seed_block_table' },
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Module' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Owner' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Domain Responsibility' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Document Editor' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Muzammil' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich-text canvas, TipTap AST, Autosave, OCC, AST Search' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Auth & RBAC' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Maira' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JWT Identity, Session governance, Access tokens' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Workspaces & Folders' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Khadija' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Workspace hierarchy, Folder nesting, Members' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Comments & Notifications' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ayyan' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Threaded comments, Mentions, In-app alerts' }] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Version History & Search' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Aiman' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Snapshot diffing, Version rollback, Global search' }] }] },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'seed_block_h2_4' },
        content: [{ type: 'text', text: '4. Sample Code Snippet' }],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'javascript', blockId: 'seed_block_code' },
        content: [
          {
            type: 'text',
            text: "// Optimistic Concurrency Control (OCC) Handler\nexport async function handleAutosave(req, res) {\n  const { id } = req.params;\n  const { content, plainText, baseVersion } = req.body;\n  const updated = await documentService.autosaveDocumentContent(id, { content, plainText, baseVersion }, req.user.id);\n  if (updated.conflict) return res.status(409).json({ error: 'VERSION_CONFLICT' });\n  return res.status(200).json({ success: true, version: updated.version });\n}",
          },
        ],
      },
    ],
  },
};

const SEED_WORKSPACE = {
  _id: new mongoose.Types.ObjectId('66cc00000000000000000002'),
  workspaceId: 'ws_main_workspace_01',
  name: 'DocSync Engineering & Product Workspace',
  slug: 'docsync-engineering',
  icon: '🚀',
  ownerId: 'user_lead_muzammil_01',
  members: ['user_lead_muzammil_01', 'user_maira_02', 'user_khadija_03', 'user_ayyan_04', 'user_namra_05', 'user_aiman_06', 'user_shanza_07'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const SEED_FOLDER = {
  _id: new mongoose.Types.ObjectId('66cc00000000000000000003'),
  workspaceId: 'ws_main_workspace_01',
  folderId: 'folder_specifications_01',
  name: 'Architecture & Specifications',
  icon: '📐',
  createdBy: 'user_lead_muzammil_01',
  createdAt: new Date(),
};

const SEED_USER = {
  _id: new mongoose.Types.ObjectId('66cc00000000000000000004'),
  userId: 'user_lead_muzammil_01',
  email: 'muzammil@docplatform.local',
  name: 'Muzammil (Document Editor Lead)',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
  isEmailVerified: true,
  createdAt: new Date(),
};

const SEED_COMMENTS = [
  {
    _id: new mongoose.Types.ObjectId('66cc00000000000000000005'),
    documentId: '66cc00000000000000000001',
    authorId: 'user_ayyan_04',
    authorName: 'Ayyan Zubair',
    body: 'The database schema and AST node extensions look well-structured! Good job on the OCC conflict handling.',
    anchor: {
      anchorType: 'text_selection',
      exactQuote: 'Executive Architecture Overview',
      from: 15,
      to: 45,
      prefixContext: '1. ',
      suffixContext: 'DocSync Pro combines',
      blockId: 'seed_block_h2_1',
    },
    isResolved: false,
    replies: [
      {
        replyId: 'reply_seed_01',
        authorId: 'user_lead_muzammil_01',
        authorName: 'Muzammil',
        body: 'Thanks Ayyan! We also added the offline write-queue and Lowlight syntax highlighting.',
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
  },
];

export async function seedDatabase() {
  console.log(`[Database Seeder]: Connecting to MongoDB Atlas: ${TARGET_DB_URI}...`);
  await mongoose.connect(TARGET_DB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  console.log(`[Database Seeder]: Connected to DB: '${mongoose.connection.name}' on host: ${mongoose.connection.host}`);
  const db = mongoose.connection.db;

  // 1. Provision & Populate 'documents' Collection
  const docCol = db.collection('documents');
  await docCol.updateOne(
    { _id: SEED_DOCUMENT._id },
    { $set: SEED_DOCUMENT },
    { upsert: true }
  );
  console.log('✅ Seeded primary live document: 66cc00000000000000000001');

  // Insert Starter Templates into documents collection
  for (const [key, tpl] of Object.entries(DOCUMENT_TEMPLATES)) {
    await docCol.updateOne(
      { templateId: tpl.id },
      {
        $setOnInsert: { _id: new mongoose.Types.ObjectId() },
        $set: {
          workspaceId: 'ws_main_workspace_01',
          folderId: 'folder_specifications_01',
          title: tpl.title,
          plainText: tpl.description,
          icon: tpl.icon,
          tags: tpl.tags,
          content: tpl.content,
          templateId: tpl.id,
          version: 1,
          isArchived: false,
          createdBy: 'user_lead_muzammil_01',
          lastModifiedBy: 'user_lead_muzammil_01',
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`✅ Seeded template document: [${tpl.id}] ${tpl.title}`);
  }


  // 2. Provision & Populate 'workspaces' Collection
  const wsCol = db.collection('workspaces');
  await wsCol.updateOne(
    { _id: SEED_WORKSPACE._id },
    { $set: SEED_WORKSPACE },
    { upsert: true }
  );
  console.log('✅ Seeded workspace: ws_main_workspace_01');

  // 3. Provision & Populate 'folders' Collection
  const folderCol = db.collection('folders');
  await folderCol.updateOne(
    { _id: SEED_FOLDER._id },
    { $set: SEED_FOLDER },
    { upsert: true }
  );
  console.log('✅ Seeded folder: folder_specifications_01');

  // 4. Provision & Populate 'users' Collection
  const userCol = db.collection('users');
  await userCol.updateOne(
    { _id: SEED_USER._id },
    { $set: SEED_USER },
    { upsert: true }
  );
  console.log('✅ Seeded user: muzammil@docplatform.local');

  // 5. Provision & Populate 'comments' Collection
  const commentCol = db.collection('comments');
  for (const cmt of SEED_COMMENTS) {
    await commentCol.updateOne(
      { _id: cmt._id },
      { $set: cmt },
      { upsert: true }
    );
  }
  console.log('✅ Seeded sample comment threads');

  // 6. Provision & Populate Placeholder Collections (Files, Versions, ActivityLogs)
  const filesCol = db.collection('files');
  await filesCol.updateOne(
    { fileId: 'file_s3_arch_diagram_01' },
    {
      $set: {
        fileId: 'file_s3_arch_diagram_01',
        workspaceId: 'ws_main_workspace_01',
        documentId: '66cc00000000000000000001',
        fileName: 'System_Architecture_Diagram_2026.pdf',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        storageKey: 'uploads/workspaces/ws_main/arch_2026.pdf',
        uploadedBy: 'user_lead_muzammil_01',
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log('✅ Seeded files collection');

  const versionsCol = db.collection('document_versions');
  await versionsCol.updateOne(
    { documentId: '66cc00000000000000000001', versionNumber: 1 },
    {
      $set: {
        documentId: '66cc00000000000000000001',
        versionNumber: 1,
        title: SEED_DOCUMENT.title,
        content: SEED_DOCUMENT.content,
        changeSummary: 'Initial baseline document release',
        createdBy: 'user_lead_muzammil_01',
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log('✅ Seeded document_versions collection');

  const activityCol = db.collection('activitylogs');
  await activityCol.insertOne({
    workspaceId: 'ws_main_workspace_01',
    documentId: '66cc00000000000000000001',
    actorId: 'user_lead_muzammil_01',
    actionType: 'DOCUMENT_CREATED',
    metadata: { title: SEED_DOCUMENT.title },
    createdAt: new Date(),
  });
  console.log('✅ Seeded activitylogs collection');

  // Build Indexes on collections safely
  console.log('[Database Seeder]: Building compound, full-text, and TTL indexes...');
  try { await docCol.createIndex({ workspaceId: 1, isArchived: 1, updatedAt: -1 }); } catch (e) {}
  try { await docCol.createIndex({ workspaceId: 1, folderId: 1, isArchived: 1 }); } catch (e) {}
  try { await docCol.createIndex({ workspaceId: 1, tags: 1, isArchived: 1 }); } catch (e) {}
  try { await docCol.createIndex({ title: 'text', plainText: 'text' }, { weights: { title: 10, plainText: 2 }, name: 'DocumentFullTextIndex' }); } catch (e) {}
  try { await docCol.createIndex({ scheduledPermanentDeletionAt: 1 }, { expireAfterSeconds: 0 }); } catch (e) {}
  try { await commentCol.createIndex({ documentId: 1, isResolved: 1 }); } catch (e) {}
  try { await wsCol.createIndex({ ownerId: 1 }); } catch (e) {}

  console.log('🎉 [Database Seeder Complete]: All collections and live documents provisioned in MongoDB Atlas.');
  console.log('👉 Open MongoDB Compass and connect to verify all collections and seeded documents!');


  await mongoose.disconnect();
}

// Direct CLI execution
if (process.argv[1] && process.argv[1].includes('seedDatabase.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeder Error:', err);
      process.exit(1);
    });
}
