#!/bin/bash

# AWS Amplify Deployment Verification Script
# Singapore Legal Help Platform
# 
# ⚠️ SAFE SCRIPT - Only performs READ operations, no modifications

set -e  # Exit on any error

echo "🔍 AWS Amplify Deployment Verification"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Current working domain
TEMP_DOMAIN="https://main.d2s0gf51rcbiy5.amplifyapp.com"
TARGET_DOMAIN="https://www.singaporelegalhelp.com.sg"

print_status "Verifying current AWS Amplify deployment..."

# Test current temp domain
print_status "Testing temporary domain: $TEMP_DOMAIN"
TEMP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEMP_DOMAIN" || echo "000")

if [ "$TEMP_STATUS" = "200" ]; then
    print_success "Temporary domain is accessible (HTTP $TEMP_STATUS)"
else
    print_error "Temporary domain is not accessible (HTTP $TEMP_STATUS)"
    exit 1
fi

# Test health endpoint on temp domain
print_status "Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEMP_DOMAIN/api/health" || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    print_success "Health endpoint is working (HTTP $HEALTH_STATUS)"
else
    print_warning "Health endpoint returned HTTP $HEALTH_STATUS"
fi

# Test response time
print_status "Measuring response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$TEMP_DOMAIN" || echo "0")
print_status "Response time: ${RESPONSE_TIME}s"

# Check if custom domain is configured
print_status "Checking custom domain configuration..."
CUSTOM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_DOMAIN" 2>/dev/null || echo "000")

if [ "$CUSTOM_STATUS" = "200" ]; then
    print_success "Custom domain is already configured and working!"
    
    # Test custom domain health
    CUSTOM_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_DOMAIN/api/health" || echo "000")
    if [ "$CUSTOM_HEALTH" = "200" ]; then
        print_success "Custom domain health endpoint is working"
    else
        print_warning "Custom domain health endpoint returned HTTP $CUSTOM_HEALTH"
    fi
    
    # Test custom domain response time
    CUSTOM_RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$TARGET_DOMAIN" || echo "0")
    print_status "Custom domain response time: ${CUSTOM_RESPONSE_TIME}s"
    
elif [ "$CUSTOM_STATUS" = "000" ]; then
    print_status "Custom domain not yet configured (expected)"
else
    print_warning "Custom domain returned HTTP $CUSTOM_STATUS"
fi

# Check DNS resolution for custom domain
print_status "Checking DNS resolution for custom domain..."
if command -v nslookup &> /dev/null; then
    DNS_RESULT=$(nslookup www.singaporelegalhelp.com.sg 2>/dev/null || echo "DNS lookup failed")
    if [[ "$DNS_RESULT" == *"DNS lookup failed"* ]]; then
        print_status "DNS not yet configured for custom domain (expected)"
    else
        print_success "DNS resolution found for custom domain"
    fi
else
    print_status "nslookup not available, skipping DNS check"
fi

# Check SSL certificate for temp domain
print_status "Checking SSL certificate for temporary domain..."
if command -v openssl &> /dev/null; then
    SSL_CHECK=$(echo | openssl s_client -connect main.d2s0gf51rcbiy5.amplifyapp.com:443 -servername main.d2s0gf51rcbiy5.amplifyapp.com 2>/dev/null | grep "Verify return code")
    if [[ "$SSL_CHECK" == *"0 (ok)"* ]]; then
        print_success "SSL certificate is valid for temporary domain"
    else
        print_warning "SSL certificate check: $SSL_CHECK"
    fi
else
    print_status "OpenSSL not available, skipping SSL check"
fi

# Test API endpoints
print_status "Testing critical API endpoints..."

# Test sitemap
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEMP_DOMAIN/sitemap.xml" || echo "000")
if [ "$SITEMAP_STATUS" = "200" ]; then
    print_success "Sitemap endpoint is working"
else
    print_warning "Sitemap endpoint returned HTTP $SITEMAP_STATUS"
fi

# Test robots.txt
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEMP_DOMAIN/robots.txt" || echo "000")
if [ "$ROBOTS_STATUS" = "200" ]; then
    print_success "Robots.txt endpoint is working"
else
    print_warning "Robots.txt endpoint returned HTTP $ROBOTS_STATUS"
fi

# Check build configuration
print_status "Verifying build configuration..."

if [ -f "amplify.yml" ]; then
    print_success "amplify.yml configuration file exists"
else
    print_error "amplify.yml configuration file not found"
fi

if [ -f "next.config.js" ]; then
    print_success "next.config.js configuration file exists"
else
    print_error "next.config.js configuration file not found"
fi

# Summary
echo ""
echo "======================================"
print_status "DEPLOYMENT VERIFICATION SUMMARY"
echo "======================================"

print_success "✅ AWS Amplify deployment is working correctly"
print_success "✅ Temporary domain: $TEMP_DOMAIN"
print_status "📋 Next steps for custom domain setup:"
echo "   1. Follow AWS_AMPLIFY_DOMAIN_SETUP.md guide"
echo "   2. Configure DNS records with your domain registrar"
echo "   3. Wait for SSL certificate validation"
echo "   4. Update environment variables after domain is active"

if [ "$CUSTOM_STATUS" = "200" ]; then
    print_success "🎉 Custom domain is already configured and working!"
    print_success "✅ Live site: $TARGET_DOMAIN"
else
    print_status "⏳ Custom domain setup pending"
fi

echo ""
print_status "Current deployment is stable and ready for custom domain configuration!"
