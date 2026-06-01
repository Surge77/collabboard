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
