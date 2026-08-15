import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Fuel, Gauge, Users as UsersIcon, Snowflake, Building2, ShieldCheck, Cog, Disc, Star, Check, Lock, Loader2, Info, X, Calendar, AlertTriangle, Heart, SlidersHorizontal, Truck, Tag, ArrowRight, Clock } from "lucide-react";
import { apiFetch, mapEmbedUrl as getMapEmbedUrl } from "../api";
import { PrimaryButton, Spec, CarCard, DateRangeCalendar, PaymentSuccessModal, AmenityPicker } from "../components";
import { PHOTO_SLOTS, AMENITIES, CAR_CATEGORIES, CAR_BRANDS } from "../carData";
import { useLang } from "../useLang";
import { monthShort, monthName, formatLocaleDate } from "../dateFormat";

// PayPal's card-form billing address defaults to whatever locale we tell it — without an explicit
// `locale` param it tends to fall back to the merchant account's own country instead of the buyer's,
// forcing the buyer to manually re-pick their country/flag every time. We detect it once per session
// from the buyer's IP and map it to a PayPal-supported locale so the form opens pre-set correctly.
const PAYPAL_LOCALE_BY_COUNTRY = {
  AL: "en_US", IT: "it_IT", GB: "en_GB", DE: "de_DE", FR: "fr_FR", ES: "es_ES",
  US: "en_US", GR: "en_US", XK: "en_US", MK: "en_US", CH: "de_DE", AT: "de_DE",
  BE: "fr_FR", NL: "nl_NL", PT: "pt_PT", PL: "pl_PL",
};
let cachedPaypalLocale = null;
async function detectPaypalLocale() {
  if (cachedPaypalLocale) return cachedPaypalLocale;
  const stored = sessionStorage.getItem("paypalLocale");
  if (stored) return (cachedPaypalLocale = stored);
  try {
    const res = await fetch("https://ipapi.co/country/");
    const country = (await res.text()).trim().toUpperCase();
    cachedPaypalLocale = PAYPAL_LOCALE_BY_COUNTRY[country] || "en_US";
  } catch {
    cachedPaypalLocale = "en_US";
  }
  sessionStorage.setItem("paypalLocale", cachedPaypalLocale);
  return cachedPaypalLocale;
}

function formatShortDate(iso, lang) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${monthShort(d.getMonth(), lang)}`;
}
function addDaysIso(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
const todayIso = () => new Date().toISOString().split("T")[0];

const companySelectClass = "w-full text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-slate-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-emerald-900/40 transition";
const categoryLabelCompany = (key, t) => (CAR_CATEGORIES.some((c) => c.key === key) ? t(`category.${key}`) : key);
const BRAND_ORDER_COMPANY = Object.keys(CAR_BRANDS);
function sortByBrandPopularityCompany(brands) {
  return [...brands].sort((a, b) => {
    const ia = BRAND_ORDER_COMPANY.indexOf(a), ib = BRAND_ORDER_COMPANY.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function CarDetail({ car, dataFillimit, dataPerfundimit, onBack, onSelectCompany, token, needAuth, goToProfile, showError, showOk, isBusinessOwner, favoriteIds, onToggleFavorite, hubConnection }) {
  const { t, lang } = useLang();
  const [bookedRanges, setBookedRanges] = useState([]);
  const [hasLicense, setHasLicense] = useState(null);
  const [selFrom, setSelFrom] = useState(dataFillimit);
  const [selTo, setSelTo] = useState(dataPerfundimit);
  const activeFrom = selTo ? selFrom : dataFillimit;
  const activeTo = selTo ? selTo : dataPerfundimit;
  const days = activeFrom && activeTo ? Math.max(1, Math.round((new Date(activeTo) - new Date(activeFrom)) / 86400000)) : 0;
  const matchedOffer = car.priceOffers?.find((o) => o.dite === days);
  const total = (matchedOffer ? matchedOffer.cmimiTotal : days * car.cmimiDites).toFixed(2);
  // Results shows near-miss cars (free in X days) using the searched dates, which for this car
  // may already be taken — don't let the payment flow start until those dates are changed.
  const hasDateConflict = activeFrom && activeTo && bookedRanges.some((r) => {
    const s = new Date(r.dataFillimit);
    const e = new Date(r.dataPerfundimit);
    return new Date(activeFrom) < e && s < new Date(activeTo);
  });

  const photos = (car.carPhotos || []).filter(Boolean);
  const mainPhoto = photos.find((p) => p.eshteKryesore) || photos[0];
  const [activePhoto, setActivePhoto] = useState(mainPhoto);
  const shown = activePhoto || mainPhoto;
  const slotLabel = (kategoria) => (PHOTO_SLOTS.some((s) => s.key === kategoria) ? t(`photoSlot.${kategoria}`) : undefined);

  useEffect(() => {
    apiFetch(`/Cars/${car.carId}/view`, token, { method: "POST" }).catch(() => {});
  }, [car.carId]);

  useEffect(() => {
    apiFetch(`/Cars/${car.carId}/availability`, null).then(setBookedRanges).catch(() => {});
  }, [car.carId]);

  // Live-updates the calendar when the business blocks/unblocks dates or a booking gets
  // confirmed/cancelled elsewhere, without the client needing to refresh this page.
  useEffect(() => {
    if (!hubConnection) return;
    hubConnection.invoke("JoinCarGroup", car.carId).catch(() => {});
    const onAvailabilityChanged = (data) => {
      if (data?.carId === car.carId) {
        apiFetch(`/Cars/${car.carId}/availability`, null).then(setBookedRanges).catch(() => {});
      }
    };
    hubConnection.on("availabilityChanged", onAvailabilityChanged);
    return () => {
      hubConnection.off("availabilityChanged", onAvailabilityChanged);
      hubConnection.invoke("LeaveCarGroup", car.carId).catch(() => {});
    };
  }, [hubConnection, car.carId]);

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
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4"><ChevronLeft size={16} /> {t("common.backToSearch")}</button>
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
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(car)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition"
                title={favoriteIds?.has(car.carId) ? t("common.favoriteRemove") : t("common.favoriteAdd")}
              >
                <Heart size={16} className={favoriteIds?.has(car.carId) ? "text-red-500 fill-red-500" : "text-slate-500 dark:text-slate-300"} />
              </button>
            )}
          </div>
          {photos.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
              {photos.map((p) => (
                <button
                  key={p.photoId}
                  type="button"
                  onClick={() => setActivePhoto(p)}
                  className={`relative rounded-xl overflow-hidden border h-16 ${shown?.photoId === p.photoId ? "border-sky-600 dark:border-emerald-500 ring-2 ring-sky-200 dark:ring-emerald-900/40" : "border-slate-200 dark:border-slate-700"}`}
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
            className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-emerald-600 hover:bg-sky-50 dark:hover:bg-emerald-900/20 transition group"
          >
            <Building2 size={14} className="text-sky-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-emerald-400">{car.company?.emri}</span>
            <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin size={11} /> {car.company?.qyteti}</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <Spec icon={Fuel} label={t("car.spec.fuel")} value={car.karburanti} />
            <Spec icon={Gauge} label={t("car.spec.transmission")} value={car.transmisioni} />
            <Spec icon={UsersIcon} label={t("car.spec.seats")} value={car.numriVendeve} />
            <Spec icon={Snowflake} label={t("car.spec.aircon")} value={car.klimatizimi ? t("common.yes") : t("common.no")} />
            {car.kubatura != null && <Spec icon={Cog} label={t("car.spec.engineSize")} value={`${car.kubatura}cc`} />}
            {car.cilindra != null && <Spec icon={Disc} label={t("car.spec.cylinders")} value={car.cilindra} />}
          </div>

          {car.amenities && car.amenities.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("common.amenities")}</p>
              <div className="flex flex-wrap gap-2">
                {car.amenities.map((key) => (
                  <span key={key} className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">
                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> {AMENITIES.some((a) => a.key === key) ? t(`amenity.${key}`) : key}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mt-5">
            <div className="flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/30 rounded-lg px-2.5 py-1.5 w-fit">
              <Calendar size={14} /> {formatShortDate(activeFrom, lang)} → {formatShortDate(activeTo, lang)}
            </div>
            <div className="flex items-center justify-between mt-2">
              {matchedOffer ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 dark:text-teal-300 bg-cyan-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full w-fit">{t("car.specialPriceFor", { days })}</span>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("car.pricePerDay", { days, price: car.cmimiDites })}</p>
              )}
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-2xl mt-1">{total}€</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{t("home.standardTimes")}</p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              {selTo ? t("car.pickDatesEdit") : t("car.pickDatesStart")}
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
              {t("car.businessCantBook")}
            </p>
          ) : hasDateConflict ? (
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl py-2.5 px-3">
              <AlertTriangle size={14} className="shrink-0" /> {t("car.datesConflict")}
            </div>
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

        {(car.priceOffers?.length > 0 || car.company?.qyteti) && (
          <div className="lg:col-span-3 lg:row-start-2 order-3 flex flex-col gap-5">
            {car.priceOffers && car.priceOffers.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5"><Tag size={16} className="text-sky-600 dark:text-teal-400" /> {t("car.priceOffers.title")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t("car.priceOffers.subtitle")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {car.priceOffers.map((o) => {
                    const active = o.dite === days;
                    const perDite = (o.cmimiTotal / o.dite).toFixed(0);
                    return (
                      <button
                        key={o.dite}
                        type="button"
                        onClick={() => {
                          const from = activeFrom || new Date().toISOString().split("T")[0];
                          setSelFrom(from);
                          setSelTo(addDaysIso(from, o.dite));
                        }}
                        className={`text-left rounded-xl border p-3 transition ${
                          active
                            ? "border-sky-600 bg-sky-50 dark:bg-teal-900/20"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-teal-700"
                        }`}
                      >
                        <p className={`text-xs font-semibold ${active ? "text-sky-600 dark:text-teal-300" : "text-slate-500 dark:text-slate-400"}`}>{t("car.daysCount", { count: o.dite })}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{o.cmimiTotal}€</p>
                        <p className="text-[11px] text-slate-400">{t("car.priceOffers.approxPerDay", { price: perDite })}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {car.company?.qyteti && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5"><MapPin size={16} className="text-sky-600 dark:text-teal-400" /> {t("car.pickupTitle")}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{car.company.adresa ? `${car.company.adresa}, ` : ""}{car.company.qyteti}</p>

                {mapEmbedUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-3">
                    <iframe
                      title={t("common.businessLocationTitle")}
                      src={mapEmbedUrl}
                      className="w-full h-64 border-0"
                    />
                  </div>
                )}

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-sky-600 dark:bg-teal-700 hover:bg-sky-700 dark:hover:bg-teal-800 rounded-xl px-4 py-2.5"
                >
                  <MapPin size={15} /> {t("common.getDirections")}
                </a>
              </div>
            )}
          </div>
        )}

        {car.company && (
          <div className="lg:col-span-5 order-4 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  {car.company.logoUrl ? (
                    <img src={car.company.logoUrl} alt={car.company.emri} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={28} className="text-sky-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{car.company.emri}</p>
                    {car.company.eshteVerifikuar && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><ShieldCheck size={11} /> {t("common.verified")}</span>
                    )}
                    {car.company.ofronDergimMakine && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-teal-300 bg-sky-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><Truck size={11} /> {t("common.deliveryBadge")}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {car.company.avgRating != null && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        <Star size={13} className="text-amber-400 fill-amber-400" /> {car.company.avgRating} <span className="font-normal text-slate-400">({car.company.reviewCount})</span>
                      </span>
                    )}
                    <span className="whitespace-nowrap">{t("car.carsOnPlatform", { count: car.company.carCount })}</span>
                    {car.company.dataRegjistrimit && <span className="whitespace-nowrap">{t("car.memberSince", { date: memberSince(car.company.dataRegjistrimit, lang) })}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectCompany(car.companyId)}
                className="w-full sm:w-auto shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition"
              >
                {t("car.viewBusinessProfile")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function memberSince(raw, lang) {
  const d = new Date(raw);
  if (isNaN(d)) return "";
  return `${monthName(d.getMonth(), lang)} ${d.getFullYear()}`;
}

function BookingBox({ car, dataFillimit, dataPerfundimit, total, token, needAuth, goToProfile, hasLicense, showError, showOk, onBooked }) {
  const { t } = useLang();
  const [method, setMethod] = useState("paypal_deposit");
  const [loading, setLoading] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);
  const [openingCard, setOpeningCard] = useState(false);
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
      setOpeningCard(false);
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
        setSuccessInfo({ bookingId: booking.bookingId, amountPaid: cap.amountPaid, method, cardLast4: cap.cardLast4 });
      } catch (e) { showError(e); } finally { setLoading(false); }
    }

    function renderButtons() {
      if (cancelled || !buttonsRef.current || !window.paypal?.Buttons) return;
      buttonsRef.current.innerHTML = "";
      const buttons = window.paypal.Buttons({
        fundingSource: window.paypal.FUNDING.CARD,
        style: { layout: "vertical", color: "black", shape: "rect", label: "pay" },
        // PayPal's own card-entry overlay can take a beat to render after the click — without
        // this the button area just goes blank/unresponsive-looking until it shows up.
        onClick: () => {
          setOpeningCard(true);
          setTimeout(() => setOpeningCard(false), 2500);
        },
        createOrder,
        onApprove,
        onCancel: () => { setOpeningCard(false); setLoading(false); },
        onError: () => { setOpeningCard(false); showError(new Error(t("booking.paymentFailed"))); setLoading(false); },
      });
      if (!buttons.isEligible()) {
        setSdkError(t("booking.cardUnavailable"));
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
      const timer = setTimeout(() => setSdkError(t("booking.paymentsNotConfigured")), 0);
      return () => { cancelled = true; clearTimeout(timer); setButtonReady(false); };
    }

    let script = document.getElementById("paypal-sdk");
    const onScriptError = () => setSdkError(t("booking.paymentSystemLoadError"));
    if (!script) {
      script = document.createElement("script");
      script.id = "paypal-sdk";
      detectPaypalLocale().then((locale) => {
        if (cancelled || document.getElementById("paypal-sdk")) return;
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=buttons&currency=EUR&locale=${locale}`;
        script.addEventListener("load", renderButtons);
        script.addEventListener("error", onScriptError);
        document.body.appendChild(script);
      });
      return () => { cancelled = true; setButtonReady(false); };
    }
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
            <AlertTriangle size={13} /> {t("booking.noLicenseTitle")}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">{t("booking.noLicenseBody")}</p>
          <button type="button" onClick={goToProfile} className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline">
            {t("booking.addNow")}
          </button>
        </div>
      )}

      {token && hasLicense === true && (
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="radio" name="paymentMethod" checked={method === "paypal_deposit"} onChange={() => { setMethod("paypal_deposit"); setSdkError(null); }} /> {t("booking.depositOption", { amount: car.cmimiDites })}
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input type="radio" name="paymentMethod" checked={method === "paypal_full"} onChange={() => { setMethod("paypal_full"); setSdkError(null); }} /> {t("booking.fullOption", { amount: total })}
          </label>
          <button
            type="button"
            onClick={() => setShowRefundPolicy(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2 mt-1"
          >
            <Info size={11} /> {t("booking.refundPolicy")}
          </button>
        </div>
      )}

      {showRefundPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowRefundPolicy(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t("booking.refundPolicy")}</h3>
              <button onClick={() => setShowRefundPolicy(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">{t("booking.refundPolicy.depositTitle")}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("booking.refundPolicy.depositBody")}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">{t("booking.refundPolicy.fullTitle")}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("booking.refundPolicy.fullBody")}
              </p>
            </div>
          </div>
        </div>
      )}

      {!token && <PrimaryButton onClick={needAuth}>{t("booking.needLogin")}</PrimaryButton>}

      {token && hasLicense === null && (
        <p className="text-xs text-slate-400 py-2">{t("booking.checkingData")}</p>
      )}

      {token && hasLicense === true && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-slate-50/60 dark:bg-slate-900/40">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
            <Lock size={11} /> {t("booking.securePayment")}
          </p>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Loader2 size={16} className="animate-spin" /> {t("booking.processingPayment")}
            </div>
          )}
          {!loading && !buttonReady && !sdkError && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Loader2 size={16} className="animate-spin" /> {t("booking.preparingPayment")}
            </div>
          )}
          {!loading && buttonReady && openingCard && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Loader2 size={14} className="animate-spin" /> {t("booking.openingCardForm")}
            </div>
          )}
          <div className={`rounded-xl overflow-hidden bg-white p-1.5 ${loading || showRefundPolicy || !buttonReady ? "hidden" : ""}`} ref={buttonsRef} />
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
          onClose={() => { setSuccessInfo(null); showOk(t("booking.confirmed")); onBooked(); }}
        />
      )}
    </div>
  );
}

const COMPANY_FILTERS_DEFAULT = { marka: "", modeli: "", kategoria: "", karburanti: "", vitiMin: "", vitiMax: "", cmimiMax: "", amenities: [], sort: "" };

function companyFreeInLabel(lirohetMe, lang) {
  return formatShortDate(lirohetMe, lang);
}

export function CompanyProfile({ company, cars, dataFillimit, dataPerfundimit, onDatesChange, onBack, onSelectCar, favoriteIds, onToggleFavorite }) {
  const { t, lang } = useLang();
  const [filters, setFilters] = useState(COMPANY_FILTERS_DEFAULT);
  const [showFilters, setShowFilters] = useState(false);
  const [fullCars, setFullCars] = useState(null);

  const companyId = company?.companyId;

  // The cars list handed down from the search flow only ever contains cars available for
  // whatever dates were last searched (or none) — visiting a business's own profile should
  // show its whole fleet, with currently-booked cars flagged rather than hidden entirely.
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setFullCars(null);
    const url = dataFillimit && dataPerfundimit
      ? `/Cars/available?dataFillimit=${dataFillimit}&dataPerfundimit=${dataPerfundimit}&companyId=${companyId}`
      : "/Cars";
    apiFetch(url, null)
      .then((data) => {
        if (cancelled) return;
        setFullCars(dataFillimit && dataPerfundimit ? data : data.filter((c) => c.companyId === companyId));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [companyId, dataFillimit, dataPerfundimit]);

  if (!company) return null;

  const baseCars = fullCars ?? cars;

  const lat = company.latitude;
  const lng = company.longitude;
  const hasCoords = lat != null && lng != null;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const directionsUrl = hasCoords
    ? (isIOS ? `https://maps.apple.com/?daddr=${lat},${lng}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.adresa ? company.adresa + ", " : ""}${company.qyteti || ""}, Shqiperi`)}`;
  const mapEmbedUrl = hasCoords ? getMapEmbedUrl(lat, lng) : null;

  const brands = sortByBrandPopularityCompany([...new Set(baseCars.map((c) => c.marka).filter(Boolean))]);
  const models = [...new Set(baseCars.filter((c) => !filters.marka || c.marka === filters.marka).map((c) => c.modeli).filter(Boolean))].sort();
  const categories = [...new Set(baseCars.map((c) => c.kategoria).filter(Boolean))].sort();
  const years = [...new Set(baseCars.map((c) => c.viti).filter(Boolean))].sort((a, b) => b - a);

  function toggleAmenity(key) {
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((k) => k !== key) : [...f.amenities, key],
    }));
  }

  let visibleCars = baseCars.filter((c) =>
    (!filters.marka || c.marka === filters.marka) &&
    (!filters.modeli || c.modeli === filters.modeli) &&
    (!filters.kategoria || c.kategoria === filters.kategoria) &&
    (!filters.karburanti || c.karburanti === filters.karburanti) &&
    (!filters.vitiMin || c.viti >= Number(filters.vitiMin)) &&
    (!filters.vitiMax || c.viti <= Number(filters.vitiMax)) &&
    (!filters.cmimiMax || c.cmimiDites <= Number(filters.cmimiMax)) &&
    filters.amenities.every((key) => c.amenities?.includes(key))
  );
  if (filters.sort === "asc") visibleCars = [...visibleCars].sort((a, b) => a.cmimiDites - b.cmimiDites);
  if (filters.sort === "desc") visibleCars = [...visibleCars].sort((a, b) => b.cmimiDites - a.cmimiDites);
  const activeFilterCount = ["marka", "modeli", "kategoria", "karburanti", "vitiMin", "vitiMax", "cmimiMax", "sort"].filter((k) => filters[k]).length + filters.amenities.length;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-6"><ChevronLeft size={16} /> {t("common.backToSearch")}</button>

      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-8">
        <div className="flex items-center lg:items-stretch gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.emri} className="w-full h-full object-cover" />
            ) : (
              <Building2 size={28} className="text-sky-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="flex-1 lg:flex-initial min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{company.emri}</h1>
              {company.eshteVerifikuar && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><ShieldCheck size={11} /> {t("common.verified")}</span>
              )}
              {company.ofronDergimMakine && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-teal-300 bg-sky-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"><Truck size={11} /> {t("common.deliveryBadge")}</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              {company.avgRating != null && (
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <Star size={13} className="text-amber-400 fill-amber-400" /> {company.avgRating} <span className="font-normal text-slate-400">({company.reviewCount})</span>
                </span>
              )}
              <span className="whitespace-nowrap">{t("company.carsCount", { count: company.carCount ?? cars.length })}</span>
              {company.dataRegjistrimit && <span className="whitespace-nowrap">{t("car.memberSince", { date: memberSince(company.dataRegjistrimit, lang) })}</span>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin size={13} /> {company.adresa ? `${company.adresa}, ` : ""}{company.qyteti}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-slate-400 dark:text-slate-500">{t("company.contactAfterConfirm")}</p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-600 dark:bg-teal-700 hover:bg-sky-700 dark:hover:bg-teal-800 rounded-xl px-3 py-2 whitespace-nowrap"
              >
                <MapPin size={13} /> {t("common.getDirections")}
              </a>
            </div>
          </div>
          {mapEmbedUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              title={t("common.getDirections")}
              className="hidden lg:block relative flex-1 min-h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <iframe title={t("common.businessLocationTitle")} src={mapEmbedUrl} className="w-full h-full border-0 pointer-events-none" tabIndex={-1} />
              <span className="absolute inset-0 bg-black/0 hover:bg-black/10 transition" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap text-xs">
        <Calendar size={14} className="text-slate-400 shrink-0" />
        {dataFillimit && dataPerfundimit ? (
          <>
            <input
              type="date"
              value={dataFillimit}
              min={todayIso()}
              onChange={(e) => onDatesChange?.(e.target.value, dataPerfundimit && e.target.value >= dataPerfundimit ? addDaysIso(e.target.value, 1) : dataPerfundimit)}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-sky-600 dark:focus:border-emerald-500"
            />
            <ArrowRight size={12} className="text-slate-300 shrink-0" />
            <input
              type="date"
              value={dataPerfundimit}
              min={addDaysIso(dataFillimit, 1)}
              onChange={(e) => onDatesChange?.(dataFillimit, e.target.value)}
              className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-sky-600 dark:focus:border-emerald-500"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => onDatesChange?.(todayIso(), addDaysIso(todayIso(), 1))}
            className="text-sky-600 dark:text-emerald-400 font-semibold underline"
          >
            {t("company.pickDates")}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t("company.carsOfTitle", { name: company.emri })} ({visibleCars.length}{visibleCars.length !== baseCars.length ? ` ${t("company.ofTotal", { total: baseCars.length })}` : ""})</h2>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${
            showFilters || activeFilterCount > 0
              ? "border-sky-300 dark:border-emerald-600 text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20"
              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <SlidersHorizontal size={13} /> {t("common.filter")}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${showFilters ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <select value={filters.marka} onChange={(e) => setFilters((f) => ({ ...f, marka: e.target.value, modeli: "" }))} className={companySelectClass}>
                <option value="">{t("results.allBrands")}</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={filters.modeli} onChange={(e) => setFilters((f) => ({ ...f, modeli: e.target.value }))} className={companySelectClass}>
                <option value="">{t("results.allModels")}</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filters.karburanti} onChange={(e) => setFilters((f) => ({ ...f, karburanti: e.target.value }))} className={`${companySelectClass} capitalize`}>
                <option value="">{t("results.allFuels")}</option>
                <option value="diesel">Diesel</option>
                <option value="benzine">Benzine</option>
                <option value="hybrid">Hybrid</option>
                <option value="elektrik">Elektrik</option>
              </select>
              <select value={filters.kategoria} onChange={(e) => setFilters((f) => ({ ...f, kategoria: e.target.value }))} className={companySelectClass}>
                <option value="">{t("results.allCategories")}</option>
                {categories.map((k) => <option key={k} value={k}>{categoryLabelCompany(k, t)}</option>)}
              </select>
              <select
                value={filters.vitiMin}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters((f) => ({ ...f, vitiMin: v, vitiMax: f.vitiMax && v && Number(f.vitiMax) < Number(v) ? v : f.vitiMax }));
                }}
                className={companySelectClass}
              >
                <option value="">{t("results.yearFrom")}</option>
                {years.filter((y) => !filters.vitiMax || y <= Number(filters.vitiMax)).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={filters.vitiMax}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters((f) => ({ ...f, vitiMax: v, vitiMin: f.vitiMin && v && Number(f.vitiMin) > Number(v) ? v : f.vitiMin }));
                }}
                className={companySelectClass}
              >
                <option value="">{t("results.yearTo")}</option>
                {years.filter((y) => !filters.vitiMin || y >= Number(filters.vitiMin)).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <input
                type="number"
                min={0}
                value={filters.cmimiMax}
                onChange={(e) => setFilters((f) => ({ ...f, cmimiMax: e.target.value }))}
                placeholder={t("results.maxPricePlaceholder")}
                className={companySelectClass}
              />
              <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className={companySelectClass}>
                <option value="">{t("common.sortBy")}</option>
                <option value="asc">{t("common.priceAsc")}</option>
                <option value="desc">{t("common.priceDesc")}</option>
              </select>
            </div>

            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-4 mb-1.5">{t("common.amenities")}</p>
            <AmenityPicker selected={filters.amenities} onToggle={toggleAmenity} />

            {activeFilterCount > 0 && (
              <button onClick={() => setFilters(COMPANY_FILTERS_DEFAULT)} className="text-xs text-slate-500 dark:text-slate-400 font-medium underline px-0 hover:text-slate-800 dark:hover:text-slate-200 mt-3">
                {t("common.clearFilters")}
              </button>
            )}
          </div>
        </div>
      </div>

      {visibleCars.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">{t("company.noMatch")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCars.map((car) => (
            <CarCard
              key={car.carId}
              car={car}
              onSelectCar={onSelectCar}
              showCompany={false}
              isFavorited={favoriteIds?.has(car.carId)}
              onToggleFavorite={onToggleFavorite}
              nearMiss={car.eshteELire === false}
              freeInLabel={car.eshteELire === false ? t("company.bookedUntil", { date: companyFreeInLabel(car.lirohetMe, lang) }) : null}
            />
          ))}
        </div>
      )}

      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mt-10 mb-4">{t("company.reviewsTitle")}</h2>
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
  const { t, lang } = useLang();
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

  if (loading) return <p className="text-sm text-slate-400">{t("common.loading")}</p>;
  if (reviews.length === 0) return <p className="text-sm text-slate-400">{t("company.noReviewsYet")}</p>;

  const avg = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Stars rating={Math.round(avg)} size={16} />
        <span className="font-bold text-slate-900 dark:text-slate-100">{avg}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">({t("company.reviewsCount", { count: reviews.length })})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reviews.slice(0, visibleCount).map((r) => (
          <div key={r.reviewId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.emri} {r.mbiemri}</p>
              <Stars rating={r.rating} />
            </div>
            {r.koment && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{r.koment}</p>}
            <p className="text-[11px] text-slate-400 mt-2">{formatLocaleDate(r.data, lang)}</p>
          </div>
        ))}
      </div>
      {visibleCount < reviews.length && (
        <button
          onClick={() => setVisibleCount((n) => n + 6)}
          className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t("company.seeMore", { count: reviews.length - visibleCount })}
        </button>
      )}
    </div>
  );
}
