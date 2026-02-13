# Deployment Guide

Congratulations on finishing your Beach Volleyball Tournament Management System! Here are the easiest ways to get your app live on the web.

## Option 1: Vercel (Recommended)
Vercel is the creator of Next.js and has fantastic support for Vite apps.

1. **Push to GitHub**: If you haven't already, push your code to a GitHub repository.
2. **Sign up for Vercel**: Connect your GitHub account at [vercel.com](https://vercel.com).
3. **Import Project**: Click "Add New" -> "Project" and select your repository.
4. **Deploy**: Vercel will automatically detect Vite. Click "Deploy".
5. **Done!**: Your app will be live on a `vercel.app` subdomain.

## Option 2: Netlify
Another extremely popular and easy option.

1. **Connect to GitHub**: Log in to [netlify.com](https://netlify.com) and click "Add new site" -> "Import an existing project".
2. **Build Settings**: 
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
3. **Deploy**: Netlify will build and host your site.

## Option 3: Manual Build (For any host)
If you want to host it on your own server or another provider:

1. Run the build command in your terminal:
   ```bash
   npm run build
   ```
2. This will create a `dist` folder in your project root.
3. Upload the **contents** of the `dist` folder to any static hosting provider.

## Important Note on Routing
Since this app uses conditional rendering (state-based navigation) instead of a physical router (like React Router), it will work perfectly on any static host without extra configuration for 404 redirects.

---
**Need help with GitHub?**
If you don't have the code on GitHub yet:
1. Initialize git: `git init`
2. Add files: `git add .`
3. Commit: `git commit -m "Initial commit"`
4. Create a repo on GitHub and follow their "push an existing repository" instructions.
