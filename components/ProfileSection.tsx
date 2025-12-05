
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, BookOpen, Award, Globe, Edit2, Save, X, Briefcase, GraduationCap, Mic2, ArrowLeft } from 'lucide-react';
import { db } from '../services/mockDatabase';
import { UserRole, SupportedLanguage, StudentProfile, TeacherProfile, AIVoice } from '../types';

interface ProfileSectionProps {
  role: UserRole;
  userData?: any; // Received from App subscription
  onBack?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ role, userData, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherProfile | null>(null);
  
  // Temporary state for form inputs
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // Sync local state when prop userData updates (due to DB notify)
    if (role === UserRole.STUDENT) {
      const s = userData || db.getCurrentStudent();
      setStudentData(s);
      setFormData({
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        bio: s.bio || '',
        preferredLanguage: s.preferredLanguage,
        preferredVoice: s.preferredVoice || AIVoice.Kore
      });
    } else {
      const t = userData || db.getCurrentTeacher();
      setTeacherData(t);
      setFormData({
        name: t.name,
        email: t.email,
        phone: t.phone || '',
        bio: t.bio || '',
        subject: t.subject
      });
    }
  }, [role, userData]);

  const handleSave = () => {
    if (role === UserRole.STUDENT && studentData) {
      db.updateStudentProfile(studentData.id, formData);
      // Local state update is handled by the subscription in App.tsx passing new userData
    } else if (role === UserRole.TEACHER && teacherData) {
      db.updateTeacherProfile(teacherData.id, formData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current data
    if (role === UserRole.STUDENT && studentData) {
      setFormData({
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone || '',
        bio: studentData.bio || '',
        preferredLanguage: studentData.preferredLanguage,
        preferredVoice: studentData.preferredVoice || AIVoice.Kore
      });
    } else if (teacherData) {
      setFormData({
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone || '',
        bio: teacherData.bio || '',
        subject: teacherData.subject
      });
    }
  };

  if (!studentData && !teacherData) return <div>Loading...</div>;

  const isStudent = role === UserRole.STUDENT;
  const name = isStudent ? studentData!.name : teacherData!.name;
  const email = isStudent ? studentData!.email : teacherData!.email;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
             <div className="flex items-end">
                <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
                  <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white ${isStudent ? 'bg-indigo-500' : 'bg-purple-600'}`}>
                    {name.charAt(0)}
                  </div>
                </div>
                <div className="ml-4 mb-1">
                   <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                   <p className="text-gray-500 flex items-center">
                     {isStudent ? <GraduationCap className="w-4 h-4 mr-1"/> : <Briefcase className="w-4 h-4 mr-1"/>}
                     {isStudent ? 'Student' : 'Faculty Member'}
                   </p>
                </div>
             </div>
             
             {!isEditing ? (
               <button 
                 onClick={() => setIsEditing(true)}
                 className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
               >
                 <Edit2 className="w-4 h-4" />
                 <span>Edit Profile</span>
               </button>
             ) : (
               <div className="flex space-x-2">
                 <button 
                   onClick={handleCancel}
                   className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                 >
                   <X className="w-4 h-4" />
                   <span>Cancel</span>
                 </button>
                 <button 
                   onClick={handleSave}
                   className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                 >
                   <Save className="w-4 h-4" />
                   <span>Save Changes</span>
                 </button>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Personal Info form */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-500" /> 
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    ) : (
                      <p className="font-medium text-gray-800">{name}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    ) : (
                      <p className="font-medium text-gray-800 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    ) : (
                      <p className="font-medium text-gray-800 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {formData.phone || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      {isStudent ? 'Preferred Language' : 'Primary Subject'}
                    </label>
                    {isEditing ? (
                      isStudent ? (
                        <select
                          value={formData.preferredLanguage}
                          onChange={(e) => setFormData({...formData, preferredLanguage: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                           {Object.values(SupportedLanguage).map((lang) => (
                              <option key={lang} value={lang}>{lang}</option>
                           ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      )
                    ) : (
                      <p className="font-medium text-gray-800 flex items-center">
                        {isStudent ? <Globe className="w-4 h-4 mr-2 text-gray-400" /> : <BookOpen className="w-4 h-4 mr-2 text-gray-400" />}
                        {isStudent ? formData.preferredLanguage : formData.subject}
                      </p>
                    )}
                  </div>

                  {/* AI Voice Preference (Student Only) */}
                  {isStudent && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Preferred AI Voice</label>
                      {isEditing ? (
                        <select
                          value={formData.preferredVoice}
                          onChange={(e) => setFormData({...formData, preferredVoice: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                           {Object.values(AIVoice).map((voice) => (
                              <option key={voice} value={voice}>{voice}</option>
                           ))}
                        </select>
                      ) : (
                        <p className="font-medium text-gray-800 flex items-center">
                           <Mic2 className="w-4 h-4 mr-2 text-gray-400" />
                           {formData.preferredVoice || 'Kore (Default)'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Bio / About</label>
                {isEditing ? (
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {formData.bio || "No bio information provided."}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Stats Card */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                  {isStudent ? 'Academic Snapshot' : 'Teaching Stats'}
                </h3>
                
                {isStudent ? (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Avg. Mastery</span>
                        <span className="font-bold text-indigo-600 text-lg">{studentData!.masteryScore}%</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{width: `${studentData!.masteryScore}%`}}></div>
                     </div>
                     <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-center">
                           <Award className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                           <p className="text-xs text-gray-500">Completed</p>
                           <p className="font-bold text-gray-800">{studentData!.topicsCompleted} Topics</p>
                        </div>
                        <div className="text-center">
                           <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-1" />
                           <p className="text-xs text-gray-500">Modules</p>
                           <p className="font-bold text-gray-800">{studentData!.modules.length} Total</p>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Experience</span>
                        <span className="font-bold text-purple-600 text-lg">{teacherData!.yearsOfExperience} Years</span>
                     </div>
                     <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                        <Mail className="w-4 h-4" />
                        <span>{email}</span>
                     </div>
                     <div className="mt-4 p-3 bg-purple-100 rounded-lg text-purple-800 text-xs font-medium text-center">
                        Faculty ID: {teacherData!.id.toUpperCase()}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
