# Overview

A comprehensive vehicle booking management system designed for the Accountant General's Department of Malaysia, Negeri Sembilan. The system facilitates the application and approval process for government vehicle usage with role-based access control, automated booking ID generation, email notifications, and comprehensive audit trails.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom government theme colors and CSS variables
- **Routing**: Wouter for client-side routing with role-based navigation
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API**: RESTful API endpoints with structured error handling and request logging
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **File Structure**: Monorepo structure with shared schema and types between client/server

## Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Role-Based Access**: Three user roles (user, admin, superadmin) with different permission levels
- **Security**: HTTP-only secure cookies, CSRF protection, and request validation

## Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection**: Connection pooling with WebSocket support for serverless environments

## Key Data Models
- **Users**: Profile information, roles, units, and activation status
- **Bookings**: Complete booking lifecycle with auto-generated IDs, status tracking, and audit trails
- **Drivers & Vehicles**: Resource management for assignment to approved bookings
- **Audit Trail**: Comprehensive logging of all booking actions and system errors

## Business Logic Features
- **Booking ID Generation**: Auto-generated format (2-digit year + 3-digit sequential number)
- **Date Validation**: Future-only booking dates with business day calculations
- **Conflict Detection**: Prevents double-booking of drivers and vehicles
- **Status Workflow**: Pending → Approved/Rejected with modification capabilities
- **Processing Metrics**: Automatic calculation of processing time in working days

## External Dependencies

- **Database Hosting**: Neon PostgreSQL serverless platform
- **Authentication**: Replit Auth service for user authentication
- **Email Notifications**: Configured for booking confirmations (implementation pending)
- **UI Components**: Radix UI primitives for accessible component foundation
- **Date Handling**: date-fns library for date manipulation and formatting
- **Validation**: Zod for runtime type checking and schema validation

## Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: ESLint, TypeScript strict mode, and import path resolution
- **Development**: Hot module replacement, runtime error overlay, and Replit integration
- **Deployment**: Production build with static asset serving and API routing