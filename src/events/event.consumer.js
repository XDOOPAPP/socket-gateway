const EventBus = require('../infra/event-bus');
const socketHandler = require('../socket/socket.handler');
const env = require('../config/env');

class EventConsumer {
  constructor() {
    this.eventBus = new EventBus(env.rabbitMQ_url);
  }

  async connect() {
    try {
      await this.eventBus.connect();

      // Subscribe notification event
      await this.eventBus.subscribe('notification.send', async (data) => {
        console.log('📩 Received notification.new event:', data);
        this.handleMessage(data);
      });

    } catch (error) {
      console.error('❌ EventConsumer failed to connect:', error);
      setTimeout(() => this.connect(), 5000); // retry
    }
  }

  handleMessage(data) {
    /**
     * Expected structure:
     * {
     *   target: 'USER' | 'ADMINS' | 'ALL',
     *   userId?: string,
     *   payload: any
     * }
     */
    const { target, userId, payload } = data;

    switch (target) {
      case 'USER':
        if (!userId) {
          console.warn('⚠️ Missing userId for user target');
          return;
        }
        socketHandler.emitToUser(userId, payload);
        break;

      case 'ADMINS':
        socketHandler.emitToAdmins(payload);
        break;

      case 'ALL':
        socketHandler.emitToAll(payload);
        break;

      default:
        console.warn('⚠️ Unknown notification target:', target);
    }
  }
}

module.exports = new EventConsumer();
