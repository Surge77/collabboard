'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRoom } from '@liveblocks/react/suspense';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import type * as Y from 'yjs';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

import { reconcileElements } from '@/components/board/excalidraw/reconcile';

// Types derived from the imperative API to avoid Excalidraw's deep internal
// import paths (which move between minor versions).
type SceneData = Parameters<ExcalidrawImperativeAPI['updateScene']>[0];
type Element = ReturnType<ExcalidrawImperativeAPI['getSceneElementsIncludingDeleted']>[number];
type Collaborators = NonNullable<SceneData['collaborators']>;
type Collaborator = NonNullable<ReturnType<Collaborators['get']>>;

interface SyncUser {
  id: string;
  color: string;
  name: string;
}

interface UseExcalidrawSyncArgs {
  api: ExcalidrawImperativeAPI | null;
  user: SyncUser;
  canEdit: boolean;
}

// Marks Yjs transactions that originate from this client so the document
// observer can ignore its own writes and avoid an echo loop.
const LOCAL_ORIGIN = 'excalidraw-local';
const Y_ELEMENTS_KEY = 'excalidraw-elements';

interface SyncHandlers {
  onChange: (elements: readonly Element[]) => void;
  onPointerUpdate: (payload: { pointer: { x: number; y: number } | null }) => void;
}

export function useExcalidrawSync({ api, user, canEdit }: UseExcalidrawSyncArgs): SyncHandlers {
  const room = useRoom();

  const { yDoc, yElements, awareness } = useMemo(() => {
    const provider = getYjsProviderForRoom(room);
    const doc = provider.getYDoc();
    return {
      yDoc: doc,
      yElements: doc.getMap<Element>(Y_ELEMENTS_KEY),
      awareness: provider.awareness,
    };
  }, [room]);

  // Guards onChange from rewriting elements we just applied from a remote update.
  const applyingRemote = useRef(false);

  // === DOCUMENT: Yjs -> Excalidraw ========================================
  useEffect(() => {
    if (!api) return;

    function applyFromYjs() {
      applyingRemote.current = true;
      api!.updateScene({ elements: Array.from(yElements.values()) });
      queueMicrotask(() => {
        applyingRemote.current = false;
      });
    }

    // Seed: if the room already has elements, adopt them; otherwise push the
    // local (usually empty) scene so a fresh room is initialised once.
    if (yElements.size > 0) {
      applyFromYjs();
    } else if (canEdit) {
      const initial = api.getSceneElementsIncludingDeleted();
      if (initial.length > 0) {
        yDoc.transact(() => {
          for (const el of initial) yElements.set(el.id, el);
        }, LOCAL_ORIGIN);
      }
    }

    const observer = (_event: Y.YMapEvent<Element>, txn: Y.Transaction) => {
      if (txn.origin === LOCAL_ORIGIN) return;
      applyFromYjs();
    };
    yElements.observe(observer);
    return () => yElements.unobserve(observer);
  }, [api, yElements, yDoc, canEdit]);

  // === PRESENCE: awareness -> Excalidraw collaborators ====================
  useEffect(() => {
    if (!api) return;

    awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    const handleAwareness = () => {
      const states = awareness.getStates() as Map<
        number,
        { user?: SyncUser; cursor?: { x: number; y: number } }
      >;
      const collaborators = new Map<string, Collaborator>();
      states.forEach((state, clientId) => {
        if (clientId === yDoc.clientID || !state.user) return;
        collaborators.set(String(clientId), {
          username: state.user.name,
          pointer: state.cursor,
          color: { background: state.user.color, stroke: state.user.color },
        } as Collaborator);
      });
      // SocketId is a branded string; our client-id keys are structurally fine.
      api!.updateScene({ collaborators: collaborators as unknown as Collaborators });
    };

    awareness.on('change', handleAwareness);
    return () => awareness.off('change', handleAwareness);
  }, [api, awareness, yDoc, user.id, user.name, user.color]);

  // === DOCUMENT: Excalidraw -> Yjs (editors only) =========================
  const onChange = (elements: readonly Element[]) => {
    if (!canEdit || applyingRemote.current) return;
    const remoteVersions = new Map<string, number>();
    for (const id of yElements.keys()) {
      remoteVersions.set(id, yElements.get(id)!.version);
    }
    const { toSet, toDelete } = reconcileElements(elements, remoteVersions);
    if (toSet.length === 0 && toDelete.length === 0) return;
    yDoc.transact(() => {
      for (const el of toSet) yElements.set(el.id, el);
      for (const id of toDelete) yElements.delete(id);
    }, LOCAL_ORIGIN);
  };

  const onPointerUpdate = (payload: { pointer: { x: number; y: number } | null }) => {
    awareness.setLocalStateField('cursor', payload.pointer ?? null);
  };

  return { onChange, onPointerUpdate };
}
