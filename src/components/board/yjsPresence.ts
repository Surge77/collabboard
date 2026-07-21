import type { JsonObject } from '@liveblocks/client';
import type { Room } from '@liveblocks/client';
import type { LiveblocksYjsProvider } from '@liveblocks/yjs';
import { computed, createPresenceStateDerivation, react, InstancePresenceRecordType } from 'tldraw';
import type { TLInstancePresence, TLStore } from 'tldraw';

export interface PresenceUser {
  id: string;
  color: string;
  name: string;
}

interface PresenceSyncArgs {
  store: TLStore;
  room: Room;
  yProvider: LiveblocksYjsProvider;
  user?: PresenceUser;
}

// Two-way binding between tldraw presence records and Liveblocks/Yjs
// awareness. Returns the unsubscribe functions; the caller owns their
// lifecycle.
export function bindPresenceSync({
  store,
  room,
  yProvider,
  user,
}: PresenceSyncArgs): (() => void)[] {
  const unsubs: (() => void)[] = [];

  const userPreferences = computed<PresenceUser>('userPreferences', () => {
    if (!user) {
      throw new Error('Failed to get user');
    }
    return {
      id: user.id,
      color: user.color,
      name: user.name,
    };
  });

  // Get unique Yjs connection ID (injected into Liveblocks presence by the provider)
  const self = room.getSelf();
  const rawClientId = self?.presence.__yjs_clientid;
  const yClientId = typeof rawClientId === 'number' ? rawClientId.toString() : undefined;
  const presenceId = InstancePresenceRecordType.createId(yClientId);

  const presenceDerivation = createPresenceStateDerivation(userPreferences, presenceId)(store);

  yProvider.awareness.setLocalStateField(
    'presence',
    // tldraw's presence record is JSON-serializable but not nominally a
    // Liveblocks JsonObject; the cast bridges the two structural types.
    (presenceDerivation.get() ?? null) as unknown as JsonObject | null
  );

  // Update Liveblocks when tldraw presence changes
  unsubs.push(
    react('when presence changes', () => {
      const presence = presenceDerivation.get() ?? null;
      requestAnimationFrame(() => {
        yProvider.awareness.setLocalStateField(
          'presence',
          presence as unknown as JsonObject | null
        );
      });
    })
  );

  // Sync Yjs awareness with tldraw
  const handleUpdate = (update: { added: number[]; updated: number[]; removed: number[] }) => {
    const states = yProvider.awareness.getStates() as Map<number, { presence: TLInstancePresence }>;

    const toRemove: TLInstancePresence['id'][] = [];
    const toPut: TLInstancePresence[] = [];

    // A user connected to Yjs
    for (const clientId of update.added) {
      const state = states.get(clientId);
      if (state?.presence && state.presence.id !== presenceId) {
        toPut.push(state.presence);
      }
    }

    // A user's awareness updated
    for (const clientId of update.updated) {
      const state = states.get(clientId);
      if (state?.presence && state.presence.id !== presenceId) {
        toPut.push(state.presence);
      }
    }

    // A user disconnected from Yjs
    for (const clientId of update.removed) {
      toRemove.push(InstancePresenceRecordType.createId(clientId.toString()));
    }

    store.mergeRemoteChanges(() => {
      if (toRemove.length > 0) {
        store.remove(toRemove);
      }
      if (toPut.length > 0) {
        store.put(toPut);
      }
    });
  };

  yProvider.awareness.on('change', handleUpdate);
  unsubs.push(() => yProvider.awareness.off('change', handleUpdate));

  return unsubs;
}
