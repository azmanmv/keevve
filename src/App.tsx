import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, HelpCircle, ChevronRight, Menu, X, Brain, Compass, Globe, Sparkles, Microscope, Lightbulb, LogOut, Loader2, BookOpen, MessageCircle } from 'lucide-react';
import { categories } from './data';
import { db, auth, signInWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const categoryIcons: Record<string, any> = {
  'Psychology': Brain,
  'Earth Science': Globe,
  'Philosophy': Compass,
  'Astronomy': Sparkles,
  'Biology': Microscope,
  'Physics': Lightbulb,
  'Science': Microscope,
  'Nature': Globe,
  'Everyday Life': Compass,
  'Islamic Studies': BookOpen,
  'All': HelpCircle
};

function getIconForCategory(category: string) {
  return categoryIcons[category] || HelpCircle;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Firebase State
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ text: '', dhivehiText: '', category: 'Philosophy' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Answers State
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);

  const handleQuestionClick = async (question: any) => {
    setSelectedQuestion(question);
    setAnswersLoading(true);
    setAnswers([]);
    
    try {
      // Removed orderBy to avoid requiring a composite index in Firestore
      const q = query(collection(db, 'answers'), where('questionId', '==', question.id));
      const snapshot = await getDocs(q);
      const aList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setAnswers(aList);
    } catch (e) {
      console.error(e);
    } finally {
      setAnswersLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribeQuestions = onSnapshot(q, (snapshot) => {
      const qList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuestions(qList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeQuestions();
    };
  }, []);

  const handleAskClick = () => {
    if (!user) {
      signInWithGoogle();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestion.text || !newQuestion.category) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'questions'), {
        text: newQuestion.text,
        dhivehiText: newQuestion.dhivehiText || '',
        category: newQuestion.category,
        answers: 0,
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewQuestion({ text: '', dhivehiText: '', category: 'Philosophy' });
    } catch (error) {
      console.error("Failed to submit question", error);
      alert("Error submitting question. Make sure you are verified.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.text?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.dhivehiText && q.dhivehiText.includes(searchQuery));
    const matchesCategory = activeCategory === 'All' || q.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#D4FF00] selection:text-black relative z-0 overflow-x-hidden flex flex-col">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4FF00] opacity-[0.03] rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-shrink-0 flex items-baseline gap-2">
            <span className="font-bold text-2xl tracking-tighter text-white">KEEVVE?</span>
            <span className="text-[#D4FF00] font-serif italic text-lg">ކީއްވެ؟</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">
            <a href="#" className="hover:text-white transition-colors">Curiosity</a>
            <a href="#" className="hover:text-white transition-colors">Archive</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
            {user ? (
              <div className="flex items-center gap-4 ml-4">
                <button onClick={() => setIsModalOpen(true)} className="hover:text-[#D4FF00] transition-colors uppercase mr-4">
                  Submit a Question
                </button>
                <div className="flex items-center gap-3 bg-[#111] border border-gray-900 py-1.5 pl-1.5 pr-4 rounded-full">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button onClick={logout} className="hover:text-red-400 transition-colors ml-2" title="Log out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={handleAskClick} className="ml-4 px-5 py-2.5 bg-[#111] text-gray-300 border border-gray-900 hover:border-[#D4FF00] hover:text-[#D4FF00] transition-all rounded-full font-bold uppercase tracking-widest">
                Sign In to Ask
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-24 left-0 right-0 bg-[#111] border-b border-gray-900 shadow-xl z-40"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-4 text-xs uppercase tracking-[0.2em] font-medium">
              {user && (
                <div className="flex items-center gap-3 p-2 mb-2 border-b border-gray-900 pb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">{user.email?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold tracking-widest">{user.displayName || user.email?.split('@')[0]}</span>
                    <span className="text-gray-500 text-[10px] lowercase tracking-normal">{user.email}</span>
                  </div>
                </div>
              )}
              <a href="#" className="text-gray-400 hover:text-[#D4FF00] p-2">Curiosity</a>
              <a href="#" className="text-gray-400 hover:text-[#D4FF00] p-2">Archive</a>
              <a href="#" className="text-gray-400 hover:text-[#D4FF00] p-2">About</a>
              <button onClick={handleAskClick} className="w-full mt-2 px-5 py-4 bg-[#D4FF00] text-black rounded-full font-bold tracking-widest hover:bg-white transition-all">
                {user ? 'Submit a Question' : 'Sign In to Ask'}
              </button>
              {user && (
                <button onClick={logout} className="w-full mt-2 px-5 py-4 bg-gray-900 text-white border border-gray-800 rounded-full font-bold tracking-widest hover:bg-gray-800 transition-all">
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col lg:flex-row relative z-10 pt-32 lg:pt-40 px-4 sm:px-8 max-w-[1600px] mx-auto w-full items-center justify-center min-h-[calc(100vh-100px)]">
        {/* Left Column */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center lg:pr-8 mb-20 lg:mb-0">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-7xl sm:text-9xl lg:text-[180px] leading-[0.8] font-black tracking-tighter mb-8 text-white text-left"
          >
            WHY?
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl lg:text-2xl font-serif italic text-gray-400 max-w-sm leading-tight mb-16 text-left"
          >
            "The important thing is not to stop questioning. Curiosity has its own reason for existing."
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-8"
          >
            <button 
              onClick={handleAskClick} 
              className="bg-[#D4FF00] text-black px-8 sm:px-12 py-4 sm:py-5 rounded-full font-black tracking-[0.2em] text-xs sm:text-sm hover:scale-105 transition-transform uppercase text-left leading-tight"
            >
              Ask<br/>Anything
            </button>
            <div className="h-[1px] w-12 sm:w-24 bg-gray-800"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold max-w-[120px] text-left">
              Explore the unexplained
            </span>
          </motion.div>
        </div>

        {/* Right Column Grid */}
        <div className="w-full lg:w-1/2 flex items-center h-full pt-10 lg:pt-0">
          {loading ? (
            <div className="w-full py-24 flex justify-center items-center">
              <Loader2 className="w-10 h-10 text-[#D4FF00] animate-spin" />
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Column 1 (Even indexed questions) */}
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {questions.filter((_, i) => i % 2 === 0).slice(0, 2).map((question, index) => {
                    const rotation = index === 0 ? 'lg:rotate-2' : 'lg:-rotate-1';
                    
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        key={question.id}
                        onClick={() => handleQuestionClick(question)}
                        className={`group bg-[#111] border border-gray-900 rounded-3xl p-10 hover:border-[#D4FF00]/30 hover:bg-[#1a1a1a] transition-all cursor-pointer flex flex-col transform ${rotation} hover:!rotate-0 hover:z-10 shadow-2xl relative z-10`}
                      >
                        <span className="text-[#D4FF00] text-[10px] uppercase tracking-widest font-bold block mb-4">
                          {question.category}
                        </span>
                        
                        <h3 className="text-xl lg:text-2xl font-bold text-white leading-tight mb-4 group-hover:text-[#D4FF00] transition-colors">
                          {question.text}
                        </h3>
                        
                        {question.dhivehiText ? (
                          <p className="text-sm text-gray-500 font-serif italic leading-relaxed line-clamp-2" dir="rtl">
                            {question.dhivehiText}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-2">
                            Asking why is the first step to knowing how.
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Column 2 (Odd indexed questions) */}
              <div className="space-y-6 sm:pt-24">
                <AnimatePresence mode="popLayout">
                  {questions.filter((_, i) => i % 2 !== 0).slice(0, 2).map((question, index) => {
                    const isHighlighted = index === 0;
                    const rotation = isHighlighted ? 'lg:-rotate-3' : 'lg:rotate-3';
                    
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: (index + 0.5) * 0.1 }}
                        key={question.id}
                        onClick={() => handleQuestionClick(question)}
                        className={`group ${isHighlighted ? 'bg-[#D4FF00] text-black' : 'bg-[#111] text-white border border-gray-900 hover:border-[#D4FF00]/30 hover:bg-[#1a1a1a]'} rounded-3xl p-10 transition-all cursor-pointer flex flex-col transform ${rotation} hover:!rotate-0 shadow-2xl relative z-20`}
                      >
                        <span className={`${isHighlighted ? 'text-black opacity-60' : 'text-[#D4FF00]'} text-[10px] uppercase tracking-widest font-bold block mb-4 transition-colors`}>
                          {question.category}
                        </span>
                        
                        <h3 className={`text-xl lg:text-2xl font-bold ${isHighlighted ? 'text-black' : 'text-white'} leading-tight mb-4 ${!isHighlighted && 'group-hover:text-[#D4FF00]'} transition-colors`}>
                          {question.text}
                        </h3>
                        
                        {question.dhivehiText ? (
                          <p className={`text-sm ${isHighlighted ? 'text-black opacity-80' : 'text-gray-500'} font-serif italic leading-relaxed line-clamp-2`} dir="rtl">
                            {question.dhivehiText}
                          </p>
                        ) : (
                          <p className={`text-sm ${isHighlighted ? 'text-black opacity-80' : 'text-gray-500'} font-light leading-relaxed line-clamp-2`}>
                            Asking why is the first step to knowing how.
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Ask Question Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-gray-800 rounded-3xl p-8 lg:p-10 shadow-2xl z-10"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold mb-2">Ask the Void</h2>
              <p className="text-gray-500 text-sm mb-8">Share your curiosity with the world.</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Category</label>
                  <select 
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4FF00]"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Question (English) *</label>
                  <textarea 
                    required
                    maxLength={500}
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-800 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4FF00] min-h-[100px] resize-none"
                    placeholder="Why is the sky blue?"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold flex justify-between">
                    <span>Question (Dhivehi)</span>
                    <span className="text-gray-600 font-normal">Optional</span>
                  </label>
                  <textarea 
                    maxLength={500}
                    dir="rtl"
                    value={newQuestion.dhivehiText}
                    onChange={(e) => setNewQuestion({...newQuestion, dhivehiText: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-800 text-white text-base font-serif rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4FF00] min-h-[100px] resize-none"
                    placeholder="އުޑު ނޫކުލައިގަ ހުންނަނީ ކީއްވެ؟"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newQuestion.text}
                  className="w-full py-4 bg-[#D4FF00] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Question'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Answer View Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedQuestion(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#111] border border-gray-800 rounded-3xl shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 lg:p-10 border-b border-gray-900 flex-shrink-0 relative">
                <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#D4FF00] text-[10px] uppercase tracking-[0.2em] font-bold">
                    {selectedQuestion.category}
                  </span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">{selectedQuestion.text}</h2>
                {selectedQuestion.dhivehiText && (
                  <p className="text-xl text-gray-400 font-serif italic leading-relaxed" dir="rtl">
                    {selectedQuestion.dhivehiText}
                  </p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 lg:p-10 hide-scrollbar">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mb-8 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Responses ({answers.length})
                </h3>
                
                {answersLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
                  </div>
                ) : answers.length > 0 ? (
                  <div className="space-y-6">
                    {answers.map(answer => (
                      <div key={answer.id} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
                            {answer.authorName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{answer.authorName}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {answer.createdAt?.toDate ? new Date(answer.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                          {answer.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl">
                    <p className="text-gray-500 font-light mb-4">No responses yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full relative z-10 mt-auto border-t border-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">
          <div>&copy; 2024 Keevve Project</div>
          <div className="text-center">Powered by Curiosity / ކީއްވެ</div>
          <div className="flex items-center gap-4">
            <span>London &bull; Male' &bull; Tokyo</span>
          </div>
        </div>
      </footer>

      {/* Global styles for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

