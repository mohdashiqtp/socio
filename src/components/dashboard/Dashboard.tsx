import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Search,  Heart,  Image,  Tag,  Users,  Loader2, X,  Home, PlusSquare, User
} from 'lucide-react';
import Header from '../Header';
import PostComponent from './Post';
import { supabase } from '@/lib/supabase';
import { gql, useQuery, useMutation } from '@apollo/client';
import { uploadImageToSupabase } from '@/lib/impageUpload';
import SideNav from './SideNav';
import { ShareDialog } from './ShareDialog';
import CreatePostDialog from './CreatePostDialog';
import { ActivityFeed } from './ActivityFeed';
import {
  FOLLOW_USER,
  UNFOLLOW_USER
} from '@/graphql/mutations/userMutation';
import {
  LIKE_POST,
  UNLIKE_POST,
  SAVE_POST,
  UNSAVE_POST,
  CREATE_POST_MUTATION,
  GET_POSTS,
} from '@/graphql/mutations/postMutation'
import { CREATE_FOLLOW_ACTIVITY } from '@/graphql/mutations/activityMutation';
import { Post, ShareDialogData } from '@/types/dashboard/dashboard';






const INTROSPECTION_QUERY = gql`
  query IntrospectionQuery {
    __type(name: "posts") {
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
`;



// Main Dashboard
export function Dashboard() {
  // User state and authentication
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Post creation and management
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tags and mentions handling
  const [tags, setTags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);

  // UI state management
  const [shareDialogData, setShareDialogData] = useState<ShareDialogData>({
    isOpen: false,
    postId: '',
    content: ''
  });
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [showMobileActivity, setShowMobileActivity] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  //  Query and Mutations next
  const { loading: postsLoading, error: postsError, data } = useQuery(GET_POSTS, {
    variables: { userId: currentUserId },
    skip: !currentUserId
  });

  const [likePost] = useMutation(LIKE_POST, {
    refetchQueries: ['GetPosts', 'GetUserActivities'],
  });

  const [unlikePost] = useMutation(UNLIKE_POST, {
    refetchQueries: ['GetPosts', 'GetUserActivities'],
  });

  const [savePost] = useMutation(SAVE_POST, {
    refetchQueries: ['GetPosts'],
  });

  const [unsavePost] = useMutation(UNSAVE_POST, {
    refetchQueries: ['GetPosts'],
  });

  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    refetchQueries: [{ query: GET_POSTS, variables: { userId: currentUserId } }],
    onError: (error) => {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    }
  });

  const [suggestedUsers, setSuggestedUsers] = useState<Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    isFollowing: boolean;
  }>>([]);

  // Add mutations
  const [followUser] = useMutation(FOLLOW_USER, {
    refetchQueries: ['GetPosts', 'GetUserActivities'],
    update(cache) {
      cache.modify({
        fields: {
          suggestedUsers(existingUsers = []) {
            return existingUsers;
          }
        }
      });
    }
  });

  const [unfollowUser] = useMutation(UNFOLLOW_USER, {
    refetchQueries: ['GetPosts', 'GetUserActivities'],
    update(cache) {
      cache.modify({
        fields: {
          suggestedUsers(existingUsers = []) {
            return existingUsers;
          }
        }
      });
    }
  });

  const [createFollowActivity] = useMutation(CREATE_FOLLOW_ACTIVITY, {
    refetchQueries: ['GetUserActivities'],
  });

  // Fetching suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Get current following status
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', session.user.id);

      if (followersError) throw followersError;

      const followingIds = new Set(followersData?.map(f => f.following_id) || []);

      // Get all users except current user
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', session.user.id)
        .limit(10);

      if (profilesError) throw profilesError;

      // Process profiles with following status
      const processedProfiles = profiles.map(profile => ({
        ...profile,
        isFollowing: followingIds.has(profile.id)
      }));

      setSuggestedUsers(processedProfiles);

    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  }, []);

  //  useEffect to refetch when needed
  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);

  //  Memoized values
  const posts = useMemo(() => {
    if (!data?.postsCollection?.edges) return [];

    return data.postsCollection.edges.map(({ node: post }: any) => ({
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      image: post.image,
      user_id: post.user_id,
      tags: post.tags || [],
      likesCollection: post.likesCollection,
      likes: post.likesCollection?.edges?.length || 0,
      isLiked: post.likesCollection?.edges?.some(
        (edge: { node: { user_id: string } }) => edge.node.user_id === currentUserId
      ) || false
    }));
  }, [data, currentUserId]);

  //  Callbacks after mutations are defined
  const handleLike = useCallback(async (postId: string) => {
    if (!currentUserId) return;

    try {
      const post = posts.find((p: Post) => p.id === postId);
      const isCurrentlyLiked = post?.likesCollection?.edges?.some(
        (edge: { node: { user_id: string } }) => edge.node.user_id === currentUserId
      );

      if (isCurrentlyLiked) {
        await unlikePost({
          variables: {
            post_id: postId,
            user_id: currentUserId
          }
        });
      } else {
        await likePost({
          variables: {
            post_id: postId,
            user_id: currentUserId
          }
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [currentUserId, likePost, unlikePost, posts]);

  // handle the save
  const handleSave = useCallback(async (postId: string) => {
    if (!currentUserId) return;

    try {
      const post = posts.find((p: Post) => p.id === postId);
      if (post?.isSaved) {
        await unsavePost({
          variables: { postId, userId: currentUserId },
        });
      } else {
        await savePost({
          variables: { postId, userId: currentUserId },
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }, [currentUserId, savePost, unsavePost]);

  // Handel share button
  const handleShare = useCallback((postId: string, content: string) => {
    setShareDialogData({ isOpen: true, postId, content });
  }, []);

  // Single useEffect for auth
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && session.user.id !== currentUserId) {
        setCurrentUserId(session.user.id);
      }
    };
    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { data: schemaData } = useQuery(INTROSPECTION_QUERY);
  console.log('Available fields:', schemaData?.__type?.fields);

  // Handle the image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image size should be less than 5MB");
        return;
      }
      setPostImage(file);
      setError(null);
    }
  };

  // Handle post sharing 
  const handlePost = async () => {
    if (!postContent.trim()) {
      setError("Please enter some content");
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      let imageUrl = null;
      if (postImage) {
        imageUrl = await uploadImageToSupabase(postImage);
      }

      // Process mentions to ensure they exist in the database
      const validMentions = await Promise.all(
        mentions.map(async (mention) => {
          const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', mention)
            .single();
          return data?.username;
        })
      );

      const filteredMentions = validMentions.filter(Boolean);

      await createPost({
        variables: {
          content: postContent.trim(),
          tags: tags.length > 0 ? tags : null,
          mentions: filteredMentions.length > 0 ? filteredMentions : null,
          image: imageUrl,
          user_id: session.user.id
        }
      });

      // Reset form
      setPostContent('');
      setTags([]);
      setMentions([]);
      setPostImage(null);

    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  // Handle the tags
  const handleTagInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const content = e.currentTarget.value;
    const lastWord = content.split(' ').pop() || '';

    // Handle hashtags
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      const tag = lastWord.slice(1);
      if (e.key === ' ' && !tags.includes(tag)) {
        setTags([...tags, tag]);
        setPostContent(content.slice(0, -lastWord.length).trim());
        e.preventDefault();
      }
    }

    // Handle mentions
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const mention = lastWord.slice(1);
      if (e.key === ' ' && !mentions.includes(mention)) {
        setMentions([...mentions, mention]);
        setPostContent(content.slice(0, -lastWord.length).trim());
        e.preventDefault();
      }
    }
  };

  //  handler for tag button click
  const handleTagButtonClick = () => {
    setShowTagInput(!showTagInput);
  };

  useEffect(() => {
    const checkProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      console.log('All profiles:', data);
      console.log('Profiles error:', error);
    };

    checkProfiles();
  }, []);

  // Update handleFollowToggle to handle immediate UI updates
  const handleFollowToggle = useCallback(async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) return;

    setSuggestedUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )
    );

    try {
      if (!isCurrentlyFollowing) {
        const [supabaseResponse] = await Promise.all([
          supabase
            .from('followers')
            .insert({
              follower_id: currentUserId,
              following_id: userId
            }),
          followUser({
            variables: {
              followerId: currentUserId,
              followingId: userId
            }
          }),
          createFollowActivity({
            variables: {
              actor_id: currentUserId,
              target_id: userId
            }
          })
        ]);

        if (supabaseResponse.error) throw supabaseResponse.error;

      } else {
        const { error: supabaseError } = await supabase
          .from('followers')
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: userId
          });

        if (supabaseError) throw supabaseError;

        await unfollowUser({
          variables: {
            followerId: currentUserId,
            followingId: userId
          }
        });
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      setSuggestedUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, isFollowing: isCurrentlyFollowing }
            : user
        )
      );
    }
  }, [currentUserId, followUser, unfollowUser, createFollowActivity]);

  // Update the button component to be more responsive
  const FollowButton = memo(({
    isFollowing,
    isCurrentUser,
    onToggle
  }: {
    userId: string;
    isFollowing: boolean;
    isCurrentUser: boolean;
    onToggle: () => void;
  }) => {
    return (
      <button
        onClick={onToggle}
        disabled={isCurrentUser}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${isFollowing
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isCurrentUser ? 'You' : (
          <span className="flex items-center gap-2">
            {isFollowing ? 'Following' : 'Follow'}
          </span>
        )}
      </button>
    );
  });

  //  real-time subscription for follow/unfollow updates
  useEffect(() => {
    const followsChannel = supabase
      .channel('custom-follow-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `follower_id=eq.${currentUserId}`
        },
        async (payload) => {
          // Update the specific user's following status
          if (payload.eventType === 'INSERT') {
            setSuggestedUsers(prev => prev.map(user =>
              user.id === payload.new.following_id
                ? { ...user, isFollowing: true }
                : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setSuggestedUsers(prev => prev.map(user =>
              user.id === payload.old.following_id
                ? { ...user, isFollowing: false }
                : user
            ));
          }
        }
      )
      .subscribe();

    return () => {
      followsChannel.unsubscribe();
    };
  }, [currentUserId]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="hidden md:block md:col-span-3 h-[calc(100vh-8rem)] sticky top-32">
              <SideNav />
            </div>

            {/* Main Content */}
            <main className="col-span-1 md:col-span-6">
              <div className="space-y-6">
                <div className="sticky top-24 z-10 bg-gray-900 pb-4">
                  <div className="bg-gray-800 rounded-lg p-4 hidden md:block">
                    {/* Post Creation Area */}
                    <div className="space-y-4">
                      {/* Avatar and Input */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0">
                        </div>
                        <textarea
                          placeholder="What's on your mind? Use # for tags and @ for mentions"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          onKeyDown={handleTagInput}
                          className="w-full bg-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[60px]"
                        />
                      </div>

                      {error && (
                        <div className="text-red-400 text-sm">{error}</div>
                      )}

                      {showTagInput && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Add tag and press Enter (e.g., coding)"
                            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                const newTag = e.currentTarget.value.trim();
                                if (!tags.includes(newTag)) {
                                  setTags([...tags, newTag]);
                                }
                                e.currentTarget.value = '';
                                setShowTagInput(false);
                              }
                            }}
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Image Preview */}
                      {postImage && (
                        <div className="mt-2">
                          <div className="relative inline-block">
                            <img
                              src={URL.createObjectURL(postImage)}
                              alt="Selected"
                              className="max-h-32 rounded"
                            />
                            <button
                              onClick={() => setPostImage(null)}
                              className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 hover:bg-gray-700"
                            >
                              <X className="w-4 h-4 text-gray-300" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tags and Mentions Display */}
                      {(tags.length > 0 || mentions.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-1"
                            >
                              #{tag}
                              <button
                                onClick={() => setTags(tags.filter(t => t !== tag))}
                                className="hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {mentions.map((mention) => (
                            <span
                              key={mention}
                              className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm flex items-center gap-1"
                            >
                              @{mention}
                              <button
                                onClick={() => setMentions(mentions.filter(m => m !== mention))}
                                className="hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            <Image className="w-5 h-5" />
                            <span>Photo</span>
                          </button>
                          <button
                            onClick={handleTagButtonClick}
                            className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            <Tag className="w-5 h-5" />
                            <span>Tag</span>
                          </button>
                        </div>
                        <button
                          onClick={handlePost}
                          disabled={isPosting || !postContent.trim()}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          {isPosting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Posting...</span>
                            </>
                          ) : (
                            <span>Post</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {postsLoading ? (
                  <div className="bg-gray-800 rounded-lg p-6 text-gray-300">Loading posts...</div>
                ) : postsError ? (
                  <div className="bg-gray-800 rounded-lg p-6 text-red-400">Error loading posts: {postsError.message}</div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post: Post) => (
                      <PostComponent
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        onLike={() => handleLike(post.id)}
                        onShare={() => handleShare(post.id, post.content)}
                        onSave={() => handleSave(post.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </main>

            {/* Right Sidebar */}
            <div className="hidden md:block md:col-span-3 h-[calc(100vh-8rem)] sticky top-32 space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Users You May Know</h3>
                <div className="space-y-4">
                  {suggestedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || 'User'}
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
                            {user.full_name || 'Anonymous User'}
                          </p>
                          {user.isFollowing && (
                            <p className="text-xs text-gray-400">Following</p>
                          )}
                        </div>
                      </div>
                      <FollowButton
                        userId={user.id}
                        isFollowing={user.isFollowing}
                        isCurrentUser={user.id === currentUserId}
                        onToggle={() => handleFollowToggle(user.id, user.isFollowing)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Activity</h3>
                <ActivityFeed />
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4 md:hidden">
              <div className="max-w-lg mx-auto">
                <div className="flex justify-around items-center">
                  {[
                    { icon: Home, label: 'Home' },
                    { icon: Search, label: 'Search' },
                    {
                      icon: PlusSquare,
                      label: 'Create',
                      onClick: () => setCreatePostDialogOpen(true)
                    },
                    { icon: Heart, label: 'Activity', onClick: () => setShowMobileActivity(true) },
                    { icon: User, label: 'Profile' },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      className="flex flex-col items-center group relative p-2"
                      onClick={onClick}
                    >
                      <Icon className="h-6 w-6 text-gray-400 group-hover:text-purple-500 transition-colors duration-200 ease-in-out" />
                      <span className="text-[10px] text-gray-400 group-hover:text-purple-500 transition-colors duration-200 mt-1 opacity-0 group-hover:opacity-100">
                        {label}
                      </span>
                      <span className="absolute -bottom-4 left-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out -translate-x-1/2 group-hover:h-[2px] group-hover:w-12" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageSelect}
      />

      <ShareDialog
        isOpen={shareDialogData.isOpen}
        onClose={() => setShareDialogData({ ...shareDialogData, isOpen: false })}
        postId={shareDialogData.postId}
        postContent={shareDialogData.content}
      />

      <CreatePostDialog
        open={createPostDialogOpen}
        onClose={() => setCreatePostDialogOpen(false)}
        currentUserId={currentUserId}
        onPost={handlePost}
      />

      {showMobileActivity && (
        <div className="fixed inset-0 bg-gray-900/95 z-50">
          <div className="relative h-full overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Activity</h2>
              <button
                onClick={() => setShowMobileActivity(false)}
                className="p-2 hover:bg-gray-800 rounded-full"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <ActivityFeed />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(Dashboard);