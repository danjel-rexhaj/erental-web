import { useRef, useState } from "react";
import { Upload, X as XIcon, Star, Move } from "lucide-react";
import { apiFetch } from "../api";
import { PHOTO_SLOTS } from "../carData";
import { useLang } from "../useLang";
import { CroppedPhoto } from "../components";

function PhotoPositionAdjuster({ photo, token, onSave, onCancel, showError, t }) {
  const [y, setY] = useState(photo.objectPositionY ?? 50);
  const [saving, setSaving] = useState(false);
  const dragRef = useRef(null);
  const boxRef = useRef(null);

  function handlePointerDown(e) {
    dragRef.current = { startY: e.clientY, startPos: y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current || !boxRef.current) return;
    const boxHeight = boxRef.current.offsetHeight;
    const deltaY = e.clientY - dragRef.current.startY;
    const deltaPercent = (deltaY / boxHeight) * 100;
    const next = Math.min(100, Math.max(0, dragRef.current.startPos - deltaPercent));
    setY(next);
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch(`/CarPhotos/${photo.photoId}/position`, token, {
        method: "PUT",
        body: JSON.stringify({ objectPositionY: Math.round(y) }),
      });
      onSave();
    } catch (e) { showError(e); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">{t("photos.dragToAdjust")}</p>
        <div
          ref={boxRef}
          className="relative w-full h-48 rounded-xl overflow-hidden touch-none cursor-grab active:cursor-grabbing select-none bg-slate-100 dark:bg-slate-800"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={photo.urlFotos}
            alt=""
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: `center ${y}%` }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {t("photos.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-sky-500 dark:bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? t("common.loading") : t("photos.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CarPhotoManager({ carId, token, photos, onChanged, showError }) {
  const { t } = useLang();
  const [busyKey, setBusyKey] = useState(null);
  const [adjustingPhoto, setAdjustingPhoto] = useState(null);

  const byCategory = {};
  const others = [];
  (photos || []).forEach((p) => {
    const slot = PHOTO_SLOTS.find((s) => s.key === p.kategoria);
    if (slot && !byCategory[slot.key]) byCategory[slot.key] = p;
    else others.push(p);
  });
  const totalCount = (photos || []).length;
  const capReached = totalCount >= 7;

  async function handleUpload(slotKey, file) {
    if (!file) return;
    setBusyKey(slotKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("carId", carId);
      fd.append("eshteKryesore", totalCount === 0 ? "true" : "false");
      fd.append("kategoria", slotKey);
      await apiFetch("/CarPhotos/upload", token, { method: "POST", body: fd });
      onChanged();
    } catch (e) { showError(e); } finally { setBusyKey(null); }
  }

  async function handleDelete(photoId) {
    setBusyKey(`delete-${photoId}`);
    try {
      await apiFetch(`/CarPhotos/${photoId}`, token, { method: "DELETE" });
      onChanged();
    } catch (e) { showError(e); } finally { setBusyKey(null); }
  }

  async function handleSetMain(photoId) {
    setBusyKey(`main-${photoId}`);
    try {
      await apiFetch(`/CarPhotos/${photoId}/main`, token, { method: "PUT" });
      onChanged();
    } catch (e) { showError(e); } finally { setBusyKey(null); }
  }

  function handlePositionSaved() {
    setAdjustingPhoto(null);
    onChanged();
  }

  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t("photos.count", { count: totalCount })}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PHOTO_SLOTS.map((slot) => {
          const photo = byCategory[slot.key];
          const uploading = busyKey === slot.key;

          if (photo) {
            return (
              <div key={slot.key} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <CroppedPhoto url={photo.urlFotos} alt={t(`photoSlot.${slot.key}`)} positionY={photo.objectPositionY} className="w-full h-20 object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5">{t(`photoSlot.${slot.key}`)}</span>
                {photo.eshteKryesore ? (
                  <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 rounded-full w-5 h-5 flex items-center justify-center" title={t("business.mainPhoto")}>
                    <Star size={11} className="fill-current" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetMain(photo.photoId)}
                    disabled={busyKey === `main-${photo.photoId}`}
                    className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-amber-500"
                    title={t("photos.makeMain")}
                  >
                    <Star size={11} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAdjustingPhoto(photo)}
                  className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-sky-500 dark:hover:bg-emerald-600"
                  title={t("photos.adjustPosition")}
                >
                  <Move size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(photo.photoId)}
                  disabled={busyKey === `delete-${photo.photoId}`}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                >
                  <XIcon size={11} />
                </button>
              </div>
            );
          }

          return (
            <label
              key={slot.key}
              className={`flex flex-col items-center justify-center gap-1 h-20 rounded-xl border border-dashed text-center px-1 ${
                capReached ? "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed" : "border-sky-300 dark:border-emerald-700 text-sky-600 dark:text-emerald-400 cursor-pointer hover:bg-sky-50 dark:hover:bg-emerald-900/20"
              }`}
            >
              <Upload size={14} />
              <span className="text-[10px] leading-tight">{uploading ? t("common.loading") : t(`photoSlot.${slot.key}`)}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={capReached || uploading}
                onChange={(e) => handleUpload(slot.key, e.target.files?.[0])}
              />
            </label>
          );
        })}
      </div>

      {others.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-400 mb-1">{t("photos.otherPhotos")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {others.map((photo) => (
              <div key={photo.photoId} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <CroppedPhoto url={photo.urlFotos} alt="" positionY={photo.objectPositionY} className="w-full h-20 object-cover" />
                {photo.eshteKryesore ? (
                  <span className="absolute top-1 left-1 bg-amber-400 text-amber-950 rounded-full w-5 h-5 flex items-center justify-center" title={t("business.mainPhoto")}>
                    <Star size={11} className="fill-current" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetMain(photo.photoId)}
                    disabled={busyKey === `main-${photo.photoId}`}
                    className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-amber-500"
                    title={t("photos.makeMain")}
                  >
                    <Star size={11} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAdjustingPhoto(photo)}
                  className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-sky-500 dark:hover:bg-emerald-600"
                  title={t("photos.adjustPosition")}
                >
                  <Move size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(photo.photoId)}
                  disabled={busyKey === `delete-${photo.photoId}`}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                >
                  <XIcon size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adjustingPhoto && (
        <PhotoPositionAdjuster
          photo={adjustingPhoto}
          token={token}
          onSave={handlePositionSaved}
          onCancel={() => setAdjustingPhoto(null)}
          showError={showError}
          t={t}
        />
      )}
    </div>
  );
}
