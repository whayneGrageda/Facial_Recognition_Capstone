# Facial Recognition System - Frontend

A modern React + TypeScript frontend application with clean architecture for the Facial Recognition System.

## 🎨 Design System

### Color Palette
- **Primary**: Deep Blue (#0066e6)
- **Secondary**: Teal (#009999)
- **Neutrals**: Gray scale
- **Semantic**: Success, Warning, Error, Info

### Typography
- **Primary Font**: Inter (body text)
- **Heading Font**: Poppins (headings)

## 📁 Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable UI components
├── contexts/        # React contexts (Auth, Theme)
├── hooks/           # Custom React hooks
├── pages/           # Page components by role
│   ├── admin/      # Admin dashboard & management
│   ├── moderator/  # Moderator pages
│   ├── college/    # College student pages
│   ├── shs/        # SHS student pages
│   ├── faculty/    # Faculty user pages
│   └── shared/     # Shared pages (Login, etc.)
├── services/        # API service layer
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🏗️ Architecture

### Clean Architecture Layers

1. **Presentation Layer** (`pages/`, `components/`)
   - UI components and page layouts
   - User interaction handling
   - State management

2. **Application Layer** (`hooks/`, `contexts/`)
   - Custom hooks for business logic
   - Context providers for global state
   - Application-specific logic

3. **Domain Layer** (`types/`)
   - Type definitions
   - Domain models
   - Business rules

4. **Infrastructure Layer** (`services/`, `utils/`)
   - API communication
   - External service integration
   - Utility functions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication

The app uses JWT-based authentication with role-based access control:

- **Admin**: Full system access
- **Moderator**: User management and monitoring
- **Student (College)**: College student portal
- **Student (SHS)**: SHS student portal
- **Faculty**: Faculty member portal

## 🎯 Features

### Admin Dashboard
- User management (College, SHS, Faculty)
- Moderator management
- Guest management
- Attendance monitoring
- System analytics

### Moderator Dashboard
- User verification
- Attendance monitoring
- Guest check-in/out

### Student Portals
- Personal dashboard
- Attendance history
- Profile management

### Faculty Portal
- Department dashboard
- Attendance tracking
- Profile management

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📝 Code Style

- Use functional components with hooks
- Follow clean architecture principles
- Implement proper error handling
- Write self-documenting code
- Use TypeScript for type safety

## 🔄 API Integration

All API calls go through the service layer:

```typescript
import { userService } from '@/services/userService';

// Example usage
const users = await userService.college.getAll(10, 0);
```

## 🎨 Styling

- CSS custom properties for theming
- Utility classes for common patterns
- Component-specific CSS modules
- Responsive design with mobile-first approach

## 📱 Responsive Design

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🧪 Testing

(To be implemented)

## 📄 License

Private - All rights reserved
