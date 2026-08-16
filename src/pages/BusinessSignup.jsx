import { useState } from "react";
import { Building2 } from "lucide-react";
import { AuthView, VerifyView } from "./Auth";
import { BusinessDetailsForm } from "./BusinessDetailsForm";
import { useLang } from "../useLang";

// Registration is inherently two-phase (Auth/register only creates a pending row + emails a
// code; Auth/verify-email is the only place a real User + JWT gets created), and Companies/register
// requires that JWT -- so this sequences the existing endpoints as three local steps instead of
// adding a combined backend endpoint, and the visitor never sees a manual "log in" screen in between.
export default function BusinessSignup({ onAuth, onDone, showError, showOk }) {
  const { t } = useLang();
  const [step, setStep] = useState("account"); // "account" | "verify" | "details"
  const [verifyData, setVerifyData] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  function handleAccountGoTo(page, data) {
    if (page === "verifyEmail") {
      setVerifyData(data);
      setStep("verify");
    }
  }

  function handleVerified(data) {
    setSessionToken(data.token);
    onAuth(data);
    setStep("details");
  }

  return (
    <div>
      {step !== "details" && (
        <div className="max-w-md mx-auto mb-4 flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-emerald-400 bg-sky-50 dark:bg-emerald-900/20 rounded-full px-3 py-1.5 w-fit">
          <Building2 size={14} /> {t("business.signupBadge")}
        </div>
      )}
      {step === "account" && (
        <AuthView businessMode onAuth={() => {}} showError={showError} showOk={showOk} goTo={handleAccountGoTo} />
      )}
      {step === "verify" && (
        <VerifyView initialData={verifyData} onAuth={handleVerified} showError={showError} showOk={showOk} goTo={() => setStep("account")} />
      )}
      {step === "details" && (
        <div className="py-4">
          <BusinessDetailsForm token={sessionToken} onDone={onDone} showError={showError} showOk={showOk} submitLabel={t("auth.register")} />
        </div>
      )}
    </div>
  );
}
