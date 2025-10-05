#!/bin/bash

# Secure Deployment Script for Analos Blockchain Integration
# This script ensures secure deployment with all security checks

set -e  # Exit on any error

echo "🚀 Starting secure deployment of Analos Blockchain Integration..."

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Security audit
run_security_audit() {
    print_status "Running security audit..."
    
    # NPM audit
    if ! npm audit --audit-level high; then
        print_warning "Security vulnerabilities found. Please review and fix before deployment."
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled due to security concerns"
            exit 1
        fi
    fi
    
    # Snyk security scan (if available)
    if command -v snyk &> /dev/null; then
        print_status "Running Snyk security scan..."
        if ! snyk test; then
            print_warning "Snyk found security issues"
            read -p "Continue deployment? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Deployment cancelled due to security concerns"
                exit 1
            fi
        fi
    fi
    
    print_success "Security audit completed"
}

# Environment validation
validate_environment() {
    print_status "Validating environment..."
    
    # Check for required environment variables
    required_vars=(
        "ANALOS_RPC_URL"
        "ADMIN_WALLET_ADDRESS"
        "FEE_RECIPIENT_ADDRESS"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    # Validate wallet addresses
    if [[ ! "$ADMIN_WALLET_ADDRESS" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]]; then
        print_error "Invalid ADMIN_WALLET_ADDRESS format"
        exit 1
    fi
    
    if [[ ! "$FEE_RECIPIENT_ADDRESS" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]]; then
        print_error "Invalid FEE_RECIPIENT_ADDRESS format"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -f "package-lock.json" ]; then
        print_warning "No package-lock.json found, generating..."
        npm install --package-lock-only
    fi
    
    npm ci --production=false
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    print_status "Running test suite..."
    
    if ! npm test; then
        print_error "Tests failed"
        exit 1
    fi
    
    print_success "All tests passed"
}

# Build application
build_application() {
    print_status "Building application..."
    
    if ! npm run build; then
        print_error "Build failed"
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Security hardening
apply_security_hardening() {
    print_status "Applying security hardening..."
    
    # Set secure file permissions
    find . -type f -name "*.js" -exec chmod 644 {} \;
    find . -type f -name "*.ts" -exec chmod 644 {} \;
    find . -type f -name "package.json" -exec chmod 644 {} \;
    
    # Remove development files
    rm -rf tests/
    rm -rf src/lib/security/test/
    rm -f *.test.js
    rm -f *.test.ts
    
    # Create .env.production from template
    if [ -f ".env.template" ]; then
        cp .env.template .env.production
        print_status "Created production environment file"
    fi
    
    print_success "Security hardening applied"
}

# Deploy to production
deploy_to_production() {
    print_status "Deploying to production..."
    
    # This would typically deploy to your hosting platform
    # For now, we'll just prepare the deployment
    
    # Create deployment package
    tar -czf analos-blockchain-integration-$(date +%Y%m%d-%H%M%S).tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=tests \
        --exclude=*.test.* \
        .
    
    print_success "Deployment package created"
    print_status "Manual deployment steps:"
    echo "  1. Upload the deployment package to your server"
    echo "  2. Extract and install dependencies: npm ci --production"
    echo "  3. Start the application: npm start"
    echo "  4. Verify deployment: curl http://localhost:3000/health"
}

# Post-deployment verification
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if application is running
    if command -v curl &> /dev/null; then
        sleep 5  # Wait for application to start
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            print_success "Application is running and healthy"
        else
            print_warning "Could not verify application health"
        fi
    fi
    
    print_success "Deployment verification completed"
}

# Main deployment flow
main() {
    print_status "Starting secure deployment process..."
    
    check_dependencies
    run_security_audit
    validate_environment
    install_dependencies
    run_tests
    build_application
    apply_security_hardening
    deploy_to_production
    verify_deployment
    
    print_success "🎉 Secure deployment completed successfully!"
    print_status "Next steps:"
    echo "  1. Monitor application logs for any issues"
    echo "  2. Verify all endpoints are working correctly"
    echo "  3. Test wallet connections and transactions"
    echo "  4. Monitor security alerts and metrics"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
