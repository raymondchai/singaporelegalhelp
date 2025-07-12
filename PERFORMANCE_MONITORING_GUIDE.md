# Performance Optimization and Monitoring Guide
## Singapore Legal Help Platform

### 📊 Overview

This guide covers the comprehensive performance optimization and monitoring system implemented for the Singapore Legal Help platform. The system includes Core Web Vitals tracking, real user monitoring (RUM), error tracking, security monitoring, and automated performance testing.

---

## 🚀 Performance Optimizations Implemented

### 1. Next.js Production Build Optimization

**File**: `next.config.js`

- **Bundle Optimization**: Advanced code splitting and chunk optimization
- **Image Optimization**: WebP/AVIF support with lazy loading
- **Font Optimization**: Preloading and optimization for Inter font
- **CSS Optimization**: Minification and critical CSS extraction
- **Static Asset Caching**: Immutable caching for static resources
- **Compression**: Gzip compression enabled
- **PWA Caching**: Service worker with intelligent caching strategies

### 2. Core Web Vitals Optimization

**Target Metrics**:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

**Implementation**:
- Image lazy loading with `next/image`
- Font preloading and optimization
- CSS containment for layout stability
- JavaScript bundle optimization
- Resource prioritization

---

## 📈 Monitoring System

### 1. Web Vitals Monitoring

**Component**: `src/components/monitoring/WebVitalsMonitor.tsx`

**Features**:
- Real-time Core Web Vitals collection
- Automatic rating classification (good/needs-improvement/poor)
- Google Analytics 4 integration
- Custom analytics endpoint reporting
- Performance observer for additional metrics

**API Endpoints**:
- `POST /api/analytics/web-vitals` - Store Web Vitals data
- `GET /api/analytics/web-vitals` - Retrieve aggregated metrics

### 2. Performance Analytics

**Component**: `src/app/api/analytics/performance/route.ts`

**Tracked Metrics**:
- Long tasks (>50ms)
- Layout shifts
- Slow resources (>1s load time)
- Custom performance metrics
- Resource timing data

### 3. Error Tracking and Logging

**Component**: `src/lib/error-handling.ts`

**Features**:
- Categorized error logging (javascript, api, database, auth, payment, performance, security)
- Severity levels (low, medium, high, critical)
- Batch processing with retry logic
- Real-time error alerts for critical issues
- Error metrics aggregation

**Error Categories**:
- **JavaScript**: Client-side errors and exceptions
- **API**: Server-side API errors
- **Database**: Database query and connection errors
- **Auth**: Authentication and authorization errors
- **Payment**: Payment processing errors
- **Performance**: Performance-related issues
- **Security**: Security violations and threats

### 4. Security Monitoring

**Component**: `src/components/monitoring/SecurityMonitor.tsx`

**Monitored Events**:
- Content Security Policy violations
- XSS attempt detection
- Rate limiting violations
- Authentication failures
- Suspicious user behavior patterns

**Security Response**:
- Automatic IP blocking for critical threats
- Real-time security alerts
- Incident response procedures
- Security metrics tracking

---

## 🎯 Google Analytics 4 Integration

**Component**: `src/components/analytics/GoogleAnalytics.tsx`

**Tracked Events**:
- Page views with enhanced data
- Legal content interactions
- Document generation events
- Subscription conversions
- Search behavior
- User engagement metrics
- Error events
- Performance issues

**Custom Dimensions**:
- Practice area
- Content type
- User subscription tier
- Device type
- Performance rating

---

## 📊 Performance Dashboard

**Location**: `/admin/performance`

**Features**:
- Real-time Web Vitals visualization
- Performance metrics overview
- Error tracking dashboard
- Security event monitoring
- Automated insights and recommendations

**Dashboard Sections**:
1. **Web Vitals**: Core Web Vitals trends and ratings
2. **Performance**: Long tasks, layout shifts, slow resources
3. **Errors**: Error distribution by category and severity
4. **Insights**: Automated performance recommendations

---

## 🧪 Performance Testing

### Automated Testing Script

**File**: `scripts/performance-test.js`

**Test Coverage**:
- Core Web Vitals measurement
- Multi-device testing (Desktop, Mobile, Tablet)
- Network condition simulation (3G, 4G, WiFi)
- Load time analysis
- Resource performance evaluation
- JavaScript error detection

**Usage**:
```bash
# Test local development
npm run test:performance

# Test production
npm run test:performance:prod

# Run Lighthouse audit
npm run lighthouse

# Analyze bundle size
npm run analyze
```

### Test Reports

**Output Location**: `./performance-reports/`

**Report Types**:
- JSON detailed results
- HTML visual reports
- Lighthouse audit reports
- Bundle analysis reports

---

## 🗄️ Database Schema

**File**: `database/performance-monitoring-schema.sql`

**Tables**:
- `web_vitals_metrics` - Individual Web Vitals measurements
- `web_vitals_daily_aggregates` - Daily aggregated statistics
- `performance_longtasks` - Long task tracking
- `performance_layout_shifts` - Layout shift events
- `performance_custom_metrics` - Custom performance metrics
- `performance_slow_resources` - Slow resource tracking
- `error_logs` - Comprehensive error logging
- `error_metrics_daily` - Daily error statistics
- `security_events` - Security event tracking
- `security_metrics_daily` - Daily security statistics

---

## 🔧 Configuration

### Environment Variables

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Security Monitoring
SECURITY_WEBHOOK_URL=https://hooks.slack.com/...
SECURITY_WEBHOOK_TOKEN=your-webhook-token
SECURITY_ALERT_WEBHOOK_URL=https://hooks.slack.com/...

# Error Tracking
SLACK_ERROR_WEBHOOK_URL=https://hooks.slack.com/...
EMAIL_SERVICE_URL=https://api.emailservice.com/send
ADMIN_EMAIL=admin@singaporelegalhelp.com.sg
```

### Next.js Configuration

Key optimizations in `next.config.js`:
- Image optimization with WebP/AVIF
- Bundle splitting configuration
- Performance experimental features
- Security headers
- Caching strategies

---

## 📋 Monitoring Checklist

### Daily Monitoring
- [ ] Check Web Vitals dashboard
- [ ] Review error rates and critical issues
- [ ] Monitor security events
- [ ] Verify performance thresholds

### Weekly Analysis
- [ ] Run comprehensive performance tests
- [ ] Analyze performance trends
- [ ] Review and optimize slow pages
- [ ] Update performance budgets

### Monthly Review
- [ ] Performance audit and optimization
- [ ] Security assessment
- [ ] Error pattern analysis
- [ ] Infrastructure scaling review

---

## 🚨 Alert Configuration

### Critical Alerts
- Web Vitals degradation (>20% increase)
- Error rate spike (>5% increase)
- Security incidents (high/critical severity)
- Performance threshold breaches

### Alert Channels
- Slack notifications
- Email alerts
- Dashboard notifications
- Mobile push notifications (if configured)

---

## 🔍 Troubleshooting

### Common Performance Issues

1. **High LCP**:
   - Check image optimization
   - Review server response times
   - Optimize critical rendering path

2. **High CLS**:
   - Add size attributes to images
   - Reserve space for dynamic content
   - Use CSS containment

3. **High FID**:
   - Reduce JavaScript bundle size
   - Optimize third-party scripts
   - Use code splitting

### Debugging Tools

- Performance dashboard (`/admin/performance`)
- Browser DevTools Performance tab
- Lighthouse audits
- Web Vitals extension
- Performance test reports

---

## 📚 Best Practices

### Performance Optimization
1. Optimize images and use next/image
2. Implement proper caching strategies
3. Minimize JavaScript bundle size
4. Use lazy loading for non-critical resources
5. Optimize fonts and CSS

### Monitoring
1. Set up automated alerts
2. Regular performance audits
3. Monitor user experience metrics
4. Track business impact of performance
5. Continuous optimization based on data

### Security
1. Monitor security events regularly
2. Implement proper CSP policies
3. Regular security assessments
4. Incident response procedures
5. User behavior analysis

---

## 🔄 Maintenance

### Regular Tasks
- Update performance budgets
- Review and optimize slow queries
- Update security policies
- Performance test new features
- Monitor third-party dependencies

### Quarterly Reviews
- Comprehensive performance audit
- Security penetration testing
- Infrastructure optimization
- Monitoring system updates
- Performance strategy review

---

This comprehensive monitoring and optimization system ensures the Singapore Legal Help platform maintains excellent performance, security, and user experience standards in production.
