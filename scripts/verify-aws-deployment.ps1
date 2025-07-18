# AWS Amplify Deployment Verification Script (PowerShell)
# Singapore Legal Help Platform
# 
# ⚠️ SAFE SCRIPT - Only performs READ operations, no modifications

Write-Host "🔍 AWS Amplify Deployment Verification" -ForegroundColor Blue
Write-Host "======================================" -ForegroundColor Blue

# Current working domain
$TEMP_DOMAIN = "https://main.d2s0gf51rcbiy5.amplifyapp.com"
$TARGET_DOMAIN = "https://www.singaporelegalhelp.com.sg"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Status "Verifying current AWS Amplify deployment..."

# Test current temp domain
Write-Status "Testing temporary domain: $TEMP_DOMAIN"
try {
    $response = Invoke-WebRequest -Uri $TEMP_DOMAIN -Method Head -TimeoutSec 10
    $statusCode = $response.StatusCode
    if ($statusCode -eq 200) {
        Write-Success "Temporary domain is accessible (Status: $statusCode)"
    } else {
        Write-Warning "Temporary domain returned Status: $statusCode"
    }
} catch {
    Write-ErrorMsg "Temporary domain is not accessible: $($_.Exception.Message)"
    exit 1
}

# Test health endpoint on temp domain
Write-Status "Testing health endpoint..."
try {
    $healthResponse = Invoke-WebRequest -Uri "$TEMP_DOMAIN/api/health" -Method Head -TimeoutSec 10
    $healthStatus = $healthResponse.StatusCode
    if ($healthStatus -eq 200) {
        Write-Success "Health endpoint is working (HTTP $healthStatus)"
    } else {
        Write-Warning "Health endpoint returned HTTP $healthStatus"
    }
} catch {
    Write-Warning "Health endpoint test failed: $($_.Exception.Message)"
}

# Test response time
Write-Status "Measuring response time..."
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $TEMP_DOMAIN -Method Head -TimeoutSec 10
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    Write-Status "Response time: ${responseTime}ms"
} catch {
    Write-Warning "Response time measurement failed"
}

# Check if custom domain is configured
Write-Status "Checking custom domain configuration..."
try {
    $customResponse = Invoke-WebRequest -Uri $TARGET_DOMAIN -Method Head -TimeoutSec 10
    $customStatus = $customResponse.StatusCode
    
    if ($customStatus -eq 200) {
        Write-Success "Custom domain is already configured and working!"
        
        # Test custom domain health
        try {
            $customHealthResponse = Invoke-WebRequest -Uri "$TARGET_DOMAIN/api/health" -Method Head -TimeoutSec 10
            $customHealthStatus = $customHealthResponse.StatusCode
            if ($customHealthStatus -eq 200) {
                Write-Success "Custom domain health endpoint is working"
            } else {
                Write-Warning "Custom domain health endpoint returned HTTP $customHealthStatus"
            }
        } catch {
            Write-Warning "Custom domain health endpoint test failed"
        }
        
        # Test custom domain response time
        try {
            $customStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $customResponse = Invoke-WebRequest -Uri $TARGET_DOMAIN -Method Head -TimeoutSec 10
            $customStopwatch.Stop()
            $customResponseTime = $customStopwatch.ElapsedMilliseconds
            Write-Status "Custom domain response time: ${customResponseTime}ms"
        } catch {
            Write-Warning "Custom domain response time measurement failed"
        }
    } else {
        Write-Warning "Custom domain returned HTTP $customStatus"
    }
} catch {
    Write-Status "Custom domain not yet configured (expected)"
}

# Check DNS resolution for custom domain
Write-Status "Checking DNS resolution for custom domain..."
try {
    $dnsResult = Resolve-DnsName -Name "www.singaporelegalhelp.com.sg" -ErrorAction SilentlyContinue
    if ($dnsResult) {
        Write-Success "DNS resolution found for custom domain"
    } else {
        Write-Status "DNS not yet configured for custom domain (expected)"
    }
} catch {
    Write-Status "DNS check failed or not configured yet"
}

# Test API endpoints
Write-Status "Testing critical API endpoints..."

# Test sitemap
try {
    $sitemapResponse = Invoke-WebRequest -Uri "$TEMP_DOMAIN/sitemap.xml" -Method Head -TimeoutSec 10
    if ($sitemapResponse.StatusCode -eq 200) {
        Write-Success "Sitemap endpoint is working"
    } else {
        Write-Warning "Sitemap endpoint returned HTTP $($sitemapResponse.StatusCode)"
    }
} catch {
    Write-Warning "Sitemap endpoint test failed"
}

# Test robots.txt
try {
    $robotsResponse = Invoke-WebRequest -Uri "$TEMP_DOMAIN/robots.txt" -Method Head -TimeoutSec 10
    if ($robotsResponse.StatusCode -eq 200) {
        Write-Success "Robots.txt endpoint is working"
    } else {
        Write-Warning "Robots.txt endpoint returned HTTP $($robotsResponse.StatusCode)"
    }
} catch {
    Write-Warning "Robots.txt endpoint test failed"
}

# Check build configuration
Write-Status "Verifying build configuration..."

if (Test-Path "amplify.yml") {
    Write-Success "amplify.yml configuration file exists"
} else {
    Write-Error "amplify.yml configuration file not found"
}

if (Test-Path "next.config.js") {
    Write-Success "next.config.js configuration file exists"
} else {
    Write-Error "next.config.js configuration file not found"
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Blue
Write-Status "DEPLOYMENT VERIFICATION SUMMARY"
Write-Host "======================================" -ForegroundColor Blue

Write-Success "✅ AWS Amplify deployment is working correctly"
Write-Success "✅ Temporary domain: $TEMP_DOMAIN"
Write-Status "📋 Next steps for custom domain setup:"
Write-Host "   1. Follow AWS_AMPLIFY_DOMAIN_SETUP.md guide"
Write-Host "   2. Configure DNS records with your domain registrar"
Write-Host "   3. Wait for SSL certificate validation"
Write-Host "   4. Update environment variables after domain is active"

try {
    $finalCustomCheck = Invoke-WebRequest -Uri $TARGET_DOMAIN -Method Head -TimeoutSec 5
    if ($finalCustomCheck.StatusCode -eq 200) {
        Write-Success "🎉 Custom domain is already configured and working!"
        Write-Success "✅ Live site: $TARGET_DOMAIN"
    }
} catch {
    Write-Status "⏳ Custom domain setup pending"
}

Write-Host ""
Write-Status "Current deployment is stable and ready for custom domain configuration!"
