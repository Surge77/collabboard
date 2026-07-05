import type { YKeyValue } from 'y-utility/y-keyvalue';
import type * as Y from 'yjs';
import { transact } from 'tldraw';
import type { TLRecord, TLStore } from 'tldraw';

interface DocumentSyncArgs {
  store: TLStore;
  yDoc: Y.Doc;
  yStore: YKeyValue<TLRecord>;
  canEdit: boolean;
}

// Two-way binding between the tldraw store and the Yjs document. Returns the
// unsubscribe functions; the caller owns their lifecycle.
export function bindDocumentSync({
  store,
  yDoc,
  yStore,
  canEdit,
}: DocumentSyncArgs): (() => void)[] {
  const unsubs: (() => void)[] = [];

  // Initialize tldraw with Yjs doc records, or if Yjs empty, initialize the
  // Yjs doc with the default store records.
  if (yStore.yarray.length) {
    transact(() => {
      store.clear();
      const records = yStore.yarray.toJSON().map(({ val }) => val);
      store.put(records);
    });
  } else {
    yDoc.transact(() => {
      for (const record of store.allRecords()) {
        yStore.set(record.id, record);
      }
    });
  }

  // Sync tldraw changes with Yjs — only for editors. Liveblocks already
  // rejects writes from a read-only token; skipping the listener keeps the
  // client's defense-in-depth symmetric with the server token scope.
  if (canEdit) {
    unsubs.push(
      store.listen(
        function syncStoreChangesToYjsDoc({ changes }) {
          yDoc.transact(() => {
            Object.values(changes.added).forEach((record) => {
              yStore.set(record.id, record);
            });

            Object.values(changes.updated).forEach(([_, record]) => {
              yStore.set(record.id, record);
            });

            Object.values(changes.removed).forEach((record) => {
              yStore.delete(record.id);
            });
          });
        },
        { source: 'user', scope: 'document' } // only sync user's document changes
      )
    );
  }

  // Sync Yjs changes with tldraw
  const handleChange = (
    changes: Map<
      string,
      | { action: 'delete'; oldValue: TLRecord }
      | { action: 'update'; oldValue: TLRecord; newValue: TLRecord }
      | { action: 'add'; newValue: TLRecord }
    >,
    transaction: Y.Transaction
  ) => {
    if (transaction.local) return;

    const toRemove: TLRecord['id'][] = [];
    const toPut: TLRecord[] = [];

    changes.forEach((change, id) => {
      switch (change.action) {
        // Object added or updated on Liveblocks
        case 'add':
        case 'update': {
          const record = yStore.get(id)!;
          toPut.push(record);
          break;
        }

        // Object deleted from Liveblocks
        case 'delete': {
          toRemove.push(id as TLRecord['id']);
          break;
        }
      }
    });

    store.mergeRemoteChanges(() => {
      if (toRemove.length) {
        store.remove(toRemove);
      }
      if (toPut.length) {
        store.put(toPut);
      }
    });
  };

  yStore.on('change', handleChange);
  unsubs.push(() => yStore.off('change', handleChange));

  return unsubs;
}
