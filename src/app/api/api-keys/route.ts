import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createApiKey, getApiKey, updateApiKey, deleteApiKey, listApiKeys } from '@/lib/db/api-keys';
import { ApiKeyInput } from '@/types/api-key';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exchange, key, secret } = body as ApiKeyInput;

    if (!exchange || !key || !secret) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingApiKey = await getApiKey(session.user.id, exchange);
    let apiKey;

    if (existingApiKey) {
      apiKey = await updateApiKey(session.user.id, { exchange, key, secret });
    } else {
      apiKey = await createApiKey(session.user.id, { exchange, key, secret });
    }

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('API key configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to configure API key' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get('exchange');

    if (exchange) {
      const apiKey = await getApiKey(session.user.id, exchange);
      if (!apiKey) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 });
      }
      return NextResponse.json(apiKey);
    }

    const apiKeys = await listApiKeys(session.user.id);
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('API key fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get('exchange');

    if (!exchange) {
      return NextResponse.json(
        { error: 'Exchange parameter is required' },
        { status: 400 }
      );
    }

    await deleteApiKey(session.user.id, exchange);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
} 