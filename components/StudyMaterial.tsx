
import React, { useState, useEffect } from 'react';
import { Search, Download, ExternalLink, Bookmark, BookmarkCheck, FileText, Globe, Loader2, BookOpen, Trash2, ArrowLeft } from 'lucide-react';
import { db } from '../services/mockDatabase';
import { searchStudyResources, ResearchResult } from '../services/geminiService';
import { StudyResource } from '../types';

interface ResourceCardProps {
  resource: StudyResource;
  savedMode?: boolean;
  onSave?: (resource: StudyResource) => void;
  onRemove?: (id: string) => void;
  isSaved?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, savedMode = false, onSave, onRemove, isSaved = false }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group">
    <div>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${resource.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          {resource.type === 'PDF' ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
        </div>
        {savedMode ? (
           <button 
             onClick={() => onRemove && onRemove(resource.id)} 
             className="text-gray-400 hover:text-red-500 transition-colors"
             title="Remove Bookmark"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        ) : (
           <button 
            onClick={() => onSave && !isSaved && onSave(resource)}
            className={`${isSaved ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'} transition-colors`}
            disabled={isSaved}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        )}
      </div>
      <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">{resource.title}</h3>
      <p className="text-xs text-gray-500 mb-3 truncate">{resource.source || 'Unknown Source'}</p>
    </div>
    
    <a 
      href={resource.uri} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-2 w-full flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors"
    >
      <span>{resource.type === 'PDF' ? 'Download PDF' : 'Visit Website'}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

interface StudyMaterialProps {
  onBack?: () => void;
}

export const StudyMaterial: React.FC<StudyMaterialProps> = ({ onBack }) => {
  const student = db.getCurrentStudent();
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [savedResources, setSavedResources] = useState<StudyResource[]>([]);

  // Force refresh saved resources when switching tabs
  useEffect(() => {
    setSavedResources(student.savedResources);
  }, [student.id, activeTab]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setResult(null);
    try {
      const data = await searchStudyResources(query);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = (res: StudyResource) => {
    db.saveResource(student.id, res);
    // Optimistic update
    setSavedResources([...savedResources, res]);
  };

  const handleRemove = (resId: string) => {
    db.removeResource(student.id, resId);
    setSavedResources(savedResources.filter(r => r.id !== resId));
  };

  const isSaved = (uri: string) => {
    return savedResources.some(r => r.uri === uri);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
         <div className="flex items-center space-x-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Research & Resources</h1>
              <p className="text-gray-500 text-sm">Find lecture notes, previous papers, and study materials.</p>
            </div>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'search' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
            >
              Find Materials
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'saved' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
            >
              My Library ({savedResources.length})
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'search' ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Search Input */}
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Search className="h-6 w-6 text-gray-400" />
               </div>
               <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full pl-12 pr-32 py-4 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 placeholder-gray-400 transition-shadow"
                  placeholder="e.g. VTU 5th Sem CS Notes, Pythagoras Theorem PDF, Machine Learning Papers..."
               />
               <button 
                 onClick={handleSearch}
                 disabled={!query.trim() || isSearching}
                 className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors z-10"
               >
                 {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
               </button>
            </div>

            {/* Results */}
            {result && (
              <div className="animate-fade-in space-y-6">
                 {/* Summary Card */}
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="flex items-center text-lg font-bold text-gray-800 mb-3">
                       <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                       AI Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.summary}</p>
                 </div>

                 {/* Resource Grid */}
                 <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                       <Download className="w-5 h-5 mr-2 text-green-600" />
                       Found Materials ({result.resources.length})
                    </h3>
                    {result.resources.length === 0 ? (
                       <p className="text-gray-500 italic">No direct links found. Try a different query.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.resources.map(res => (
                             <ResourceCard 
                               key={res.id} 
                               resource={res} 
                               onSave={handleSave} 
                               isSaved={isSaved(res.uri)} 
                             />
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            )}
            
            {!result && !isSearching && (
               <div className="text-center py-20 opacity-50">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-xl font-medium text-gray-400">Search for any university notes or papers.</p>
               </div>
            )}
          </div>
        ) : (
          /* Saved Resources Tab */
          <div className="max-w-5xl mx-auto">
             {savedResources.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                   <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                   <h3 className="text-xl font-medium text-gray-400">Your library is empty.</h3>
                   <p className="text-gray-400 mt-2">Save resources from the search tab to access them here.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {savedResources.map(res => (
                      <ResourceCard 
                        key={res.id} 
                        resource={res} 
                        savedMode={true} 
                        onRemove={handleRemove} 
                      />
                   ))}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
