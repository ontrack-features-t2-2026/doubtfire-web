import {Notification} from 'src/app/api/models/notification';
import {Project} from 'src/app/api/models/project';
import {Task} from 'src/app/api/models/task';
import {TaskStatus} from 'src/app/api/models/task-status';

export interface StudentAttentionItem {
  key: string;
  unitCode: string;
  abbreviation: string;
  title: string;
  reason: string;
  action: string;
  route: (string | number)[];
  date: Date | null;
  dateLabel: string;
  extension: string | null;
  dateUpdate: string | null;
  dateNotification: Notification | null;
  priority: number;
}

export interface StudentAttention {
  items: StudentAttentionItem[];
  waiting: number;
}

const DATE_EVENTS = new Set([
  'task_due_date_changed',
  'resubmission_deadline_changed',
  'extension_assessed',
]);
const RETURNED_STATUSES = new Set(['fix_and_resubmit', 'redo', 'attention_required']);
const DISCUSSION_STATUSES = new Set(['discuss', 'rediscuss', 'demonstrate']);

function validDate(value: Date | undefined): Date | null {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}

/** Reuses the same authorised projects and task dates as the cross-unit dashboard. */
export function buildStudentAttention(
  projects: readonly Project[],
  notifications: readonly Notification[],
  now = new Date(),
): StudentAttention {
  const result: StudentAttention = {items: [], waiting: 0};
  for (const project of projects) {
    if (!project.unit?.isActive) {
      continue;
    }
    for (const task of project.tasks ?? []) {
      if (!task.definition?.abbreviation) {
        continue;
      }
      const change = notifications.find(
        (notice) =>
          !notice.isRead &&
          DATE_EVENTS.has(notice.event) &&
          notice.projectId === project.id &&
          (notice.taskDefinitionId === task.definition.id ||
            notice.taskDefinitionAbbr === task.definition.abbreviation),
      );
      const unread = Math.max(task.numNewComments ?? 0, 0);
      const returned = RETURNED_STATUSES.has(task.status);
      const discussion = DISCUSSION_STATUSES.has(task.status);
      const waiting = task.status === 'ready_for_feedback' || task.status === 'need_help';
      if (waiting) {
        result.waiting++;
      }

      // A date alone must not make completed work or work waiting on a tutor overdue.
      // Work above the target grade remains visible when it has been started or updated.
      const withinTarget =
        project.targetGrade == null || task.definition.targetGrade <= project.targetGrade;
      const needsWork =
        !TaskStatus.FINAL_STATUSES.includes(task.status) &&
        !TaskStatus.SUBMITTED_STATUSES.includes(task.status) &&
        !waiting &&
        (withinTarget || task.status !== 'not_started');
      const date = validDate(task.effectiveDeadlineDate) ?? validDate(task.localDueDate());
      const deadline = validDate(task.effectiveDeadline);
      // Use the server's deadline instant for lateness, and local calendar days only
      // for the "coming week" grouping. AoE dates must not become overdue at midnight here.
      const late = needsWork && (deadline ? now > deadline : task.isPastDueDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const days = date
        ? Math.round(
            (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - today) /
              86_400_000,
          )
        : Infinity;
      const soon = needsWork && !late && days <= 7;
      const extension = extensionExplanation(task);
      const dateUpdate = change
        ? change.event === 'extension_assessed'
          ? 'Your extension request has an update'
          : 'A task date has changed'
        : null;

      let reason: string;
      let action = 'Open task';
      let priority: number;
      let feedback = false;
      if (unread > 0) {
        // numNewComments includes messages from students too; hasFeedback means
        // historical feedback exists and cannot establish whether it is unread.
        reason = `${unread} unread ${unread === 1 ? 'message' : 'messages'}`;
        action = 'Read messages';
        priority = 0;
        feedback = true;
      } else if (returned || discussion) {
        reason = discussion ? 'Arrange a discussion with your tutor' : 'Feedback needs your action';
        action = 'Review feedback';
        priority = 1;
        feedback = true;
      } else if (change) {
        reason = dateUpdate;
        action = change.event === 'extension_assessed' ? 'Check outcome' : 'Check dates';
        priority = 2;
        feedback = change.event === 'extension_assessed';
      } else if (late) {
        reason = project.unit.allowFlexibleDates
          ? 'Past your planned submission date'
          : 'Past your due date';
        priority = 3;
      } else if (soon) {
        reason =
          days < 0
            ? 'Submission window still open'
            : days === 0
              ? 'Due today'
              : days === 1
                ? 'Due tomorrow'
                : `Due in ${days} days`;
        priority = 4;
      } else if (extension && needsWork) {
        reason = 'An extension applies to this task';
        action = 'Check dates';
        priority = 5;
      } else {
        continue;
      }
      const route: (string | number)[] = [
        '/projects',
        project.id,
        'dashboard',
        task.definition.abbreviation,
      ];
      if (feedback) {
        route.push('feedback');
      }
      result.items.push({
        key: `${project.id}:${task.definition.id}`,
        unitCode: project.unit.code,
        abbreviation: task.definition.abbreviation,
        title: task.definition.name,
        reason,
        action,
        route,
        date,
        dateLabel: project.unit.allowFlexibleDates ? 'Planned submission' : 'Your due date',
        extension,
        dateUpdate,
        dateNotification: priority === 2 ? change : null,
        priority,
      });
    }
  }
  result.items.sort(
    (a, b) =>
      a.priority - b.priority ||
      (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity) ||
      a.key.localeCompare(b.key),
  );
  return result;
}

function extensionExplanation(task: Task): string | null {
  if (task.effectiveDeadlineReason === 'approved_extension') {
    return 'Approved extension included';
  }
  if (task.effectiveDeadlineReason === 'post_feedback_extension') {
    return 'Extra time after feedback included';
  }
  if (task.extensions > 0) {
    return `Includes ${task.extensions} ${task.extensions === 1 ? 'week' : 'weeks'} of extension`;
  }
  return null;
}
