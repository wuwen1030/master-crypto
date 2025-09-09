import { createClient, type RedisClientType } from 'redis'

let client: RedisClientType | null = null

export async function getRedis(): Promise<RedisClientType> {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not set')
  }
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL })
    client.on('error', (err) => {
      console.error('Redis client error:', err)
    })
  }
  if (!client.isOpen) {
    await client.connect()
  }
  return client
}
