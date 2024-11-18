import { Activity, Grid, Layers, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const SideNav = () => {
  // tracks which nav section is currently active
  const [activeSection, setActiveSection] = useState('Feed');
  const [showMobileActivity, setShowMobileActivity] = useState(false);

  // nav items config - easier to maintain and update
  const navItems = [
    { icon: Grid, label: 'Feed' },
    { icon: Activity, label: 'Activity' },
    { icon: Users, label: 'Communities' },
    { icon: TrendingUp, label: 'Trending' },
    { icon: Layers, label: 'Collections' }
  ];

  // topics data - could be moved to a separate config file if needed
  const topics = [
    { name: 'Design', count: '2.3k' },
    { name: 'Development', count: '2.3k' },
    { name: 'Marketing', count: '2.3k' },
    { name: 'AI', count: '2.3k' },
    { name: 'Startups', count: '2.3k' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800/50 px-4 py-3 md:relative md:bg-gray-800 md:rounded-lg md:border-none md:px-6 md:py-4">
      <div className="flex justify-between items-center md:flex-col md:items-stretch md:space-y-2">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => {
              setActiveSection(label);
              if (label === 'Activity') setShowMobileActivity(true);
            }}
            className={`
              group flex flex-col items-center relative p-1.5 md:flex-row md:p-3
              ${activeSection === label ? 'text-purple-500' : 'text-gray-400 hover:text-purple-500'}
              md:w-full md:rounded-lg md:hover:bg-gray-700/50 transition-all duration-200
            `}
          >
            <Icon className="h-5 w-5 mb-1 md:mb-0 md:mr-3" />
            <span className="text-[10px] md:text-sm">{label}</span>
            
            {/* mobile indicator dot/line */}
            <span className={`
              absolute -bottom-4 left-1/2 w-1 h-1 bg-purple-500 rounded-full 
              transition-all duration-200 -translate-x-1/2 md:hidden
              ${activeSection === label ? 'opacity-100 group-hover:h-[2px] group-hover:w-12' : 'opacity-0'}
            `} />

            {/* desktop indicator line */}
            <span className={`
              hidden md:block absolute left-0 top-0 bottom-0 w-1 rounded-full
              transition-all duration-200
              ${activeSection === label ? 'bg-purple-500 opacity-100' : 'opacity-0 group-hover:opacity-50 group-hover:bg-purple-500'}
            `} />
          </button>
        ))}
      </div>

      {/* desktop-only topics section */}
      <div className="hidden md:block mt-8 space-y-4">
        <h3 className="px-3 text-sm font-medium text-gray-400 uppercase">Popular Topics</h3>
        <div className="space-y-1">
          {topics.map(({ name, count }) => (
            <button 
              key={name} 
              className="flex items-center justify-between w-full px-4 py-2.5 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <span className="text-sm">#{name}</span>
              <span className="text-xs text-gray-500">{count}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default SideNav;