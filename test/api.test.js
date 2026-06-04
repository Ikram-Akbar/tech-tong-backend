import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const userModel = vi.hoisted(() => ({
  findOne: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  find: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  countDocuments: vi.fn()
}));

const articleModel = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  exists: vi.fn(),
  countDocuments: vi.fn()
}));

vi.mock('../src/models/User.js', () => ({ User: userModel }));
vi.mock('../src/models/Article.js', () => ({ Article: articleModel }));

const { createApp } = await import('../src/app.js');

const app = createApp();

function createQuery(result) {
  const query = {
    select: vi.fn(() => query),
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    limit: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };

  return query;
}

function createUser(overrides = {}) {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    avatarUrl: '',
    savedArticles: [],
    comparePassword: vi.fn().mockResolvedValue(true),
    save: vi.fn().mockResolvedValue(null),
    populate: vi.fn().mockResolvedValue(null)
  };

  Object.assign(user, overrides);
  user.save = user.save || vi.fn().mockResolvedValue(null);
  user.populate = user.populate || vi.fn().mockResolvedValue(user);

  return user;
}

function createArticle(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439012',
    title: 'Sample Article',
    slug: 'sample-article',
    summary: 'Summary',
    content: 'Content body',
    category: 'general',
    imageUrl: '',
    status: 'published',
    author: {
      _id: '507f1f77bcf86cd799439011',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    },
    ...overrides
  };
}

function authHeader(userId = '507f1f77bcf86cd799439011') {
  return {
    authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}`
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  const defaultUser = createUser();
  const defaultAdmin = createUser({ role: 'admin', email: 'admin@example.com', name: 'Admin User' });
  const defaultArticle = createArticle();

  userModel.findOne.mockReturnValue(createQuery(defaultUser));
  userModel.create.mockResolvedValue(defaultUser);
  userModel.findById.mockReturnValue(createQuery(defaultUser));
  userModel.find.mockReturnValue(createQuery([defaultUser]));
  userModel.findByIdAndUpdate.mockReturnValue(createQuery(defaultUser));
  userModel.findByIdAndDelete.mockResolvedValue(defaultUser);
  userModel.countDocuments.mockResolvedValue(1);

  articleModel.find.mockReturnValue(createQuery([defaultArticle]));
  articleModel.findById.mockReturnValue(createQuery(defaultArticle));
  articleModel.create.mockResolvedValue(defaultArticle);
  articleModel.findByIdAndUpdate.mockReturnValue(createQuery(defaultArticle));
  articleModel.findByIdAndDelete.mockResolvedValue(defaultArticle);
  articleModel.exists.mockResolvedValue(true);
  articleModel.countDocuments.mockResolvedValue(1);

  userModel.defaultAdmin = defaultAdmin;
});

describe('Tech Tong News API', () => {
  it('serves the landing and health endpoints', async () => {
    const landing = await request(app).get('/');
    expect(landing.status).toBe(200);
    expect(landing.text).toContain('Tech Tong News API');

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true, service: 'tech-tong-news-backend' });
  });

  it('rejects registration payloads with missing or invalid fields', async () => {
    const missing = await request(app).post('/api/auth/register').send({ email: 'new@example.com' });
    expect(missing.status).toBe(400);

    const invalidEmail = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'not-an-email', password: 'secret123' });
    expect(invalidEmail.status).toBe(400);

    const shortPassword = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'new@example.com', password: '123' });
    expect(shortPassword.status).toBe(400);
  });

  it('registers a user and blocks duplicate emails', async () => {
    const createdUser = createUser({ email: 'new@example.com', name: 'New User' });
    userModel.findOne.mockReturnValueOnce(createQuery(null));
    userModel.create.mockResolvedValueOnce(createdUser);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'new@example.com', password: 'secret123' });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('new@example.com');
    expect(response.body.user.role).toBe('user');
    expect(response.body.token).toBeTypeOf('string');

    userModel.findOne.mockReturnValueOnce(createQuery(createdUser));
    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'new@example.com', password: 'secret123' });
    expect(duplicate.status).toBe(409);
  });

  it('validates login payloads and authenticates valid credentials', async () => {
    const badEmail = await request(app).post('/api/auth/login').send({ email: 'invalid', password: 'secret123' });
    expect(badEmail.status).toBe(400);

    userModel.findOne.mockReturnValueOnce(createQuery(null));
    const invalidCredentials = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'secret123' });
    expect(invalidCredentials.status).toBe(401);

    const user = createUser();
    user.comparePassword = vi.fn().mockResolvedValue(true);
    userModel.findOne.mockReturnValueOnce(createQuery(user));

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.token).toBeTypeOf('string');
  });

  it('protects the auth me endpoint', async () => {
    const unauthorized = await request(app).get('/api/auth/me');
    expect(unauthorized.status).toBe(401);

    const response = await request(app).get('/api/auth/me').set(authHeader());
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('validates and updates the current user profile', async () => {
    const invalid = await request(app).patch('/api/users/me').set(authHeader()).send({});
    expect(invalid.status).toBe(400);

    const updatedUser = createUser({
      name: 'Updated User',
      email: 'updated@example.com',
      avatarUrl: 'https://cdn.example.com/avatar.png'
    });
    userModel.findOne.mockReturnValueOnce(createQuery(null));
    userModel.findByIdAndUpdate.mockReturnValueOnce(createQuery(updatedUser));

    const response = await request(app)
      .patch('/api/users/me')
      .set(authHeader())
      .send({ name: 'Updated User', email: 'updated@example.com', avatarUrl: 'https://cdn.example.com/avatar.png' });

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe('Updated User');
    expect(response.body.user.email).toBe('updated@example.com');
  });

  it('validates password changes', async () => {
    const shortPassword = await request(app)
      .patch('/api/users/me/password')
      .set(authHeader())
      .send({ currentPassword: 'secret123', newPassword: '123' });
    expect(shortPassword.status).toBe(400);

    const user = createUser();
    user.comparePassword = vi.fn().mockResolvedValue(false);
    userModel.findById
      .mockReturnValueOnce(createQuery(createUser()))
      .mockReturnValueOnce(createQuery(user));

    const wrongCurrent = await request(app)
      .patch('/api/users/me/password')
      .set(authHeader())
      .send({ currentPassword: 'wrong', newPassword: 'secret123' });
    expect(wrongCurrent.status).toBe(401);

    const validUser = createUser();
    validUser.comparePassword = vi.fn().mockResolvedValue(true);
    validUser.save = vi.fn().mockResolvedValue(validUser);
    userModel.findById
      .mockReturnValueOnce(createQuery(createUser()))
      .mockReturnValueOnce(createQuery(validUser));

    const response = await request(app)
      .patch('/api/users/me/password')
      .set(authHeader())
      .send({ currentPassword: 'secret123', newPassword: 'newsecret123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password updated successfully');
  });

  it('validates saved article toggles', async () => {
    const invalidId = await request(app).patch('/api/users/me/saved/not-an-id').set(authHeader());
    expect(invalidId.status).toBe(400);

    const savedUser = createUser({
      savedArticles: [],
      save: vi.fn().mockResolvedValue(null),
      populate: vi.fn().mockResolvedValue(null)
    });
    userModel.findById.mockReturnValueOnce(createQuery(savedUser));
    articleModel.exists.mockResolvedValueOnce(true);

    const response = await request(app).patch('/api/users/me/saved/507f1f77bcf86cd799439012').set(authHeader());
    expect(response.status).toBe(200);
    expect(response.body.saved).toBe(true);
  });

  it('guards admin endpoints and returns dashboard stats for admins', async () => {
    const user = createUser();
    userModel.findById.mockReturnValueOnce(createQuery(user));

    const forbidden = await request(app).get('/api/admin/stats').set(authHeader());
    expect(forbidden.status).toBe(403);

    const adminUser = createUser({ role: 'admin', name: 'Admin User', email: 'admin@example.com' });
    userModel.findById.mockReturnValueOnce(createQuery(adminUser));
    userModel.find.mockReturnValueOnce(createQuery([adminUser]));
    userModel.countDocuments.mockResolvedValueOnce(5).mockResolvedValueOnce(1);
    articleModel.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(8).mockResolvedValueOnce(2);
    articleModel.find.mockReturnValueOnce(createQuery([createArticle()]));

    const response = await request(app).get('/api/admin/stats').set(authHeader());
    expect(response.status).toBe(200);
    expect(response.body.overview.users.total).toBe(5);
    expect(response.body.overview.articles.total).toBe(10);
  });

  it('validates admin role management', async () => {
    const adminUser = createUser({ role: 'admin' });
    userModel.findById.mockReturnValueOnce(createQuery(adminUser));
    const invalidRole = await request(app)
      .patch('/api/admin/users/507f1f77bcf86cd799439011/role')
      .set(authHeader())
      .send({ role: 'superadmin' });
    expect(invalidRole.status).toBe(400);

    const updatedUser = createUser({ role: 'admin' });
    userModel.findById.mockReturnValueOnce(createQuery(adminUser));
    userModel.findByIdAndUpdate.mockReturnValueOnce(createQuery(updatedUser));

    const response = await request(app)
      .patch('/api/admin/users/507f1f77bcf86cd799439011/role')
      .set(authHeader())
      .send({ role: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('admin');
  });

  it('lists and validates article endpoints', async () => {
    const list = await request(app).get('/api/articles');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.articles)).toBe(true);

    const invalidGet = await request(app).get('/api/articles/not-an-id');
    expect(invalidGet.status).toBe(400);

    const missingBody = await request(app).post('/api/articles').set(authHeader()).send({});
    expect(missingBody.status).toBe(400);

    const author = createUser({ role: 'admin' });
    userModel.findById.mockReturnValueOnce(createQuery(author));
    const createdArticle = createArticle({ title: 'Created Article', slug: 'created-article' });
    articleModel.create.mockResolvedValueOnce(createdArticle);

    const created = await request(app)
      .post('/api/articles')
      .set(authHeader())
      .send({ title: 'Created Article', content: 'Full content', summary: 'Summary', category: 'world', status: 'published' });

    expect(created.status).toBe(201);
    expect(created.body.article.title).toBe('Created Article');

    userModel.findById.mockReturnValueOnce(createQuery(author));
    const noFields = await request(app).patch('/api/articles/507f1f77bcf86cd799439012').set(authHeader()).send({});
    expect(noFields.status).toBe(400);

    userModel.findById.mockReturnValueOnce(createQuery(author));
    const invalidStatus = await request(app)
      .patch('/api/articles/507f1f77bcf86cd799439012')
      .set(authHeader())
      .send({ status: 'archived' });
    expect(invalidStatus.status).toBe(400);

    const updatedArticle = createArticle({ title: 'Updated Article', slug: 'updated-article' });
    userModel.findById.mockReturnValueOnce(createQuery(author));
    articleModel.findByIdAndUpdate.mockReturnValueOnce(createQuery(updatedArticle));
    const updated = await request(app)
      .patch('/api/articles/507f1f77bcf86cd799439012')
      .set(authHeader())
      .send({ title: 'Updated Article', status: 'published' });

    expect(updated.status).toBe(200);
    expect(updated.body.article.title).toBe('Updated Article');

    userModel.findById.mockReturnValueOnce(createQuery(author));
    const invalidDelete = await request(app).delete('/api/articles/not-an-id').set(authHeader());
    expect(invalidDelete.status).toBe(400);
  });
});