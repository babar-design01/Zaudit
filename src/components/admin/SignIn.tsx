import { submitPassword } from '@/app/admin/actions';
import { Button } from '@/components/ui';

export function SignIn({ error }: { error?: string }) {
  const message = error === 'limited' ? 'Too many attempts. Wait 15 minutes and try again.' : error ? 'That password is not right.' : null;
  return (
    <main className="admin-signin">
      <form action={submitPassword} className="admin-card">
        <h1>Audix admin</h1>
        <label>
          Password
          <input type="password" name="password" required autoFocus autoComplete="current-password" />
        </label>
        {message && (
          <p role="alert" className="admin-error">
            {message}
          </p>
        )}
        <Button type="submit" fullWidth>
          Sign in
        </Button>
      </form>
    </main>
  );
}
