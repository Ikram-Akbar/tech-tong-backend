# Tech Tong News Backend

Express + MongoDB backend scaffold for the Tech Tong News frontend.

## Features

- JWT authentication
- Role-based access for `user` and `admin`
- CRUD structure for articles and users
- Root API landing page at `/`

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Render deployment

Use the repository-level [render.yaml](../render.yaml) to deploy only the backend API on Render.

- Backend service: `backend`
- Make sure `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` are set in Render for the backend service.
- Set `CLIENT_ORIGIN` to the frontend URL you will use with this API.

## Core routes

- `GET /` - API landing page
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/articles`
- `POST /api/articles`
- `PATCH /api/articles/:id`
- `DELETE /api/articles/:id`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/password`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`

## Behavior notes

- Self-registration always creates a `user`; admin access is granted through the admin routes only.
- `POST /api/auth/login` returns both a JWT token and the sanitized user object.
- `PATCH /api/users/me` can update the name, email, and avatar URL.
- `PATCH /api/users/me/password` verifies the current password before saving a new one.
- `GET /api/admin/stats` returns summary counts and recent users/articles for dashboard screens.

## Notes

- The models are intentionally small so you can expand them to match the frontend demo JSON data.
- Add your own controllers and validation rules as the project grows.
