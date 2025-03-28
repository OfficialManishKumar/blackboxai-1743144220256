const { connect, disconnect, clearDatabase } = require('../config/testDb');
const app = require('../app');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

global.app = app;
global.request = require('supertest')(app);