import { gql } from '@apollo/client';



export const FOLLOW_USER = gql`
  mutation FollowUser($follower_id: UUID!, $following_id: UUID!) {
    insertIntofollowersCollection(objects: [{
      follower_id: $follower_id,
      following_id: $following_id
    }]) {
      records {
        id
      }
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($follower_id: UUID!, $following_id: UUID!) {
    deleteFromfollowersCollection(
      filter: { follower_id: { eq: $follower_id }, following_id: { eq: $following_id } }
    ) {
      records {
        id
      }
    }
  }
`;

export const GET_SUGGESTED_USERS = gql`
  query GetSuggestedUsers($currentUserId: UUID!) {
    usersCollection(
      first: 5,
      filter: { id: { neq: $currentUserId } }
    ) {
      edges {
        node {
          id
          raw_user_meta_data
          followersCollection(filter: { follower_id: { eq: $currentUserId } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`;