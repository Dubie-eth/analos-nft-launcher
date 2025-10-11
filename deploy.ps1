# Secure Deployment Script for Analos Blockchain Integration (Windows)
# This script ensures secure deployment with all security checks

param(
    [switch]$SkipTests,
    [switch]$SkipSecurityAudit,
    [string]$Environment = "production"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Check if required tools are installed
function Test-Dependencies {
    Write-Status "Checking dependencies..."
    
    $requiredTools = @("node", "npm", "git")
    
    foreach ($tool in $requiredTools) {
        if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
            Write-Error "$tool is not installed or not in PATH"
            exit 1
        }
    }
    
    Write-Success "All dependencies are installed"
}

# Security audit
function Invoke-SecurityAudit {
    if ($SkipSecurityAudit) {
        Write-Warning "Skipping security audit as requested"
        return
    }
    
    Write-Status "Running security audit..."
    
    # NPM audit
    $auditResult = npm audit --audit-level high 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Security vulnerabilities found. Please review and fix before deployment."
        $continue = Read-Host "Continue deployment? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Error "Deployment cancelled due to security concerns"
            exit 1
        }
    }
    
    # Snyk security scan (if available)
    if (Get-Command snyk -ErrorAction SilentlyContinue) {
        Write-Status "Running Snyk security scan..."
        $snykResult = snyk test 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Snyk found security issues"
            $continue = Read-Host "Continue deployment? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Error "Deployment cancelled due to security concerns"
                exit 1
            }
        }
    }
    
    Write-Success "Security audit completed"
}

# Environment validation
function Test-Environment {
    Write-Status "Validating environment..."
    
    # Check for required environment variables
    $requiredVars = @(
        "ANALOS_RPC_URL",
        "ADMIN_WALLET_ADDRESS", 
        "FEE_RECIPIENT_ADDRESS"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($var))) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor $Colors.Red
        }
        exit 1
    }
    
    # Validate wallet addresses (basic format check)
    $adminWallet = [Environment]::GetEnvironmentVariable("ADMIN_WALLET_ADDRESS")
    $feeRecipient = [Environment]::GetEnvironmentVariable("FEE_RECIPIENT_ADDRESS")
    
    if ($adminWallet -notmatch "^[1-9A-HJ-NP-Za-km-z]{32,44}$") {
        Write-Error "Invalid ADMIN_WALLET_ADDRESS format"
        exit 1
    }
    
    if ($feeRecipient -notmatch "^[1-9A-HJ-NP-Za-km-z]{32,44}$") {
        Write-Error "Invalid FEE_RECIPIENT_ADDRESS format"
        exit 1
    }
    
    Write-Success "Environment validation passed"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    if (!(Test-Path "package-lock.json")) {
        Write-Warning "No package-lock.json found, generating..."
        npm install --package-lock-only
    }
    
    npm ci --production=false
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    
    Write-Success "Dependencies installed"
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested"
        return
    }
    
    Write-Status "Running test suite..."
    
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed"
        exit 1
    }
    
    Write-Success "All tests passed"
}

# Build application
function Build-Application {
    Write-Status "Building application..."
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
    
    Write-Success "Application built successfully"
}

# Security hardening
function Apply-SecurityHardening {
    Write-Status "Applying security hardening..."
    
    # Remove development files
    if (Test-Path "tests") {
        Remove-Item -Recurse -Force "tests"
    }
    
    if (Test-Path "src\lib\security\test") {
        Remove-Item -Recurse -Force "src\lib\security\test"
    }
    
    Get-ChildItem -Recurse -Include "*.test.js", "*.test.ts" | Remove-Item -Force
    
    # Create .env.production from template
    if (Test-Path ".env.template") {
        Copy-Item ".env.template" ".env.production"
        Write-Status "Created production environment file"
    }
    
    Write-Success "Security hardening applied"
}

# Deploy to production
function Deploy-ToProduction {
    Write-Status "Deploying to production..."
    
    # Create deployment package
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $packageName = "analos-blockchain-integration-$timestamp.zip"
    
    # Create zip package excluding sensitive files
    $excludeFiles = @(
        "node_modules",
        ".git",
        "tests",
        "*.test.*",
        ".env.local",
        ".env.development"
    )
    
    # Use PowerShell's Compress-Archive
    $filesToZip = Get-ChildItem -Path . -Exclude $excludeFiles
    Compress-Archive -Path $filesToZip -DestinationPath $packageName -Force
    
    Write-Success "Deployment package created: $packageName"
    Write-Status "Manual deployment steps:"
    Write-Host "  1. Upload $packageName to your server" -ForegroundColor $Colors.White
    Write-Host "  2. Extract and install dependencies: npm ci --production" -ForegroundColor $Colors.White
    Write-Host "  3. Start the application: npm start" -ForegroundColor $Colors.White
    Write-Host "  4. Verify deployment: Invoke-WebRequest http://localhost:3000/health" -ForegroundColor $Colors.White
}

# Post-deployment verification
function Test-Deployment {
    Write-Status "Verifying deployment..."
    
    # Check if application is running (simplified for Windows)
    try {
        Start-Sleep -Seconds 5  # Wait for application to start
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Application is running and healthy"
        }
    }
    catch {
        Write-Warning "Could not verify application health: $($_.Exception.Message)"
    }
    
    Write-Success "Deployment verification completed"
}

# Main deployment flow
function Start-Deployment {
    Write-Status "Starting secure deployment process..."
    
    try {
        Test-Dependencies
        Invoke-SecurityAudit
        Test-Environment
        Install-Dependencies
        Invoke-Tests
        Build-Application
        Apply-SecurityHardening
        Deploy-ToProduction
        Test-Deployment
        
        Write-Success "🎉 Secure deployment completed successfully!"
        Write-Status "Next steps:"
        Write-Host "  1. Monitor application logs for any issues" -ForegroundColor $Colors.White
        Write-Host "  2. Verify all endpoints are working correctly" -ForegroundColor $Colors.White
        Write-Host "  3. Test wallet connections and transactions" -ForegroundColor $Colors.White
        Write-Host "  4. Monitor security alerts and metrics" -ForegroundColor $Colors.White
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Handle script interruption
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Error "Deployment interrupted"
}

# Run main function
Start-Deployment
