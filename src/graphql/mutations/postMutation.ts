import { gql } from '@apollo/client';

export const LIKE_POST = gql`
  mutation LikePost($post_id: UUID!, $user_id: UUID!) {
    insertIntolikesCollection(objects: [{
      post_id: $post_id,
      user_id: $user_id
    }]) {
      records {
        id
        post_id
        user_id
      }
    }
  }
`;

export const UNLIKE_POST = gql`
  mutation UnlikePost($post_id: UUID!, $user_id: UUID!) {
    deleteFromlikesCollection(
      filter: { post_id: { eq: $post_id }, user_id: { eq: $user_id } }
    ) {
      records {
        id
      }
    }
  }
`;

export const SAVE_POST = gql`
  mutation SavePost($postId: UUID!, $userId: UUID!) {
    insertIntopost_savesCollection(objects: [{
      post_id: $postId,
      user_id: $userId
    }]) {
      records {
        id
        post_id
        user_id
      }
    }
  }
`;

export const UNSAVE_POST = gql`
  mutation UnsavePost($postId: UUID!, $userId: UUID!) {
    deleteFrompost_savesCollection(
      filter: { post_id: { eq: $postId }, user_id: { eq: $userId } }
    ) {
      records {
        id
      }
    }
  }
`;

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($content: String!, $tags: [String!], $image: String, $user_id: UUID!) {
    insertIntopostsCollection(objects: [{
      content: $content,
      tags: $tags,
      image: $image,
      user_id: $user_id
    }]) {
      records {
        id
        content
        created_at
        image
        tags
        user_id
      }
    }
  }
`;

// Add the query definition
export const GET_POSTS = gql`
  query GetPosts($userId: UUID!) {
    postsCollection(
      orderBy: {created_at: DescNullsLast}
    ) {
      edges {
        node {
          id
          content
          created_at
          image
          tags
          user_id
          likesCollection {
            edges {
              node {
                id
                user_id
              }
            }
          }
        }
      }
    }
    followersCollection(
      filter: { follower_id: { eq: $userId } }
    ) {
      edges {
        node {
          follower_id
          following_id
        }
      }
    }
  }
`;