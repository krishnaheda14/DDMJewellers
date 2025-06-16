# DDM Jewellers - Comprehensive Jewelry E-commerce Platform

## Overview

DDM Jewellers is a full-stack jewelry e-commerce platform built with React, Express.js, and PostgreSQL. The platform offers both real and imitation jewelry with advanced features like AI-powered chatbot (SunaarJi), jewelry exchange program, Gullak (gold savings), corporate partnerships, and comprehensive admin management systems.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Library**: Shadcn/UI components built on Radix UI
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js with session-based authentication
- **Authentication**: Replit Auth integration with Passport.js
- **API Design**: RESTful APIs with comprehensive error handling
- **File Uploads**: Multer for handling jewelry images and custom designs

### Data Storage Solutions
- **Primary Database**: PostgreSQL 16 via Neon serverless
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Session Store**: PostgreSQL-backed sessions via connect-pg-simple
- **File Storage**: Local filesystem with organized upload directories

## Key Components

### Authentication and Authorization
- **Multi-role System**: Customer, Wholesaler, Admin roles with granular permissions
- **Replit Auth Integration**: Seamless OAuth flow with session management
- **Email Verification**: SendGrid integration for user verification
- **Session Management**: Secure session handling with PostgreSQL storage

### Product Management
- **Dual Product Types**: Real jewelry (gold/silver) with live pricing vs fixed-price imitation jewelry
- **Dynamic Pricing**: PricingCalculator service for real-time gold/silver rate integration
- **Category Hierarchy**: Body-part based categorization (neck, ear, hand, etc.)
- **Inventory Management**: Stock tracking with availability status

### E-commerce Features
- **Shopping Cart**: Persistent cart with quantity management
- **Order Processing**: Complete order lifecycle with status tracking
- **Wishlist System**: User-specific product favorites
- **Advanced Search**: Multi-filter product discovery

### Specialized Services
- **SunaarJi AI Chatbot**: Anthropic Claude-powered jewelry advisor with voice capabilities
- **Jewelry Exchange Program**: Upload and appraisal system for old jewelry trade-ins
- **Gullak Gold Savings**: Systematic investment plans for gold accumulation
- **Corporate Partnerships**: B2B services with employee benefits and bulk pricing

### Market Integration
- **Live Gold/Silver Rates**: Real-time market rate updates every 5 minutes
- **Currency Conversion**: Multi-currency support for international customers
- **Pricing Engine**: Dynamic pricing based on weight, purity, and market rates

## Data Flow

### User Journey
1. **Landing Page**: Unauthenticated users see marketing content
2. **Authentication**: Replit Auth handles OAuth flow
3. **Home Dashboard**: Role-based dashboard with personalized content
4. **Product Discovery**: Category browsing with advanced filtering
5. **Purchase Flow**: Cart → Checkout → Order tracking

### Admin Workflow
1. **Admin Dashboard**: Comprehensive analytics and management overview
2. **Category Management**: Hierarchical category creation and organization
3. **Product Management**: Bulk product operations with pricing controls
4. **User Management**: Role-based access and approval workflows
5. **Exchange Management**: Jewelry appraisal and trade-in processing

### Data Synchronization
- **Real-time Updates**: Market rates update automatically
- **Cache Strategy**: TanStack Query provides intelligent caching
- **Background Jobs**: Automated Gullak payments and rate updates

## External Dependencies

### Third-party Integrations
- **Anthropic Claude**: AI chatbot intelligence
- **SendGrid**: Email service for notifications and verification
- **Neon PostgreSQL**: Serverless database hosting
- **Market Data APIs**: Multiple sources for gold/silver rates

### Development Tools
- **TypeScript**: Full-stack type safety
- **ESBuild**: Fast production builds
- **Drizzle Kit**: Database migration management
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Replit Configuration
- **Auto-scaling**: Configured for dynamic scaling based on traffic
- **Build Process**: Vite frontend build + ESBuild backend bundling
- **Environment**: Node.js 20, Web, PostgreSQL 16 modules
- **Port Configuration**: Internal 5000 → External 80

### Database Strategy
- **Migrations**: Drizzle migrations in `/migrations` directory
- **Schema**: Centralized schema definitions in `/shared/schema.ts`
- **Connection**: Neon serverless with WebSocket support

### File Organization
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript schemas
├── migrations/      # Database migrations
└── uploads/         # File upload storage
```

## Changelog
- June 14, 2025: Initial setup
- June 14, 2025: Fixed authentication session persistence issue - users can now sign in successfully without getting stuck on the sign-in screen. Implemented proper token storage and transmission for all API requests.
- June 14, 2025: Added complete store locator feature with Google Maps integration. Users can now find physical store locations, view contact details, opening hours, and get directions directly through Google Maps.
- June 16, 2025: Completed wholesaler approval system - admins can now successfully approve/reject pending wholesaler applications. Fixed authentication issues in approval endpoints and implemented proper in-memory data updates. System tested and verified working with 11 test applications.
- June 16, 2025: Fixed wholesaler authentication and added approved test user krish@gmail.com/krish123. Wholesaler upload functionality now properly stores products in backend with correct dashboard statistics display. All wholesaler features fully operational.
- June 16, 2025: Fixed critical wholesaler approval authentication bug. System now automatically generates secure passwords during approval process using format [firstName]123. Approved wholesalers can immediately sign in with generated credentials. Tested with rajesh.gems@example.com/rajesh123 and priya.diamonds@example.com/priya123.

## User Preferences

Preferred communication style: Simple, everyday language.