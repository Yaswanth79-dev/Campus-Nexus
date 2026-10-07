'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { useAuthContext } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';

type QuizQuestion = Database['public']['Tables']['learning_quiz_questions']['Row'];
type QuizOption = Database['public']['Tables']['learning_quiz_options']['Row'];

interface QuestionWithOptions extends QuizQuestion {
  options: QuizOption[];
}

export function QuizManager({ moduleId }: { moduleId: string }) {
  const { user: profile } = useAuthContext();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleTitle, setModuleTitle] = useState('');
  
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuizQuestion> | null>(null);
  
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<Partial<QuizOption> | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { data: modData } = await (supabase as any).from('learning_modules').select('title').eq('id', moduleId).single();
      if (modData) setModuleTitle((modData as any).title);

      const { data: qData, error: qError } = await supabase
        .from('learning_quiz_questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('display_order', { ascending: true });

      if (qError) throw qError;

      if (qData && qData.length > 0) {
        const qIds = qData.map((q: any) => q.id);
        const { data: oData, error: oError } = await supabase
          .from('learning_quiz_options')
          .select('*')
          .in('question_id', qIds)
          .order('display_order', { ascending: true });

        if (oError) throw oError;

        const merged = qData.map((q: any) => ({
          ...q,
          options: oData?.filter((o: any) => o.question_id === q.id) || []
        }));
        setQuestions(merged);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      toast({ type: 'error', title: 'Error', message: 'Failed to load quiz content' });
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.question_text) return;
    
    try {
      const supabase = getSupabaseBrowserClient();
      if (editingQuestion.id) {
        await (supabase as any).from('learning_quiz_questions').update({
          question_text: editingQuestion.question_text,
          explanation: editingQuestion.explanation,
          display_order: editingQuestion.display_order || 0
        }).eq('id', editingQuestion.id);
      } else {
        await (supabase as any).from('learning_quiz_questions').insert({
          module_id: moduleId,
          question_text: editingQuestion.question_text,
          explanation: editingQuestion.explanation,
          display_order: editingQuestion.display_order || 0
        });
      }
      setIsQuestionModalOpen(false);
      fetchQuestions();
      toast({ type: 'success', title: 'Success', message: 'Question saved.' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to save question' });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await (supabase as any).from('learning_quiz_questions').delete().eq('id', id);
      fetchQuestions();
      toast({ type: 'success', title: 'Success', message: 'Question deleted.' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete question' });
    }
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption?.option_text || !activeQuestionId) return;

    try {
      const supabase = getSupabaseBrowserClient();
      
      if (editingOption.is_correct) {
        await (supabase as any).from('learning_quiz_options')
          .update({ is_correct: false })
          .eq('question_id', activeQuestionId);
      }

      if (editingOption.id) {
        await (supabase as any).from('learning_quiz_options').update({
          option_text: editingOption.option_text,
          is_correct: editingOption.is_correct || false,
          display_order: editingOption.display_order || 0
        }).eq('id', editingOption.id);
      } else {
        await (supabase as any).from('learning_quiz_options').insert({
          question_id: activeQuestionId,
          option_text: editingOption.option_text,
          is_correct: editingOption.is_correct || false,
          display_order: editingOption.display_order || 0
        });
      }
      setIsOptionModalOpen(false);
      fetchQuestions();
      toast({ type: 'success', title: 'Success', message: 'Option saved.' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to save option' });
    }
  };

  const handleDeleteOption = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      await (supabase as any).from('learning_quiz_options').delete().eq('id', id);
      fetchQuestions();
      toast({ type: 'success', title: 'Success', message: 'Option deleted.' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: 'Failed to delete option' });
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><LoadingSpinner size="lg" /></div>;

  const rolePrefix = profile?.role === 'hod' ? '/hod' : '/faculty';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`${rolePrefix}/learning`}>
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quiz Content: {moduleTitle}</h2>
          <p className="text-sm text-slate-500">Manage questions and options for this module.</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => { setEditingQuestion({ display_order: (questions.length + 1) * 10 }); setIsQuestionModalOpen(true); }} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Question
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-white text-slate-500">
            No questions added yet. Click "Add Question" to begin.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4 pb-4 border-b">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {idx + 1}. {q.question_text}
                  </h3>
                  {q.explanation && (
                    <p className="text-xs text-slate-500 mt-1">💡 {q.explanation}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingQuestion(q); setIsQuestionModalOpen(true); }} className="h-7 px-2 text-xs">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteQuestion(q.id)} className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {q.options.map(opt => (
                  <div key={opt.id} className={`flex items-center justify-between p-2 rounded-lg border text-sm ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      {opt.is_correct && <Check className="w-4 h-4 text-emerald-600" />}
                      <span className={opt.is_correct ? 'font-semibold' : ''}>{opt.option_text}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setActiveQuestionId(q.id); setEditingOption(opt); setIsOptionModalOpen(true); }} className="h-6 w-6 p-0">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(opt.id)} className="h-6 w-6 p-0 text-rose-500">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setActiveQuestionId(q.id); setEditingOption({ display_order: (q.options.length + 1) * 10 }); setIsOptionModalOpen(true); }}
                  className="w-full mt-2 border-dashed h-8 text-xs text-slate-500"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">{editingQuestion?.id ? 'Edit Question' : 'Add Question'}</h3>
          <form onSubmit={handleSaveQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Question Text</label>
              <textarea required value={editingQuestion?.question_text || ''} onChange={e => setEditingQuestion(p => ({...p!, question_text: e.target.value}))} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" rows={3} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Explanation (Optional)</label>
              <textarea value={editingQuestion?.explanation || ''} onChange={e => setEditingQuestion(p => ({...p!, explanation: e.target.value}))} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
              <input type="number" required value={editingQuestion?.display_order || 0} onChange={e => setEditingQuestion(p => ({...p!, display_order: parseInt(e.target.value)}))} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsQuestionModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Question</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isOptionModalOpen} onClose={() => setIsOptionModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">{editingOption?.id ? 'Edit Option' : 'Add Option'}</h3>
          <form onSubmit={handleSaveOption} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option Text</label>
              <input type="text" required value={editingOption?.option_text || ''} onChange={e => setEditingOption(p => ({...p!, option_text: e.target.value}))} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_correct" checked={editingOption?.is_correct || false} onChange={e => setEditingOption(p => ({...p!, is_correct: e.target.checked}))} />
              <label htmlFor="is_correct" className="text-sm font-bold text-slate-700">Mark as Correct Answer</label>
            </div>
            <p className="text-[10px] text-slate-500">(Marking this correct will automatically unmark other options for this question)</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
              <input type="number" required value={editingOption?.display_order || 0} onChange={e => setEditingOption(p => ({...p!, display_order: parseInt(e.target.value)}))} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOptionModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Option</Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
}
