import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { articleRoutes } from './routes/article.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/', (_request, response) => {
    response.type('html').send(`
      <html>
        <head>
          <title>Tech Tong News API</title>
          <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
            .card { max-width: 720px; margin: 0 auto; background: #111827; border: 1px solid #334155; border-radius: 16px; padding: 28px; }
            code { background: #1f2937; padding: 2px 6px; border-radius: 6px; }
            ul { line-height: 1.8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Tech Tong News API</h1>
            <p>Express + MongoDB backend scaffold with authentication, user APIs, admin APIs, and CRUD routes.</p>
            <ul>
              <li><code>/api/auth</code> for register, login, and profile</li>
              <li><code>/api/users</code> for user profile actions and password updates</li>
              <li><code>/api/admin</code> for admin management and dashboard stats</li>
              <li><code>/api/articles</code> for CRUD operations</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'tech-tong-news-backend' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/articles', articleRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}