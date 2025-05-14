import { sql } from '@vercel/postgres';
import { ApiKey, ApiKeyInput } from '@/types/api-key';
import { encrypt, decrypt } from '@/lib/crypto';

export async function createApiKey(userId: string, input: ApiKeyInput): Promise<ApiKey> {
  const { exchange, key, secret } = input;
  const encryptedKey = encrypt(key);
  const encryptedSecret = encrypt(secret);

  const result = await sql`
    INSERT INTO api_keys (user_id, exchange, key, secret)
    VALUES (${userId}, ${exchange}, ${encryptedKey}, ${encryptedSecret})
    RETURNING *
  `;

  const apiKey = result.rows[0];
  return {
    id: apiKey.id,
    userId: apiKey.user_id,
    exchange: apiKey.exchange,
    key: decrypt(apiKey.key),
    secret: decrypt(apiKey.secret),
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at,
  };
}

export async function getApiKey(userId: string, exchange: string): Promise<ApiKey | null> {
  const result = await sql`
    SELECT * FROM api_keys
    WHERE user_id = ${userId} AND exchange = ${exchange}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  const apiKey = result.rows[0];
  return {
    id: apiKey.id,
    userId: apiKey.user_id,
    exchange: apiKey.exchange,
    key: decrypt(apiKey.key),
    secret: decrypt(apiKey.secret),
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at,
  };
}

export async function updateApiKey(userId: string, input: ApiKeyInput): Promise<ApiKey> {
  const { exchange, key, secret } = input;
  const encryptedKey = encrypt(key);
  const encryptedSecret = encrypt(secret);

  const result = await sql`
    UPDATE api_keys
    SET key = ${encryptedKey}, secret = ${encryptedSecret}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId} AND exchange = ${exchange}
    RETURNING *
  `;

  const apiKey = result.rows[0];
  return {
    id: apiKey.id,
    userId: apiKey.user_id,
    exchange: apiKey.exchange,
    key: decrypt(apiKey.key),
    secret: decrypt(apiKey.secret),
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at,
  };
}

export async function deleteApiKey(userId: string, exchange: string): Promise<void> {
  await sql`
    DELETE FROM api_keys
    WHERE user_id = ${userId} AND exchange = ${exchange}
  `;
}

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const result = await sql`
    SELECT * FROM api_keys
    WHERE user_id = ${userId}
  `;

  return result.rows.map(apiKey => ({
    id: apiKey.id,
    userId: apiKey.user_id,
    exchange: apiKey.exchange,
    key: decrypt(apiKey.key),
    secret: decrypt(apiKey.secret),
    createdAt: apiKey.created_at,
    updatedAt: apiKey.updated_at,
  }));
} 