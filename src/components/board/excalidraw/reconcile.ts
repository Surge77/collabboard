interface VersionedElement {
  id: string;
  version: number;
  versionNonce: number;
}

interface RemoteMeta {
  version: number;
  versionNonce: number;
}

interface Reconciliation<T> {
  toSet: T[];
  toDelete: string[];
}

/**
 * Pure reconciliation between the local Excalidraw scene and the shared Yjs
 * document. Local elements that are absent from, or differ from, the doc are
 * written; doc entries no longer present locally are tombstoned.
 *
 * Change is detected via `versionNonce`, NOT `version` alone: Excalidraw does
 * not monotonically bump `version` during an in-progress drag (the geometry
 * grows while `version` stays constant), so a "strictly newer version" rule
 * drops every frame after the initial 0x0 one and persists an invisible
 * element. `versionNonce` changes on every mutation, so it reliably flags a
 * real local edit.
 *
 * Kept free of Yjs/React so the merge rule — the one piece of sync that cannot
 * be runtime-verified without two live clients — is unit-testable in isolation.
 */
export function reconcileElements<T extends VersionedElement>(
  localElements: readonly T[],
  remote: ReadonlyMap<string, RemoteMeta>
): Reconciliation<T> {
  const toSet: T[] = [];
  const seen = new Set<string>();

  for (const el of localElements) {
    seen.add(el.id);
    const r = remote.get(el.id);
    if (!r || r.version !== el.version || r.versionNonce !== el.versionNonce) {
      toSet.push(el);
    }
  }

  const toDelete: string[] = [];
  for (const id of remote.keys()) {
    if (!seen.has(id)) toDelete.push(id);
  }

  return { toSet, toDelete };
}
