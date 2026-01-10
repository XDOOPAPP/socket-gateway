const amqp = require('amqplib');
const socketHandler = require('../socket/socket.handler');
const env = require('../config/env');

class EventConsumer {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'domain_events';
    }

    async connect() {
        try {
            this.connection = await amqp.connect(env.rabbitMQ_url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

            const q = await this.channel.assertQueue('', { exclusive: true });

            // Bind to routing keys we care about
            // Assuming notification-service publishes with 'notification.send'
            await this.channel.bindQueue(q.queue, this.exchange, 'notification.send');

            console.log('✅ EventConsumer connected and waiting for messages');

            this.channel.consume(q.queue, (msg) => {
                if (msg.content) {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        console.log(`📩 Received event: ${msg.fields.routingKey}`, payload);

                        this.handleMessage(payload);

                        this.channel.ack(msg);
                    } catch (e) {
                        console.error('Error processing message', e);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            setTimeout(() => this.connect(), 5000); // Retry logic
        }
    }

    handleMessage(data) {
        // data structure expected: { target: 'user'|'admins'|'all', userId?: string, payload: any }
        const { target, userId, payload } = data;

        switch (target) {
            case 'user':
                if (userId) socketHandler.emitToUser(userId, payload);
                break;
            case 'admins':
                socketHandler.emitToAdmins(payload);
                break;
            case 'all':
                socketHandler.emitToAll(payload);
                break;
            default:
                console.warn('Unknown target in notification event:', target);
        }
    }
}

module.exports = new EventConsumer();
