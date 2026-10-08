'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Code,
  CheckCircle2,
  ExternalLink,
  Flame,
  Award,
  Clock,
  Play,
  Trophy,
  History,
  TrendingUp,
  Brain,
  Check,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

type LearningModule = Tables<'learning_modules'>;
type Activity = Tables<'student_learning_activities'>;

interface QuizOption {
  id: string;
  option_text: string;
  display_order: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  display_order: number;
  options: QuizOption[];
}

interface QuizFeedback {
  question_id: string;
  is_correct: boolean;
  correct_option_id: string;
  explanation: string | null;
}

// Obsolete QUESTIONS_BY_TOPIC removed

export default function StudentLearningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');

  // Assessment & Task Modal State
  const [activeModalModule, setActiveModalModule] = useState<LearningModule | null>(null);
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [assessmentResult, setAssessmentResult] = useState<{
    score: number;
    passed: boolean;
    total: number;
    correct: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [feedback, setFeedback] = useState<QuizFeedback[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Fetch catalog
      const { data: moduleData } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      setModules(moduleData || []);

      // 2. Fetch user's completed activities
      const { data: actData } = await supabase
        .from('student_learning_activities')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      setActivities(actData || []);
    } catch (err: any) {
      console.error('Error fetching learning data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Task / Assessment Modal
  const handleOpenAssessment = async (mod: LearningModule) => {
    setActiveModalModule(mod);
    setHasOpenedLink(false);
    setUserAnswers({});
    setAssessmentResult(null);
    setFeedback([]);
    
    setIsFetchingQuestions(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await (supabase.rpc as any)('get_quiz', { p_module_id: mod.id });
      if (error) throw error;
      setActiveQuestions((data as QuizQuestion[]) || []);
    } catch (err: any) {
      console.error('Failed to fetch quiz', err);
      toast({ type: 'error', title: 'Error', message: 'Failed to load assessment' });
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const handleCloseModal = () => {
    setActiveModalModule(null);
    setHasOpenedLink(false);
    setUserAnswers({});
    setAssessmentResult(null);
    setActiveQuestions([]);
    setFeedback([]);
  };

  // Submit Assessment & Verify Task
  const handleSubmitAssessment = async () => {
    if (!user || !activeModalModule || activeQuestions.length === 0) return;

    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount < activeQuestions.length) {
      toast({
        type: 'warning',
        title: 'Incomplete Assessment',
        message: `Please answer all ${activeQuestions.length} questions before submitting.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await (supabase.rpc as any)('evaluate_quiz', { 
        p_module_id: activeModalModule.id, 
        p_answers: userAnswers 
      });

      if (error) throw error;

      setAssessmentResult({
        score: data.score,
        passed: data.passed,
        total: data.total,
        correct: data.correct,
      });
      setFeedback(data.feedback || []);

      if (data.passed) {
        toast({
          type: 'success',
          title: `+${activeModalModule.credits_reward} Learning Credits Awarded! 🏆`,
          message: `Passed "${activeModalModule.title}" with a score of ${data.score}%.`,
        });
        await fetchData();
      } else {
        toast({
          type: 'warning',
          title: 'Assessment Failed',
          message: `You scored ${data.score}%. You need 70% to pass.`,
        });
      }
    } catch (err: any) {
      console.error('Error recording learning activity:', err);
      toast({
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Failed to evaluate quiz.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics Calculations
  const totalCredits = activities.reduce((acc, a) => acc + (a.credits_earned || 0), 0);
  const completedCount = activities.filter((a) => a.status === 'Completed').length;
  const averageScore = activities.length > 0
    ? Math.round(activities.reduce((acc, a) => acc + (a.score || 0), 0) / activities.length)
    : 0;

  // Topics for Filter
  const allTopics = ['All', ...Array.from(new Set(modules.map((m) => m.topic)))];

  const filteredModules = modules.filter((m) => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesTopic = selectedTopic === 'All' || m.topic === selectedTopic;
    return matchesCat && matchesTopic;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="pt-4 pb-8 mb-4 border-b border-slate-200/60">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Learning Hub
        </h1>
        <p className="text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Open practice links, complete modules, and verify your technical skills to earn Learning Credits.
        </p>
      </div>

      {/* Hero Credits & Stats Banner */}
      <div className="rounded-[24px] bg-slate-900 p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Trophy className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
          
          {/* Main Credits Total */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
              Total Verified Credits
            </span>
            <div className="text-5xl font-black tracking-tighter text-white flex items-baseline gap-2">
              <span>{totalCredits}</span>
              <span className="text-base font-semibold text-indigo-400">pts</span>
            </div>
          </div>

          {/* Activities Completed */}
          <div className="space-y-2 lg:border-l lg:border-white/10 lg:pl-8">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
              Completed Tasks
            </span>
            <div className="text-3xl font-extrabold text-white">{completedCount} <span className="text-sm font-medium text-slate-500">/ {modules.length}</span></div>
          </div>

          {/* Average Assessment Score */}
          <div className="space-y-2 lg:border-l lg:border-white/10 lg:pl-8">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
              Average Score
            </span>
            <div className="text-3xl font-extrabold text-emerald-400">{averageScore}%</div>
          </div>

          {/* Department Benchmark */}
          <div className="space-y-2 lg:border-l lg:border-white/10 lg:pl-8">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
              Tier Standing
            </span>
            <div className="text-xl font-bold text-white">
              {totalCredits >= 150 ? 'Tier 1 Expert' : totalCredits >= 50 ? 'Tier 2 Inter.' : 'Tier 3 Emerging'}
            </div>
            <div className="text-[11px] text-indigo-300 font-semibold mt-1">
              {totalCredits >= 150 ? 'High Honors' : `${150 - totalCredits} pts to Tier 1`}
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Catalog vs Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Modules Catalog */}
        <div className="lg:col-span-2 space-y-6">

          {/* Filter Bar */}
          <div className="p-4 sm:p-6 rounded-[24px] bg-white border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {['All', 'Practice', 'Test', 'Quiz', 'Course'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Topic Select */}
              <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 shrink-0">Topic</span>
                <select
                  className="w-full sm:w-[200px] rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  {allTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Module List */}
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" message="Loading learning modules..." />
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-base font-bold text-slate-900">No matching modules found</p>
              <p className="text-sm text-slate-500 mt-1">Try selecting a different category or topic.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((mod) => {
                const isCompleted = activities.some(
                  (a) => (a.module_id === mod.id || a.module_title === mod.title) && a.status === 'Completed'
                );

                return (
                  <div
                    key={mod.id}
                    className={`rounded-[24px] border transition-all ${
                      isCompleted ? 'bg-emerald-50/30 border-emerald-100/60' : 'bg-white border-slate-200/60 hover:border-slate-300/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default" size="sm">
                            {mod.category}
                          </Badge>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {mod.topic}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {mod.estimated_time || '30 mins'}
                          </span>
                          {isCompleted && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{mod.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{mod.description}</p>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex items-center gap-1.5 text-indigo-600 font-black text-lg">
                          <span>+{mod.credits_reward}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Pts</span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {mod.external_url && (
                            <a
                              href={mod.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl border border-slate-200/60 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                            >
                              Open Link
                            </a>
                          )}
                          <Button
                            variant={isCompleted ? 'secondary' : 'primary'}
                            size="md"
                            onClick={() => handleOpenAssessment(mod)}
                          >
                            {isCompleted ? 'Re-Assess' : 'Start Assessment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Column: Activity History */}
        <div className="space-y-6">

          {/* Credits Rewards Structure */}
          <section className="bg-slate-50 rounded-[24px] border border-slate-200/60 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Credit Structure</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                <span className="text-sm font-semibold text-slate-700">Beginner Test</span>
                <span className="text-sm font-bold text-indigo-600">+10 Pts</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                <span className="text-sm font-semibold text-slate-700">Intermediate Test</span>
                <span className="text-sm font-bold text-indigo-600">+20 Pts</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                <span className="text-sm font-semibold text-slate-700">Advanced Test</span>
                <span className="text-sm font-bold text-indigo-600">+30 Pts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Online Course</span>
                <span className="text-sm font-bold text-indigo-600">+50 Pts</span>
              </div>
            </div>
          </section>

          {/* Recent Activity Log */}
          <section className="bg-white rounded-[24px] border border-slate-200/60 p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Activity Log</h3>
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-[16px]">
                No verified activities yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="font-bold text-sm text-slate-900">{act.module_title}</span>
                      <span className="text-indigo-600 font-extrabold text-sm shrink-0">
                        +{act.credits_earned} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Score: {act.score}%</span>
                      <span className="text-[11px] font-semibold text-slate-400">{new Date(act.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Interactive Assessment & Task Verification Modal */}
      {activeModalModule && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Task Assessment: ${activeModalModule.title}`}
          description={`${activeModalModule.topic} • ${activeModalModule.category} • +${activeModalModule.credits_reward} Credits`}
          size="xl"
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* Step 1: Open Task Link */}
            {activeModalModule.external_url && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900">Step 1: Open & Complete Given Task</span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium">
                    Estimated Time: {activeModalModule.estimated_time || '30 mins'}
                  </span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Open the official learning / practice platform below, work through the assigned module or problem set, and then complete the verification check.
                </p>
                <div className="pt-1">
                  <a
                    href={activeModalModule.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setHasOpenedLink(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Task Platform in New Tab
                  </a>
                  {hasOpenedLink && (
                    <span className="ml-3 text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Link Opened
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Technical Questions Assessment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600" /> Step 2: Knowledge Verification Assessment
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Passing Score: <strong>70%</strong>
                </span>
              </div>

              {isFetchingQuestions ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner size="md" message="Loading questions..." />
                </div>
              ) : activeQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No questions available for this module.
                </div>
              ) : (
                activeQuestions.map((q, qIndex) => {
                  const selectedOptionId = userAnswers[q.id];
                  const qFeedback = feedback.find(f => f.question_id === q.id);
                  const showExplanation = assessmentResult != null && qFeedback != null;
                  const isCorrect = qFeedback?.is_correct;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border transition-all ${
                        showExplanation
                          ? isCorrect
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mb-3">
                        {qIndex + 1}. {q.question_text}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isChecked = selectedOptionId === opt.id;
                          const isThisCorrect = qFeedback?.correct_option_id === opt.id;

                          return (
                            <label
                              key={opt.id}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-950'
                                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                checked={isChecked}
                                disabled={assessmentResult != null && assessmentResult.passed}
                                onChange={() =>
                                  setUserAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: opt.id,
                                  }))
                                }
                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="flex-1">{opt.option_text}</span>
                              {showExplanation && isThisCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                                  Correct Answer
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {showExplanation && qFeedback.explanation && (
                        <p
                          className={`text-[11px] mt-2.5 pt-2 border-t font-medium ${
                            isCorrect ? 'border-emerald-200 text-emerald-800' : 'border-rose-200 text-rose-800'
                          }`}
                        >
                          💡 <strong>Explanation:</strong> {qFeedback.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Assessment Result Summary */}
            {assessmentResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  assessmentResult.passed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {assessmentResult.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm">
                    {assessmentResult.passed
                      ? `🎉 Assessment Passed! Score: ${assessmentResult.score}% (${assessmentResult.correct}/${assessmentResult.total} Correct)`
                      : `Needs Review. Score: ${assessmentResult.score}% (${assessmentResult.correct}/${assessmentResult.total} Correct)`}
                  </div>
                  <p>
                    {assessmentResult.passed
                      ? `Congratulations! +${activeModalModule.credits_reward} Learning Credits have been recorded to your profile.`
                      : 'Passing threshold is 70%. Please review the task link materials and click "Re-Attempt" to try again.'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
                {assessmentResult?.passed ? 'Done & Close' : 'Cancel'}
              </Button>

              {assessmentResult && !assessmentResult.passed ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setUserAnswers({});
                    setAssessmentResult(null);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-Attempt Assessment
                </Button>
              ) : !assessmentResult?.passed ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={handleSubmitAssessment}
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Submit Assessment & Claim Credits
                </Button>
              ) : null}
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
