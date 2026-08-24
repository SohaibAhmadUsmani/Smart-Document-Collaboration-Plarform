import { useState, useCallback } from 'react';
import { useDocumentEditor } from './useDocumentEditor.js';
import { apiLinkAttachment, apiUnlinkAttachment } from '../services/documentApi.js';

/**
 * Hook for managing document file attachment metadata linking.
 */
export function useDocumentAttachments(editorInstance) {
  const { state, addAttachment, removeAttachment } = useDocumentEditor();
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  /**
   * Links an uploaded file to the document and optionally embeds an attachment node.
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
