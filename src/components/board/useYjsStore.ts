/* eslint-disable react-hooks/set-state-in-effect -- This hook binds tldraw's
   store to a Liveblocks Yjs document. The loading -> synced status transitions
   are driven by the external sync lifecycle inside the effect, which is the
   documented integration pattern (ported from the official Liveblocks example). */
import { useEffect, useMemo, useState } from 'react';
import { useRoom } from '@liveblocks/react/suspense';
import { getYjsProviderForRoom } from '@liveblocks/yjs';
import { YKeyValue } from 'y-utility/y-keyvalue';
import { createTLStore, defaultShapeUtils } from 'tldraw';
import type { TLAnyShapeUtilConstructor, TLRecord, TLStoreWithStatus } from 'tldraw';

import { bindDocumentSync } from '@/components/board/yjsDocumentSync';
import { bindPresenceSync, type PresenceUser } from '@/components/board/yjsPresence';

export function useYjsStore({
  shapeUtils = [],
  user,
  canEdit = true,
}: Partial<{
  hostUrl: string;
  version: number;
  shapeUtils: TLAnyShapeUtilConstructor[];
  canEdit: boolean;
  user: PresenceUser;
}>) {
  // Get Liveblocks room
  const room = useRoom();

  // Set up Liveblocks Yjs and get multiplayer store
  const { yDoc, yStore, yProvider } = useMemo(() => {
    const yProvider = getYjsProviderForRoom(room);
    const yDoc = yProvider.getYDoc();
    yDoc.gc = true;
    const yArr = yDoc.getArray<{ key: string; val: TLRecord }>('tl_records');
    const yStore = new YKeyValue(yArr);

    return {
      yDoc,
      yStore,
      yProvider,
    };
  }, [room]);

  // Set up tldraw store and status
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });

  useEffect(() => {
    setStoreWithStatus({ status: 'loading' });

    const unsubs: (() => void)[] = [];

    function handleSync() {
      unsubs.push(...bindDocumentSync({ store, yDoc, yStore, canEdit }));
      unsubs.push(...bindPresenceSync({ store, room, yProvider, user }));

      setStoreWithStatus({
        store,
        status: 'synced-remote',
        connectionStatus: 'online',
      });
    }

    if (yProvider.synced) {
      handleSync();
    } else {
      yProvider.on('synced', handleSync);
      unsubs.push(() => yProvider.off('synced', handleSync));
    }

    return () => {
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    };
    // room/user are intentionally excluded: re-running on their identity would
    // tear down and rebuild the whole Yjs subscription on every presence change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yProvider, yDoc, store, yStore]);

  return storeWithStatus;
}
