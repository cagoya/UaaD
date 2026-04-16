import { activityHandlers } from './activities';
import { enrollmentHandlers } from './enrollments';
import { notificationHandlers } from './notifications';
import { orderHandlers } from './orders';
import { recommendationHandlers } from './recommendations';
import { authHandlers } from './auth';

export const handlers = [
  ...authHandlers,
  ...activityHandlers,
  ...enrollmentHandlers,
  ...orderHandlers,
  ...recommendationHandlers,
  ...notificationHandlers,
];
