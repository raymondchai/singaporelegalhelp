'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

interface GAEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

// Google Analytics 4 tracking functions
export const gtag = {
  // Page view tracking
  pageview: (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID!, {
        page_path: url,
      })
    }
  },

  // Event tracking
  event: ({ action, category, label, value, custom_parameters }: GAEvent) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...custom_parameters,
      })
    }
  },

  // Legal content specific events
  trackLegalContentView: (contentType: string, contentId: string, practiceArea: string) => {
    gtag.event({
      action: 'view_legal_content',
      category: 'Legal Content',
      label: `${practiceArea}/${contentType}/${contentId}`,
      custom_parameters: {
        content_type: contentType,
        content_id: contentId,
        practice_area: practiceArea,
      },
    })
  },

  // Search tracking
  trackSearch: (query: string, resultsCount: number, filters?: Record<string, any>) => {
    gtag.event({
      action: 'search',
      category: 'Search',
      label: query,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        results_count: resultsCount,
        filters: filters || {},
      },
    })
  },

  // Document generation tracking
  trackDocumentGeneration: (templateType: string, success: boolean) => {
    gtag.event({
      action: success ? 'document_generated' : 'document_generation_failed',
      category: 'Document Builder',
      label: templateType,
      custom_parameters: {
        template_type: templateType,
        success: success,
      },
    })
  },

  // Subscription tracking
  trackSubscription: (tier: string, action: 'subscribe' | 'upgrade' | 'downgrade' | 'cancel', value?: number) => {
    gtag.event({
      action: action,
      category: 'Subscription',
      label: tier,
      value: value,
      custom_parameters: {
        subscription_tier: tier,
        subscription_action: action,
      },
    })
  },

  // User engagement tracking
  trackEngagement: (action: string, element: string, duration?: number) => {
    gtag.event({
      action: action,
      category: 'User Engagement',
      label: element,
      value: duration,
      custom_parameters: {
        engagement_element: element,
        engagement_duration: duration,
      },
    })
  },

  // Error tracking
  trackError: (errorType: string, errorMessage: string, page: string) => {
    gtag.event({
      action: 'error',
      category: 'Errors',
      label: `${errorType}: ${errorMessage}`,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage,
        error_page: page,
      },
    })
  },

  // Conversion tracking
  trackConversion: (conversionType: string, value?: number) => {
    gtag.event({
      action: 'conversion',
      category: 'Conversions',
      label: conversionType,
      value: value,
      custom_parameters: {
        conversion_type: conversionType,
      },
    })
  },
}

// Main Google Analytics component
export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    gtag.pageview(url)
  }, [pathname, searchParams])

  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              custom_map: {
                'custom_parameter_1': 'web_vitals_rating',
                'custom_parameter_2': 'navigation_type',
              },
            });
          `,
        }}
      />
    </>
  )
}

// Hook for tracking user interactions
export function useAnalytics() {
  const trackPageView = (page: string) => {
    gtag.pageview(page)
  }

  const trackEvent = (event: GAEvent) => {
    gtag.event(event)
  }

  const trackLegalContentInteraction = (
    action: 'view' | 'bookmark' | 'share' | 'download',
    contentType: string,
    contentId: string,
    practiceArea: string
  ) => {
    gtag.event({
      action: `legal_content_${action}`,
      category: 'Legal Content Interaction',
      label: `${practiceArea}/${contentType}/${contentId}`,
      custom_parameters: {
        interaction_type: action,
        content_type: contentType,
        content_id: contentId,
        practice_area: practiceArea,
      },
    })
  }

  const trackUserJourney = (step: string, funnel: string) => {
    gtag.event({
      action: 'user_journey_step',
      category: 'User Journey',
      label: `${funnel}/${step}`,
      custom_parameters: {
        journey_step: step,
        journey_funnel: funnel,
      },
    })
  }

  const trackPerformanceIssue = (issue: string, severity: 'low' | 'medium' | 'high', details?: string) => {
    gtag.event({
      action: 'performance_issue',
      category: 'Performance',
      label: issue,
      custom_parameters: {
        issue_type: issue,
        severity: severity,
        details: details,
      },
    })
  }

  return {
    trackPageView,
    trackEvent,
    trackLegalContentInteraction,
    trackUserJourney,
    trackPerformanceIssue,
    gtag,
  }
}

// Enhanced error boundary with analytics
export function withAnalytics<T extends Record<string, any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function AnalyticsWrappedComponent(props: T) {
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        gtag.trackError('javascript_error', event.message, window.location.pathname)
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        gtag.trackError('promise_rejection', String(event.reason), window.location.pathname)
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [])

    return <Component {...props} />
  }
}
