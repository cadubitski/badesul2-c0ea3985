// Hook centralizado para Google Analytics
// Verifica se gtag existe antes de chamar para evitar erros

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      action: string,
      params?: Record<string, string | number | boolean | undefined>
    ) => void;
  }
}

const trackEvent = (eventName: string, params?: Record<string, string | number | boolean | undefined>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export const useAnalytics = () => {
  const trackCardClick = (title: string, category: string, type: string) => {
    trackEvent('card_click', {
      card_title: title,
      card_category: category,
      card_type: type,
    });
  };

  const trackCategoryClick = (categoryName: string) => {
    trackEvent('category_click', {
      category_name: categoryName,
    });
  };

  const trackQuickLinkClick = (linkName: string) => {
    trackEvent('quick_link_click', {
      link_name: linkName,
    });
  };

  const trackSearch = (searchTerm: string) => {
    trackEvent('search', {
      search_term: searchTerm,
    });
  };

  const trackDashboardView = (dashboardName: string) => {
    trackEvent('dashboard_view', {
      dashboard_name: dashboardName,
    });
  };

  const trackChartClick = (dashboardName: string, chartGroup: string, chartValue: string) => {
    trackEvent('chart_click', {
      dashboard_name: dashboardName,
      chart_group: chartGroup,
      chart_value: chartValue,
    });
  };

  const trackAdminAccess = (isAdmin: boolean) => {
    trackEvent('admin_access', {
      is_authenticated: isAdmin,
    });
  };

  return {
    trackEvent,
    trackCardClick,
    trackCategoryClick,
    trackQuickLinkClick,
    trackSearch,
    trackDashboardView,
    trackChartClick,
    trackAdminAccess,
  };
};

export default useAnalytics;
