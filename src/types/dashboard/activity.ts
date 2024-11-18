export interface Activity {
  id: string;
  type: 'like' | 'follow';
  created_at: string;
  actor: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
    image?: string;
  } | null;
}

export interface ActivityFeedProps {
  className?: string;
}