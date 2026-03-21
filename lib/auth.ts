import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cfo_session';

export async function requireUserId(): Promise<string> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export { SESSION_COOKIE };
