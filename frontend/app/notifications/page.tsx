'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  ShieldCheck,
  FileText,
  CheckCircle,
  WarningCircle,
  Sparkle,
  ArrowRight,
  Checks,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNotifications, useMarkAsRead } from '@/features/notifications/use-notifications';
import { formatDate } from '@/lib/utils';
import { Notification } from '@/types';

export default function NotificationCenterPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsReadMutation = useMarkAsRead();

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const benefitNotifications = notifications.filter((n) => n.notificationType === 'BENEFIT_DETECTED');
  const claimNotifications = notifications.filter((n) => n.notificationType !== 'BENEFIT_DETECTED');

  const handleMarkAllRead = () => {
    unreadNotifications.forEach((n) => {
      markAsReadMutation.mutate(n.id);
    });
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-primary border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Notification Center</Badge>
              <span className="text-xs text-muted-foreground">&bull; Real-Time Activity</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Alerts & Protection Updates</h1>
            <p className="text-xs text-muted-foreground">
              Real-time stream of detected card benefit opportunities and claim adjudication status updates.
            </p>
          </div>

          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="rounded-xl text-xs font-semibold"
            >
              <Checks className="mr-1.5 h-3.5 w-3.5" /> Mark All Read ({unreadNotifications.length})
            </Button>
          )}
        </div>

        {/* Tabbed Notification Feeds */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
            <TabsTrigger value="benefits">Benefits ({benefitNotifications.length})</TabsTrigger>
            <TabsTrigger value="claims">Claims ({claimNotifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="pt-4 space-y-3">
            {isLoading ? (
              <div className="h-48 rounded-2xl glass-primary animate-pulse" />
            ) : notifications.length > 0 ? (
              notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
            ) : (
              <EmptyNotificationState />
            )}
          </TabsContent>

          <TabsContent value="unread" className="pt-4 space-y-3">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((n) => <NotificationItem key={n.id} notification={n} />)
            ) : (
              <EmptyNotificationState message="You have caught up with all alerts. No unread notifications." />
            )}
          </TabsContent>

          <TabsContent value="benefits" className="pt-4 space-y-3">
            {benefitNotifications.length > 0 ? (
              benefitNotifications.map((n) => <NotificationItem key={n.id} notification={n} />)
            ) : (
              <EmptyNotificationState message="No benefit opportunity notifications recorded." />
            )}
          </TabsContent>

          <TabsContent value="claims" className="pt-4 space-y-3">
            {claimNotifications.length > 0 ? (
              claimNotifications.map((n) => <NotificationItem key={n.id} notification={n} />)
            ) : (
              <EmptyNotificationState message="No claim adjudication notifications recorded." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsReadMutation = useMarkAsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'BENEFIT_DETECTED':
        return <ShieldCheck className="h-5 w-5 text-indigo-500" weight="duotone" />;
      case 'CLAIM_STATUS_UPDATE':
      case 'CLAIM_APPROVED':
        return <CheckCircle className="h-5 w-5 text-emerald-500" weight="duotone" />;
      case 'DOCUMENT_REQUEST':
        return <WarningCircle className="h-5 w-5 text-amber-500" weight="duotone" />;
      default:
        return <FileText className="h-5 w-5 text-purple-500" weight="duotone" />;
    }
  };

  const handleRead = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl glass-primary border border-slate-200/80 dark:border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        !notification.isRead ? 'border-primary/40 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-sm' : ''
      }`}
    >
      <div className="flex items-start space-x-3.5">
        <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          {getIcon(notification.notificationType)}
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className={`text-sm font-bold text-foreground ${!notification.isRead ? 'font-extrabold' : ''}`}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
            <Badge variant="secondary" className="text-[10px] py-0">{notification.priority}</Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            {notification.message}
          </p>

          <p className="text-[10px] text-muted-foreground font-mono">{formatDate(notification.createdAt)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 self-end sm:self-center">
        {notification.deepLink && (
          <Link href={notification.deepLink} onClick={handleRead}>
            <Button variant="default" size="sm" className="rounded-xl text-xs font-semibold">
              View <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyNotificationState({ message = 'No notifications found in this view.' }: { message?: string }) {
  return (
    <div className="text-center py-16 px-6 rounded-3xl glass-secondary border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
      <Bell className="h-10 w-10 text-muted-foreground mx-auto opacity-40" weight="duotone" />
      <h3 className="text-sm font-semibold text-foreground">No Notifications</h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
