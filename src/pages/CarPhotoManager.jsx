import { useState } from "react";
import { Upload, X as XIcon } from "lucide-react";
import { apiFetch } from "../api";
import { PHOTO_SLOTS } from "../carData";

export default function CarPhotoManager({ carId, token, photos, onChanged, showError }) {
  const [busyKey, setBusyKey] = useState(null);

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

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">Foto ({totalCount}/7)</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PHOTO_SLOTS.map((slot) => {
          const photo = byCategory[slot.key];
          const uploading = busyKey === slot.key;

          if (photo) {
            return (
              <div key={slot.key} className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={photo.urlFotos} alt={slot.label} className="w-full h-20 object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5">{slot.label}</span>
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
                capReached ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-emerald-300 text-emerald-700 cursor-pointer hover:bg-emerald-50"
              }`}
            >
              <Upload size={14} />
              <span className="text-[10px] leading-tight">{uploading ? "Duke ngarkuar..." : slot.label}</span>
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
          <p className="text-[11px] text-slate-400 mb-1">Foto te tjera</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {others.map((photo) => (
              <div key={photo.photoId} className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={photo.urlFotos} alt="" className="w-full h-20 object-cover" />
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
    </div>
  );
}
