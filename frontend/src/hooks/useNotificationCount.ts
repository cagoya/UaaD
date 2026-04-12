import { useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export function useNotificationCount() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      setCount(0);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);

    getUnreadNotificationCount()
      .then((value) => {
        if (active) {
          setCount(value);
        }
      })
      .catch(() => {
        if (active) {
          setCount(0);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return {
    count: isAuthenticated ? count : 0,
    isLoading,
  };
}
