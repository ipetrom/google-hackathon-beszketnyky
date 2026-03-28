# RentOS - AI-Powered Rental Property Management Platform

RentOS eliminates time-consuming tasks for Polish landlords managing multiple rental properties by transforming hours of manual listing creation, tenant communication, and property inspections into a seamless, AI-powered workflow that takes under 2 minutes per property.

## Features

- **AI-Powered Apartment Inventory Generation**: Upload photos → AI creates detailed inventory
- **Multi-Platform Listing Generator**: Generate optimized listings for otodom.pl, olx.pl, Airbnb, Booking.com
- **AI Tenant Inquiry Concierge**: Automated chatbot answers tenant questions with human-in-the-loop escalation
- **Visual Move-Out Damage Detection**: AI compares photos to detect missing items and damage
- **Landlord Dashboard**: Dual-view (table + calendar) for managing all properties

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS

### Backend
- **Framework**: Python 3.12 + FastAPI
- **AI/ML**: LangChain, Google Gemini API
- **Database**: PostgreSQL 16
- **Storage**: Google Cloud Storage

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Cloud**: Google Cloud Platform (GCP)

## Project Structure

```
rentos/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── Dockerfile
│
├── backend/               # FastAPI backend application
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Configuration
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── agents/       # LangChain AI agents
│   ├── pyproject.toml    # Poetry dependencies
│   └── Dockerfile
│
├── database/              # Database scripts
│   └── migrations/       # Alembic migrations
│
├── .docker/               # Docker configurations
├── context/               # AWOS project documentation
│   ├── product/          # Product definition & roadmap
│   └── spec/             # Specifications
│
├── .claude/               # Claude Code configuration
│   ├── agents/           # Specialist agent definitions
│   └── commands/         # Custom slash commands
│
└── docker-compose.yml    # Multi-container setup
```

## Prerequisites

- **Python**: 3.12+
- **Node.js**: 18+
- **Poetry**: Python package manager
- **Docker & Docker Compose**: For containerized services
- **GCP Account**: For Gemini API and Cloud Storage

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd google-hackathon-beszketnyky
```

### 2. Set Up Environment Variables

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit .env files with your credentials:
# - GEMINI_API_KEY: Your Google Gemini API key
# - GCP_PROJECT_ID: Your GCP project ID
# - GCS_BUCKET_NAME: Your Cloud Storage bucket name
```

### 3. Set Up GCP Service Account

```bash
# Download your GCP service account JSON key
# Save it as gcp-credentials.json in the project root
# Ensure it has permissions for:
# - Cloud Storage (read/write)
# - Generative AI (Gemini API access)
```

### 4. Start with Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - PostgreSQL: localhost:5432
```

### 5. Alternative: Local Development Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Database Setup

```bash
# Start PostgreSQL with Docker
docker run -d \
  --name rentos-db \
  -e POSTGRES_DB=rentos \
  -e POSTGRES_USER=rentos_user \
  -e POSTGRES_PASSWORD=rentos_password \
  -p 5432:5432 \
  postgres:16-alpine
```

## Development Workflow

### Backend Development

```bash
cd backend

# Add new dependency
poetry add <package-name>

# Run tests
poetry run pytest

# Format code
poetry run black .

# Type checking
poetry run mypy app/

# Lint code
poetry run ruff check .
```

### Frontend Development

```bash
cd frontend

# Add new dependency
npm install <package-name>

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build
```

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## AWOS Framework Commands

This project uses the AWOS (AI Work Organization System) framework:

- `/awos:product` - Define product vision and features
- `/awos:roadmap` - Plan implementation phases
- `/awos:architecture` - Define system architecture
- `/awos:hire` - Set up specialist agents
- `/awos:spec` - Create functional specifications
- `/awos:tech` - Define technical specifications
- `/awos:tasks` - Generate implementation tasks
- `/awos:implement` - Execute implementation with agents
- `/awos:verify` - Verify completion criteria

## Specialist Agents

Configured agents for this project:
- **nextjs-frontend**: Next.js, React, TypeScript, Tailwind CSS
- **python-backend**: FastAPI, LangChain, Gemini API integration
- **postgres-database**: PostgreSQL, SQLAlchemy, database design
- **gcp-infra**: GCP, Docker, deployment configuration

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass and code is formatted
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please create an issue in the repository.

---

Built with Claude Code and the AWOS Framework