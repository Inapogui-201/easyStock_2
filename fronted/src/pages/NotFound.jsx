import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[hsl(var(--primary))]">404</h1>
        <p className="text-xl text-[hsl(var(--muted-foreground))] mt-2">Page non trouvée</p>
        <Link to="/dashboard" className="inline-block mt-4 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
