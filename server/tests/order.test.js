import request from 'supertest';
import app from '../src/app.js';
import { connect, closeDatabase, clearDatabase } from './setup.js';
import Property from '../src/modules/properties/property.model.js';
import Room from '../src/modules/rooms/room.model.js';
import MenuCategory from '../src/modules/menu/category.model.js';
import MenuItem from '../src/modules/menu/item.model.js';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Order Module', () => {
  it('should create a new order', async () => {
    // Setup mock data
    const property = await Property.create({ name: 'Test Hotel', address: '123 Test St' });
    const room = await Room.create({ propertyId: property._id, roomNumber: '101' });
    const category = await MenuCategory.create({ propertyId: property._id, name: 'Food' });
    const item = await MenuItem.create({
      propertyId: property._id,
      categoryId: category._id,
      name: 'Burger',
      description: 'Delicious burger',
      price: 15
    });

    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        propertyId: property._id.toString(),
        roomId: room._id.toString(),
        items: [
          { menuItemId: item._id.toString(), quantity: 2 }
        ],
        specialInstructions: 'No onions'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAmount).toEqual(30); // 15 * 2
  });
});
