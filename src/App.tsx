import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, HelpCircle, ChevronRight, Menu, X, Brain, Compass, Globe, Sparkles, Microscope, Lightbulb, LogOut, Loader2 } from 'lucide-react';
import { categories } from './data';
import { db, auth, signInWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
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
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#D4FF00] selection:text-black relative z-0 overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4FF00] opacity-[0.03] rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#080808]/80 backdrop-blur-xl border-b border-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0 flex items-baseline gap-2">
              <span className="font-bold text-2xl tracking-tighter text-white">KEEVVE?</span>
              <span className="text-[#D4FF00] font-serif italic text-lg">ކީއްވެ؟</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium opacity-60">
              <a href="#" className="hover:opacity-100 hover:text-[#D4FF00] transition-all">Explore</a>
              <a href="#" className="hover:opacity-100 hover:text-[#D4FF00] transition-all">Topics</a>
              <a href="#" className="hover:opacity-100 hover:text-[#D4FF00] transition-all">About</a>
              
              {user ? (
                <div className="flex items-center gap-4 ml-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-800">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Profile" />
                  </div>
                  <button onClick={logout} className="hover:text-red-400 transition-colors" title="Log out">
                    <LogOut className="w-4 h-4" />
                  </button>
                  <button onClick={handleAskClick} className="px-6 py-2.5 bg-[#D4FF00] text-black text-xs font-bold rounded-full hover:bg-white transition-all active:scale-95 uppercase tracking-widest opacity-100">
                    Ask a Question
                  </button>
                </div>
              ) : (
                <button onClick={handleAskClick} className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-full hover:bg-[#D4FF00] transition-all active:scale-95 uppercase tracking-widest opacity-100">
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
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-20 left-0 right-0 bg-[#111] border-b border-gray-900 shadow-xl z-40"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-4 text-xs uppercase tracking-[0.2em] font-medium">
              <a href="#" className="text-gray-400 hover:text-[#D4FF00] p-2">Explore</a>
              <a href="#" className="text-gray-400 hover:text-[#D4FF00] p-2">Topics</a>
              <a href="#" className="text-gray-400 hover:text-[#D4FF00] p-2">About</a>
              <button onClick={handleAskClick} className="w-full mt-2 px-5 py-4 bg-[#D4FF00] text-black rounded-full font-bold tracking-widest hover:bg-white transition-all">
                {user ? 'Ask a Question' : 'Sign In to Ask'}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-24 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#111] text-[#D4FF00] text-[10px] font-bold uppercase tracking-[0.2em] mb-12 border border-gray-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF00]"></span>
            </span>
            Stay Curious
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-7xl sm:text-9xl lg:text-[160px] leading-[0.8] font-black tracking-tighter mb-8"
          >
            WHY? <br className="hidden sm:block" />
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl font-serif italic text-gray-400 max-w-2xl mx-auto leading-tight mb-12"
          >
            "The important thing is not to stop questioning. Curiosity has its own reason for existing."
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative max-w-2xl mx-auto w-full"
          >
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-600" />
            </div>
            <input
              type="text"
              placeholder="What are you curious about?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-40 py-5 text-lg bg-[#111] border-2 border-gray-900 rounded-full text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-[#D4FF00]/10 focus:border-[#D4FF00]/50 transition-all shadow-sm font-light"
            />
            <button className="absolute inset-y-2 right-2 px-8 bg-[#D4FF00] hover:bg-white text-black text-xs uppercase tracking-widest font-bold rounded-full transition-colors flex items-center gap-2">
              Search
            </button>
          </motion.div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-6 mb-12 hide-scrollbar gap-3 max-w-4xl mx-auto justify-start sm:justify-center">
          {categories.map((category) => (
             <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                activeCategory === category
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_20px_rgba(212,255,0,0.2)]'
                  : 'bg-[#111] text-gray-400 hover:text-white border border-gray-900 hover:border-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Questions Grid */}
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-gray-500">
            {searchQuery ? 'Search Results' : 'Explore the Unexplained'}
          </h2>
          <button className="text-[#D4FF00] font-bold text-xs uppercase tracking-widest hover:text-white flex items-center gap-2 group transition-colors">
            View Archive <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <Loader2 className="w-10 h-10 text-[#D4FF00] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question, index) => {
                  const Icon = getIconForCategory(question.category);
                  const rotation = index % 4 === 0 ? (index % 2 === 0 ? 'lg:rotate-1' : 'lg:-rotate-1') 
                    : index % 3 === 0 ? 'lg:-rotate-2' 
                    : index % 2 === 0 ? 'lg:rotate-2' 
                    : 'lg:-rotate-1';
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      key={question.id}
                      className={`group bg-[#111] border border-gray-900 rounded-2xl p-8 hover:border-[#D4FF00]/30 hover:bg-[#1a1a1a] transition-all cursor-pointer flex flex-col h-full transform ${rotation} hover:!rotate-0 hover:z-10`}
                    >
                      <div className="flex items-start justify-between mb-8">
                        <span className="text-[#D4FF00] text-[10px] uppercase tracking-[0.2em] font-bold">
                          {question.category}
                        </span>
                        <div className="text-gray-600 group-hover:text-[#D4FF00] transition-colors">
                          <Icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 group-hover:text-[#D4FF00] transition-colors leading-tight">
                          {question.text}
                        </h3>
                        {question.dhivehiText && (
                          <p className="text-base text-gray-500 font-serif italic leading-relaxed line-clamp-2 mb-6" dir="rtl">
                            {question.dhivehiText}
                          </p>
                        )}
                      </div>
                      
                      <div className="pt-6 border-t border-gray-900 flex items-center justify-between mt-auto group-hover:border-gray-800 transition-colors">
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium tracking-wide">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className={`w-6 h-6 rounded-full border-2 border-[#111] bg-gray-${600 - i*100}`}></div>
                            ))}
                          </div>
                          <span>{question.answers || 0} responses</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-24 text-center border border-dashed border-gray-800 rounded-3xl"
                >
                  <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">The Void is Empty</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-8 font-light">
                    We couldn't find anything matching "{searchQuery}". The question remains unasked.
                  </p>
                  <button onClick={handleAskClick} className="px-8 py-4 bg-[#D4FF00] text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors">
                    Submit this Question
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
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

      {/* Footer */}
      <footer className="border-t border-gray-900 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 text-[10px] uppercase tracking-[0.3em] font-light text-gray-400">
          <div>&copy; {new Date().getFullYear()} Keevve Project</div>
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

