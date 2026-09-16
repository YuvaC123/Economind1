# EconoMind - Economic Behavior Simulator

A sophisticated Next.js application that simulates consumer economic behavior across various macroeconomic scenarios. Built with modern design principles, glassmorphism effects, and smooth animations.

## 🎯 Overview

EconoMind enables researchers, economists, and educators to:
- Create detailed consumer personas with demographic and economic profiles
- Define and customize macroeconomic scenarios with adjustable parameters
- Run behavioral simulations to predict consumer decisions
- Analyze results through behavioral insights and theory validation
- Generate comprehensive research reports

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with custom glassmorphism utilities
- **UI Components**: shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: React hooks with mock data

### Project Structure

```
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles & utilities
│   ├── dashboard/               # Dashboard layout
│   │   ├── layout.tsx           # Dashboard wrapper
│   │   ├── page.tsx             # Main dashboard
│   │   ├── persona-builder/     # Persona management
│   │   ├── economic-scenarios/  # Scenario configuration
│   │   ├── simulations/         # Simulation results
│   │   ├── analytics/           # Analytics dashboard
│   │   ├── reports/             # Research reports
│   │   └── settings/            # User settings
│   └── results/
│       └── page.tsx             # Simulation results page
│
├── components/
│   ├── landing/                 # Landing page sections
│   │   ├── hero-section.tsx
│   │   ├── feature-cards.tsx
│   │   └── cta-section.tsx
│   ├── layouts/                 # Dashboard layout components
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   └── right-panel.tsx
│   ├── dashboard/               # Dashboard feature components
│   │   ├── persona-config-card.tsx
│   │   ├── macroeconomic-card.tsx
│   │   ├── scenario-builder.tsx
│   │   └── behavioral-traits.tsx
│   ├── shared/                  # Shared utility components
│   │   └── stat-card.tsx
│   └── ui/                      # shadcn/ui components
│
├── lib/
│   ├── mock-data.ts             # Mock personas, scenarios, simulations
│   └── utils.ts                 # Utility functions
│
└── public/                      # Static assets

```

## 🎨 Design Features

### Visual Design
- **Dark Theme**: Deep navy/black background with white/gray accents
- **Glassmorphism**: Frosted glass effect with backdrop blur and transparency
- **Color Palette**:
  - Primary: Blue (#3B82F6) for main actions
  - Secondary: Purple (#A855F7) for accents
  - Gradients: Blue → Purple → Pink for premium feel
  - Neutrals: #0F172A (dark bg), #E2E8F0 (light text)

### Interactive Elements
- Smooth animations on component mount and hover
- Staggered transitions for lists and cards
- Framer Motion for complex animations
- Responsive sidebar collapse on mobile
- Tabbed interface for insights and analysis

## 📄 Pages & Features

### Landing Page (`/`)
- **Hero Section**: Eye-catching headline with gradient text
- **Feature Cards**: Three key features with descriptions
- **CTA Section**: Call-to-action cards highlighting capabilities
- **Navigation**: Links to dashboard and more info

### Dashboard (`/dashboard`)
- **Sidebar Navigation**: Quick access to all features
- **Top Navigation**: Status indicators and action buttons
- **Right Panel**: Real-time insights and metrics
- **Main Content**: 
  - Persona and scenario selection
  - Economic environment indicators (9 metrics)
  - Quick actions

### Persona Builder (`/dashboard/persona-builder`)
- **Personas List**: Browse and manage consumer profiles
- **Behavioral Profile**: Six psychological factors displayed with progress bars:
  - Risk Aversion
  - Loss Aversion
  - Time Preference
  - Rationality
  - Herding Behavior
  - Overconfidence

### Economic Scenarios (`/dashboard/economic-scenarios`)
- **Preset Scenarios**: Three predefined economic states
  - Stable Growth (mild)
  - Recession (severe)
  - High Inflation (moderate)
- **Custom Adjustments**: Fine-tune economic parameters
  - Inflation Rate (0-10%)
  - Interest Rate (0-10%)
  - Unemployment Rate (0-15%)
  - Market Volatility (5-50)

### Simulations (`/dashboard/simulations`)
- View and manage simulation results
- Track completion status and accuracy metrics
- Download and share results

### Analytics (`/dashboard/analytics`)
- **Stat Cards**: Key metrics (Avg Spending, Savings Rate, Investment, Risk)
- **Chart Placeholders**: Ready for data visualization integration

### Reports (`/dashboard/reports`)
- Generate research reports
- View historical reports with metadata
- Download and share findings

### Results (`/results`)
- **Executive Summary**: Overview of simulation outcomes
- **Decision Cards**: Breakdown of consumer decisions (Spending, Savings, Borrowing, Investing)
- **Decision Timeline**: Chronological view of decisions made
- **Behavioral Traits**: Visualization of psychological factors
- **Theory Alignment**: How results validate economic theories
- **Export Options**: Download as PDF or CSV

### Settings (`/dashboard/settings`)
- Account management (email, username)
- Notification preferences
- Application settings

## 🚀 Getting Started

### Installation
```bash
pnpm install
# or
npm install
# or
yarn install
```

### Running the Development Server
```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📦 Dependencies

### Core
- `next`: ^16.0.0
- `react`: ^19.0.0
- `react-dom`: ^19.0.0

### UI & Styling
- `tailwindcss`: ^4.2.0
- `framer-motion`: Latest
- `lucide-react`: Icons library

### shadcn/ui Components
- `@radix-ui/react-slot`
- `@radix-ui/react-tabs`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-slider`
- `class-variance-authority`
- `clsx`

## 🎯 Mock Data

The application uses mock data located in `lib/mock-data.ts`:
- **Personas**: 3 example consumers with different profiles
- **Scenarios**: Pre-defined economic conditions
- **Simulations**: Sample results from past runs
- **Economic Indicators**: Mock macroeconomic data

## 🔄 Future Enhancements

- [ ] Backend API integration for persistence
- [ ] Real data visualization with Recharts
- [ ] Advanced statistical analysis
- [ ] Multi-user collaboration
- [ ] Export to PDF reports
- [ ] Machine learning model integration
- [ ] Real-time market data feeds
- [ ] Team workspaces

## 🛠️ Customization

### Colors & Theming
Edit color tokens in `app/globals.css` to customize the color scheme:
```css
@theme inline {
  --color-primary: #3B82F6;
  --color-secondary: #A855F7;
  /* ... */
}
```

### Adding New Features
1. Create components in appropriate directories
2. Use shadcn/ui components for consistency
3. Apply glassmorphism utilities with `card-glass` class
4. Use Framer Motion for animations

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Sidebar collapse on smaller screens
- Adaptive grid layouts
- Touch-friendly interactions

## 🎓 Educational Use

Perfect for:
- Economics education and research
- Behavioral finance studies
- Consumer psychology analysis
- Data-driven learning environments

## 📄 License

This project is provided as-is for educational and research purposes.

---

Built with ❤️ using Next.js, React, and Tailwind CSS
