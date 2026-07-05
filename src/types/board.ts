// Unified per-board role. 'admin' covers the creator, explicit board-member
// admins, and org admins. Shared between server authz and client components,
// so it must stay free of server-only imports.
export type BoardRole = 'admin' | 'editor' | 'commenter' | 'viewer';

export interface BoardSummary {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  title?: string;
}

export interface UpdateBoardInput {
  title?: string;
  isPublic?: boolean;
}
