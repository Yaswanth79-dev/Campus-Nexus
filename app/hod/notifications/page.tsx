'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  Check,
} from 'lucide-react';

type Notification = Tables<'user_notifications'>;

export default function HodNotificationsPage() {
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
      console.error('Error fetching HOD notifications:', err);
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

  const filtered = notifications.filter((n) => (filter === 'Unread' ? !n.is_read : true));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HOD Executive Notification Board"
        description="Department escalation alerts, accreditation milestones, and grievance alerts."
        breadcrumbs={[
          { label: 'HOD Portal', href: '/hod/dashboard' },
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
          {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-amber-400" />}
          <span>({unreadCount})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading notifications..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-slate-400" />}
          title="No Notifications"
          description={filter === 'Unread' ? "All notifications have been read." : "No notifications received yet."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`p-4 transition-all flex items-start justify-between gap-4 ${
                !item.is_read
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 shadow-2xs shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
                    {!item.is_read && <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">{item.message}</p>
                  <span className="text-[11px] opacity-70 block pt-0.5">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-semibold shrink-0 transition-colors"
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
