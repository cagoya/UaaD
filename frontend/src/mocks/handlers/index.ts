import { activityHandlers } from './activities';
import { notificationHandlers } from './notifications';
import { recommendationHandlers } from './recommendations';
import { authHandlers } from './auth';

export const handlers = [
  ...authHandlers,
  ...activityHandlers,
  ...recommendationHandlers,
  ...notificationHandlers,
];
