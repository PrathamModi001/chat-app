# Periskope Chat

A simple chat application with authentication and messaging features.

## Authentication System

This project implements a complete authentication system with the following features:

- User signup with email, name, and phone number
- Password setting flow
- Login with email and password
- Protected routes for authenticated users
- Supabase integration for authentication and database

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for authentication and database)

### Environment Setup

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase service role key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT secret
SUPABASE_JWT_SECRET=your-jwt-secret
```

3. Run the SQL setup script from `scripts/setup-db.sql` in the Supabase SQL editor

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Authentication Flow

1. User signs up with email, name, and phone number
2. User is redirected to set password page
3. After setting password, user is redirected to login page
4. User logs in with email and password
5. After successful login, user is redirected to the chat interface

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   │   └── auth/         # Authentication API routes
│   ├── auth/             # Auth-related pages
│   │   └── set-password/ # Password setting page
│   ├── login/            # Login page
│   └── signup/           # Signup page
├── components/           # React components
├── lib/                  # Utility functions
│   ├── context/          # React context providers
│   └── supabase/         # Supabase client utilities
└── scripts/              # Database setup scripts
```

## Features

- User authentication with email and password
- Protected routes for authenticated users
- Dark mode support
- Responsive design

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
