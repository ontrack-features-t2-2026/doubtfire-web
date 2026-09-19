import {Injectable} from '@angular/core';
import {Notification} from 'src/app/api/models/notification';
import {NotificationRouteService} from 'src/app/api/services/notification-route.service';

/**
 * Open the page a notification is about, from the bell or the notifications
 * page.
 *
 * The api sends the page as the notification's link. NotificationRouteService
 * checks that link against the route shapes the api builds, and sends anything
 * else to the notifications page, so the link is never handed to the router
 * unchecked.
 */
@Injectable({providedIn: 'root'})
export class NotificationOpenService {
  constructor(private routes: NotificationRouteService) {}

  /**
   * Resolves true when the app is now on the notification's page. A
   * notification with no link, such as a general announcement, has nowhere to
   * go and resolves false without navigating.
   */
  open(notification: Notification): Promise<boolean> {
    if (!notification.link) {
      return Promise.resolve(false);
    }

    return this.routes.navigate(notification.link);
  }
}
