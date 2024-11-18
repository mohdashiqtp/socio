import React, { useState, useEffect, useCallback } from "react";
import { Bookmark, Heart, Share2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PostProps } from "@/types/dashboard/post";
import { useMutation } from '@apollo/client';
import { CREATE_ACTIVITY } from "@/graphql/mutations/activityMutation";

const Post = React.memo(({ post, currentUserId, onLike, onShare, onSave }: PostProps) => {
  // basic states for user data and loading
  const [userData, setUserData] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    userData?.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=random`
  );

  // double tap like feature states
  const [lastTap, setLastTap] = useState<number>(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const [createActivity] = useMutation(CREATE_ACTIVITY);

  // handles double tap detection for liking posts
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      const hasLiked = post.likesCollection.edges.some(
        edge => edge.node.user_id === currentUserId
      );
      if (!hasLiked) {
        onLike(post.id);
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }
    }
    setLastTap(now);
  }, [lastTap, post.likesCollection, currentUserId, onLike, post.id]);

  // gets user profile data from supabase
  const fetchUserData = useCallback(async () => {
    if (!post.user_id) return;
    
    setProfileLoading(true);
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('id', post.user_id)
        .single();
      
      if (error) throw error;

      if (profileData) {
        setUserData({
          id: profileData.id,
          name: profileData.full_name || 'Anonymous',
          avatar_url: profileData.avatar_url,
          email: profileData.email
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Error loading profile');
    } finally {
      setProfileLoading(false);
    }
  }, [post.user_id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // handles like action and creates activity
  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      await onLike(post.id);
      
      if (!post.isLiked) {
        await createActivity({
          variables: {
            type: 'like',
            actor_id: currentUserId,
            target_id: post.user_id,
            post_id: post.id,
            content: post.content?.substring(0, 100) || null
          }
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }, [currentUserId, post.id, post.user_id, post.content, post.isLiked, onLike, createActivity]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
          {userData?.avatar_url ? (
            <img 
              src={userData.avatar_url}
              alt={userData?.name || 'User'} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Users className="w-6 h-6" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">
            {userData?.name}
          </p>
          <p className="text-xs text-gray-400">
            {userData?.email}
          </p>
        </div>
      </div>

      <p className="text-gray-300">{post.content}</p>

      {post.image && (
        <div className="relative group">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          )}
          <img
            src={post.image}
            alt="Post content"
            className={`w-full rounded-lg ${imageLoading ? 'opacity-0' : 'opacity-100'} cursor-pointer`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setError('Error loading image');
            }}
            onClick={handleDoubleTap}
            onTouchStart={handleDoubleTap}
            onTouchEnd={(e) => e.preventDefault()}
          />
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none
              ${showLikeAnimation ? 'animate-like-heart' : 'opacity-0'}`}
          >
            <Heart className="w-24 h-24 text-red-500 fill-current animate-like-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm">
          {error}
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 ${
            post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          } transition-colors`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likes || 0}</span>
        </button>

        <button
          onClick={() => onShare(post.id, post.content)}
          className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>

        <button
          onClick={() => onSave(post.id)}
          className={`flex items-center space-x-2 ${
            post.isSaved ? 'text-purple-500' : 'text-gray-400 hover:text-purple-500'
          } transition-colors`}
        >
          <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
          <span>{post.saves || 0}</span>
        </button>
      </div>
    </div>
  );
});

export default Post;