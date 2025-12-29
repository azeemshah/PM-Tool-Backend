#!/bin/bash

# PM Tool API - Setup Script

echo "🚀 Setting up PM Tool API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. You'll need to install it or use a cloud instance."
else
    echo "✅ MongoDB is installed"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your configuration"
echo "2. Make sure MongoDB is running"
echo "3. Run 'npm run start:dev' to start the development server"
echo ""
echo "📚 Documentation:"
echo "- README.md - Project overview"
echo "- API_EXAMPLES.md - API endpoint examples"
echo "- PROJECT_STRUCTURE.md - Detailed structure documentation"
echo ""
echo "Happy coding! 🎉"
