
import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Award, BookOpen, Clock, AlertCircle, Sparkles, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { db } from '../services/mockDatabase';
import { generateQuizQuestions } from '../services/geminiService';
import { QuizQuestion } from '../types';

interface StudentQuizProps {
  onBack?: () => void;
}

export const StudentQuiz: React.FC<StudentQuizProps> = ({ onBack }) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genDifficulty, setGenDifficulty] = useState<'Easy'|'Medium'|'Hard'>('Medium');

  const student = db.getCurrentStudent();
  
  // Fetch questions dynamically from DB instead of local constant
  const activeQuestions = selectedModuleId 
    ? db.getModuleQuestions(selectedModuleId) 
    : [];
  
  const question = activeQuestions[currentQIndex];

  const handleStartQuiz = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setCurrentQIndex(0);
    setScore(0);
    setIsComplete(false);
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleGenerateQuiz = async () => {
    if (!genTopic.trim()) return;
    
    setIsGenerating(true);
    try {
      const tempId = `temp_${Date.now()}`; // Temporary ID for generation
      const questions = await generateQuizQuestions(genTopic, genDifficulty, tempId);
      
      if (questions.length > 0) {
        db.createAIModule(student.id, `${genTopic} (${genDifficulty})`, questions);
        setGenTopic('');
        setShowGenerator(false);
      }
    } catch (e) {
      console.error("Failed to generate quiz", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === question.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback("Correct! Well done.");
    } else {
      setFeedback("Not quite. Consider reviewing this topic with the AI Tutor.");
    }

    setTimeout(() => {
      if (currentQIndex < activeQuestions.length - 1) {
        setCurrentQIndex(c => c + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        setIsComplete(true);
        // Update Specific Module in Mock DB
        if (selectedModuleId) {
          // Calculate score percentage for this quiz run
          const finalScore = score + (isCorrect ? 1 : 0);
          const maxScore = activeQuestions.length;
          const percentage = (finalScore / maxScore) * 100;
          
          // Heuristic for Demo:
          // If score >= 60%, give them a huge boost (+50) to demonstrate unlocking/completion
          // If score < 60%, small boost (+5)
          const change = percentage >= 60 ? 50 : 5;
          db.updateModuleScore(student.id, selectedModuleId, change, 5); // Add 5 mins
        }
      }
    }, 1500);
  };

  if (!selectedModuleId) {
    return (
      <div className="h-full bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
           <div className="flex items-center space-x-3">
              {onBack && (
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Adaptive Assessments</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complete quizzes to unlock new modules.</p>
              </div>
           </div>
           
           <button 
             onClick={() => setShowGenerator(!showGenerator)}
             className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
           >
             <Sparkles className="w-4 h-4" />
             <span>AI Assessment</span>
           </button>
        </div>

        {/* AI Generator Panel */}
        {showGenerator && (
          <div className="mx-8 mt-6 p-6 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl animate-fade-in">
             <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center">
                   <Sparkles className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                   Generate Personalized Assessment
                </h3>
                <button onClick={() => setShowGenerator(false)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                   <XCircle className="w-5 h-5" />
                </button>
             </div>
             <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Topic / Concept</label>
                   <input 
                     type="text"
                     value={genTopic}
                     onChange={(e) => setGenTopic(e.target.value)}
                     placeholder="e.g. Thermodynamics..."
                     className="w-full p-3 border border-indigo-200 dark:border-indigo-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200"
                   />
                </div>
                <div className="w-full md:w-40">
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Difficulty</label>
                   <select 
                     value={genDifficulty} 
                     onChange={(e) => setGenDifficulty(e.target.value as any)}
                     className="w-full p-3 border border-indigo-200 dark:border-indigo-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-200"
                   >
                     <option value="Easy">Beginner</option>
                     <option value="Medium">Intermediate</option>
                     <option value="Hard">Advanced</option>
                   </select>
                </div>
                <button 
                  onClick={handleGenerateQuiz}
                  disabled={!genTopic.trim() || isGenerating}
                  className="p-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors w-full md:w-32 flex justify-center"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
                </button>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => mod.status !== 'LOCKED' && handleStartQuiz(mod.id)}
                disabled={mod.status === 'LOCKED'}
                className={`p-6 rounded-xl border text-left transition-all ${
                  mod.status === 'LOCKED' 
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${mod.status === 'LOCKED' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  {mod.status === 'LOCKED' && <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">Locked</span>}
                  {mod.status === 'COMPLETED' && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">Completed</span>}
                  {mod.status === 'IN_PROGRESS' && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded">In Progress</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{mod.name}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {mod.timeSpent}m</span>
                  <span>Mastery: {mod.mastery}%</span>
                </div>
              </button>
            ))}
            
            {/* Add Card */}
            <button 
               onClick={() => setShowGenerator(true)}
               className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all min-h-[160px]"
            >
               <Plus className="w-8 h-8 mb-2" />
               <span className="font-medium">Request New Assessment</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center transition-colors">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You scored {score} out of {activeQuestions.length}</p>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-8">
           Your mastery for <strong>{student.modules.find(m => m.id === selectedModuleId)?.name}</strong> has been updated.
           {score / activeQuestions.length > 0.5 && " Great job!"}
        </p>
        <button 
          onClick={() => setSelectedModuleId(null)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return to Topics
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center transition-colors">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Questions Available</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">We couldn't find any practice questions for this topic yet.</p>
        <button 
          onClick={() => setSelectedModuleId(null)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return to Topics
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col overflow-hidden transition-colors">
      {/* Header - Fixed Height */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 shrink-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSelectedModuleId(null)}
            className="p-2 -ml-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Adaptive Assessment</h3>
        </div>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 truncate max-w-[150px]">
          {question.topic}
        </span>
      </div>

      {/* Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="flex flex-col justify-center min-h-full max-w-2xl mx-auto w-full">
          <div className="mb-2 text-sm text-gray-400">Question {currentQIndex + 1} of {activeQuestions.length}</div>
          <h2 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-8">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => !feedback && setSelectedOption(idx)}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  selectedOption === idx
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                } ${feedback && idx === question.correctAnswer ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' : ''}
                  ${feedback && selectedOption === idx && idx !== question.correctAnswer ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {feedback && idx === question.correctAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {feedback && selectedOption === idx && idx !== question.correctAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </button>
            ))}
          </div>

          {feedback && (
            <div className="mt-4 text-center font-medium text-gray-700 dark:text-gray-300 animate-fade-in">
              {feedback}
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed Height (Always Visible) */}
      <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null || feedback !== null}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <span>{feedback ? 'Processing...' : 'Submit Answer'}</span>
          {!feedback && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
