import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Fuel, Gauge, Users as UsersIcon, Snowflake, Building2, ShieldCheck, Cog, Disc, Star, Check, CheckCircle2, Download, Lock, Loader2 } from "lucide-react";
import { apiFetch, mapEmbedUrl as getMapEmbedUrl } from "../api";
import { PrimaryButton, Spec, CarPhoto, DateRangeCalendar } from "../components";
import { PHOTO_SLOTS, AMENITIES } from "../carData";

export function CarDetail({ car, dataFillimit, dataPerfundimit, onBack, onSelectCompany, token, needAuth, showError, showOk, isBusinessOwner }) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const [selFrom, setSelFrom] = useState(dataFillimit);
  const [selTo, setSelTo] = useState(dataPerfundimit);
  const activeFrom = selTo ? selFrom : dataFillimit;
  const activeTo = selTo ? selTo : dataPerfundimit;
  const days = Math.max(1, Math.round((new Date(activeTo) - new Date(activeFrom)) / 86400000));
  const total = (days * car.cmimiDites).toFixed(2);

  const photos = (car.carPhotos || []).filter(Boolean);
  const mainPhoto = photos.find((p) => p.eshteKryesore) || photos[0];
  const [activePhoto, setActivePhoto] = useState(mainPhoto);
  const shown = activePhoto || mainPhoto;
  const slotLabel = (kategoria) => PHOTO_SLOTS.find((s) => s.key === kategoria)?.label;

  useEffect(() => {
    apiFetch(`/Cars/${car.carId}/view`, token, { method: "POST" }).catch(() => {});
  }, [car.carId]);

  useEffect(() => {
    apiFetch(`/Cars/${car.carId}/availability`, null).then(setBookedRanges).catch(() => {});
  }, [car.carId]);

  const lat = car.company?.latitude;
  const lng = car.company?.longitude;
  const hasCoords = lat != null && lng != null;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const directionsUrl = hasCoords
    ? (isIOS ? `https://maps.apple.com/?daddr=${lat},${lng}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${car.company?.adresa ? car.company.adresa + ", " : ""}${car.company?.qyteti || ""}, Shqiperi`)}`;
  const mapEmbedUrl = hasCoords ? getMapEmbedUrl(lat, lng) : null;

  function stepPhoto(dir) {
    if (photos.length < 2) return;
    const idx = photos.findIndex((p) => p.photoId === shown?.photoId);
    setActivePhoto(photos[(idx + dir + photos.length) % photos.length]);
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4"><ChevronLeft size={16} /> Prapa te kerkimi</button>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 lg:row-start-1 order-1">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={shown?.urlFotos}
              alt={`${car.marka} ${car.modeli}`}
              className="w-full h-72 object-cover bg-slate-100 dark:bg-slate-800"
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
                  className={`relative rounded-xl overflow-hidden border h-16 ${shown?.photoId === p.photoId ? "border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900/40" : "border-slate-200 dark:border-slate-700"}`}
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
        <div className="lg:col-span-2 lg:row-start-1 lg:row-span-2 order-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{car.marka} {car.modeli} · {car.viti}</p>
          <button
            onClick={() => onSelectCompany(car.companyId)}
            className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition group"
          >
            <Building2 size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{car.company?.emri}</span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin size={11} /> {car.company?.qyteti}</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <Spec icon={Fuel} label="Karburanti" value={car.karburanti} />
            <Spec icon={Gauge} label="Transmisioni" value={car.transmisioni} />
            <Spec icon={UsersIcon} label="Vende" value={car.numriVendeve} />
            <Spec icon={Snowflake} label="Klima" value={car.klimatizimi ? "Po" : "Jo"} />
            {car.kubatura != null && <Spec icon={Cog} label="Kubatura" value={`${car.kubatura}cc`} />}
            {car.cilindra != null && <Spec icon={Disc} label="Cilindra" value={car.cilindra} />}
          </div>

          {car.amenities && car.amenities.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Pajisje</p>
              <div className="flex flex-wrap gap-2">
                {car.amenities.map((key) => (
                  <span key={key} className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">
                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> {AMENITIES.find((a) => a.key === key)?.label || key}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">{days} dite × {car.cmimiDites}€</p>
              <span className="text-[11px] text-slate-400">{activeFrom} → {activeTo}</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-2xl mt-1">{total}€</p>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {selTo ? "Zgjidh datat direkt ne kalendar per t'i ndryshuar" : "Zgjidh daten e fillimit ne kalendar"}
            </p>
            <DateRangeCalendar
              ranges={bookedRanges}
              selFrom={selFrom}
              selTo={selTo}
              onSelect={(from, to) => { setSelFrom(from); setSelTo(to); }}
            />
          </div>

          {isBusinessOwner ? (
            <p className="mt-4 text-xs text-slate-400 text-center bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 px-3">
              Llogarite e bizneseve nuk mund te bejne rezervime.
            </p>
          ) : (
            <div className="mt-4">
              <BookingBox
                car={car}
                dataFillimit={activeFrom}
                dataPerfundimit={activeTo}
                total={total}
                token={token}
                needAuth={needAuth}
                showError={showError}
                showOk={showOk}
                onBooked={onBack}
              />
            </div>
          )}
        </div>

        {car.company?.qyteti && (
          <div className="lg:col-span-3 lg:row-start-2 order-3 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5"><MapPin size={16} className="text-teal-600 dark:text-teal-400" /> Ku ndodhet dhe merret makina</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{car.company.adresa ? `${car.company.adresa}, ` : ""}{car.company.qyteti}</p>

            {mapEmbedUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-3">
                <iframe
                  title="Vendndodhja e biznesit"
                  src={mapEmbedUrl}
                  className="w-full h-64 border-0"
                  loading="lazy"
                />
              </div>
            )}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-4 py-2.5"
            >
              <MapPin size={15} /> Merr udhezime
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingBox({ car, dataFillimit, dataPerfundimit, total, token, needAuth, showError, showOk, onBooked }) {
  const [method, setMethod] = useState("paypal_deposit");
  const [loading, setLoading] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const paypalRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const paymentMethod = method === "paypal_deposit" ? "deposit" : "full";

    async function createOrder() {
      const res = await apiFetch("/Payments/paypal/create-order", token, {
        method: "POST",
        body: JSON.stringify({ carId: car.carId, dataFillimit, dataPerfundimit, method: paymentMethod }),
      });
      return res.orderId;
    }

    async function onApprove(data) {
      setLoading(true);
      try {
        const cap = await apiFetch("/Payments/paypal/capture", token, {
          method: "POST",
          body: JSON.stringify({ carId: car.carId, dataFillimit, dataPerfundimit, method: paymentMethod, paypalOrderId: data.orderID }),
        });
        const booking = await apiFetch("/Bookings", token, {
          method: "POST",
          body: JSON.stringify({ carId: car.carId, dataFillimit, dataPerfundimit, paymentMethod: method, paypalCaptureId: cap.captureId }),
        });
        setSuccessInfo({ bookingId: booking.bookingId, amountPaid: cap.amountPaid, method });
      } catch (e) { showError(e); } finally { setLoading(false); }
    }

    function renderButton() {
      if (cancelled || !paypalRef.current) return;
      if (!window.paypal) { setSdkError("Sistemi i pagesave nuk u ngarkua dot. Provo te rifreskosh faqen."); return; }
      paypalRef.current.innerHTML = "";
      window.paypal.Buttons({
        fundingSource: window.paypal.FUNDING.CARD,
        style: { height: 45, shape: "rect" },
        createOrder,
        onApprove,
        onError: () => { showError(new Error("Pagesa deshtoi.")); setLoading(false); },
      }).render(paypalRef.current);
    }

    if (window.paypal) {
      renderButton();
      return () => { cancelled = true; };
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      const t = setTimeout(() => setSdkError("Pagesat nuk jane konfiguruar akoma."), 0);
      return () => { cancelled = true; clearTimeout(t); };
    }

    let script = document.getElementById("paypal-sdk");
    if (!script) {
      script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
      document.body.appendChild(script);
    }
    const onScriptError = () => setSdkError("Sistemi i pagesave nuk u ngarkua dot. Kontrollo internetin dhe provo perseri.");
    script.addEventListener("load", renderButton);
    script.addEventListener("error", onScriptError);
    return () => {
      cancelled = true;
      script.removeEventListener("load", renderButton);
      script.removeEventListener("error", onScriptError);
    };
  }, [method, token]);

  return (
    <div>
      {token && (
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="radio" name="paymentMethod" checked={method === "paypal_deposit"} onChange={() => { setMethod("paypal_deposit"); setSdkError(null); }} /> Depozite ({car.cmimiDites}€) me karte, pjesa tjeter cash
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="radio" name="paymentMethod" checked={method === "paypal_full"} onChange={() => { setMethod("paypal_full"); setSdkError(null); }} /> Pagese e plote ({total}€) me karte
          </label>
        </div>
      )}

      {token ? (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-slate-50/60 dark:bg-slate-900/40">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            <Lock size={11} /> Pagese e sigurte, e procesuar direkt nga PayPal
          </p>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Loader2 size={16} className="animate-spin" /> Duke procesuar pagesen...
            </div>
          )}
          <div ref={paypalRef} className={loading ? "hidden" : "min-h-[45px]"} />
          {sdkError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{sdkError}</p>}
        </div>
      ) : (
        <PrimaryButton onClick={needAuth}>Kyçu per te rezervuar</PrimaryButton>
      )}

      {successInfo && (
        <PaymentSuccessModal
          car={car}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          successInfo={successInfo}
          onClose={() => { setSuccessInfo(null); showOk("Rezervimi u konfirmua."); onBooked(); }}
        />
      )}
    </div>
  );
}

function PaymentSuccessModal({ car, dataFillimit, dataPerfundimit, successInfo, onClose }) {
  const confirmim = `ER-${String(successInfo.bookingId).padStart(6, "0")}`;

  function downloadInvoice() {
    const lines = [
      "ERental — Fatura e pageses",
      "",
      `Numri i konfirmimit: ${confirmim}`,
      `Makina: ${car.marka} ${car.modeli}`,
      `Biznesi: ${car.company?.emri || ""}`,
      `Marrja: ${dataFillimit}`,
      `Dorezimi: ${dataPerfundimit}`,
      `Menyra: ${successInfo.method === "paypal_full" ? "Pagese e plote" : "Depozite (1 dite)"}`,
      `Shuma e paguar: ${successInfo.amountPaid}€`,
      `Data e pageses: ${new Date().toLocaleDateString("sq-AL")}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fatura-${confirmim}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-slate-100 mb-1">Pagesa u krye ✓</h3>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">Rezervimi yt per {car.marka} {car.modeli} u konfirmua.</p>

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-400">Konfirmimi</span><span className="font-semibold text-slate-900 dark:text-slate-100">{confirmim}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Datat</span><span className="font-semibold text-slate-900 dark:text-slate-100">{dataFillimit} → {dataPerfundimit}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Shuma e paguar</span><span className="font-semibold text-emerald-700 dark:text-emerald-400">{successInfo.amountPaid}€</span></div>
        </div>

        <button
          onClick={downloadInvoice}
          className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 mb-2 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Download size={15} /> Shkarko faturen
        </button>
        <PrimaryButton onClick={onClose}>Kthehu</PrimaryButton>
      </div>
    </div>
  );
}

export function CompanyProfile({ company, cars, onBack, onSelectCar }) {
  if (!company) return null;
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> Prapa te kerkimi</button>

      <div className="flex items-start justify-between border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{company.emri}</h1>
            {company.eshteVerifikuar && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full"><ShieldCheck size={12} /> I verifikuar</span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2"><MapPin size={13} /> {company.adresa ? `${company.adresa}, ` : ""}{company.qyteti}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Kontakti i biznesit shfaqet te rezervimi juaj, pasi te konfirmohet.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
          <Building2 size={22} className="text-emerald-700 dark:text-emerald-400" />
        </div>
      </div>

      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Makinat e {company.emri} ({cars.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <button key={car.carId} onClick={() => onSelectCar(car)} className="text-left rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-md transition bg-white dark:bg-slate-800">
            <CarPhoto car={car} />
            <div className="p-3">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{car.marka} {car.modeli}</p>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{car.cmimiDites}€/dite</span>
            </div>
          </button>
        ))}
      </div>

      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mt-10 mb-4">Vleresime</h2>
      <CompanyReviews companyId={company.companyId} />
    </div>
  );
}

function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700"} />
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
        <span className="font-bold text-slate-900 dark:text-slate-100">{avg}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">({reviews.length} vleresime)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reviews.map((r) => (
          <div key={r.reviewId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.emri} {r.mbiemri}</p>
              <Stars rating={r.rating} />
            </div>
            {r.koment && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{r.koment}</p>}
            <p className="text-[11px] text-slate-400 mt-2">{new Date(r.data).toLocaleDateString("sq-AL")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
