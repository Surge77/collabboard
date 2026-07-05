import type { BoardRole } from '@/types/board';

// Pure role predicates, safe to import from client components (no server-only
// dependencies). Server code reaches them re-exported through '@/lib/authz'.

export function canEditRole(role: BoardRole): boolean {
  return role === 'admin' || role === 'editor';
}

export function canCommentRole(role: BoardRole): boolean {
  return canEditRole(role) || role === 'commenter';
}

export function isAdminRole(role: BoardRole): boolean {
  return role === 'admin';
}
