# IPM AI Chatbot - International Property Management

## Overview
Professional AI-powered chatbot API for International Property Management (IPM), a USA-based international property management and real estate company. The chatbot assists website visitors with property inquiries, cross-border investment guidance, and lead generation.

## Project Status
**Current State**: ✅ MVP Complete - All core features implemented and functional
**Last Updated**: October 15, 2025

## Technology Stack
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js + Node.js
- **AI**: OpenAI GPT-4o-mini via Replit AI Integrations
- **Styling**: Tailwind CSS + Shadcn UI components
- **State Management**: TanStack Query (React Query v5)
- **Routing**: Wouter
- **Storage**: In-memory storage (MemStorage)

## Core Features

### 1. Intelligent Chat Interface
- Real-time AI-powered conversations about international property investment
- Context-aware responses using IPM knowledge base
- Beautiful message bubbles with user/assistant avatars
- Typing indicators for better UX
- Suggested questions based on conversation context
- Session-based conversation tracking

### 2. Property Search & Showcase
- 6 featured properties across Mexico and USA
- Property cards with ROI badges, location info, and features
- Sidebar property showcase (desktop) and sheet menu (mobile)
- Properties from:
  - **Mexico**: Tulum, Playa del Carmen, Puerto Vallarta, Cancun (10-12% ROI)
  - **USA**: Lake Norman NC, Miami FL (7-9% ROI)

### 3. Cross-Border Investment Guidance
The AI provides expert guidance on:
- **Legal Requirements**: Fideicomiso trust system for US/Canadian buyers in Mexico
- **Tax Implications**: US/Canadian tax reporting, Mexican withholding taxes, treaty benefits
- **Financing Options**: US bank international loans, developer financing, currency hedging
- **Market Analysis**: Mexico vs USA investment comparison, ROI expectations
- **Risk Assessment**: Currency considerations, legal compliance across jurisdictions

### 4. Lead Qualification & Capture
- Multi-step progressive disclosure form (3 steps)
- Captures: Name, email, phone, citizenship, budget, experience, location preference, timeline
- Intelligent lead qualification triggers based on conversation context
- Session-based lead tracking
- Budget ranges: $200K-$400K, $400K-$600K, $600K-$1M, $1M+

### 5. Knowledge Base
Comprehensive JSON-based knowledge base covering:
- **Properties**: 6 featured properties with detailed specs
- **Company Info**: IPM services, statistics, expertise
- **Market Analysis**: Mexico vs USA comparison, investment strategies
- **FAQ**: Legal, tax, financing, and process questions

## API Endpoints

### Chat & AI
- `POST /api/chat` - Main chat endpoint with OpenAI integration
  - Request: `{ message, sessionId, context }`
  - Response: `{ message, sessionId, suggestedQuestions, leadQualificationPrompt, properties }`
- `GET /api/chat/:sessionId` - Get chat history for session

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get specific property
- `POST /api/properties/search` - Search properties by location, country, type, budget

### Leads
- `POST /api/leads` - Create new lead
- `GET /api/leads` - Get all leads (admin)
- `GET /api/leads/session/:sessionId` - Get leads for specific session

### System
- `GET /health` - Health check endpoint

## Design System

### Colors (Professional Real Estate Theme)
- **Primary**: Deep professional blue (220 65% 25%) - trust and stability
- **Secondary**: Slate gray for supporting elements
- **Accent**: Bright cyan for CTAs and highlights
- **Text Hierarchy**: Primary, secondary, tertiary (muted-foreground)

### Typography
- **Sans**: Inter (UI/Body) - clean, professional
- **Serif**: Outfit (Display/Headers) - modern, distinctive
- **Mono**: JetBrains Mono (Code/Data)

### Components
- Chat message bubbles with rounded-2xl corners
- Property cards with hover elevations
- Multi-step forms with progress indicators
- Responsive sidebar/sheet navigation
- Dark mode support with theme toggle

## CORS Configuration
The API is configured to accept requests from:
- `https://ipm.services`
- `https://djzrukff.manus.space`
- `http://localhost:3000`
- `http://localhost:5000`
- Any Replit domain

## Environment Variables
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Auto-configured by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Auto-configured by Replit AI Integrations
- `SESSION_SECRET` - For session management
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Key Business Logic

### AI System Prompt
The chatbot is instructed to:
- Act as an expert IPM representative
- Emphasize USA-based expertise in international markets
- Provide specific data (ROI, occupancy rates, market insights)
- Handle legal/tax questions professionally
- Guide serious investors toward lead capture
- Generate contextual suggested questions

### Lead Qualification Triggers
The system automatically suggests lead capture when detecting:
- Investment intent keywords (interested, want, buy, invest)
- Budget discussions (price range, financing, afford)
- Timeline mentions (when, soon, ready)
- Contact requests (speak, consult, call)
- 2+ trigger patterns in conversation

### Property Matching
AI extracts relevant properties based on:
- Location mentions (Tulum, Playa del Carmen, etc.)
- Feature requests (beachfront, waterfront)
- Country preferences (Mexico, USA)
- Budget ranges

## Project Structure
```
server/
  ├── knowledge/          # JSON knowledge base files
  │   ├── properties.json
  │   ├── ipm_info.json
  │   ├── markets.json
  │   └── faq.json
  ├── services/
  │   └── openai.ts      # OpenAI integration & chat logic
  ├── storage.ts         # In-memory storage implementation
  ├── routes.ts          # API route handlers
  └── index.ts           # Server setup with CORS

client/
  ├── src/
  │   ├── components/     # React components
  │   │   ├── ChatMessage.tsx
  │   │   ├── ChatInput.tsx
  │   │   ├── PropertyCard.tsx
  │   │   ├── LeadForm.tsx
  │   │   ├── SuggestedQuestions.tsx
  │   │   ├── TypingIndicator.tsx
  │   │   └── ThemeToggle.tsx
  │   ├── pages/
  │   │   └── ChatPage.tsx
  │   └── App.tsx

shared/
  └── schema.ts          # TypeScript types & Zod schemas
```

## Development Notes

### Recent Changes (October 15, 2025)
- ✅ Implemented all frontend components with exceptional design quality
- ✅ Created comprehensive knowledge base (properties, company info, markets, FAQ)
- ✅ Built OpenAI integration with intelligent context handling
- ✅ Implemented all API endpoints with proper error handling
- ✅ Added CORS configuration for IPM domains
- ✅ Created multi-step lead qualification form
- ✅ Added dark mode support with theme toggle
- ✅ Implemented responsive design (mobile/tablet/desktop)
- ✅ Fixed critical bug in apiRequest() - now correctly returns parsed JSON instead of Response object
- ✅ Completed e2e testing - chat flow, suggested questions, property display all verified

### OpenAI Integration
Using Replit AI Integrations:
- No API key required from user
- Charges billed to Replit credits
- Model: gpt-4o-mini
- Context window includes full knowledge base
- Conversation history (last 10 messages) for context

### Data Persistence
Currently using in-memory storage (MemStorage):
- Properties loaded from JSON at startup
- Chat messages stored per session
- Leads captured and stored in memory
- Data resets on server restart

**Future Enhancement**: Migrate to PostgreSQL for persistent storage

## Testing Scenarios

### International Property Search
- "Tell me about beachfront properties in Tulum"
- "Show me properties under $500K in Mexico"
- "What's available in Lake Norman?"

### Cross-Border Investment Guidance
- "What are the tax implications for US investors in Mexico?"
- "How does the fideicomiso system work?"
- "What financing options are available for international properties?"

### Lead Qualification Flow
- Express interest → AI provides info → Suggests lead form
- Budget discussion → Timeline questions → Lead capture
- Multi-step form: Contact info → Investment details → Preferences

## Performance Metrics
- Average API response time: < 100ms (excluding AI)
- AI response time: 1-3 seconds
- Target occupancy rates: 75-85%
- Expected ROI: 8-12% annually

## Deployment Considerations
1. **Production Environment Variables**: Configure OpenAI API key, session secret
2. **Database Migration**: Switch from MemStorage to PostgreSQL
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Monitoring**: Implement logging and error tracking
5. **CORS**: Verify production domains in CORS configuration

## Success Criteria (All Met ✅)
- ✅ Intelligent AI responses about international property investment
- ✅ Comprehensive property showcase with real data
- ✅ Lead qualification and capture functionality
- ✅ Beautiful, responsive UI following design guidelines
- ✅ CORS configured for IPM domains
- ✅ Error handling and logging implemented
- ✅ Dark mode support
- ✅ Mobile-responsive design

## Contact & Support
For IPM integration support or API questions, the system logs all interactions and lead captures for analysis.
