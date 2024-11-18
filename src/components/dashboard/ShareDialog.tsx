import { X, Copy, Twitter, Facebook, MessageCircle } from 'lucide-react';

type ShareDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
}

export const ShareDialog = ({ isOpen, onClose, postId, postContent }: ShareDialogProps) => {
  if (!isOpen) return null;

  // all possible share options with their configs
  const shareOptions = [
    { 
      name: 'Copy Link',
      icon: Copy,
      color: 'bg-gray-600 hover:bg-gray-500',
      action: async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        onClose();
      }
    },
    { 
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2] hover:bg-[#1a8cd8]',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postContent)}`);
        onClose();
      }
    },
    { 
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#4267B2] hover:bg-[#365899]',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/post/${postId}`)}`);
        onClose();
      }
    },
    {
      name: 'Message',
      icon: MessageCircle,
      color: 'bg-purple-600 hover:bg-purple-500',
      action: () => {
        window.open(`sms:?body=${encodeURIComponent(postContent)}`);
        onClose();
      }
    },
  ];

  return (
    // backdrop overlay with blur effect
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center md:items-center p-4"
      onClick={onClose}
    >
      {/* main dialog container */}
      <div 
        className="w-full max-w-xs bg-gray-800 rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-100">Share</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* share buttons grid */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {shareOptions.map(({ name, icon: Icon, color, action }) => (
            <button
              key={name}
              onClick={action}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`p-3 rounded-full ${color} transition-all duration-200 transform group-hover:scale-105 group-active:scale-95`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-300">
                {name}
              </span>
            </button>
          ))}
        </div>

        {/* quick copy url section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
            <div className="flex-1 truncate text-sm text-gray-400">
              {`${window.location.origin}/post/${postId.slice(0, 8)}...`}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
                onClose();
              }}
              className="px-3 py-1 text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-full transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};