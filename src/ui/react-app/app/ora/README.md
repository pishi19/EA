# Ora - Platform Consciousness for Workstream Creation

## Overview

Ora is the intelligent consciousness of the platform that helps users create well-structured workstreams with strong foundations for success. It acts as a conversational guide to ensure every workstream has:

- **Vision**: A clear, measurable future state
- **Mission**: Concrete daily activities to achieve the vision  
- **Cadence**: The rhythm of work (daily standups, weekly reviews, etc.)

## Architecture

### Directory Structure
```
/ora
  /components      - React UI components
  /api            - API routes for Ora functionality
  /lib            - Shared utilities and helpers
  /hooks          - Custom React hooks
  /types          - TypeScript type definitions
  /tests          - Test files
```

### Key Components

1. **OraChat**: Main conversation interface
2. **WorkstreamList**: Displays existing workstreams with constitutions
3. **OraPatterns**: Shows learned patterns for better suggestions
4. **WorkstreamWizard**: Guided creation flow

### Database Schema

- `ora_conversations`: Stores conversation history
- `workstream_constitutions`: Stores workstream requirements (vision, mission, cadence)
- `ora_patterns`: Stores learned patterns for improved suggestions

### API Endpoints

- `POST /api/ora/chat`: Send message to Ora
- `GET/POST /api/ora/workstreams`: Manage workstreams
- `GET/POST /api/ora/patterns`: Manage learned patterns

## Tech Stack

- Frontend: Next.js 14+, React 18, TypeScript 5
- UI Components: shadcn/ui, Tailwind CSS
- Database: PostgreSQL with workstream integration
- API: Next.js API Routes
- LLM Integration: OpenAI API (gpt-4)
- Testing: Jest, React Testing Library
- State Management: React hooks + Context

## Development

### Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables (see .env.example)
3. Run database migrations
4. Start development: `npm run dev`
5. Navigate to `/ora`

### Testing

```bash
npm run test:ora        # Run Ora-specific tests
npm run test:ora:watch  # Run tests in watch mode
npm run test:ora:e2e    # Run E2E tests
```

## Integration Points

- Uses existing workstream creation logic from `/admin`
- Adds constitution data to new `workstream_constitutions` table
- Logs all actions to existing audit system
- Respects existing RBAC permissions
- Created workstreams appear in `/admin` list

## Security

- Input sanitization for all user messages
- Rate limiting on API endpoints
- Parameterized database queries
- Error messages don't expose sensitive data