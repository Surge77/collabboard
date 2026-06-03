interface VersionedElement {
  id: string;
  version: number;
}

interface Reconciliation<T> {
  toSet: T[];
  toDelete: string[];
}

/**
 * Pure version-wins reconciliation between the local Excalidraw scene and the
 * shared Yjs document. Local elements newer than (or absent from) the doc are
 * written; doc entries no longer present locally are tombstoned.
 *
 * Kept free of Yjs/React so the merge rule — the one piece of sync that cannot
 * be runtime-verified without two live clients — is unit-testable in isolation.
 */
export function reconcileElements<T extends VersionedElement>(
  localElements: readonly T[],
  remoteVersions: ReadonlyMap<string, number>
): Reconciliation<T> {
  const toSet: T[] = [];
  const seen = new Set<string>();

  for (const el of localElements) {
    seen.add(el.id);
    const remoteVersion = remoteVersions.get(el.id);
    if (remoteVersion === undefined || remoteVersion < el.version) {
      toSet.push(el);
    }
  }

  const toDelete: string[] = [];
  for (const id of remoteVersions.keys()) {
    if (!seen.has(id)) toDelete.push(id);
  }

  return { toSet, toDelete };
}
