interface SyncableElement {
  id: string;
  version: number;
  versionNonce: number;
  width: number;
  height: number;
  isDeleted: boolean;
}

interface RemoteMeta {
  version: number;
  versionNonce: number;
}

/**
 * Picks the local Excalidraw elements that should be written to the shared Yjs
 * document: those new to, or changed from, the doc.
 *
 * Two hard-won rules:
 *  - Change is detected via version AND versionNonce. Excalidraw bumps both on
 *    every mutation but does NOT increase `version` monotonically during an
 *    in-progress drag, so a version-only check would drop geometry updates.
 *  - Zero-size, not-yet-deleted elements are skipped — they are in-progress
 *    drag drafts that Excalidraw discards on the receiving side, and persisting
 *    them pollutes the doc with invisible 0x0 shapes.
 *
 * Deletions are intentionally NOT inferred from absence. Excalidraw keeps
 * deleted elements in the scene with `isDeleted: true`, so they propagate as
 * ordinary updates; inferring deletes from a transient onChange array makes two
 * editors delete each other's elements.
 */
export function elementsToSync<T extends SyncableElement>(
  localElements: readonly T[],
  remote: ReadonlyMap<string, RemoteMeta>
): T[] {
  const out: T[] = [];
  for (const el of localElements) {
    if (!el.isDeleted && el.width === 0 && el.height === 0) continue;
    const r = remote.get(el.id);
    if (!r || r.version !== el.version || r.versionNonce !== el.versionNonce) {
      out.push(el);
    }
  }
  return out;
}
