// Standalone -- deliberately doesn't touch the router, LangProvider, or any API call, so it
// renders instantly and correctly no matter what. Plain white, stark on purpose (not the site's
// usual branded look) -- toggled via VITE_MAINTENANCE_MODE, nothing underneath is touched or lost.
export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MBYLLUR</h1>
        <p className="text-sm text-slate-500 mt-2">Kompania është mbyllur.</p>
        <p className="text-xs text-slate-400 mt-6">This business is closed.</p>
      </div>
    </div>
  );
}
