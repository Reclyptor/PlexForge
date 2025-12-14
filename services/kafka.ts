import { Kafka, Producer, SASLOptions } from 'kafkajs';

function getKafkaConfig() {
  const brokers = process.env.KAFKA_BROKERS;
  const username = process.env.KAFKA_USERNAME;
  const password = process.env.KAFKA_PASSWORD;

  if (!brokers) {
    throw new Error('KAFKA_BROKERS environment variable is required');
  }
  if (!username || !password) {
    throw new Error('KAFKA_USERNAME and KAFKA_PASSWORD environment variables are required');
  }

  const sasl: SASLOptions = {
    mechanism: 'plain',
    username,
    password,
  };

  return { brokers: brokers.split(','), clientId: username, sasl };
}

let kafka: Kafka | null = null;

function getKafka(): Kafka {
  if (!kafka) {
    const config = getKafkaConfig();
    kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      sasl: config.sasl,
    });
  }
  return kafka;
}

let producer: Producer | null = null;
let producerPromise: Promise<Producer> | null = null;

async function getProducer(): Promise<Producer> {
  if (producer) {
    return producer;
  }

  if (producerPromise) {
    return producerPromise;
  }

  producerPromise = (async () => {
    const p = getKafka().producer();
    await p.connect();
    producer = p;
    return producer;
  })();

  return producerPromise;
}

function getTopic(): string {
  const topic = process.env.KAFKA_TOPIC_BATCHES_QUEUED;
  if (!topic) {
    throw new Error('KAFKA_TOPIC_BATCHES_QUEUED environment variable is required');
  }
  return topic;
}

export async function publishBatchQueued(_id: string, directory: string): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic: getTopic(),
    messages: [{ value: JSON.stringify({ _id, directory }) }],
  });
}

export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    producerPromise = null;
  }
}

