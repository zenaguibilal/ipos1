import { redirect } from 'next/navigation';

export default function RootPage() {
  // Since the login system is removed, redirect all users directly to the dashboard.
  redirect('/dashboard');
}
