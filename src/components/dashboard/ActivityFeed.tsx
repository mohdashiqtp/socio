import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Activity, ActivityFeedProps } from '@/types/dashboard/activity';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_ACTIVITIES, CREATE_FOLLOW_ACTIVITY } from '@/graphql/mutations/activityMutation';
import { FOLLOW_USER } from '@/graphql/mutations/userMutation';

export function ActivityFeed({ className = '' }: ActivityFeedProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Fetch activities for the current user
  const { loading, error, data, refetch } = useQuery(GET_USER_ACTIVITIES, {
    variables: { userId: currentUserId },
    skip: !currentUserId,
    fetchPolicy: 'network-only',
  });

  // Grab the current user's ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Keep track of any query issues in development
  useEffect(() => {
    if (error) console.error('Query error:', error);
    if (data) console.log('Query data:', data);
  }, [error, data]);

  // Build a map of who the current user is following
  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!currentUserId) return;
      try {
        const { data: followingData, error } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUserId);

        if (error) throw error;

        const followingStatus = followingData.reduce((acc: Record<string, boolean>, curr) => {
          acc[curr.following_id] = true;
          return acc;
        }, {});

        setFollowingMap(followingStatus);
      } catch (error) {
        console.error('Error fetching following status:', error);
      }
    };

    fetchFollowingStatus();
  }, [currentUserId, data]);

  // Add mutations
  const [followUser] = useMutation(FOLLOW_USER);
  const [createFollowActivity] = useMutation(CREATE_FOLLOW_ACTIVITY, {
    refetchQueries: ['GetUserActivities'],
  });

  // Show loading spinner while data is being fetched
  if (loading || !currentUserId) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center text-red-400 ${className}`}>
        Error loading activities. Please try again later.
      </div>
    );
  }

  // Transform the raw GraphQL data into a more usable format
  const activities = data?.activitiesCollection?.edges?.map((edge: any) => {
    const activityNode = edge.node;
    const actorProfile = data?.profilesCollection?.edges?.find(
      (profileEdge: any) => profileEdge.node.id === activityNode.actor_id
    )?.node;

    return {
      id: activityNode.id,
      type: activityNode.type,
      created_at: activityNode.created_at,
      actor: {
        id: actorProfile?.id,
        name: actorProfile?.full_name || 'Unknown User',
        avatar_url: actorProfile?.avatar_url
      },
      post: activityNode.type === 'like' ? data?.postsCollection?.edges?.find(
        (postEdge: any) => postEdge.node.id === activityNode.post_id
      )?.node || null : null
    };
  }) || [];

  // Handle the follow back action across both Supabase and GraphQL
  const handleFollowBack = async (actorId: string) => {
    if (!currentUserId) return;
    
    try {
      // Follow in Supabase
      const { error: supabaseError } = await supabase
        .from('followers')
        .insert({ 
          follower_id: currentUserId, 
          following_id: actorId 
        });

      if (supabaseError) throw supabaseError;

      // Update GraphQL state
      await followUser({
        variables: {
          followerId: currentUserId,
          followingId: actorId
        }
      });

      // Create follow activity
      await createFollowActivity({
        variables: {
          actor_id: currentUserId,
          target_id: actorId
        }
      });

      // Refetch activities to update UI
      refetch();

    } catch (error) {
      console.error('Error following back:', error);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Activity Feed Header */}
      <div className="md:max-w-2xl md:mx-auto">
        <div className="border-b border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-100">Activity</h2>
        </div>

        {/* Activity List */}
        <div className="divide-y divide-gray-700">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No activity yet
            </div>
          ) : (
            activities.map((activity: Activity) => (
              <div 
                key={activity.id} 
                className="p-4 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {activity.actor.avatar_url ? (
                      <img
                        src={activity.actor.avatar_url}
                        alt={activity.actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-500/20 text-purple-200">
                        {activity.actor.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-200">
                        <span className="font-medium">{activity.actor.name}</span>
                        {' '}
                        {activity.type === 'like' && (
                          <>
                            liked your post
                            {activity.post?.content && (
                              <span className="text-gray-400">
                                : "{activity.post.content.slice(0, 50)}
                                {activity.post.content.length > 50 ? '...' : ''}"
                              </span>
                            )}
                          </>
                        )}
                        {activity.type === 'follow' && 'started following you'}
                      </p>
                      {activity.type === 'follow' && !followingMap[activity.actor.id] && (
                        <button
                          onClick={() => handleFollowBack(activity.actor.id)}
                          className="px-3 py-1 text-sm rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        >
                          Follow Back
                        </button>
                      )}
                      {activity.type === 'follow' && followingMap[activity.actor.id] && (
                        <span className="px-3 py-1 text-sm text-gray-400">
                          Following
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {activity.type === 'like' && (
                      <Heart className="w-5 h-5 text-red-500" />
                    )}
                    {activity.type === 'follow' && (
                      <UserPlus className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 