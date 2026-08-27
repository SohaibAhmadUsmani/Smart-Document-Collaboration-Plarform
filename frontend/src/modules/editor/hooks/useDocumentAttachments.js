/**
 * @file useDocumentAttachments.js
 * @description Custom hook for managing document file attachment metadata and embedding attachment blocks.
 * @module frontend/src/modules/editor/hooks/useDocumentAttachments
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh hook document ke sath file attachments link karne aur editor ke andar file attachment block
 * node insert karne ki functionality provide karta hai.
 */

import { useState, useCallback } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';
import { apiLinkAttachment, apiUnlinkAttachment } from '../services/documentApi.js';

/**
 * Hook for managing document file attachment metadata linking.
 *
 * [ROMAN URDU]:
 * Attachment list, linking state, errors, aur link/unlink functions return karta hai.
 *
 * @param {Object} editorInstance - TipTap editor instance
 * @returns {{ attachments: Array, isLinking: boolean, linkError: string|null, linkFileAttachment: Function, unlinkFileAttachment: Function }}
 */
export function useDocumentAttachments(editorInstance) {
  const { state, addAttachment, removeAttachment } = useDocumentEditor();
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  /**
   * Links an uploaded file to the document and optionally embeds an attachment node in the editor.
   *
   * [ROMAN URDU]:
   * File metadata ko backend par link karta hai aur TipTap editor ke canvas par visual attachment card insert karta hai.
   */
  const linkFileAttachment = useCallback(
    async (filePayload, embedInEditor = true) => {
      if (!state.documentId) return null;

      try {
        setIsLinking(true);
        setLinkError(null);

        const linkedAttachment = await apiLinkAttachment(state.documentId, filePayload);
        addAttachment(linkedAttachment);

        if (embedInEditor && editorInstance) {
          editorInstance
            .chain()
            .focus()
            .insertContent({
              type: 'fileAttachment',
              attrs: {
                fileId: linkedAttachment.fileId,
                filename: linkedAttachment.fileName,
                url: linkedAttachment.downloadUrl,
                fileSize: linkedAttachment.fileSize,
                mimeType: linkedAttachment.mimeType,
                blockId: `att_${linkedAttachment.attachmentId}`,
              },
            })
            .run();
        }

        return linkedAttachment;
      } catch (err) {
        setLinkError(err.message || 'Failed to link attachment');
        throw err;
      } finally {
        setIsLinking(false);
      }
    },
    [state.documentId, editorInstance, addAttachment]
  );

  /**
   * Unlinks an attachment from the document.
   *
   * [ROMAN URDU]:
   * Document ke record se attachment ko remove karta hai.
   */
  const unlinkFileAttachment = useCallback(
    async (attachmentId) => {
      if (!state.documentId) return;

      try {
        await apiUnlinkAttachment(state.documentId, attachmentId);
        removeAttachment(attachmentId);
      } catch (err) {
        console.error('[Unlink Attachment Error]:', err);
        throw err;
      }
    },
    [state.documentId, removeAttachment]
  );

  return {
    attachments: state.attachments,
    isLinking,
    linkError,
    linkFileAttachment,
    unlinkFileAttachment,
  };
}
