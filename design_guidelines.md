# IPM AI Chatbot - Design Guidelines

## Design Approach: Reference-Based (Real Estate + Modern SaaS Hybrid)

**Primary References:**
- **Airbnb**: Property showcase patterns, trust-building elements, clean card designs
- **Stripe**: Professional color palette, modern UI components, developer-focused clarity
- **Linear/Notion**: Clean chat interfaces, smart use of whitespace, refined typography

**Design Principle:** Establish credibility through sophisticated real estate aesthetics while maintaining the efficiency and clarity expected from modern AI chat applications.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- **Primary Brand**: 220 65% 25% (Deep professional blue - trust and stability)
- **Primary Hover**: 220 65% 20%
- **Secondary**: 210 15% 45% (Slate gray for supporting elements)
- **Accent**: 200 85% 55% (Bright cyan - sparingly for CTAs and highlights)
- **Background**: 0 0% 98%
- **Surface**: 0 0% 100%
- **Text Primary**: 220 25% 15%
- **Text Secondary**: 220 15% 45%
- **Border**: 220 15% 90%

**Dark Mode:**
- **Primary Brand**: 220 60% 60% (Lighter blue for dark backgrounds)
- **Primary Hover**: 220 60% 55%
- **Secondary**: 210 20% 60%
- **Accent**: 200 80% 60%
- **Background**: 220 20% 8%
- **Surface**: 220 18% 12%
- **Text Primary**: 220 15% 95%
- **Text Secondary**: 220 10% 70%
- **Border**: 220 15% 20%

**Status Colors:**
- Success: 145 65% 50%
- Warning: 40 90% 55%
- Error: 0 70% 55%
- Info: 210 85% 60%

### B. Typography

**Font Families:**
- **Primary (UI/Body)**: Inter (Google Fonts) - Clean, professional, excellent readability
- **Display (Headers)**: Outfit (Google Fonts) - Modern, distinctive for key headings
- **Monospace (Code/Data)**: JetBrains Mono - For property IDs, technical details

**Type Scale:**
- Display (Hero): 3.5rem / 3.75rem line-height, font-weight 700
- H1: 2.5rem / 3rem, font-weight 700
- H2: 2rem / 2.5rem, font-weight 600
- H3: 1.5rem / 2rem, font-weight 600
- Body Large: 1.125rem / 1.75rem, font-weight 400
- Body: 1rem / 1.5rem, font-weight 400
- Body Small: 0.875rem / 1.25rem, font-weight 400
- Caption: 0.75rem / 1rem, font-weight 500

### C. Layout System

**Spacing Primitives (Tailwind units):**
- **Micro spacing**: 1, 2 (borders, tight gaps)
- **Standard spacing**: 4, 6, 8 (component padding, gaps)
- **Section spacing**: 12, 16, 20 (between major sections)
- **Large spacing**: 24, 32 (hero sections, major separations)

**Container Widths:**
- Chat Interface: max-w-5xl (centered)
- Property Cards: max-w-7xl
- Full-width Sections: w-full with inner max-w-7xl
- Text Content: max-w-prose

**Grid Systems:**
- Property Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Feature Cards: grid-cols-1 md:grid-cols-2 xl:grid-cols-4
- Chat Layout: Two-column split on desktop (sidebar + chat)

### D. Component Library

**Navigation:**
- Fixed header with glass-morphism effect (backdrop-blur-lg, bg-opacity-80)
- Logo (left) + Main Nav (center) + CTA button (right)
- Mobile: Hamburger menu with slide-in drawer
- Height: h-16 with shadow on scroll

**Chat Interface:**
- **Message Bubbles**: 
  - User: bg-primary text-white, rounded-2xl, max-w-2xl, self-end
  - Bot: bg-surface border, rounded-2xl, max-w-2xl, self-start
  - Padding: px-4 py-3, gap-2 for message groups
- **Input Area**: Fixed bottom, elevated shadow, rounded-xl input with send button
- **Chat Container**: Scrollable area with smooth scroll behavior, px-4 py-6

**Property Cards:**
- Image: aspect-video, rounded-t-xl, object-cover with gradient overlay on hover
- Content: p-6, structured with title, location, price, features
- Border: border with subtle shadow, hover:shadow-lg transition
- CTAs: Primary button + "View Details" link
- Badge overlays for "Featured", "New", ROI percentage

**Forms & Inputs:**
- Border radius: rounded-lg
- Consistent height: h-12 for inputs, h-10 for buttons
- Focus state: ring-2 ring-primary ring-offset-2
- Labels: text-sm font-medium mb-2
- Dark mode: Proper contrast with bg-surface and border-border

**Data Display:**
- **ROI Indicators**: Large percentage with trend icon, colored backgrounds
- **Stats Cards**: Icon + number + label, grid layout
- **Property Features**: Icon-list format with checkmarks
- **Investment Metrics**: Table format with alternating row colors

**Modals & Overlays:**
- Backdrop: bg-black/50 backdrop-blur-sm
- Panel: bg-surface rounded-2xl, max-w-2xl, shadow-2xl
- Close button: Absolute top-right, ghost style
- Smooth entrance: Fade + scale animation

**CTAs & Buttons:**
- Primary: bg-primary hover:bg-primary-hover, rounded-lg, px-6 py-3
- Secondary: border border-primary text-primary, rounded-lg
- Ghost: hover:bg-surface transition
- Icon buttons: size-10, rounded-full, centered icons
- Buttons on images: backdrop-blur-md bg-white/20 border-white/30

### E. Animations & Interactions

**Principle: Minimal, Purposeful Motion**

**Micro-interactions Only:**
- Button hover: scale-[1.02] transition
- Card hover: shadow-lg transform transition (150ms)
- Input focus: ring appearance (100ms)
- Modal entrance: Fade in (200ms)

**Prohibited:**
- Page scroll animations
- Parallax effects
- Auto-playing carousels
- Excessive loading spinners

---

## Images & Visual Assets

**Hero Section:**
- **Large Hero Image**: Yes - Premium international property landscape
  - Image: Luxury beachfront property at sunset (Tulum/Playa del Carmen aesthetic)
  - Treatment: Subtle gradient overlay (black/60 to black/0) for text readability
  - Position: Full-width, h-[600px] on desktop, h-[400px] mobile
  - Content overlay: Centered, white text with backdrop-blur button CTAs

**Property Showcases:**
- High-quality lifestyle photography for each property listing
- Consistent aspect-video ratio for uniformity
- Image optimization for fast loading (WebP format)

**Trust Indicators:**
- Team photos (if applicable) in "About IPM" section
- Client testimonial headshots (real, not stock photos)
- Location/office imagery for credibility

**Icon Library:**
- Heroicons (via CDN) - primary icon set for UI elements
- Property feature icons, location pins, ROI indicators

---

## Page-Specific Guidelines

**Chat Interface (Primary View):**
- Split layout: 280px sidebar (properties/shortcuts) + flexible chat area
- Sidebar: Fixed, bg-surface, property quick-view cards
- Chat area: White/surface background, messages flow from top
- Typing indicator: Animated dots, subtle bounce
- Suggested questions: Pill-shaped buttons below input, scroll horizontally on mobile

**Property Listings (Modal/Dedicated):**
- Grid layout with filters sidebar (desktop) or drawer (mobile)
- Each card: Image + essential info + "Learn More" CTA
- Quick-view on hover (desktop): Expanded details without navigation
- Map integration: Embedded property locations with pins

**Lead Capture Forms:**
- Progressive disclosure: Multi-step with progress indicator
- Friendly, conversational microcopy
- Real-time validation with helpful error messages
- Success state: Confirmation with next steps, not just "Thanks"

---

## Accessibility & Responsiveness

**Dark Mode:**
- Automatic system preference detection
- Manual toggle in navigation
- Consistent implementation across ALL components including form inputs
- Sufficient contrast ratios (WCAG AA minimum)

**Responsive Breakpoints:**
- Mobile: < 768px (single column, stacked chat)
- Tablet: 768px - 1024px (condensed sidebar, 2-col property grid)
- Desktop: > 1024px (full layout, 3-col grid)

**Touch Targets:**
- Minimum 44px × 44px for all interactive elements
- Increased padding on mobile (p-4 vs p-2 desktop)

---

## Brand Personality Expression

- **Professional yet Approachable**: Clean lines, generous whitespace, warm accent colors
- **International Sophistication**: Subtle luxury cues, refined typography, premium imagery
- **Trustworthy**: Consistent patterns, clear hierarchy, transparent information
- **Tech-Forward**: Modern chat interface, smart interactions, seamless experience

**Voice in Visual Design:**
- Use data visualization to build confidence (ROI charts, occupancy graphs)
- Showcase international credentials through location tags and currency indicators
- Balance property beauty (imagery) with investment intelligence (data)