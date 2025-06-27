export default () => ({
    port: parseInt(process.env.APP_PORT!, 10) || 3001,
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT!, 10) || 5432,
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'password',
        database: process.env.DATABASE_NAME || 'admin_panel_db',
    },
    clerk: {
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
        webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret',
        expiresIn: process.env.JWT_EXPIRATION || '7d',
    },
    email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT!, 10) || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.FROM_EMAIL,
    },
    app: {
        url: process.env.APP_URL || 'http://localhost:3001',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE!, 10) || 10485760, // 10MB
        destination: process.env.UPLOAD_DEST || './uploads',
    },
});