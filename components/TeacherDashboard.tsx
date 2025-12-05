
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, BookOpen, BrainCircuit, Users, Search, MessageSquare, X, Send } from 'lucide-react';
import { db } from '../services/mockDatabase';
import { AIDecisionLog, InterventionFlag, StudentProfile } from '../types';

export const TeacherDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AIDecisionLog[]>([]);
  const [flags, setFlags] = useState<InterventionFlag[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'students'>('analytics');
  
  // Student Directory State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isMessageSent, setIsMessageSent] = useState(false);

  useEffect(() => {
    // Simulate real-time polling
    const interval = setInterval(() => {
      setLogs(db.getLogs());
      setFlags(db.getInterventions());
      setStudents(db.getStudents());
    }, 2000);
    setLogs(db.getLogs());
    setFlags(db.getInterventions());
    setStudents(db.getStudents());
    return () => clearInterval(interval);
  }, []);

  const chartData = students.map(s => ({
    name: s.name.split(' ')[0],
    score: s.masteryScore,
    completed: s.topicsCompleted
  }));

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (selectedStudent && messageInput.trim()) {
      db.sendTeacherMessage(selectedStudent.id, messageInput);
      setMessageInput('');
      setIsMessageSent(true);
      setTimeout(() => setIsMessageSent(false), 3000);
    }
  };

  const StudentProfileModal = () => {
    if (!selectedStudent) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
              <p className="text-sm text-gray-500">Student ID: {selectedStudent.id}</p>
            </div>
            <button 
              onClick={() => setSelectedStudent(null)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-indigo-50 rounded-xl">
                 <p className="text-xs text-indigo-600 font-bold uppercase">Avg Mastery</p>
                 <p className="text-2xl font-bold text-indigo-900">{selectedStudent.masteryScore}%</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                 <p className="text-xs text-green-600 font-bold uppercase">Completed</p>
                 <p className="text-2xl font-bold text-green-900">{selectedStudent.topicsCompleted}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                 <p className="text-xs text-orange-600 font-bold uppercase">Risk Status</p>
                 <p className={`text-lg font-bold ${selectedStudent.atRisk ? 'text-red-600' : 'text-orange-900'}`}>
                   {selectedStudent.atRisk ? 'At Risk' : 'Normal'}
                 </p>
              </div>
            </div>

            {/* Cross-Subject Performance */}
            <h3 className="text-lg font-bold text-gray-800 mb-4">Cross-Subject Performance</h3>
            <div className="space-y-4 mb-8">
               {selectedStudent.modules.map(mod => (
                 <div key={mod.id} className="flex items-center">
                   <div className="w-40 text-sm font-medium text-gray-700">{mod.name}</div>
                   <div className="flex-1">
                     <div className="w-full bg-gray-100 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                             mod.mastery > 75 ? 'bg-green-500' : 
                             mod.mastery > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{width: `${mod.mastery}%`}}
                        ></div>
                     </div>
                   </div>
                   <div className="w-12 text-right text-sm font-bold text-gray-900">{mod.mastery}%</div>
                 </div>
               ))}
            </div>

            {/* Messaging */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {selectedStudent.name.split(' ')[0]}
              </h3>
              <textarea 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Write a message regarding their progress..."
                className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                 {isMessageSent && <span className="text-green-600 text-xs font-bold animate-pulse">Message Sent!</span>}
                 <button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center ml-auto"
                 >
                   Send <Send className="w-3 h-3 ml-2" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <header className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classroom Analytics</h1>
          <p className="text-gray-500">Real-time overview of student mastery and AI interventions.</p>
        </div>
        
        {/* Tab Toggle */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
           <button 
             onClick={() => setActiveTab('analytics')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
           >
             Overview
           </button>
           <button 
             onClick={() => setActiveTab('students')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'students' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
           >
             Student Directory
           </button>
        </div>
      </header>

      {activeTab === 'analytics' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 text-indigo-600 mb-2">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Total Students</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 text-red-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold text-gray-700">At Risk</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{flags.length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 text-green-600 mb-2">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-semibold text-gray-700">Avg Mastery</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.masteryScore, 0) / students.length) : 0}%
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 text-purple-600 mb-2">
                <BrainCircuit className="w-5 h-5" />
                <h3 className="font-semibold text-gray-700">AI Interactions</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6">Mastery by Student</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Intervention Flags */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[400px]">
              <h3 className="font-bold text-gray-800 mb-4">Critical Interventions</h3>
              <div className="space-y-3">
                {flags.length === 0 ? (
                  <p className="text-gray-400 text-sm">No critical flags detected.</p>
                ) : (
                  flags.map(flag => (
                    <div key={flag.id} className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" 
                         onClick={() => {
                           const s = students.find(st => st.id === flag.studentId);
                           if(s) {
                             setSelectedStudent(s);
                             setActiveTab('students'); // Switch to student tab if clicking flag? Or just open modal
                           }
                         }}>
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-red-900">{flag.studentName}</h4>
                        <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded">
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">{flag.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* XAI Logs */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
              <BrainCircuit className="w-5 h-5 text-purple-600 mr-2" />
              Explainable AI (XAI) Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">User Input</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-1/3">AI Pedagogical Reasoning</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {db.getStudent(log.studentId)?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-gray-600 truncate max-w-xs">{log.studentInput}</td>
                      <td className="p-4 text-sm text-purple-700 bg-purple-50 rounded-lg my-2 block font-mono text-xs leading-relaxed">
                        {log.reasoning}
                      </td>
                      <td className="p-4 text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* STUDENT DIRECTORY TAB */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-gray-100 flex items-center space-x-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                 <input 
                   type="text" 
                   placeholder="Search students by name..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
              </div>
           </div>
           
           <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filteredStudents.map(student => (
                   <div 
                     key={student.id} 
                     onClick={() => setSelectedStudent(student)}
                     className="p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                   >
                     <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           {student.name.charAt(0)}
                        </div>
                        {student.atRisk && <AlertTriangle className="w-5 h-5 text-red-500" />}
                     </div>
                     <h3 className="font-bold text-gray-800">{student.name}</h3>
                     <p className="text-xs text-gray-500 mb-3">ID: {student.id}</p>
                     
                     <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                           <span className="text-gray-500">Avg Mastery</span>
                           <span className="font-medium text-gray-900">{student.masteryScore}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                           <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${student.masteryScore}%`}}></div>
                        </div>
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {selectedStudent && <StudentProfileModal />}
    </div>
  );
};
