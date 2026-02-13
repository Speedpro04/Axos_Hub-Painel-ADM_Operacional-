
import { useRef, useEffect } from 'react';
import { useAxosStore } from '../store';

export const usePageAnalytics = (pageName: string, metadata?: Record<string, any>) => {
  const { syncToN8N } = useAxosStore();
  const startTime = useRef(Date.now());
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    // Rastreamento de visualização de página
    syncToN8N('/analytics', {
      event: 'page_view',
      page: pageName,
      ...metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    }).catch(() => {});

    // Rastreamento de tempo de permanência ao sair da página
    return () => {
      const timeSpent = Date.now() - startTime.current;
      syncToN8N('/analytics', {
        event: 'page_exit',
        page: pageName,
        timeSpent: Math.round(timeSpent / 1000), // tempo em segundos
        ...metadata,
        timestamp: new Date().toISOString()
      }).catch(() => {});
    };
  }, [pageName, syncToN8N, metadata]);
};
