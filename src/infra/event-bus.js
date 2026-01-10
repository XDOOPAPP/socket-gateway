const amqp = require("amqplib");

class EventBus {
    constructor(url, exchange = "domain_events", type = "topic") {
        this.url = url;
        this.exchange = exchange;
        this.type = type;
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        if (this.channel) return;

        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(this.exchange, this.type, {
            durable: true,
        });

        console.log("✅ RabbitMQ connected");
    }

    async publish(event, payload) {
        if (!this.channel) throw new Error("EventBus not connected");

        this.channel.publish(
            this.exchange,
            event,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true }
        );
    }

    async subscribe(event, handler) {
        if (!this.channel) throw new Error("EventBus not connected");

        const { queue } = await this.channel.assertQueue("", { exclusive: true });
        await this.channel.bindQueue(queue, this.exchange, event);

        this.channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const payload = JSON.parse(msg.content.toString());
                await handler(payload);
                this.channel.ack(msg);
            } catch (err) {
                console.error("Handler error:", err);
            }
        });
    }
}

module.exports = EventBus;
