'use client'

import { useEffect } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'

interface WebVitalsData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

// Thresholds for Core Web Vitals
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]
  if (!thresholds) return 'good'
  
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: Metric) {
  const vitalsData: WebVitalsData = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate'
  }

  // Send to Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_parameter_1: vitalsData.rating,
      custom_parameter_2: vitalsData.navigationType,
    })
  }

  // Send to custom analytics endpoint
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...vitalsData,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }),
  }).catch(error => {
    console.error('Failed to send Web Vitals data:', error)
  })

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: vitalsData.rating,
      delta: metric.delta,
      id: metric.id,
    })
  }
}

export function WebVitalsMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Collect Core Web Vitals
    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)

    // Additional performance monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Monitor long tasks (>50ms)
        if (entry.entryType === 'longtask') {
          fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'longtask',
              duration: entry.duration,
              startTime: entry.startTime,
              url: window.location.href,
              timestamp: Date.now(),
            }),
          }).catch(console.error)
        }

        // Monitor layout shifts
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'layout-shift',
              value: (entry as any).value,
              sources: (entry as any).sources?.map((source: any) => ({
                node: source.node?.tagName,
                currentRect: source.currentRect,
                previousRect: source.previousRect,
              })),
              url: window.location.href,
              timestamp: Date.now(),
            }),
          }).catch(console.error)
        }
      }
    })

    // Observe performance entries
    try {
      observer.observe({ entryTypes: ['longtask', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null // This component doesn't render anything
}

// Hook for manual performance tracking
export function usePerformanceTracking() {
  const trackCustomMetric = (name: string, value: number, metadata?: Record<string, any>) => {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'custom',
        name,
        value,
        metadata,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(console.error)
  }

  const trackUserTiming = (name: string, startTime?: number) => {
    const endTime = performance.now()
    const duration = startTime ? endTime - startTime : endTime
    
    trackCustomMetric(name, duration, {
      type: 'user-timing',
      startTime: startTime || 0,
      endTime,
    })
  }

  const trackResourceTiming = () => {
    const resources = performance.getEntriesByType('resource')
    const slowResources = resources.filter(resource => resource.duration > 1000)
    
    if (slowResources.length > 0) {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'slow-resources',
          resources: slowResources.map(resource => ({
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize,
            type: resource.initiatorType,
          })),
          url: window.location.href,
          timestamp: Date.now(),
        }),
      }).catch(console.error)
    }
  }

  return {
    trackCustomMetric,
    trackUserTiming,
    trackResourceTiming,
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
  }
}
