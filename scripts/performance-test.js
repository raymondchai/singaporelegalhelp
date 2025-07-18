#!/usr/bin/env node

/**
 * Performance Testing Script for Singapore Legal Help Platform
 * Tests Core Web Vitals, load times, and performance under various conditions
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  testPages: [
    '/',
    '/legal',
    '/legal/family-law',
    '/legal/employment-law',
    '/dashboard',
    '/document-builder',
    '/search?q=employment',
  ],
  devices: [
    'Desktop',
    'iPhone 12',
    'iPad',
  ],
  networkConditions: [
    { name: 'Fast 3G', downloadThroughput: 1600000, uploadThroughput: 750000, latency: 150 },
    { name: '4G', downloadThroughput: 9000000, uploadThroughput: 9000000, latency: 170 },
    { name: 'WiFi', downloadThroughput: 30000000, uploadThroughput: 15000000, latency: 2 },
  ],
  iterations: 3,
  outputDir: './performance-reports',
};

// Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

class PerformanceTester {
  constructor() {
    this.results = [];
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing Performance Testing...');
    
    // Create output directory
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
  }

  async testPage(url, device, network) {
    const page = await this.browser.newPage();
    
    try {
      // Set device emulation
      if (device !== 'Desktop') {
        const deviceConfig = puppeteer.devices[device];
        await page.emulate(deviceConfig);
      }

      // Set network conditions
      await page.emulateNetworkConditions(network);

      // Enable performance monitoring
      await page.evaluateOnNewDocument(() => {
        window.performanceMetrics = {
          navigationStart: performance.timeOrigin,
          metrics: {},
        };

        // Collect Web Vitals
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.performanceMetrics.metrics[entry.name] = entry.value;
          }
        }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

        // Collect CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          window.performanceMetrics.metrics.CLS = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
      });

      // Navigate and measure
      const startTime = Date.now();
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      const loadTime = Date.now() - startTime;

      // Wait for Web Vitals to be collected
      await page.waitForTimeout(2000);

      // Collect metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const lcp = performance.getEntriesByType('largest-contentful-paint');
        
        return {
          // Navigation timing
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          
          // Paint timing
          fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          lcp: lcp[lcp.length - 1]?.startTime || 0,
          
          // Layout stability
          cls: window.performanceMetrics?.metrics?.CLS || 0,
          
          // Resource timing
          resourceCount: performance.getEntriesByType('resource').length,
          totalResourceSize: performance.getEntriesByType('resource')
            .reduce((total, resource) => total + (resource.transferSize || 0), 0),
        };
      });

      // Collect additional performance data
      const performanceData = await page.metrics();
      
      // Test interactivity (FID simulation)
      const fidStart = Date.now();
      await page.click('body');
      const fid = Date.now() - fidStart;

      // Collect JavaScript errors
      const jsErrors = await page.evaluate(() => {
        return window.jsErrors || [];
      });

      return {
        url,
        device,
        network: network.name,
        timestamp: new Date().toISOString(),
        status: response.status(),
        loadTime,
        metrics: {
          ...metrics,
          fid,
        },
        performance: performanceData,
        errors: jsErrors,
        passed: this.evaluateThresholds(metrics, fid),
      };

    } catch (error) {
      console.error(`❌ Error testing ${url} on ${device} with ${network.name}:`, error.message);
      return {
        url,
        device,
        network: network.name,
        timestamp: new Date().toISOString(),
        error: error.message,
        passed: false,
      };
    } finally {
      await page.close();
    }
  }

  evaluateThresholds(metrics, fid) {
    const results = {
      LCP: metrics.lcp <= THRESHOLDS.LCP.good ? 'good' : 
           metrics.lcp <= THRESHOLDS.LCP.poor ? 'needs-improvement' : 'poor',
      FID: fid <= THRESHOLDS.FID.good ? 'good' : 
           fid <= THRESHOLDS.FID.poor ? 'needs-improvement' : 'poor',
      CLS: metrics.cls <= THRESHOLDS.CLS.good ? 'good' : 
           metrics.cls <= THRESHOLDS.CLS.poor ? 'needs-improvement' : 'poor',
      FCP: metrics.fcp <= THRESHOLDS.FCP.good ? 'good' : 
           metrics.fcp <= THRESHOLDS.FCP.poor ? 'needs-improvement' : 'poor',
      TTFB: metrics.ttfb <= THRESHOLDS.TTFB.good ? 'good' : 
            metrics.ttfb <= THRESHOLDS.TTFB.poor ? 'needs-improvement' : 'poor',
    };

    const passCount = Object.values(results).filter(r => r === 'good').length;
    return {
      overall: passCount >= 4 ? 'good' : passCount >= 2 ? 'needs-improvement' : 'poor',
      details: results,
    };
  }

  async runTests() {
    console.log('📊 Starting Performance Tests...');
    
    for (const page of CONFIG.testPages) {
      console.log(`\n🔍 Testing page: ${page}`);
      
      for (const device of CONFIG.devices) {
        for (const network of CONFIG.networkConditions) {
          console.log(`  📱 ${device} on ${network.name}`);
          
          // Run multiple iterations
          const iterationResults = [];
          for (let i = 0; i < CONFIG.iterations; i++) {
            const result = await this.testPage(
              `${CONFIG.baseUrl}${page}`,
              device,
              network
            );
            iterationResults.push(result);
            
            // Brief pause between iterations
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Calculate averages
          const avgResult = this.calculateAverages(iterationResults);
          this.results.push(avgResult);
        }
      }
    }
  }

  calculateAverages(results) {
    const validResults = results.filter(r => !r.error);
    if (validResults.length === 0) return results[0];

    const first = validResults[0];
    const avgMetrics = {};
    
    // Average numeric metrics
    const numericFields = ['loadTime', 'ttfb', 'domContentLoaded', 'loadComplete', 'fcp', 'lcp', 'cls', 'fid'];
    
    for (const field of numericFields) {
      if (field === 'loadTime') {
        avgMetrics[field] = validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length;
      } else {
        avgMetrics[field] = validResults.reduce((sum, r) => sum + (r.metrics[field] || 0), 0) / validResults.length;
      }
    }

    return {
      ...first,
      loadTime: avgMetrics.loadTime,
      metrics: {
        ttfb: avgMetrics.ttfb,
        domContentLoaded: avgMetrics.domContentLoaded,
        loadComplete: avgMetrics.loadComplete,
        fcp: avgMetrics.fcp,
        lcp: avgMetrics.lcp,
        cls: avgMetrics.cls,
        fid: avgMetrics.fid,
        resourceCount: first.metrics.resourceCount,
        totalResourceSize: first.metrics.totalResourceSize,
      },
      passed: this.evaluateThresholds(avgMetrics, avgMetrics.fid),
      iterations: validResults.length,
    };
  }

  async generateReport() {
    console.log('\n📋 Generating Performance Report...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(CONFIG.outputDir, `performance-report-${timestamp}.json`);
    
    // Save detailed results
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: CONFIG,
      thresholds: THRESHOLDS,
      results: this.results,
      summary: this.generateSummary(),
    }, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHtmlReport();
    const htmlPath = path.join(CONFIG.outputDir, `performance-report-${timestamp}.html`);
    await fs.writeFile(htmlPath, htmlReport);

    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  generateSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed?.overall === 'good').length;
    const failedTests = this.results.filter(r => r.error || r.passed?.overall === 'poor').length;

    return {
      totalTests,
      passedTests,
      failedTests,
      passRate: (passedTests / totalTests * 100).toFixed(1),
      averageLoadTime: (this.results.reduce((sum, r) => sum + (r.loadTime || 0), 0) / totalTests).toFixed(0),
    };
  }

  generateHtmlReport() {
    const summary = this.generateSummary();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report - Singapore Legal Help</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .good { border-left: 5px solid #4CAF50; }
        .needs-improvement { border-left: 5px solid #FF9800; }
        .poor { border-left: 5px solid #F44336; }
        .error { border-left: 5px solid #9E9E9E; background: #fafafa; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; }
        .metric { background: #f9f9f9; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${summary.totalTests}</p>
        <p><strong>Passed:</strong> ${summary.passedTests} (${summary.passRate}%)</p>
        <p><strong>Failed:</strong> ${summary.failedTests}</p>
        <p><strong>Average Load Time:</strong> ${summary.averageLoadTime}ms</p>
    </div>
    
    <h2>Detailed Results</h2>
    ${this.results.map(result => `
        <div class="result ${result.error ? 'error' : result.passed?.overall || 'poor'}">
            <h3>${result.url} - ${result.device} - ${result.network}</h3>
            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : `
                <div class="metrics">
                    <div class="metric"><strong>Load Time:</strong> ${Math.round(result.loadTime)}ms</div>
                    <div class="metric"><strong>LCP:</strong> ${Math.round(result.metrics.lcp)}ms</div>
                    <div class="metric"><strong>FCP:</strong> ${Math.round(result.metrics.fcp)}ms</div>
                    <div class="metric"><strong>CLS:</strong> ${result.metrics.cls.toFixed(3)}</div>
                    <div class="metric"><strong>FID:</strong> ${Math.round(result.metrics.fid)}ms</div>
                    <div class="metric"><strong>TTFB:</strong> ${Math.round(result.metrics.ttfb)}ms</div>
                </div>
            `}
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new PerformanceTester();
  
  try {
    await tester.initialize();
    await tester.runTests();
    await tester.generateReport();
    
    const summary = tester.generateSummary();
    console.log('\n🎯 Test Summary:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Pass Rate: ${summary.passRate}%`);
    console.log(`   Average Load Time: ${summary.averageLoadTime}ms`);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PerformanceTester;
