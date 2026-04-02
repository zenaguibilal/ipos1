import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirection directe vers le tableau de bord car l'application est entièrement locale et ne nécessite pas de connexion.
  redirect('/dashboard');
}
