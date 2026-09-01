'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BellRinging, ShieldCheck, FileText, CheckCircle, WarningCircle, Sparkle, ArrowRight } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useMarkAsRead, useRealtimeNotifications } from '@/features/notifications/use-notifications';
import { formatDate } from '@/lib/utils';
import { Notification } from '@/types';

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: notifications = [] } = useNotifications();
  const markAsReadMutation = useMarkAsRead();

  // Listen to SSE live events
  useRealtimeNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      markAsReadMutation.mutate(n.id);
    }
    setIsOpen(false);
    if (n.deepLink) {
      router.push(n.deepLink);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BENEFIT_DETECTED':
        return <ShieldCheck className="h-4 w-4 text-indigo-500" weight="duotone" />;
      case 'CLAIM_STATUS_UPDATE':
      case 'CLAIM_SUBMITTED':
      case 'CLAIM_APPROVED':
        return <CheckCircle className="h-4 w-4 text-emerald-500" weight="duotone" />;
      case 'DOCUMENT_REQUEST':
        return <WarningCircle className="h-4 w-4 text-amber-500" weight="duotone" />;
      default:
        return <Sparkle className="h-4 w-4 text-primary" weight="duotone" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          className="relative h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
        >
          {unreadCount > 0 ? (
            <BellRinging className="h-4 w-4 text-primary animate-bounce" weight="fill" />
          ) : (
            <Bell className="h-4 w-4" />
          )}

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl glass-elevated border border-slate-200/90 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold text-foreground">Notifications</h4>
            {unreadCount > 0 && <Badge variant="default" className="text-[10px] py-0">{unreadCount} New</Badge>}
          </div>

          <Link href="/notifications" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold text-primary hover:underline">
            View All
          </Link>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-200/50 dark:divide-slate-800/50">
          {notifications.length > 0 ? (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/50 ${
                  !n.isRead ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                }`}
              >
                <div className="h-7 w-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {getNotificationIcon(n.notificationType)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`font-semibold truncate text-foreground ${!n.isRead ? 'font-bold' : ''}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 text-muted-foreground space-y-1">
              <Bell className="h-6 w-6 mx-auto opacity-40" />
              <p className="text-xs font-semibold">No Notifications</p>
              <p className="text-[10px]">Real-time benefit and claim alerts will appear here.</p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline py-1"
          >
            Open Notification Center <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
