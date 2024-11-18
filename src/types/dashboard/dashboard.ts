// Types
export interface Post {
    id: string;
    content: string;
    created_at: string;
    image?: string;
    user_id: string;
    tags: string[];
    likesCollection: {
      edges: Array<{
        node: {
          id: string;
          user_id: string;
        };
      }>;
    };
    likes?: number;
    saves?: number;
    isLiked?: boolean;
    isSaved?: boolean;
}

export interface SuggestedUser {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  }

export  interface ShareDialogData {
    isOpen: boolean;
    postId: string;
    content: string;
  }