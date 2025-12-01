# CHAPTER 5: SOFTWARE ENVIRONMENT

This chapter details the software environment, technologies, and tools used in the development and deployment of the Smart Medication Manager system.

## 5.1 Front-End Technologies

The front-end of the application is built using a modern, component-based architecture to ensure responsiveness, performance, and maintainability.

- **Framework**: **Next.js 16.0.3** - A React framework that enables server-side rendering (SSR) and static site generation (SSG) for optimal performance and SEO.
- **Library**: **React 19.2.0** - A JavaScript library for building user interfaces, utilizing the latest features like Server Components and Actions.
- **Language**: **TypeScript 5** - A strongly typed superset of JavaScript that enhances code quality and developer productivity.
- **Styling**:
  - **Tailwind CSS 4** - A utility-first CSS framework for rapid UI development.
  - **Tailwind Merge & CLSX** - Utilities for efficiently constructing class strings conditionally.
- **UI Components & Icons**:
  - **Radix UI** - Headless UI primitives for accessible, high-quality components (Dialog, Avatar, Label, Slot).
  - **Lucide React** - A consistent and lightweight icon library.
- **Animations**: **Framer Motion** - A production-ready motion library for React to create fluid animations and gestures.
- **State Management**: React's built-in hooks (`useState`, `useReducer`, `useContext`) and URL state management via Next.js router.

## 5.2 Back-End Technologies

The back-end architecture leverages a Backend-as-a-Service (BaaS) model combined with serverless functions.

- **Platform**: **Supabase** - An open-source Firebase alternative that provides a suite of backend tools.
- **Authentication**: Supabase Auth for secure user management and session handling.
- **API**:
  - **Next.js API Routes** - Server-side endpoints for handling application logic.
  - **Supabase Client (`@supabase/supabase-js`)** - For direct, secure database interactions.
- **External Services**:
  - **Telegram Bot API (`node-telegram-bot-api`)** - For sending medication reminders and handling user interactions via Telegram.
  - **Web Push (`web-push`)** - For delivering push notifications to supported web browsers.

## 5.3 Database Management System

The system uses a robust relational database management system hosted by Supabase.

- **Database**: **PostgreSQL** - An advanced, open-source object-relational database system known for reliability and feature robustness.
- **Features Used**:
  - **Row Level Security (RLS)** - To ensure users can only access their own data.
  - **Real-time Subscriptions** - For instant updates on the frontend when data changes.
  - **pg_cron** - A PostgreSQL extension for scheduling database tasks (used for medication reminders).

## 5.4 Development Tools and IDE

The development environment is configured to ensure code quality and efficient workflows.

- **Code Editor**: **Visual Studio Code** - A lightweight but powerful source code editor.
- **Package Manager**: **pnpm** - A fast, disk space-efficient package manager.
- **Version Control**: **Git** - For tracking changes in the source code.
- **Linting & Formatting**:
  - **ESLint** - For identifying and reporting on patterns found in ECMAScript/JavaScript code.
  - **Prettier** (implied) - For consistent code formatting.
- **Testing/Debugging**: Browser DevTools and Next.js error overlays.

## 5.5 Operating System

- **Development**: **Linux** - The development environment runs on a Linux-based operating system (e.g., Ubuntu via WSL).
- **Production**: **Linux** - The application is deployed on Vercel's serverless infrastructure, which runs on Linux containers.

## 5.6 Web Server

- **Development Server**: **Node.js** - The local development server provided by Next.js (`next dev`).
- **Production Server**: **Vercel** - A cloud platform for static sites and Serverless Functions. It handles the deployment, scaling, and serving of the Next.js application globally via its Edge Network.
