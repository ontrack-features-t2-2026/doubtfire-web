import {describe, expect, it} from 'vitest';
import {Notification} from 'src/app/api/models/notification';
import {presentationFor} from './notification-presentation';

function notification(event: string, notificationType = 'task'): Notification {
  return Object.assign(new Notification(), {event, notificationType});
}

describe('notification presentation', () => {
  it('distinguishes every deterministic demo event without reading message text', () => {
    expect(
      [
        'new_task_available',
        'task_due_soon',
        'task_due_date_changed',
        'task_comment_created',
        'task_status_changed',
        'extension_assessed',
        'portfolio_received',
      ].map((event) => presentationFor(notification(event)).label),
    ).toEqual([
      'New task',
      'Due soon',
      'Date changed',
      'New feedback',
      'Status changed',
      'Extension',
      'Portfolio',
    ]);
  });

  it('uses a category fallback for a new event and a generic fallback for a new category', () => {
    expect(presentationFor(notification('future_feedback_event', 'feedback'))).toMatchObject({
      icon: 'chat_bubble',
      label: 'Feedback',
      tone: 'feedback',
    });
    expect(presentationFor(notification('future_event', 'future_category'))).toMatchObject({
      icon: 'notifications',
      label: 'Notification',
      tone: 'general',
    });
  });
});
