# QuickQuiz

A modern quiz application that leverages AI to create and manage interactive quizzes. Built with Next.js, MongoDB, and OpenAI.

## Features

- AI-powered quiz generation
- User authentication with Google OAuth
- Interactive quiz taking experience
- User progress tracking and statistics
- Responsive design with Tailwind CSS

## Local Setup & Run Steps

### Prerequisites

- MongoDB
- Google OAuth credentials
- OpenAI API key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quiz_ai_app.git
cd quiz_ai_app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser


## Architectural Trade-offs

### NoSQL (MongoDB) vs SQL Database
- **Chosen**: NoSQL (MongoDB)
- **Pros**: 
  - Native JSON support aligns well with JavaScript/TypeScript
  - Simpler to model hierarchical data (quizzes, questions, attempts)
- **Cons**: 
  - Less strict data consistency guarantees

### Authentication Strategy
- **Chosen**: NextAuth.js with Google OAuth
- **Pros**: Easy to implement, secure, supports multiple providers
- **Cons**: Additional dependency, requires external OAuth setup

## Test Plan

### Unit Tests

1. **Quiz Generation**
   - Test OpenAI prompt formatting
   - Test quiz validation logic
   - Test difficulty level calculations
   - Edge cases where prompt is able to be broken and sent back wrong format

2. **User Authentication**
   - Test user creation flow
   - Test session management

3. **Quiz Management**
   - Test quiz creation
   - Test quiz validation
   - Test quiz update/delete operations

### Integration Tests

1. **API Routes**
   - Test quiz creation endpoint
   - Test quiz submission endpoint
   - Test user statistics endpoint

2. **Database Operations**
   - Test user creation and retrieval
   - Test quiz storage and retrieval
   - Test attempt tracking

### End-to-End Tests

1. **User Journeys**
   - Complete quiz creation flow
   - Complete quiz taking flow
   - User profile management

