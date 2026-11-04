'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/lib/admin';

export async function submitPassword(form: FormData) {
  const list = await headers();
  const ip = list.get('x-forwarded-for')?.split(',')[0] || list.get('x-real-ip') || 'local';
  const outcome = await signIn(String(form.get('password') ?? ''), ip);
  redirect(outcome === 'ok' ? '/admin' : `/admin?error=${outcome}`);
}

export async function leave() {
  await signOut();
  redirect('/admin');
}
