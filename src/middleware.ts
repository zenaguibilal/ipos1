import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ce middleware est intentionnellement laissé vide après la suppression du système d'authentification.
  // Il laisse simplement passer la requête sans aucun traitement.
  return NextResponse.next();
}

// Un matcher vide signifie que ce middleware ne s'exécutera sur aucun chemin,
// mais le fichier est conservé pour éviter les erreurs de construction.
export const config = {
  matcher: [],
};
