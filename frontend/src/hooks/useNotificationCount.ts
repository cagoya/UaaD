import { useEffect, useState } from 'react';
import { listNotifications } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { mergeNotificationReadState, subscribeNotificationState } from '../utils/notificationState';

export function useNotificationCount() {
  const { isAuthenticated, session } = useAuth();
  const [state, setState] = useState(() => ({
    count: 0,
    isLoading: isAuthenticated,
  }));

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      return undefined;
    }

    const load = () =>
      listNotifications()
        .then((items) => {
          const mergedItems = mergeNotificationReadState(items, session?.userId);

          if (active) {
            setState({
              count: mergedItems.filter((item) => !item.isRead).length,
              isLoading: false,
            });
          }
        })
        .catch(() => {
          if (active) {
            setState({
              count: 0,
              isLoading: false,
            });
          }
        });

    void load();

    const unsubscribe = subscribeNotificationState(session?.userId, () => {
      void load();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isAuthenticated, session?.userId]);

  return {
    count: isAuthenticated ? state.count : 0,
    isLoading: isAuthenticated ? state.isLoading : false,
  };
}
