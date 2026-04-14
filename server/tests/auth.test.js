import request from 'supertest';
import app from '../src/app.js';
import { connect, closeDatabase, clearDatabase } from './setup.js';
import User from '../src/modules/users/user.model.js';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Auth Module', () => {
  it('should login an existing user', async () => {
    // Create a mock user
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'super_admin'
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'wrong@test.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
