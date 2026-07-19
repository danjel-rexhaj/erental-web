import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { apiFetch } from "../api";
import { CarCard } from "../components";

export default function Favorites({ token, showError, onSelectCar, onSelectCompany, favoriteIds, onToggleFavorite }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCars(await apiFetch("/Favorites", token)); } catch (e) { showError(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // favoriteIds is the source of truth (updated instantly on heart click anywhere in the app);
  // filtering the fetched list against it means un-hearting here removes the card immediately.
  const visibleCars = favoriteIds ? cars.filter((c) => favoriteIds.has(c.carId)) : cars;

  if (loading) return <p className="text-center text-sm text-slate-400 py-16">Duke ngarkuar...</p>;
  if (visibleCars.length === 0) {
    return (
      <div className="text-center py-16 px-8">
        <Heart size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Ende s'ke asnje makine te preferuar.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Shtyp zemren te nje makine per ta ruajtur ketu.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Te preferuarat</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCars.map((car) => (
          <CarCard
            key={car.carId}
            car={car}
            onSelectCar={onSelectCar}
            onSelectCompany={onSelectCompany}
            isFavorited={favoriteIds?.has(car.carId)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
