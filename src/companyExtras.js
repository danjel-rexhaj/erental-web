// Form state + payload shaping for the optional business details (minimum days, insurance, extra
// services, cross-border countries, delivery zones) -- shared by business registration and the
// later "edit details" form so both send the backend exactly the same shape.
export const EMPTY_COMPANY_EXTRAS = {
  ofronDergimMakine: false,
  minimumDitesh: "",
  cmimiSigurimit: "",
  ofronKmTePakufizuara: false,
  cmimiShoferiShtese: "",
  cmimiSediljesBebe: "",
  cmimiDergesesJashtOrarit: "",
  vendetKufitare: [],
  vonjesaPolicy: "",
  vonjesaAmount: "",
};

// Empty means "not offered" (null); for the three extra-service prices 0 is a real value (free).
export function companyExtrasPayload(form) {
  return {
    ofronDergimMakine: form.ofronDergimMakine,
    minimumDitesh: form.minimumDitesh ? Number(form.minimumDitesh) : null,
    cmimiSigurimit: form.cmimiSigurimit ? Number(form.cmimiSigurimit) : null,
    ofronKmTePakufizuara: form.ofronKmTePakufizuara,
    cmimiShoferiShtese: form.cmimiShoferiShtese !== "" ? Number(form.cmimiShoferiShtese) : null,
    cmimiSediljesBebe: form.cmimiSediljesBebe !== "" ? Number(form.cmimiSediljesBebe) : null,
    cmimiDergesesJashtOrarit: form.cmimiDergesesJashtOrarit !== "" ? Number(form.cmimiDergesesJashtOrarit) : null,
    vendetKufitare: form.vendetKufitare,
    vonjesaPolicy: form.vonjesaPolicy || null,
    vonjesaAmount: form.vonjesaPolicy === "fixed" && form.vonjesaAmount !== "" ? Number(form.vonjesaAmount) : null,
  };
}

export function validDeliveryZones(zones) {
  return zones.filter((z) => z.zona.trim() && z.cmimi !== "").map((z) => ({ zona: z.zona.trim(), cmimi: Number(z.cmimi) }));
}
