
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to dashboard as default
  redirect('/dashboard');
}
