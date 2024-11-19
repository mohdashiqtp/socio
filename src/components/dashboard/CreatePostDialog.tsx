import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Image, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
  onPost: (data: any) => Promise<void>;
}

export function CreatePostDialog({ open, onClose, currentUserId, onPost }: CreatePostDialogProps) {
  // Core post state
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mention system state
  const [mentions, setMentions] = useState<string[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Array<{
    id: string;
    username: string;
    full_name: string | null;
  }>>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

  


  // this handles both @ mentions and # tags while typing
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setPostContent(content);

    const words = content.split(/\s/);
    const lastWord = words[words.length - 1];

    // if they're trying to @ mention someone
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const searchTerm = lastWord.slice(1);
      
      // look up matching users in the db
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .ilike('username', `${searchTerm}%`)
        .limit(5); 
      setSuggestedUsers(users || []);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }

    
  };

  // Add selected user to mentions
  const handleMentionSelect = (username: string) => {
    const words = postContent.split(/\s/);
    words[words.length - 1] = `@${username} `;
    setPostContent(words.join(' '));
    setMentions([...mentions, username]);
    setShowMentionSuggestions(false);
  };

  // when they hit the post button
  const handlePost = async () => {
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    try {
      // we need to match exactly what the dashboard does
      await onPost({
        content: postContent,
        image: postImage, // send the raw file, let the dashboard handle the upload
        tags: tags.length > 0 ? tags : null,
        mentions: mentions.length > 0 ? mentions : null,
        user_id: currentUserId
      });

      // clean up everything after posting
      setPostContent('');
      setPostImage(null);
      setTags([]);
      setMentions([]);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // helpful for debugging bucket issues
  const checkBuckets = async () => {
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();
    
    if (error) {
      console.error('Uh oh, cant get buckets:', error);
      return;
    }
    
    console.log('Here are our buckets:', buckets);
  };

  // lets check what buckets we have when component loads
  useEffect(() => {
    checkBuckets();
  }, []);

  // TODO: Add error handling for failed image uploads
  // TODO: Add character limit to post content
  // TODO: Maybe add emoji picker?

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-xl sm:rounded-xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
          {/* Dialog header */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-100">
              Create Post
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Post content input with mentions */}
            <div className="relative">
              <textarea
                placeholder="What's on your mind? Use @ to mention users and # for tags"
                value={postContent}
                onChange={handleContentChange}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[120px]"
              />
              
              {/* User mention suggestions dropdown */}
              {showMentionSuggestions && suggestedUsers.length > 0 && (
                <div className="absolute bottom-full left-0 w-full bg-gray-700 rounded-lg mt-2 shadow-lg">
                  {suggestedUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleMentionSelect(user.username)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-600 text-gray-200"
                    >
                      <span className="font-medium">@{user.username}</span>
                      {user.full_name && (
                        <span className="text-gray-400 text-sm ml-2">
                          ({user.full_name})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active mentions display */}
            {mentions.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            {/* Image preview */}
            {postImage && (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(postImage)}
                  alt="Selected"
                  className="max-h-32 rounded"
                />
                <button
                  onClick={() => setPostImage(null)}
                  className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex space-x-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-purple-400"
                >
                  <Image className="w-5 h-5" />
                </button>
                
              </div>
              
              <button
                onClick={handlePost}
                disabled={isPosting || !postContent.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
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

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPostImage(file);
            }}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default CreatePostDialog; 