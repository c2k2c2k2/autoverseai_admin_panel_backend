# NestJS Backend Deployment Guide for Vercel

This guide will walk you through deploying your NestJS backend application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you don't have an account
2. **Vercel CLI** (optional): Install with `npm i -g vercel`
3. **PostgreSQL Database**: You'll need a cloud-hosted PostgreSQL database (e.g., Supabase, Neon, Railway, or Amazon RDS)

## Pre-Deployment Checklist

### 1. Database Setup

Since Vercel is a serverless platform, you need a cloud-hosted PostgreSQL database. Recommended providers:

- **Supabase** (Free tier available): https://supabase.com
- **Neon** (Free tier available): https://neon.tech
- **Railway**: https://railway.app
- **Amazon RDS**: https://aws.amazon.com/rds/postgresql/

### 2. Environment Variables

Prepare the following environment variables:

```env
# Database Configuration
DATABASE_HOST=your-database-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-username
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=your-db-name

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret

# Email Configuration (SMTP)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com

# Application URLs
APP_URL=https://your-backend-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Choose the root directory (where package.json is located)

3. **Configure Project Settings**
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty (Vercel will use the api folder)
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - In the "Environment Variables" section, add all the variables listed above
   - Make sure to add the actual values, not the placeholders

5. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Follow the prompts**
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No
   - Project name: your-project-name
   - Directory: ./
   - Override settings: No

5. **Add Environment Variables**

   ```bash
   # Add each environment variable
   vercel env add DATABASE_HOST production
   vercel env add DATABASE_PORT production
   # ... repeat for all variables
   ```

6. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## Post-Deployment Steps

### 1. Run Database Migrations

Since Vercel is serverless, you'll need to run migrations from your local machine:

```bash
# Set your production database URL
export DATABASE_HOST=your-production-host
export DATABASE_PORT=5432
export DATABASE_USERNAME=your-username
export DATABASE_PASSWORD=your-password
export DATABASE_NAME=your-database

# Run migrations
npm run typeorm migration:run
```

### 2. Seed Initial Data (if needed)

```bash
# With production database environment variables set
npm run seed
```

### 3. Update Frontend Configuration

Update your frontend application to point to the new backend URL:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.vercel.app/api/v1
```

### 4. Test Your Deployment

1. **Health Check**

   ```bash
   curl https://your-backend-domain.vercel.app/health
   ```

2. **API Documentation** (only in non-production)
   - Visit: `https://your-backend-domain.vercel.app/api/docs`

3. **Test API Endpoints**
   ```bash
   # Example: Get brands
   curl https://your-backend-domain.vercel.app/api/v1/brands
   ```

## Important Considerations

### 1. Serverless Limitations

- **Cold Starts**: First request after inactivity may be slower
- **Execution Time**: Maximum 30 seconds per request (configured in vercel.json)
- **Memory**: 1024 MB allocated (can be increased if needed)

### 2. File Uploads

- Vercel's serverless functions don't persist files
- Consider using cloud storage (AWS S3, Cloudinary) for file uploads
- Update your upload logic accordingly

### 3. WebSockets

- Vercel doesn't support WebSockets
- Use alternatives like Pusher or Ably for real-time features

### 4. Logs

- View logs in Vercel Dashboard under "Functions" tab
- Or use Vercel CLI: `vercel logs`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure your database allows connections from Vercel's IP ranges
   - Check SSL settings in typeorm.config.ts

2. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Try building locally first: `npm run build`

3. **Environment Variables Not Working**
   - Redeploy after adding environment variables
   - Check variable names match exactly
   - Use Vercel dashboard to verify variables are set

4. **CORS Issues**
   - Update FRONTEND_URL environment variable
   - Check CORS configuration in main.ts

### Debug Commands

```bash
# View deployment logs
vercel logs

# List deployments
vercel ls

# Inspect deployment
vercel inspect [deployment-url]
```

## Optimization Tips

1. **Reduce Cold Start Time**
   - Minimize dependencies
   - Use dynamic imports where possible
   - Consider edge functions for simple endpoints

2. **Database Optimization**
   - Use connection pooling
   - Add appropriate indexes
   - Consider caching frequently accessed data

3. **Monitor Performance**
   - Use Vercel Analytics
   - Set up error tracking (e.g., Sentry)
   - Monitor database performance

## Security Checklist

- [ ] All sensitive data in environment variables
- [ ] Database uses SSL connection
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Clerk authentication properly configured

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up CI/CD pipeline
4. Implement caching strategy
5. Plan for scaling

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **NestJS Documentation**: https://docs.nestjs.com
- **Vercel Support**: https://vercel.com/support

---

Remember to regularly update your dependencies and monitor your application's performance and security.
