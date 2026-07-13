import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../app.js';
import { signToken } from '../../utils/jwt.js';
import Property from '../properties/property.model.js';
import Room from '../rooms/room.model.js';
import MenuItem from '../menu/item.model.js';
import User from '../users/user.model.js';
import Notification from './notification.model.js';

// Ensure a secret is available for signing test tokens.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

let mongoServer;
let property;
let room;
let menuItem;
let admin;
let adminToken;

// Manual spy for the Socket.IO emitter (jest.fn() isn't a global in ESM mode).
const emitCalls = [];
const fakeIo = {
  emit: (event, payload) => {
    emitCalls.push({ event, payload });
  },
};

const createOrderRequest = (authToken) => {
  const req = request(app)
    .post('/api/v1/orders')
    .send({
      propertyId: property._id.toString(),
      roomId: room._id.toString(),
      items: [{ menuItemId: menuItem._id.toString(), quantity: 2 }],
    });
  if (authToken) req.set('Authorization', `Bearer ${authToken}`);
  return req;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  property = await Property.create({ name: 'Test Hotel', address: '123 St' });
  room = await Room.create({ propertyId: property._id, roomNumber: '101' });
  menuItem = await MenuItem.create({
    propertyId: property._id,
    name: 'Margherita Pizza',
    price: 12,
  });
  admin = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'property_admin',
    propertyId: property._id,
  });
  adminToken = signToken({
    id: admin._id,
    role: admin.role,
    propertyId: admin.propertyId,
  });

  // Provide a fake Socket.IO so order creation can attempt to emit.
  app.locals.io = fakeIo;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Notification.deleteMany();
  await mongoose.model('Order').deleteMany();
  emitCalls.length = 0;
});

describe('Order notifications', () => {
  test('Creating an order persists a new_order notification', async () => {
    const res = await createOrderRequest();
    expect(res.status).toBe(201);

    const notifications = await Notification.find();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('new_order');
    expect(notifications[0].orderId.toString()).toBe(res.body.data._id);
    expect(notifications[0].propertyId.toString()).toBe(property._id.toString());
    expect(notifications[0].isRead).toBe(false);
    expect(notifications[0].title).toMatch(/^New Order #/);
  });

  test('Creating an order emits a new_order real-time event', async () => {
    const res = await createOrderRequest();
    expect(res.status).toBe(201);
    expect(emitCalls.some((c) => c.event === 'new_order')).toBe(true);
  });

  test('Failed/invalid order does NOT create a notification', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ propertyId: property._id.toString() }); // missing roomId + items
    expect(res.status).toBe(400);

    const notifications = await Notification.find();
    expect(notifications).toHaveLength(0);
  });
});

describe('Integration: customer order -> admin real-time notification', () => {
  test('a customer-placed order is persisted, emitted, and visible to the admin', async () => {
    // 1. Customer (no auth) places a new order.
    const orderRes = await createOrderRequest();
    expect(orderRes.status).toBe(201);

    // 2. Backend emitted the real-time "new_order" event.
    expect(emitCalls.some((c) => c.event === 'new_order')).toBe(true);

    // 3. Admin fetches notifications and sees the unread order immediately.
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.unreadCount).toBeGreaterThanOrEqual(1);
    const hasNewOrder = notifRes.body.data.some(
      (n) => n.type === 'new_order' && String(n.orderId) === orderRes.body.data._id
    );
    expect(hasNewOrder).toBe(true);

    // 4. After the admin reviews (marks read) the badge count drops to 0.
    const notifId = notifRes.body.data.find(
      (n) => String(n.orderId) === orderRes.body.data._id
    )._id;
    await request(app)
      .patch(`/api/v1/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);

    const after = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.unreadCount).toBe(0);
  });
});

describe('Notification endpoints auth', () => {
  test('Unauthenticated request is rejected with 401', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Authenticated admin can list notifications with unread count', async () => {
    await createOrderRequest();

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Notification read lifecycle', () => {
  test('Marking a notification read updates isRead and unread count', async () => {
    await createOrderRequest();
    let list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    const notifId = list.body.data[0]._id;
    expect(list.body.unreadCount).toBe(1);

    const markRes = await request(app)
      .patch(`/api/v1/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(markRes.status).toBe(200);
    expect(markRes.body.data.isRead).toBe(true);

    list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.unreadCount).toBe(0);
  });

  test('Marking all read clears the unread count', async () => {
    await createOrderRequest();
    await createOrderRequest();

    const res = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.unreadCount).toBe(0);
  });

  test('Reviewing an order (status update) marks its notification read', async () => {
    const orderRes = await createOrderRequest();
    const orderId = orderRes.body.data._id;

    let list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.unreadCount).toBe(1);

    const statusRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'preparing' });
    expect(statusRes.status).toBe(200);

    list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.unreadCount).toBe(0);
  });
});
