import { Wrench } from "lucide-react";
import { Logo } from "./Logo";

// Standalone -- deliberately doesn't touch the router, LangProvider, or any API call, so it
// renders instantly and correctly even if the backend itself is the thing being worked on.
export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 text-center">
      <div className="max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <Wrench size={22} className="text-sky-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">Jemi duke bërë mirëmbajtje</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Do të kthehemi shumë shpejt. Faleminderit për durimin.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">We're currently under maintenance. Back shortly — thanks for your patience.</p>
      </div>
    </div>
  );
}
