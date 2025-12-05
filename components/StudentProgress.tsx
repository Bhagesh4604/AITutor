
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line 
} from 'recharts';
import { Clock, CheckCircle, Lock, PlayCircle, TrendingUp, AlertCircle, Heart, Star, Map as MapIcon } from 'lucide-react';
import { db } from '../services/mockDatabase';
import { Sentiment, ModuleStats } from '../types';

const LearningPathMap: React.FC<{ modules: ModuleStats[] }> = ({ modules }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center space-x-2 mb-2">
        <MapIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-800">Your Learning Journey</h3>
      </div>
      
      {/* Scrollable Container for the Map */}
      <div className="w-full overflow-x-auto pb-12 pt-10 px-4">
        <div className="flex items-start justify-between min-w-[850px] relative">
          
          {modules.map((mod, index) => {
            const isCompleted = mod.status === 'COMPLETED';
            const isInProgress = mod.status === 'IN_PROGRESS';
            const isLocked = mod.status === 'LOCKED';
            const isLast = index === modules.length - 1;

            return (
              <div key={mod.id} className="relative flex flex-col items-center flex-1 group">
                
                {/* Connecting Line (drawn to the right of the current node) */}
                {!isLast && (
                  <div 
                    className={`absolute top-8 left-1/2 w-full h-1 -z-0 transition-colors duration-500
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                    `} 
                  />
                )}

                {/* Node Container */}
                <div className="relative z-10 flex flex-col items-center">
                  
                  {/* Floating 'Recommended' Badge */}
                  {isInProgress && (
                    <div className="absolute -top-10 animate-bounce bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-20">
                      Recommended
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45"></div>
                    </div>
                  )}

                  {/* The Circle Node */}
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-sm transition-all duration-300 bg-white
                      ${isCompleted ? 'border-green-500 text-green-600' : ''}
                      ${isInProgress ? 'border-indigo-600 text-indigo-600 shadow-indigo-200 ring-4 ring-indigo-50 scale-110' : ''}
                      ${isLocked ? 'border-gray-200 text-gray-300 bg-gray-50' : ''}
                    `}
                  >
                    {isCompleted && <CheckCircle className="w-8 h-8" />}
                    {isInProgress && <PlayCircle className="w-8 h-8 fill-current" />}
                    {isLocked && <Lock className="w-6 h-6" />}
                  </div>

                  {/* Mastery Stars */}
                  <div className={`flex mt-3 space-x-0.5 h-4 ${isLocked ? 'opacity-0' : 'opacity-100'}`}>
                    {[1, 2, 3].map(star => (
                      <Star 
                        key={star} 
                        className={`w-3 h-3 ${
                          (mod.mastery / 33) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* Labels */}
                  <div className="mt-1 text-center w-32">
                    <p className={`text-sm font-bold leading-tight ${
                      isLocked ? 'text-gray-400' : 'text-gray-800'
                    }`}>
                      {mod.name}
                    </p>
                    {!isLocked && (
                      <p className={`text-xs mt-1 font-medium ${
                        isInProgress ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {mod.mastery}% Mastery
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const StudentProgress: React.FC = () => {
  const student = db.getCurrentStudent();
  const modules = student.modules;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200';
      case 'IN_PROGRESS': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5" />;
      case 'IN_PROGRESS': return <PlayCircle className="w-5 h-5" />;
      default: return <Lock className="w-5 h-5" />;
    }
  };

  // --- Sentiment Data Preparation ---
  const getSentimentScore = (s: Sentiment) => {
    switch (s) {
      case Sentiment.POSITIVE: return 4;
      case Sentiment.NEUTRAL: return 3;
      case Sentiment.NEGATIVE: return 2;
      case Sentiment.FRUSTRATED: return 1;
      default: return 0;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 4) return '#10b981'; // Green
    if (score >= 3) return '#6366f1'; // Indigo
    if (score >= 2) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  // Generate data points (using mock trend + filling some history for visual effect if array is short)
  const sentimentData = student.sentimentTrend.map((s, i) => ({
    session: `Session ${i + 1}`,
    score: getSentimentScore(s),
    mood: s,
    color: getSentimentColor(getSentimentScore(s))
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="font-bold text-sm" style={{ color: data.color }}>
            {data.mood}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2 pb-10">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Study Time</p>
            <h3 className="text-xl font-bold text-gray-800">
              {Math.round(modules.reduce((acc, m) => acc + m.timeSpent, 0) / 60)} hrs
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Avg. Mastery</p>
            <h3 className="text-xl font-bold text-gray-800">{student.masteryScore}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Modules Done</p>
            <h3 className="text-xl font-bold text-gray-800">
              {modules.filter(m => m.status === 'COMPLETED').length} / {modules.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Visual Learning Path */}
      <LearningPathMap modules={modules} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Mastery Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">Topic Mastery Scores</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modules} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={20}>
                  {modules.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mastery > 70 ? '#10b981' : entry.mastery > 40 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Spent Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">Time Spent (Minutes)</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modules}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                <YAxis />
                <Tooltip 
                   cursor={{fill: '#f3f4f6'}}
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="timeSpent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sentiment Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-6">
           <Heart className="w-5 h-5 text-pink-500" />
           <h3 className="font-bold text-gray-800">Learning Mood Journey</h3>
        </div>
        
        <div className="h-40 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={sentimentData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
               <XAxis 
                 dataKey="session" 
                 hide 
               />
               <YAxis 
                 domain={[0, 5]} 
                 ticks={[1, 2, 3, 4]} 
                 tickFormatter={(val) => {
                   if(val===4) return 'Positive';
                   if(val===3) return 'Neutral';
                   if(val===2) return 'Negative';
                   if(val===1) return 'Frustrated';
                   return '';
                 }}
                 width={70}
                 tick={{fontSize: 10, fill: '#6b7280'}}
                 axisLine={false}
                 tickLine={false}
               />
               <Tooltip content={<CustomTooltip />} />
               <Line 
                 type="monotone" 
                 dataKey="score" 
                 stroke="#ec4899" 
                 strokeWidth={3} 
                 dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
                 activeDot={{ r: 6, fill: '#ec4899' }} 
               />
             </LineChart>
           </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Tracking your emotional response during recent study sessions helps identify when you learn best.
        </p>
      </div>

      {/* Detailed Module List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Detailed Module Status</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {modules.map((module) => (
            <div key={module.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg border ${getStatusColor(module.status)}`}>
                  {getStatusIcon(module.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{module.name}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {module.timeSpent} mins
                    </span>
                    {module.status === 'IN_PROGRESS' && module.mastery < 50 && (
                      <span className="flex items-center text-amber-600 font-medium">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Needs Review
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-32 hidden sm:block">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="text-gray-500">Mastery</span>
                   <span className="font-medium text-gray-900">{module.mastery}%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-2">
                   <div 
                      className={`h-2 rounded-full ${module.mastery > 70 ? 'bg-green-500' : module.mastery > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${module.mastery}%` }}
                   ></div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
