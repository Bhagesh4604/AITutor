

import React, { useState, useEffect } from 'react';
import { StudentChat } from './components/StudentChat';
import { StudentQuiz } from './components/StudentQuiz';
import { StudentProgress } from './components/StudentProgress';
import { TeacherDashboard } from './components/TeacherDashboard';
import { LiveTutor } from './components/LiveTutor';
import { ProfileSection } from './components/ProfileSection';
import { StudyMaterial } from './components/StudyMaterial';
import { AuthPage } from './components/AuthPage';
import { CommandMenu } from './components/CommandMenu';
import { AnimatedSidebar } from './components/AnimatedSidebar';
import { NeonOrbs } from './components/NeonOrbs';
import { AudioTranscriber } from './components/AudioTranscriber';
import { UserRole } from './types';
import { db } from './services/mockDatabase';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [user, setUser] = useState<any>(null); // Stores the current user profile

  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'progress' | 'live' | 'profile' | 'resources' | 'transcribe'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Toggle Dark Mode Class on HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Subscribe to DB updates to keep 'user' state fresh across all components
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = db.subscribe(() => {
      if (role === UserRole.STUDENT) {
        // Force a shallow copy to trigger React re-render
        setUser({ ...db.getCurrentStudent() });
      } else {
        setUser({ ...db.getCurrentTeacher() });
      }
    });
    return unsubscribe;
  }, [isAuthenticated, role]);

  const handleLogin = (userData: any, userRole: UserRole) => {
    setUser(userData);
    setRole(userRole);
    setIsAuthenticated(true);
    
    // Set default tabs based on role
    if (userRole === UserRole.STUDENT) {
      setActiveTab('chat');
      // Update DB context so other components work correctly
      db.setCurrentStudent(userData.id);
    } else {
      setActiveTab('dashboard' as any);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(UserRole.STUDENT);
  };

  const handleCommandNavigation = (tab: string) => {
    setActiveTab(tab as any);
  };

  // Handler to go back to Home (Chat for students, Dashboard for teachers)
  const handleBack = () => {
    if (role === UserRole.STUDENT) {
      setActiveTab('chat');
    } else {
      // Teachers usually stay on dashboard, but if we had other tabs:
      setActiveTab('dashboard' as any);
    }
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Determine if we should show the global header
  // We show it on 'chat' and 'progress', but hide it on immersive tools like Quiz/Live/Resources/Profile
  const showHeader = activeTab === 'chat' || activeTab === 'progress';

  return (
    <div className={`min-h-screen flex bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500`}>
      {/* Dark Mode Background Effect */}
      {theme === 'dark' && <NeonOrbs />}

      {/* Animated Sidebar */}
      <AnimatedSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={role} 
        user={user} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />

      {/* Main Content Area */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: isSidebarCollapsed ? 80 : 288 }} // 80px (5rem) vs 288px (18rem)
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 p-6 h-screen overflow-hidden relative z-10"
      >
        {/* Light Mode Background decorative elements */}
        {theme === 'light' && (
          <>
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
          </>
        )}

        {role === UserRole.STUDENT ? (
          <div className="h-full flex flex-col max-w-6xl mx-auto">
            {showHeader && (
              <header className="flex items-start justify-between mb-8 pt-2">
                <div className="w-full max-w-xl pr-8">
                   <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{user?.name.split(' ')[0]}</span>
                  </h1>
                  {/* Command Menu / Search Bar - Only visible in Chat tab */}
                  {activeTab === 'chat' && (
                    <CommandMenu onNavigate={handleCommandNavigation} />
                  )}
                </div>
                
                <div className="text-right hidden md:block pt-1">
                  <div className="inline-block px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Academic Status</p>
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`w-2 h-2 rounded-full ${user?.atRisk ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <p className={`text-sm font-bold ${user?.atRisk ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {user?.atRisk ? 'Needs Attention' : 'Excellent'}
                      </p>
                    </div>
                  </div>
                </div>
              </header>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto pb-10 custom-scrollbar pr-2">
               {activeTab === 'chat' && <StudentChat />}
               {activeTab === 'live' && <LiveTutor onBack={handleBack} />}
               {activeTab === 'quiz' && <StudentQuiz onBack={handleBack} />}
               {activeTab === 'resources' && <StudyMaterial onBack={handleBack} />}
               {activeTab === 'transcribe' && <AudioTranscriber />}
               {activeTab === 'progress' && <StudentProgress />}
               {activeTab === 'profile' && <ProfileSection role={UserRole.STUDENT} userData={user} onBack={handleBack} />}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {activeTab === 'profile' ? <ProfileSection role={UserRole.TEACHER} userData={user} onBack={handleBack} /> : <TeacherDashboard />}
          </div>
        )}
      </motion.main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(203, 213, 225, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.8);
        }
      `}</style>
    </div>
  );
};

export default App;