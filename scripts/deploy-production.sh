#!/bin/bash
# Make script executable
chmod +x "$0"

# Production Deployment Script for Singapore Legal Help Platform
# singaporelegalhelp.com.sg

set -e  # Exit on any error

echo "🚀 Starting Production Deployment for Singapore Legal Help Platform"
echo "=================================================="

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

print_success "Prerequisites check completed"

# Environment validation
print_status "Validating environment configuration..."

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found. Please create it with production environment variables."
    exit 1
fi

# Check for required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXTAUTH_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.production; then
        print_error "Required environment variable $var not found in .env.production"
        exit 1
    fi
done

print_success "Environment validation completed"

# Clean build
print_status "Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf public/sw.js
rm -rf public/workbox-*.js

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Type checking
print_status "Running TypeScript type checking..."
npm run type-check

# Linting
print_status "Running ESLint..."
npm run lint

# Build application
print_status "Building application for production..."
npm run build

print_success "Build completed successfully"

# Security checks
print_status "Running security checks..."

# Check for sensitive data in build
if grep -r "localhost" .next/ 2>/dev/null; then
    print_warning "Found localhost references in build. Please review."
fi

# Check for development environment variables
if grep -r "development" .next/ 2>/dev/null; then
    print_warning "Found development references in build. Please review."
fi

print_success "Security checks completed"

# Deploy to Vercel
print_status "Deploying to Vercel..."

# Login to Vercel (if not already logged in)
vercel whoami || vercel login

# Deploy to production
vercel --prod --yes

print_success "Deployment to Vercel completed"

# Post-deployment checks
print_status "Running post-deployment checks..."

# Wait for deployment to be ready
sleep 30

# Check if site is accessible
SITE_URL="https://singaporelegalhelp.com.sg"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Site is accessible at $SITE_URL"
else
    print_error "Site is not accessible. HTTP Status: $HTTP_STATUS"
    exit 1
fi

# Check SSL certificate
print_status "Checking SSL certificate..."
SSL_CHECK=$(curl -s -I "$SITE_URL" | grep -i "strict-transport-security" || echo "")
if [ -n "$SSL_CHECK" ]; then
    print_success "SSL security headers are present"
else
    print_warning "SSL security headers may not be configured properly"
fi

# Performance check
print_status "Running basic performance check..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL")
print_status "Response time: ${RESPONSE_TIME}s"

print_success "Post-deployment checks completed"

echo "=================================================="
print_success "🎉 Production deployment completed successfully!"
echo ""
print_status "Site URL: $SITE_URL"
print_status "Admin Dashboard: $SITE_URL/admin"
print_status "API Health Check: $SITE_URL/api/health"
echo ""
print_status "Next steps:"
echo "1. Configure domain DNS settings"
echo "2. Set up monitoring and alerts"
echo "3. Configure backup procedures"
echo "4. Update documentation"
echo ""
print_warning "Remember to:"
echo "- Monitor application logs"
echo "- Set up automated backups"
echo "- Configure monitoring alerts"
echo "- Update security certificates regularly"
