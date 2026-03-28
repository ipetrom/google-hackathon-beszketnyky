# RentOS Backend

FastAPI backend service for RentOS - AI-powered rental property management platform.

## Tech Stack

- **Framework**: FastAPI (Python 3.12)
- **AI/ML**: LangChain, Google Gemini API
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Storage**: Google Cloud Storage
- **Package Manager**: Poetry

## Setup

### Prerequisites

- Python 3.12+
- Poetry
- Docker & Docker Compose (for PostgreSQL)

### Installation

1. Install dependencies:
```bash
cd backend
poetry install
```

2. Activate virtual environment:
```bash
poetry shell
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your GCP credentials and API keys
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Configuration, settings
│   ├── models/        # SQLAlchemy models
│   ├── services/      # Business logic
│   └── agents/        # LangChain AI agents
├── tests/             # Test suite
└── alembic/           # Database migrations
```
