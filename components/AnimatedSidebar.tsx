

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Video, 
  Library, 
  LayoutDashboard, 
  User, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  BrainCircuit,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Sun,
  Moon,
  Mic
} from 'lucide-react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  role: UserRole;
  user: any;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  bgStart: string;
}

export const AnimatedSidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  role, 
  user, 
  onLogout,
  isCollapsed,
  toggleSidebar,
  theme,
  toggleTheme
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const studentItems: MenuItem[] = [
    { 
      id: 'chat', 
      label: 'AI Tutor', 
      icon: GraduationCap, 
      color: 'text-indigo-600 dark:text-indigo-400',
      gradient: 'from-indigo-500 to-violet-500',
      bgStart: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    { 
      id: 'live', 
      label: 'Live Class', 
      icon: Video, 
      color: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-500 to-pink-500',
      bgStart: 'bg-rose-50 dark:bg-rose-900/20'
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: Library, 
      color: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-500 to-orange-500',
      bgStart: 'bg-amber-50 dark:bg-amber-900/20'
    },
    { 
      id: 'quiz', 
      label: 'Assessment', 
      icon: BrainCircuit,
      color: 'text-violet-600 dark:text-violet-400',
      gradient: 'from-violet-500 to-purple-500',
      bgStart: 'bg-violet-50 dark:bg-violet-900/20'
    },
    { 
      id: 'transcribe', 
      label: 'Transcribe', 
      icon: Mic,
      color: 'text-pink-600 dark:text-pink-400',
      gradient: 'from-pink-500 to-red-500',
      bgStart: 'bg-pink-50 dark:bg-pink-900/20'
    },
    { 
      id: 'progress', 
      label: 'Progress', 
      icon: LayoutDashboard, 
      color: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500 to-teal-500',
      bgStart: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: User, 
      color: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-cyan-500',
      bgStart: 'bg-blue-50 dark:bg-blue-900/20'
    },
  ];

  const teacherItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      color: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500 to-fuchsia-500',
      bgStart: 'bg-purple-50 dark:bg-purple-900/20'
    },
    { 
      id: 'profile', 
      label: 'Teacher Profile', 
      icon: User, 
      color: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-cyan-500',
      bgStart: 'bg-blue-50 dark:bg-blue-900/20'
    },
  ];

  const items = role === UserRole.STUDENT ? studentItems : teacherItems;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }} // 20 (5rem) vs 72 (18rem)
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 flex flex-col fixed h-full z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden transition-colors duration-300"
    >
      {/* Header / Logo Area */}
      <div className={cn("flex items-center p-6 pb-6", isCollapsed ? "justify-center px-4" : "justify-between")}>
        <div className="flex items-center space-x-3 overflow-hidden whitespace-nowrap">
          <div className="relative shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
              role === UserRole.STUDENT ? "bg-gradient-to-br from-indigo-600 to-violet-600" : "bg-gradient-to-br from-purple-600 to-fuchsia-600"
            )}>
              <span className="text-white font-bold text-xl font-mono">H</span>
            </div>
            {!isCollapsed && (
              <motion.div 
                className="absolute -top-1 -right-1"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </motion.div>
            )}
          </div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 block pl-1">
                   H²-ALA
                </span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-widest uppercase pl-1">
                   {role === UserRole.STUDENT ? 'Student Portal' : 'Faculty Admin'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapse Button (Centered when collapsed) */}
      {isCollapsed && (
        <div className="flex justify-center mb-4">
           <button 
             onClick={toggleSidebar}
             className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-gray-100 dark:border-gray-700"
           >
             <PanelLeftOpen className="w-5 h-5" />
           </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-2 py-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {items.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "relative z-10 w-full flex items-center px-3 py-3 rounded-2xl transition-all duration-300",
                  isCollapsed ? "justify-center" : "justify-between",
                  !isActive && "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "space-x-4")}>
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0",
                    isActive ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg shadow-${item.color.split('-')[1]}-500/30` : `bg-white dark:bg-gray-800 ${item.color} group-hover:scale-110`
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className={cn(
                          "font-semibold text-sm transition-colors duration-200 whitespace-nowrap overflow-hidden",
                          isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {isActive && !isCollapsed && (
                   <motion.div
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="text-gray-900 dark:text-white"
                   >
                     <ChevronRight className="w-4 h-4 opacity-50" />
                   </motion.div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm space-y-3">
         
         {/* Theme Toggle */}
         <button 
           onClick={toggleTheme}
           className={cn(
             "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-300 group",
             "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-white"
           )}
           title="Toggle Theme"
         >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
            ) : (
              <Sun className="w-5 h-5 transition-transform group-hover:rotate-45" />
            )}
            {!isCollapsed && <span className="ml-3 font-medium text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
         </button>

         <motion.div 
           whileHover={{ scale: 1.02 }}
           className={cn(
             "bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center transition-all",
             isCollapsed ? "justify-center p-2" : "p-3 space-x-3"
           )}
         >
            <div className={cn(
               "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0",
               role === UserRole.STUDENT ? "bg-gradient-to-r from-indigo-500 to-blue-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
            )}>
              {user?.name.charAt(0)}
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                 <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
         </motion.div>

         <button 
           onClick={onLogout}
           className={cn(
             "w-full flex items-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group",
             isCollapsed ? "justify-center py-3" : "justify-center space-x-2 py-3"
           )}
           title="Sign Out"
         >
           <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
           {!isCollapsed && <span className="font-medium">Sign Out</span>}
         </button>
      </div>
    </motion.aside>
  );
};