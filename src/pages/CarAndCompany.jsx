import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Fuel, Gauge, Users as UsersIcon, Snowflake, Building2, ShieldCheck, Cog, Disc, Star } from "lucide-react";
import { apiFetch } from "../api";
import { PrimaryButton, Spec, CarPhoto } from "../components";
import { PHOTO_SLOTS } from "../carData";

export function CarDetail({ car, dataFillimit, dataPerfundimit, onBack, onSelectCompany, token, needAuth, showError, showOk }) {
  const [loading, setLoading] = useState(false);
  const days = Math.max(1, Math.round((new Date(dataPerfundimit) - new Date(dataFillimit)) / 86400000));
  const total = (days * car.cmimiDites).toFixed(2);

  const photos = (car.carPhotos || []).filter(Boolean);
  const mainPhoto = photos.find((p) => p.eshteKryesore) || photos[0];
  const [activePhoto, setActivePhoto] = useState(mainPhoto);
  const shown = activePhoto || mainPhoto;
  const slotLabel = (kategoria) => PHOTO_SLOTS.find((s) => s.key === kategoria)?.label;

  function stepPhoto(dir) {
    if (photos.length < 2) return;
    const idx = photos.findIndex((p) => p.photoId === shown?.photoId);
    setActivePhoto(photos[(idx + dir + photos.length) % photos.length]);
  }

  async function book() {
    if (!token) return needAuth();
    setLoading(true);
    try {
      await apiFetch("/Bookings", token, { method: "POST", body: JSON.stringify({ carId: car.carId, dataFillimit, dataPerfundimit }) });
      showOk("Rezervimi u krijua. Shiko te 'Rezervimet' per ta konfirmuar.");
      onBack();
    } catch (e) { showError(e); } finally { setLoading(false); }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 mb-4"><ChevronLeft size={16} /> Prapa te kerkimi</button>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={shown?.urlFotos}
              alt={`${car.marka} ${car.modeli}`}
              className="w-full h-72 object-cover bg-slate-100"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => stepPhoto(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => stepPhoto(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
              {photos.map((p) => (
                <button
                  key={p.photoId}
                  type="button"
                  onClick={() => setActivePhoto(p)}
                  className={`relative rounded-xl overflow-hidden border h-16 ${shown?.photoId === p.photoId ? "border-emerald-600 ring-2 ring-emerald-200" : "border-slate-200"}`}
                >
                  <img src={p.urlFotos} alt={slotLabel(p.kategoria) || ""} className="w-full h-full object-cover" />
                  {slotLabel(p.kategoria) && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">{slotLabel(p.kategoria)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <p className="text-2xl font-bold text-slate-900">{car.marka} {car.modeli} · {car.viti}</p>
          <button onClick={() => onSelectCompany(car.companyId)} className="text-sm text-slate-600 hover:text-emerald-700 hover:underline flex items-center gap-1 mt-1">
            <MapPin size={13} /> {car.company?.emri}, {car.company?.qyteti}
          </button>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <Spec icon={Fuel} label="Karburanti" value={car.karburanti} />
            <Spec icon={Gauge} label="Transmisioni" value={car.transmisioni} />
            <Spec icon={UsersIcon} label="Vende" value={car.numriVendeve} />
            <Spec icon={Snowflake} label="Klima" value={car.klimatizimi ? "Po" : "Jo"} />
            {car.kubatura != null && <Spec icon={Cog} label="Kubatura" value={`${car.kubatura}cc`} />}
            {car.cilindra != null && <Spec icon={Disc} label="Cilindra" value={car.cilindra} />}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{days} dite × {car.cmimiDites}€</p>
              <span className="text-[11px] text-slate-400">{dataFillimit} → {dataPerfundimit}</span>
            </div>
            <p className="font-bold text-slate-900 text-2xl mt-1">{total}€</p>
          </div>

          <PrimaryButton onClick={book} disabled={loading} className="mt-4">{loading ? "Duke rezervuar..." : "Rezervo"}</PrimaryButton>
        </div>
      </div>

      {car.pershkrimi && (
        <div className="mt-8 max-w-3xl">
          <h3 className="font-semibold text-slate-900 mb-2">Pershkrimi</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{car.pershkrimi}</p>
        </div>
      )}
    </div>
  );
}

export function CompanyProfile({ company, cars, onBack, onSelectCar }) {
  if (!company) return null;
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 mb-6"><ChevronLeft size={16} /> Prapa te kerkimi</button>

      <div className="flex items-start justify-between border border-slate-200 rounded-2xl p-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{company.emri}</h1>
            {company.eshteVerifikuar && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full"><ShieldCheck size={12} /> I verifikuar</span>
            )}
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-2"><MapPin size={13} /> {company.adresa ? `${company.adresa}, ` : ""}{company.qyteti}</p>
          <p className="text-sm text-slate-500 mt-1">{company.telefoni} · {company.email}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Building2 size={22} className="text-emerald-700" />
        </div>
      </div>

      <h2 className="font-semibold text-slate-900 mb-4">Makinat e {company.emri} ({cars.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <button key={car.carId} onClick={() => onSelectCar(car)} className="text-left rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-600 hover:shadow-md transition bg-white">
            <CarPhoto car={car} />
            <div className="p-3">
              <p className="font-semibold text-slate-900 text-sm">{car.marka} {car.modeli}</p>
              <span className="text-xs font-bold text-slate-900">{car.cmimiDites}€/dite</span>
            </div>
          </button>
        ))}
      </div>

      <h2 className="font-semibold text-slate-900 mt-10 mb-4">Vleresime</h2>
      <CompanyReviews companyId={company.companyId} />
    </div>
  );
}

function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
      ))}
    </div>
  );
}

function CompanyReviews({ companyId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/Reviews/company/${companyId}`, null)
      .then((r) => { if (!cancelled) setReviews(r); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [companyId]);

  if (loading) return <p className="text-sm text-slate-400">Duke ngarkuar...</p>;
  if (reviews.length === 0) return <p className="text-sm text-slate-400">Ende pa vleresime.</p>;

  const avg = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Stars rating={Math.round(avg)} size={16} />
        <span className="font-bold text-slate-900">{avg}</span>
        <span className="text-sm text-slate-500">({reviews.length} vleresime)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reviews.map((r) => (
          <div key={r.reviewId} className="border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{r.emri} {r.mbiemri}</p>
              <Stars rating={r.rating} />
            </div>
            {r.koment && <p className="text-sm text-slate-600 mt-2">{r.koment}</p>}
            <p className="text-[11px] text-slate-400 mt-2">{new Date(r.data).toLocaleDateString("sq-AL")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
