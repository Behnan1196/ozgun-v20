# Deployment Guide - Vercel

This guide will help you deploy your TYT-AYT Coaching App to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Project**: Your database should be set up and running
4. **Stream.io Account**: For chat and video features (optional)

## Step 1: Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

### Required Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional Variables (for Stream.io features):
```bash
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project
5. Add your environment variables in the "Environment Variables" section
6. Click "Deploy"

### Option B: Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts to link your project
4. Set environment variables: `vercel env add`
5. Deploy: `vercel --prod`

## Step 3: Configure Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with the appropriate values:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview, Development |
| `NEXT_PUBLIC_STREAM_API_KEY` | Your Stream.io API key | Production, Preview, Development |
| `STREAM_API_SECRET` | Your Stream.io API secret | Production, Preview, Development |

## Step 4: Database Setup

Make sure your Supabase database is properly configured:

1. **Run Database Migrations**: Execute all SQL files in the project root
2. **Row Level Security**: Ensure RLS policies are in place
3. **Sample Data**: Insert initial data using the provided SQL scripts

### Key SQL files to run:
- `database-schema-v3.sql` - Main database schema
- `database-schema-coach-extension.sql` - Coach-specific tables
- `insert-admin-user-v3.sql` - Admin user creation
- `insert-subjects-data.sql` - Subject data
- `bulk-insert-topics-corrected.sql` - Topic data

## Step 5: Domain Configuration (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Configure DNS records as instructed by Vercel

## Step 6: Performance Optimizations

The app is already configured with:
- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Supabase for backend
- ✅ Stream.io for real-time features
- ✅ Optimized images and assets

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check your environment variables are set correctly
2. **Database Connection**: Verify Supabase URL and keys
3. **Stream.io Issues**: Ensure API keys are valid
4. **404 Errors**: Check your routing and middleware

### Debugging:
- Use Vercel's function logs to debug API routes
- Check the browser console for client-side errors
- Verify environment variables in the Vercel dashboard

## Production Checklist

Before going live:
- [ ] All environment variables are set
- [ ] Database is properly configured with RLS
- [ ] Admin user is created
- [ ] Sample data is loaded
- [ ] Stream.io keys are configured (if using chat/video)
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is active
- [ ] Performance testing completed

## Support

If you encounter issues:
1. Check Vercel's deployment logs
2. Review Supabase logs
3. Test locally with production environment variables
4. Consult the documentation for each service

---

**Your app is now ready for production! 🚀** 