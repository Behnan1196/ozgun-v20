# TYT-AYT Coaching Platform (Web App)

A comprehensive Next.js coaching platform for TYT-AYT exam preparation with admin, coach, and student interfaces.

## 🌟 Features

### PWA (Progressive Web App)
- ✅ Offline support with service worker
- ✅ Mobile-responsive design with 7-tab navigation
- ✅ Push notifications ready
- ✅ App-like experience on mobile devices
- ✅ Background sync for offline data

### Mobile-First Design
- **Student Interface**: Dashboard, Plan, Chat, Video, Goals, Profile, Settings
- **Coach Interface**: Dashboard, Plan, Students, Chat, Video, Goals, Settings  
- **Admin Interface**: Desktop-optimized management panel

### Core Functionality
- Real-time chat and video calls (Stream.io)
- Weekly task planning and tracking [[memory:1029523]]
- Student-coach assignment system [[memory:1029522]]
- Progress analytics and statistics
- Mock exam result tracking
- Educational resource management

## 🚀 Live Deployment

**Production URL**: https://ozgun-v14.vercel.app/coach

- Auto-deploys from `main` branch of this repository
- PWA features fully functional
- Mobile-responsive across all interfaces

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Communication**: Stream.io (Chat & Video)
- **Deployment**: Vercel with auto-deployment from GitHub
- **PWA**: Service Worker, Web App Manifest

## 📱 Related Projects

This web application works seamlessly with our mobile app:
- **Mobile App**: React Native with Expo (separate repository)
- **Shared**: Unified database types and API endpoints
- **Cross-platform**: Video calls work between web coaches and mobile students

## Usage

1. **Admin Login**: Full platform management
2. **Coach Login**: Student management and communication  
3. **Student Login**: Task tracking and coach interaction

All interfaces are fully mobile-responsive with native app-like navigation on mobile devices.

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stream.io account (optional, for chat/video features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd alper5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up database**
   - Create a new Supabase project
   - Run the SQL scripts in order:
     - `database-schema-v3.sql`
     - `database-schema-coach-extension.sql`
     - `insert-admin-user-v3.sql`
     - `insert-subjects-data.sql`
     - `bulk-insert-topics-corrected.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## User Roles

### Admin
- Manage users (coaches and students)
- System settings and announcements
- Educational resources management
- Subject and topic management

### Coach
- View assigned students
- Create and manage weekly plans
- Chat and video calls with students
- Track student progress and goals

### Student
- View weekly plans from assigned coach
- Chat and video calls with coach
- Access educational resources
- Track personal goals and progress

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stream.io (optional)
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_secret
```

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Configure Environment Variables**
   In your Vercel project settings, add all the environment variables from your `.env.local` file.

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel pages
│   ├── coach/             # Coach interface pages
│   ├── student/           # Student interface pages
│   ├── api/               # API routes
│   └── login/             # Authentication
├── components/            # Reusable components
│   ├── admin/             # Admin-specific components
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase configuration
│   └── stream.ts          # Stream.io configuration
└── types/                 # TypeScript type definitions
```

## Database Schema

The database includes the following main tables:
- `user_profiles` - User information and roles
- `subjects` - Academic subjects
- `topics` - Subject topics
- `student_goals` - Student goal tracking
- `coach_student_assignments` - Coach-student relationships
- `educational_links` - Resource management
- `announcements` - System announcements

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Material-UI for components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the documentation
2. Review common issues in [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Create an issue on GitHub

## License

This project is proprietary software. All rights reserved.

---

**Ready to deploy? Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions! 🚀** 