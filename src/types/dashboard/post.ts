// interface for Post props
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
  
  export interface PostProps {
    post: Post;  
    currentUserId: string | null;
    onLike: (postId: string) => void;
    onShare: (postId: string, content: string) => void;
    onSave: (postId: string) => void;
  }
  
 export interface User {
    id: string;
    email: string;
    raw_user_meta_data: {
      name?: string;
      avatar_url?: string;
      picture?: string;
      email?: string;
      full_name?: string;
    };
  }