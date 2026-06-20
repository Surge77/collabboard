import { randomBytes } from 'node:crypto';

import { db } from '@/lib/db';

export type ShareRole = 'VIEWER' | 'EDITOR';

export interface ShareLinkSummary {
  id: string;
  token: string;
  role: ShareRole;
  expiresAt: string | null;
  createdAt: string;
}

// 24 random bytes (~192 bits) base64url-encoded — unguessable, URL-safe.
const TOKEN_BYTES = 24;
const MS_PER_DAY = 86_400_000;
const MAX_EXPIRY_DAYS = 365;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

function toSummary(link: {
  id: string;
  token: string;
  role: ShareRole;
  expiresAt: Date | null;
  createdAt: Date;
}): ShareLinkSummary {
  return {
    id: link.id,
    token: link.token,
    role: link.role,
    expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
    createdAt: link.createdAt.toISOString(),
  };
}

export async function createShareLink(
  boardId: string,
  createdById: string,
  role: ShareRole,
  expiresInDays?: number
): Promise<ShareLinkSummary> {
  // Defense in depth: the route validates via Zod, but guard here too so the
  // function is safe to call from any server context.
  if (expiresInDays !== undefined && (expiresInDays < 1 || expiresInDays > MAX_EXPIRY_DAYS)) {
    throw new Error('expiresInDays out of range');
  }
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * MS_PER_DAY) : null;
  const link = await db.shareLink.create({
    data: { boardId, createdById, role, token: generateToken(), expiresAt },
  });
  return toSummary(link);
}

export async function listShareLinks(boardId: string): Promise<ShareLinkSummary[]> {
  // Active links only: not revoked and not past expiry (an expired link is dead
  // weight that would mislead the owner into thinking it still works).
  const links = await db.shareLink.findMany({
    where: {
      boardId,
      revoked: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
  });
  return links.map(toSummary);
}

export async function revokeShareLink(id: string, boardId: string): Promise<boolean> {
  // Scope the revoke by boardId so a caller can only revoke links on a board they
  // have already been authorized for.
  const result = await db.shareLink.updateMany({
    where: { id, boardId },
    data: { revoked: true },
  });
  return result.count > 0;
}

// Resolves a raw share token to its board + role, or null if the token is
// unknown, revoked, or expired. The single place token validity is decided.
export async function resolveShareToken(
  token: string
): Promise<{ boardId: string; role: ShareRole } | null> {
  const link = await db.shareLink.findUnique({ where: { token } });
  if (!link || link.revoked) return null;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;
  return { boardId: link.boardId, role: link.role };
}
