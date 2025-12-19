#!/bin/bash

# PM Tool API - Installation Verification Script

echo "🔍 PM Tool API - Installation Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
        ((FAILED++))
    fi
}

# Function to check directory existence
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1/ - MISSING"
        ((FAILED++))
    fi
}

echo "📁 Checking Project Structure..."
echo ""

# Root files
echo "Configuration Files:"
check_file "package.json"
check_file "tsconfig.json"
check_file "nest-cli.json"
check_file ".eslintrc.js"
check_file ".prettierrc"
check_file ".gitignore"
check_file ".env.example"
echo ""

# Docker files
echo "Docker Files:"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file ".env.docker"
echo ""

# Documentation
echo "Documentation:"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "API_EXAMPLES.md"
check_file "PROJECT_STRUCTURE.md"
check_file "DOCKER.md"
check_file "OVERVIEW.md"
echo ""

# Utilities
echo "Utilities:"
check_file "setup.sh"
check_file "postman_collection.json"
echo ""

# Source directories
echo "Source Directories:"
check_dir "src"
check_dir "src/auth"
check_dir "src/auth/dto"
check_dir "src/auth/strategies"
check_dir "src/users"
check_dir "src/users/dto"
check_dir "src/users/schemas"
check_dir "src/email"
check_dir "src/common"
check_dir "src/common/decorators"
check_dir "src/common/guards"
check_dir "src/common/filters"
check_dir "src/common/interfaces"
check_dir "src/common/validators"
check_dir "src/common/enums"
check_dir "src/common/utils"
check_dir "src/config"
echo ""

# Source files
echo "Core Application Files:"
check_file "src/main.ts"
check_file "src/app.module.ts"
echo ""

echo "Authentication Module:"
check_file "src/auth/auth.module.ts"
check_file "src/auth/auth.controller.ts"
check_file "src/auth/auth.service.ts"
check_file "src/auth/strategies/jwt.strategy.ts"
check_file "src/auth/dto/register.dto.ts"
check_file "src/auth/dto/login.dto.ts"
check_file "src/auth/dto/forgot-password.dto.ts"
check_file "src/auth/dto/reset-password.dto.ts"
check_file "src/auth/dto/change-password.dto.ts"
check_file "src/auth/dto/auth-response.dto.ts"
echo ""

echo "Users Module:"
check_file "src/users/users.module.ts"
check_file "src/users/users.controller.ts"
check_file "src/users/users.service.ts"
check_file "src/users/schemas/user.schema.ts"
check_file "src/users/dto/create-user.dto.ts"
check_file "src/users/dto/update-user.dto.ts"
check_file "src/users/dto/user-response.dto.ts"
echo ""

echo "Email Module:"
check_file "src/email/email.module.ts"
check_file "src/email/email.service.ts"
echo ""

echo "Common Module:"
check_file "src/common/guards/jwt-auth.guard.ts"
check_file "src/common/guards/roles.guard.ts"
check_file "src/common/decorators/roles.decorator.ts"
check_file "src/common/decorators/current-user.decorator.ts"
check_file "src/common/filters/all-exceptions.filter.ts"
check_file "src/common/interfaces/jwt-payload.interface.ts"
check_file "src/common/interfaces/api-response.interface.ts"
check_file "src/common/validators/password.validator.ts"
check_file "src/common/enums/user.enum.ts"
check_file "src/common/utils/response.util.ts"
echo ""

echo "Configuration:"
check_file "src/config/configuration.ts"
check_file "src/config/validation.ts"
check_file "src/config/database.config.ts"
echo ""

# Summary
echo "=========================================="
echo "📊 Verification Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your project structure is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm install' to install dependencies"
    echo "2. Copy .env.example to .env and configure it"
    echo "3. Start MongoDB"
    echo "4. Run 'npm run start:dev' to start the application"
    echo ""
    echo "For detailed instructions, see QUICKSTART.md"
else
    echo -e "${RED}❌ Some files are missing. Please check the failed items above.${NC}"
    exit 1
fi
