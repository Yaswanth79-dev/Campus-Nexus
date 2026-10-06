'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Bell,
  CheckCheck,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Trophy,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';

type Notification = Tables<'user_notifications'>;

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      await (supabase.from('user_notifications') as any).update({ is_read: true }).eq('id', id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await (supabase
        .from('user_notifications') as any)
        .update({ is_read: true })
        .eq('user_id', user.id);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        type: 'success',
        title: 'All Caught Up',
        message: 'All notifications marked as read.',
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'learning': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'opportunity': return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'feedback': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'mentoring': return <GraduationCap className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const filtered = notifications.filter((n) => (filter === 'Unread' ? !n.is_read : true));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Department Alerts"
        description="Stay updated with review milestones, opportunity alerts, credit rewards, and faculty announcements."
        breadcrumbs={[
          { label: 'Student Portal', href: '/student/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 mr-1.5" /> Mark All as Read
            </Button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('Unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filter === 'Unread'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            )}
            <span>({unreadCount})</span>
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading notifications..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-slate-400" />}
          title="No Notifications"
          description={filter === 'Unread' ? "You're all caught up! No unread notifications." : "No notifications received yet."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`p-4 transition-all flex items-start justify-between gap-4 ${
                !item.is_read
                  ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.title}</h4>
                    {!item.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  <span className="text-[11px] text-slate-400 block pt-0.5">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
