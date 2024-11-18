import { gql } from '@apollo/client';

export const CREATE_ACTIVITY = gql`
  mutation CreateActivity(
    $type: String!,
    $actor_id: UUID!,
    $target_id: UUID,
    $post_id: UUID,
    $content: String
  ) {
    insertIntoactivitiesCollection(objects: [{
      type: $type,
      actor_id: $actor_id,
      target_id: $target_id,
      post_id: $post_id,
      content: $content,
      created_at: "now()"
    }]) {
      records {
        id
        type
        actor_id
        target_id
        post_id
        content
        created_at
      }
    }
  }
`;

export const GET_USER_ACTIVITIES = gql`
  query GetUserActivities($userId: UUID!) {
    activitiesCollection(
      filter: { target_id: { eq: $userId } }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          type
          actor_id
          target_id
          post_id
          content
          created_at
        }
      }
    }
    profilesCollection {
      edges {
        node {
          id
          full_name
          avatar_url
        }
      }
    }
    postsCollection {
      edges {
        node {
          id
          content
          image
        }
      }
    }
  }
`;

export const CREATE_FOLLOW_ACTIVITY = gql`
  mutation CreateFollowActivity(
    $actor_id: UUID!,
    $target_id: UUID!
  ) {
    insertIntoactivitiesCollection(objects: [{
      type: "follow",
      actor_id: $actor_id,
      target_id: $target_id,
      created_at: "now()"
    }]) {
      records {
        id
        type
        actor_id
        target_id
        created_at
      }
    }
  }
`; 