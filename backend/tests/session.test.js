const mongoose = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');

describe('Session Routes', () => {
  let testUser;
  let testSession;
  let authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'founder'
    });

    // Create test session
    testSession = await Session.create({
      title: 'Test Session',
      description: 'Test Description',
      startTime: new Date(Date.now() + 3600000), // 1 hour from now
      endTime: new Date(Date.now() + 7200000), // 2 hours from now
      createdBy: testUser._id
    });

    // Get auth token (simplified for testing)
    authToken = 'test-token';
  });

  describe('GET /api/sessions', () => {
    it('should return all sessions', async () => {
      const res = await request
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const newSession = {
        title: 'New Session',
        description: 'New Description',
        startTime: new Date(Date.now() + 86400000), // 1 day from now
        endTime: new Date(Date.now() + 90000000) // 1 day + 1 hour from now
      };

      const res = await request
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSession);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toEqual(newSession.title);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return a single session', async () => {
      const res = await request
        .get(`/api/sessions/${testSession._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id', testSession._id.toString());
    });
  });

  describe('PUT /api/sessions/:id', () => {
    it('should update a session', async () => {
      const updates = {
        title: 'Updated Session Title'
      };

      const res = await request
        .put(`/api/sessions/${testSession._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toEqual(updates.title);
    });
  });

  describe('PUT /api/sessions/:id/join', () => {
    it('should allow a user to join a session', async () => {
      const res = await request
        .put(`/api/sessions/${testSession._id}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.participants).toContain(testUser._id.toString());
    });
  });

  describe('PUT /api/sessions/:id/end', () => {
    it('should end a session', async () => {
      const res = await request
        .put(`/api/sessions/${testSession._id}/end`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ended');
    });
  });

  describe('POST /api/sessions/:id/chat', () => {
    it('should add a chat message to a session', async () => {
      const message = {
        text: 'Test message',
        sender: testUser._id
      };

      const res = await request
        .post(`/api/sessions/${testSession._id}/chat`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(message);

      expect(res.statusCode).toEqual(201);
      expect(res.body.messages).toHaveLength(1);
      expect(res.body.messages[0].text).toEqual(message.text);
    });
  });
});