import {Notification} from 'src/app/api/models/notification';

export interface NotificationPresentation {
  icon: string;
  label: string;
  tone: 'feedback' | 'task' | 'portfolio' | 'extension' | 'general';
}

const EVENT_PRESENTATIONS: Readonly<Record<string, NotificationPresentation>> = {
  new_task_available: {icon: 'assignment_add', label: 'New task', tone: 'task'},
  task_due_soon: {icon: 'event_upcoming', label: 'Due soon', tone: 'task'},
  task_due_date_changed: {icon: 'edit_calendar', label: 'Date changed', tone: 'task'},
  task_comment_created: {icon: 'chat_bubble', label: 'New feedback', tone: 'feedback'},
  discussion_request_created: {
    icon: 'record_voice_over',
    label: 'Discussion prompt',
    tone: 'feedback',
  },
  task_status_changed: {icon: 'published_with_changes', label: 'Status changed', tone: 'task'},
  task_submitted: {icon: 'upload_file', label: 'Task submitted', tone: 'task'},
  extension_assessed: {icon: 'more_time', label: 'Extension', tone: 'extension'},
  portfolio_received: {icon: 'collections_bookmark', label: 'Portfolio', tone: 'portfolio'},
  group_membership_changed: {icon: 'groups', label: 'Group update', tone: 'general'},
  tutorial_changed: {icon: 'event_repeat', label: 'Tutorial update', tone: 'general'},
};

const CATEGORY_PRESENTATIONS: Readonly<Record<string, NotificationPresentation>> = {
  feedback: {icon: 'chat_bubble', label: 'Feedback', tone: 'feedback'},
  task: {icon: 'assignment', label: 'Task', tone: 'task'},
  portfolio: {icon: 'collections_bookmark', label: 'Portfolio', tone: 'portfolio'},
  extension: {icon: 'more_time', label: 'Extension', tone: 'extension'},
  general: {icon: 'campaign', label: 'OnTrack update', tone: 'general'},
};

const UNKNOWN_PRESENTATION: NotificationPresentation = {
  icon: 'notifications',
  label: 'Notification',
  tone: 'general',
};

/**
 * Stable notification presentation keyed by the API event hook.
 *
 * Event names, rather than message parsing, let due dates, feedback, status
 * changes and portfolio activity remain visibly different while keeping the
 * message body privacy-safe. The category fallback keeps an older browser
 * useful when the API adds an event this build has not learned yet.
 */
export function presentationFor(notification: Notification): NotificationPresentation {
  return (
    EVENT_PRESENTATIONS[notification.event] ??
    CATEGORY_PRESENTATIONS[notification.notificationType] ??
    UNKNOWN_PRESENTATION
  );
}
