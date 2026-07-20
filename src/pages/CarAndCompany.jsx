import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Fuel, Gauge, Users as UsersIcon, Snowflake, Building2, ShieldCheck, Cog, Disc, Star, Check, Lock, Loader2, Info, X, Calendar, AlertTriangle } from "lucide-react";
import { apiFetch, mapEmbedUrl as getMapEmbedUrl } from "../api";
import { PrimaryButton, Spec, CarPhoto, CarCard, DateRangeCalendar, PaymentSuccessModal } from "../components";
import { PHOTO_SLOTS, AMENITIES } from "../carData";

export function CarDetail({ car, dataFillimit, dataPerfundimit, onBack, onSelectCompany, token, needAuth, goToProfile, showError, showOk, isBusinessOwner }) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const [hasLicense, setHasLicense] = useState(null);
  const [selFrom, setSelFrom] = useState(dataFillimit);
  const [selTo, setSelTo] = useState(dataPerfundimit);
  const activeFrom = selTo ? selFrom : dataFillimit;
  const activeTo = selTo ? selTo : dataPerfundimit;
  const days = activeFrom && activeTo ? Math.max(1, Math.round((new Date(activeTo) - new Date(activeFrom)) / 86400000)) : 0;
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

  useEffect(() => {
    if (!token) return;
    apiFetch("/Users/me", token)
      .then((u) => setHasLicense(!!u.hasLicensePara && !!u.hasLicenseMbrapa))
      .catch(() => {});
  }, [token]);

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
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-2.5 py-1.5 w-fit">
              <Calendar size={14} /> {activeFrom} → {activeTo}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">{days} dite × {car.cmimiDites}€</p>
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
                goToProfile={goToProfile}
                hasLicense={hasLicense}
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

        {car.company && (
          <div className="lg:col-span-5 order-4 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  {car.company.logoUrl ? (
                    <img src={car.company.logoUrl} alt={car.company.emri} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={28} className="text-emerald-700 dark:text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{car.company.emri}</p>
                    {car.company.eshteVerifikuar && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><ShieldCheck size={11} /> I verifikuar</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {car.company.avgRating != null && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        <Star size={13} className="text-amber-400 fill-amber-400" /> {car.company.avgRating} <span className="font-normal text-slate-400">({car.company.reviewCount})</span>
                      </span>
                    )}
                    <span className="whitespace-nowrap">{car.company.carCount} {car.company.carCount === 1 ? "makine" : "makina"} ne platforme</span>
                    {car.company.dataRegjistrimit && <span className="whitespace-nowrap">Anetar qe nga {memberSince(car.company.dataRegjistrimit)}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectCompany(car.companyId)}
                className="w-full sm:w-auto shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition"
              >
                Shiko profilin e biznesit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const MUAJT = ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nentor", "Dhjetor"];
function memberSince(raw) {
  const d = new Date(raw);
  if (isNaN(d)) return "";
  return `${MUAJT[d.getMonth()]} ${d.getFullYear()}`;
}

function BookingBox({ car, dataFillimit, dataPerfundimit, total, token, needAuth, goToProfile, hasLicense, showError, showOk, onBooked }) {
  const [method, setMethod] = useState("paypal_deposit");
  const [loading, setLoading] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);
  const buttonsRef = useRef(null);

  // createOrder/onApprove run from PayPal SDK callbacks, which capture whatever closure was in
  // scope when the button was last rendered. The button only re-renders on [method, token], so if
  // dataFillimit/dataPerfundimit/total aren't re-read from a ref, picking new dates in the calendar
  // without changing the payment method would silently submit the stale dates from initial render.
  const latestRef = useRef({ dataFillimit, dataPerfundimit, total, carId: car.carId });
  useEffect(() => {
    latestRef.current = { dataFillimit, dataPerfundimit, total, carId: car.carId };
  }, [dataFillimit, dataPerfundimit, total, car.carId]);

  useEffect(() => {
    if (!token || hasLicense !== true) return;
    let cancelled = false;
    const paymentMethod = method === "paypal_deposit" ? "deposit" : "full";

    async function createOrder() {
      const { carId, dataFillimit, dataPerfundimit } = latestRef.current;
      const res = await apiFetch("/Payments/paypal/create-order", token, {
        method: "POST",
        body: JSON.stringify({ carId, dataFillimit, dataPerfundimit, method: paymentMethod }),
      });
      return res.orderId;
    }

    async function onApprove(data) {
      setLoading(true);
      try {
        const { carId, dataFillimit, dataPerfundimit } = latestRef.current;
        const cap = await apiFetch("/Payments/paypal/capture", token, {
          method: "POST",
          body: JSON.stringify({ carId, dataFillimit, dataPerfundimit, method: paymentMethod, paypalOrderId: data.orderID }),
        });
        const booking = await apiFetch("/Bookings", token, {
          method: "POST",
          body: JSON.stringify({ carId, dataFillimit, dataPerfundimit, paymentMethod: method, paypalCaptureId: cap.captureId }),
        });
        setSuccessInfo({ bookingId: booking.bookingId, amountPaid: cap.amountPaid, method });
      } catch (e) { showError(e); } finally { setLoading(false); }
    }

    function renderButtons() {
      if (cancelled || !buttonsRef.current || !window.paypal?.Buttons) return;
      buttonsRef.current.innerHTML = "";
      const buttons = window.paypal.Buttons({
        fundingSource: window.paypal.FUNDING.CARD,
        style: { layout: "vertical", color: "black", shape: "rect", label: "pay" },
        createOrder,
        onApprove,
        onCancel: () => setLoading(false),
        onError: () => { showError(new Error("Pagesa deshtoi. Provo perseri.")); setLoading(false); },
      });
      if (!buttons.isEligible()) {
        setSdkError("Pagesa me karte nuk eshte e disponueshme aktualisht.");
        return;
      }
      buttons.render(buttonsRef.current);
      // Small artificial delay before revealing the button — rendering it the instant the SDK
      // resolves (often near-instantaneous on a warm cache) reads as a jarring pop-in/flash;
      // a brief "loading" beat feels more deliberate, especially right after switching the radio.
      setTimeout(() => { if (!cancelled) setButtonReady(true); }, 450);
    }

    if (window.paypal) {
      renderButtons();
      return () => { cancelled = true; setButtonReady(false); };
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      const t = setTimeout(() => setSdkError("Pagesat nuk jane konfiguruar akoma."), 0);
      return () => { cancelled = true; clearTimeout(t); setButtonReady(false); };
    }

    let script = document.getElementById("paypal-sdk");
    if (!script) {
      script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=buttons&currency=EUR`;
      document.body.appendChild(script);
    }
    const onScriptError = () => setSdkError("Sistemi i pagesave nuk u ngarkua dot. Kontrollo internetin dhe provo perseri.");
    script.addEventListener("load", renderButtons);
    script.addEventListener("error", onScriptError);
    return () => {
      cancelled = true;
      setButtonReady(false);
      script.removeEventListener("load", renderButtons);
      script.removeEventListener("error", onScriptError);
    };
  }, [method, token, hasLicense]);

  return (
    <div>
      {token && hasLicense === false && (
        <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20 rounded-2xl p-3 mb-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
            <AlertTriangle size={13} /> Nuk e ke shtuar patenten
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">Duhet te ngarkosh foton e patentes (para dhe mbrapa) ne profilin tend para se te rezervosh.</p>
          <button type="button" onClick={goToProfile} className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline">
            Shto tani ne profil
          </button>
        </div>
      )}

      {token && hasLicense === true && (
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="radio" name="paymentMethod" checked={method === "paypal_deposit"} onChange={() => { setMethod("paypal_deposit"); setSdkError(null); }} /> Depozite ({car.cmimiDites}€) me karte, pjesa tjeter cash
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="radio" name="paymentMethod" checked={method === "paypal_full"} onChange={() => { setMethod("paypal_full"); setSdkError(null); }} /> Pagese e plote ({total}€) me karte
          </label>
          <button
            type="button"
            onClick={() => setShowRefundPolicy(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2 mt-1"
          >
            <Info size={11} /> Politika e rimbursimit
          </button>
        </div>
      )}

      {showRefundPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowRefundPolicy(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Politika e rimbursimit</h3>
              <button onClick={() => setShowRefundPolicy(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">Depozite (karte) + pjesa tjeter cash</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Depozita e paguar me karte rimbursohet plotesisht nese anulon brenda 12 oresh nga rezervimi. Pas 12 oresh, rimbursimi i saj varet nga marreveshja mes teje dhe biznesit. Pjesa cash paguhet direkt te biznesi kur merr makinen — s'kalon nga ERental, ndaj s'ka nevoje per rimbursim nga ne.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">Pagese e plote (karte)</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Shuma e plote rimbursohet nese anulon brenda 12 oresh nga rezervimi. Pas 12 oresh, rimbursimi varet nga marreveshja mes teje dhe biznesit — ERental s'nderhyn me ne kete vendim.
              </p>
            </div>
          </div>
        </div>
      )}

      {!token && <PrimaryButton onClick={needAuth}>Kyçu per te rezervuar</PrimaryButton>}

      {token && hasLicense === null && (
        <p className="text-xs text-slate-400 py-2">Duke kontrolluar te dhenat...</p>
      )}

      {token && hasLicense === true && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-slate-50/60 dark:bg-slate-900/40">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            <Lock size={11} /> Pagese e sigurte, e procesuar direkt nga PayPal
          </p>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Loader2 size={16} className="animate-spin" /> Duke procesuar pagesen...
            </div>
          )}
          {!loading && !buttonReady && !sdkError && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Duke pergatitur pagesen...
            </div>
          )}
          <div className={loading || showRefundPolicy || !buttonReady ? "hidden" : ""} ref={buttonsRef} />
          {sdkError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{sdkError}</p>}
        </div>
      )}

      {successInfo && (
        <PaymentSuccessModal
          car={car}
          dataFillimit={dataFillimit}
          dataPerfundimit={dataPerfundimit}
          successInfo={successInfo}
          token={token}
          onClose={() => { setSuccessInfo(null); showOk("Rezervimi u konfirmua."); onBooked(); }}
        />
      )}
    </div>
  );
}

export function CompanyProfile({ company, cars, onBack, onSelectCar, favoriteIds, onToggleFavorite }) {
  if (!company) return null;

  const lat = company.latitude;
  const lng = company.longitude;
  const hasCoords = lat != null && lng != null;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const directionsUrl = hasCoords
    ? (isIOS ? `https://maps.apple.com/?daddr=${lat},${lng}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.adresa ? company.adresa + ", " : ""}${company.qyteti || ""}, Shqiperi`)}`;
  const mapEmbedUrl = hasCoords ? getMapEmbedUrl(lat, lng) : null;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> Prapa te kerkimi</button>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-8">
        <div className="flex items-center lg:items-stretch gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.emri} className="w-full h-full object-cover" />
            ) : (
              <Building2 size={28} className="text-emerald-700 dark:text-emerald-400" />
            )}
          </div>
          <div className="flex-1 lg:flex-initial min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{company.emri}</h1>
              {company.eshteVerifikuar && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><ShieldCheck size={11} /> I verifikuar</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              {company.avgRating != null && (
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <Star size={13} className="text-amber-400 fill-amber-400" /> {company.avgRating} <span className="font-normal text-slate-400">({company.reviewCount})</span>
                </span>
              )}
              <span className="whitespace-nowrap">{company.carCount ?? cars.length} {(company.carCount ?? cars.length) === 1 ? "makine" : "makina"}</span>
              {company.dataRegjistrimit && <span className="whitespace-nowrap">Anetar qe nga {memberSince(company.dataRegjistrimit)}</span>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin size={13} /> {company.adresa ? `${company.adresa}, ` : ""}{company.qyteti}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-slate-400 dark:text-slate-500">Kontakti i biznesit shfaqet te rezervimi juaj, pasi te konfirmohet.</p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl px-3 py-2 whitespace-nowrap"
              >
                <MapPin size={13} /> Merr udhezime
              </a>
            </div>
          </div>
          {mapEmbedUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              title="Merr udhezime"
              className="hidden lg:block relative flex-1 min-h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <iframe title="Vendndodhja e biznesit" src={mapEmbedUrl} className="w-full h-full border-0 pointer-events-none" loading="lazy" tabIndex={-1} />
              <span className="absolute inset-0 bg-black/0 hover:bg-black/10 transition" />
            </a>
          )}
        </div>
      </div>

      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Makinat e {company.emri} ({cars.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <CarCard key={car.carId} car={car} onSelectCar={onSelectCar} showCompany={false} isFavorited={favoriteIds?.has(car.carId)} onToggleFavorite={onToggleFavorite} />
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
  const [visibleCount, setVisibleCount] = useState(3);

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
        {reviews.slice(0, visibleCount).map((r) => (
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
      {visibleCount < reviews.length && (
        <button
          onClick={() => setVisibleCount((n) => n + 6)}
          className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Shiko me shume ({reviews.length - visibleCount})
        </button>
      )}
    </div>
  );
}
