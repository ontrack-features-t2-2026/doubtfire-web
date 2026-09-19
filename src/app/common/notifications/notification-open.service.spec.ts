import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Notification} from 'src/app/api/models/notification';
import {NotificationRouteService} from 'src/app/api/services/notification-route.service';
import {NotificationOpenService} from './notification-open.service';

describe('NotificationOpenService', () => {
  let routes: {navigate: ReturnType<typeof vi.fn>};
  let service: NotificationOpenService;

  function notification(link: string | null): Notification {
    return Object.assign(new Notification(), {
      event: 'task_comment_created',
      notificationType: 'feedback',
      link,
    });
  }

  beforeEach(() => {
    routes = {navigate: vi.fn().mockResolvedValue(true)};
    service = new NotificationOpenService(routes as unknown as NotificationRouteService);
  });

  it('opens the page the api linked to through the route check', async () => {
    await expect(service.open(notification('/projects/9/dashboard/2.2C/feedback'))).resolves.toBe(
      true,
    );

    expect(routes.navigate).toHaveBeenCalledOnce();
    expect(routes.navigate).toHaveBeenCalledWith('/projects/9/dashboard/2.2C/feedback');
  });

  it('opens a task whose code the api url-encoded', async () => {
    await service.open(notification('/projects/9/dashboard/Task%201/feedback'));

    expect(routes.navigate).toHaveBeenCalledWith('/projects/9/dashboard/Task%201/feedback');
  });

  it('hands an unsafe link to the route check rather than the router', async () => {
    await service.open(notification('https://evil.example/steal'));

    expect(routes.navigate).toHaveBeenCalledWith('https://evil.example/steal');
  });

  it('stays put when there is nowhere to go', async () => {
    for (const link of [null, '']) {
      await expect(service.open(notification(link))).resolves.toBe(false);
    }

    expect(routes.navigate).not.toHaveBeenCalled();
  });

  it('reports a navigation the router refused', async () => {
    routes.navigate.mockResolvedValue(false);

    await expect(service.open(notification('/projects/9/dashboard'))).resolves.toBe(false);
  });
});
