# IPM AI Chatbot - International Property Management

## Overview
The IPM AI Chatbot is a professional AI-powered chatbot API designed for International Property Management (IPM), a USA-based international property management and real estate company. Its primary purpose is to assist website visitors with property inquiries, provide expert cross-border investment guidance, and facilitate lead generation. The project aims to enhance user engagement, streamline inquiry processes, and drive sales by offering intelligent, context-aware assistance.

## User Preferences
I prefer iterative development with clear communication at each stage. Ask before making major changes or architectural decisions. I value detailed explanations but also appreciate conciseness. Ensure the AI acts as an expert IPM representative, focusing on USA-based expertise in international markets, providing specific data (ROI, occupancy rates), handling legal/tax questions professionally, guiding serious investors toward lead capture, and generating contextual suggested questions. Do not make changes to the folder `Z` and the file `Y`.

## System Architecture
The system is built with a **React + TypeScript** frontend using **Vite**, an **Express.js + Node.js** backend, and a **PostgreSQL** database with **Drizzle ORM**. **OpenAI GPT-4o-mini** powers the AI functionalities via Replit AI Integrations. Styling is handled by **Tailwind CSS** and **Shadcn UI components**. State management utilizes **TanStack Query (React Query v5)**, routing uses **Wouter**, and internationalization is provided by **i18next** for English/Spanish support.

**UI/UX Decisions:**
The design adheres to a professional real estate theme with a primary deep professional blue, secondary slate gray, and accent bright cyan. Typography uses Inter for UI/Body, Outfit for Display/Headers, and JetBrains Mono for Code/Data. Components include chat message bubbles with rounded corners, property cards with hover elevations, multi-step forms with progress indicators, and responsive sidebar/sheet navigation. Dark mode support is integrated.

**Technical Implementations:**
- **Intelligent Chat Interface:** Real-time, context-aware AI conversations with user/assistant avatars, typing indicators, and suggested questions.
- **Property Search & Showcase:** Displays 6 featured properties with ROI badges, location, and features.
- **Cross-Border Investment Guidance:** AI provides expert advice on legal requirements (Fideicomiso), tax implications, financing options, market analysis (Mexico vs USA), and risk assessment.
- **Lead Qualification & Capture:** A multi-step progressive disclosure form captures user details, with intelligent triggers for lead qualification based on conversation context.
- **Knowledge Base:** Comprehensive JSON-based knowledge covering properties, company info, market analysis, and FAQs.
- **Real-time Currency Conversion:** Integrates `exchangerate-api.com` for live USD/MXN rates, with a currency toggle and automatic price conversion.
- **Multilingual Support:** Full English/Spanish translations using `i18next`, with language detection and a toggle.
- **Property Comparison Tool:** A dedicated page `/compare` allows side-by-side comparison of up to 3 properties.
- **API Documentation:** Comprehensive interactive API docs at `/api-docs` including widget integration guide and endpoint details.
- **Analytics Dashboard:** An admin page at `/analytics` provides key metrics like total leads, conversion rates, engagement, and various demographic distributions.
- **Embeddable Chat Widget:** Floating chat bubble widget (`public/widget.js`) that can be embedded on external websites (www.ipm.services), opens a 380px×600px popup with full chat functionality, customizable theme/language/position, with responsive layout optimizations for narrow widget mode.

**System Design Choices:**
- **AI System Prompt:** Configured to act as an expert IPM representative, emphasizing USA-based expertise and guiding investors.
- **Lead Qualification Triggers:** AI automatically suggests lead capture based on keywords indicating investment intent, budget, timeline, or contact requests.
- **Property Matching:** AI extracts relevant properties based on user-mentioned locations, features, country preferences, and budget ranges.
- **CORS Configuration:** API accepts requests from specified IPM domains, localhost, and Replit domains.
- **Widget Embedded Mode:** Detects `?embedded=true` URL parameter to hide header/sidebar, apply compact layout with reduced padding (px-3 py-4), smaller text sizes, and enforced width constraints to fit 380px widget. Message bubbles constrained to 85% width (303px max) with word-break: break-all to prevent horizontal overflow.

## External Dependencies
- **IPM Assistant:** Staff workspace implementation, API/database additions, configuration, privacy limits, and verification commands are documented in `docs/ipm-assistant.md`.
- **Clerk:** Verified-email staff/admin authorization for the new workspace and existing lead/analytics read endpoints.
- **OpenAI GPT-4o-mini**: For AI-powered conversational capabilities.
- **exchangerate-api.com**: For real-time USD/MXN currency exchange rates.
- **PostgreSQL**: Relational database for persistent storage of properties, leads, and chat messages.
- **Drizzle ORM**: Object-Relational Mapper for interacting with the PostgreSQL database.
- **i18next**: Internationalization framework for multilingual support (English/Spanish).
- **React**: Frontend JavaScript library.
- **Express.js**: Backend web application framework for Node.js.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Shadcn UI**: Collection of re-usable components.
- **TanStack Query (React Query v5)**: Data fetching and state management library.
- **Wouter**: Small routing library for React.