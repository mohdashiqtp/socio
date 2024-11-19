import { Bell } from "lucide-react";
import { useState, useCallback, memo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// Main header component that handles navigation and user interactions
const Header = memo(() => {
  const [selectedCategory, setSelectedCategory] = useState('Following');
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // Fetch user profile data when user is authenticated
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setProfile(data);
        });
    }
  }, [user]);


  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [signOut]);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 z-50 border-b border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Peach
            </span>
            <div className="hidden sm:block relative w-64">
              <input
                type="text"
                placeholder="Discover something new"
                className="w-full bg-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            <button className="relative bg-gray-900 p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-purple-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-gray-700 hover:ring-2 hover:ring-purple-500 transition-all"
              >
                <span className="text-sm text-gray-200">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="hidden sm:block px-4 py-2 text-sm text-gray-200">
                      {profile?.full_name}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {['Following', 'Trending', 'Technology', 'Creative', 'Business', 'Lifestyle'].map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === category 
                  ? 'bg-purple-900/50 text-purple-300' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;