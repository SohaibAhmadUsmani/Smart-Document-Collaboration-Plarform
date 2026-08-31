/**
 * @file useWorkspaceHierarchy.js
 * @description Dynamic hook for resolving workspace and folder hierarchy breadcrumbs.
 * Integrates with Khadija's Workspaces and Folders endpoints (/api/workspaces, /api/folders).
 * @module frontend/src/modules/editor/hooks/useWorkspaceHierarchy
 *
 * [ROMAN URDU]:
 * Yeh custom hook Khadija ke Workspaces aur Folders module se document ki location
 * (Workspace Name, Folder Name, Breadcrumbs) dynamically fetch aur cache karta hai.
 * DocSubHeader aur BottomStatusBar dono mein dynamic path show karne ke liye istemal hota hai.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { apiGetWorkspace, apiGetFolder } from '../services/documentApi.js';

// In-memory cache for workspace and folder names to prevent redundant API queries
// [ROMAN URDU]: Bar bar network calls se bachne ke liye in-memory lookup cache
const HIERARCHY_CACHE = {
  workspaces: new Map(),
  folders: new Map(),
};

/**
 * Custom React hook for dynamic Workspace and Folder hierarchy resolution.
 *
 * @param {Object} params
 * @param {string|null} [params.workspaceId=null] - Document's workspace ID
 * @param {string|null} [params.folderId=null] - Document's folder ID
 * @param {string} [params.initialWorkspaceName='Workspaces'] - Fallback workspace name
 * @param {string|null} [params.initialFolderName=null] - Fallback folder name
 * @returns {{
 *   workspaceName: string,
 *   folderName: string|null,
 *   folderBreadcrumbs: Array<{ id: string, name: string, type: 'workspace'|'folder' }>,
 *   breadcrumbString: string,
 *   isLoading: boolean,
 *   refreshHierarchy: () => Promise<void>
 * }}
 */
export function useWorkspaceHierarchy({
  workspaceId = null,
  folderId = null,
  initialWorkspaceName = 'Workspaces',
  initialFolderName = null,
} = {}) {
  const [workspaceName, setWorkspaceName] = useState(
    () => (workspaceId && HIERARCHY_CACHE.workspaces.get(workspaceId)) || initialWorkspaceName
  );
  const [folderName, setFolderName] = useState(
    () => (folderId && HIERARCHY_CACHE.folders.get(folderId)) || initialFolderName
  );
  const [isLoading, setIsLoading] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // [ROMAN URDU]: Workspace aur Folder ki live details fetch karne ka core function
  const fetchHierarchy = async () => {
    if (!workspaceId && !folderId) {
      if (initialWorkspaceName && isMountedRef.current) {
        setWorkspaceName(initialWorkspaceName);
      }
      return;
    }

    setIsLoading(true);

    try {
      // 1. Resolve Workspace Name
      if (workspaceId) {
        if (HIERARCHY_CACHE.workspaces.has(workspaceId)) {
          if (isMountedRef.current) {
            setWorkspaceName(HIERARCHY_CACHE.workspaces.get(workspaceId));
          }
        } else {
          const wsData = await apiGetWorkspace(workspaceId);
          const resolvedWsName = wsData?.name || wsData?.title || initialWorkspaceName;
          HIERARCHY_CACHE.workspaces.set(workspaceId, resolvedWsName);
          if (isMountedRef.current) {
            setWorkspaceName(resolvedWsName);
          }
        }
      }

      // 2. Resolve Folder Name
      if (folderId) {
        if (HIERARCHY_CACHE.folders.has(folderId)) {
          if (isMountedRef.current) {
            setFolderName(HIERARCHY_CACHE.folders.get(folderId));
          }
        } else {
          const folderData = await apiGetFolder(folderId);
          const resolvedFolderName = folderData?.name || folderData?.title || initialFolderName;
          if (resolvedFolderName) {
            HIERARCHY_CACHE.folders.set(folderId, resolvedFolderName);
          }
          if (isMountedRef.current) {
            setFolderName(resolvedFolderName);
          }
        }
      } else {
        if (isMountedRef.current) {
          setFolderName(null);
        }
      }
    } catch (err) {
      console.warn('[DocSync Hierarchy Notice]: Using fallback hierarchy metadata:', err.message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, [workspaceId, folderId]);

  // Structured breadcrumbs array
  const folderBreadcrumbs = useMemo(() => {
    const crumbs = [];
    if (workspaceName) {
      crumbs.push({ id: workspaceId || 'ws_root', name: workspaceName, type: 'workspace' });
    }
    if (folderName) {
      crumbs.push({ id: folderId || 'folder_root', name: folderName, type: 'folder' });
    }
    return crumbs;
  }, [workspaceName, folderName, workspaceId, folderId]);

  // Formatted string representation (e.g. "Engineering / Product Specs")
  const breadcrumbString = useMemo(() => {
    if (workspaceName && folderName) {
      return `${workspaceName} / ${folderName}`;
    }
    return workspaceName || folderName || 'Workspaces';
  }, [workspaceName, folderName]);

  return {
    workspaceName,
    folderName,
    folderBreadcrumbs,
    breadcrumbString,
    isLoading,
    refreshHierarchy: fetchHierarchy,
  };
}

export default useWorkspaceHierarchy;
