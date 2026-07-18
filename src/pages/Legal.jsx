import { useState } from "react";
import { Briefcase, Shield, FileText, Send, CheckCircle2, Info, Mail, MessageCircle, Car as CarIcon, Users, ShieldCheck } from "lucide-react";
import { PrimaryButton, Field, inputClass } from "../components";
import { apiFetch } from "../api";

const SUPPORT_WHATSAPP = "355688208868";
const SUPPORT_EMAIL = "info@erental.store";

export function About() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-1"><Info size={20} className="text-emerald-700 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rreth ERental</h1></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Platforma e pare shqiptare qe lidh biznese te makinave me qera me klientet, ne nje vend te vetem.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <CarIcon size={22} className="mx-auto text-emerald-700 dark:text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Krahaso lirisht</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Filtro sipas markes, karburantit, cmimit dhe kategorise.</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <ShieldCheck size={22} className="mx-auto text-emerald-700 dark:text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Biznese te verifikuara</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cdo biznes kalon nga verifikimi i NIPT-it para se te listoje makina.</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <Users size={22} className="mx-auto text-emerald-700 dark:text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pa ndermjetes</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Flet direkt me biznesin, rezervo brenda minutash.</p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>ERental lindi nga nevoja për të thjeshtuar procesin e marrjes së një makine me qera në Shqipëri — pa telefonata të panumërta, pa çmime të fshehura dhe pa pasiguri nëse biznesi është real.</p>
        <p>Sot mbledhim biznese nga qytete të ndryshme të Shqipërisë, të gjitha të verifikuara, në një platformë të vetme ku klienti mund të kërkojë, krahasojë dhe rezervojë makinën e duhur në vetëm pak klikime.</p>
        <p>Misioni ynë është të krijojmë një eksperiencë të sigurt, të shpejtë dhe transparente si për klientët, ashtu edhe për bizneset e makinave me qera. Çdo rezervim menaxhohet në mënyrë të thjeshtë, duke kursyer kohë dhe duke rritur besimin mes të dyja palëve.</p>
        <p>Ne besojmë se gjetja e një makine me qera duhet të jetë po aq e lehtë sa rezervimi i një hoteli apo një bilete avioni. Për këtë arsye, vazhdojmë të përmirësojmë platformën duke shtuar biznese të reja, funksionalitete moderne dhe një eksperiencë gjithnjë e më të mirë për përdoruesit tanë.</p>
      </div>
    </div>
  );
}

export function Contact({ loggedIn, showError }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ emri: "", email: "", mesazhi: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Contact", null, {
        method: "POST",
        body: JSON.stringify({ emri: form.emri, email: form.email, subjekti: "Kontakt nga faqja", mesazhi: form.mesazhi }),
      });
      setSent(true);
    } catch (e) { showError && showError(e); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="flex items-center gap-2 mb-1"><Mail size={20} className="text-emerald-700 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Na kontakto</h1></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Kemi ndonje pyetje ose problem? Na shkruaj.</p>

      <div className="flex gap-2 mb-6">
        {loggedIn && (
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold py-2.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        )}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <Mail size={16} /> {SUPPORT_EMAIL}
        </a>
      </div>

      {sent ? (
        <div className="text-center py-10">
          <CheckCircle2 size={28} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-300">Mesazhi u dergua. Do te te pergjigjemi shpejt.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <Field label="Emri"><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="Emri Mbiemri" /></Field>
          <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="ti@email.com" /></Field>
          <Field label="Mesazhi">
            <textarea required className={inputClass} rows={5} value={form.mesazhi} onChange={set("mesazhi")} placeholder="Si mund te te ndihmojme?" />
          </Field>
          <PrimaryButton type="submit" disabled={loading} className="flex items-center justify-center gap-2">
            <Send size={14} /> {loading ? "Duke derguar..." : "Dergo mesazhin"}
          </PrimaryButton>
        </form>
      )}
    </div>
  );
}

export function Privacy() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-1"><Shield size={20} className="text-emerald-700 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Politika e Privatesise</h1></div>
      <p className="text-xs text-slate-400 mb-6">Perditesuar per here te fundit: Korrik 2026</p>

      <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">1. Cfare te dhena mbledhim</h2>
          <p>Kur regjistrohesh ne ERental, mbledhim emrin, mbiemrin, email-in dhe numrin e telefonit. Kur regjistron biznes, mbledhim gjithashtu NIPT-in, adresen dhe te dhenat e kontaktit te biznesit. Nuk mbledhim asnje dokument identiteti (ID, patente) nga klientet — verifikimi i identitetit per marrjen e makines behet fizikisht nga biznesi, jashte platformes.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">2. Si i perdorim te dhenat</h2>
          <p>Te dhenat perdoren vetem per te mundesuar rezervimin, komunikimin mes klientit dhe biznesit, dhe permiresimin e sherbimit. Nuk i shesim ose i ndajme te dhenat me palet e treta per qellime marketingu.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">3. Ruajtja e te dhenave</h2>
          <p>Te dhenat ruhen ne serverat tane per aq kohe sa llogaria eshte aktive. Foto e makinave ruhen ne infrastrukture cloud te sigurt (Cloudflare R2). Fjalekalimet ruhen te enkriptuara (hash), asnjehere si tekst i thjeshte.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">4. Te drejtat e tua</h2>
          <p>Mund te kerkosh fshirjen e llogarise tende dhe te dhenave te tua ne cdo kohe duke na kontaktuar. Mund te kerkosh nje kopje te te dhenave qe kemi per ty.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">5. Kontakt</h2>
          <p>Per pyetje rreth privatesise, na kontakto ne <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-700 dark:text-emerald-400 underline">{SUPPORT_EMAIL}</a></p>
        </section>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-1"><FileText size={20} className="text-emerald-700 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kushtet e Perdorimit</h1></div>
      <p className="text-xs text-slate-400 mb-6">Perditesuar per here te fundit: Korrik 2026</p>

      <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">ERental eshte nje marketplace (platforme ndermjetese)</h2>
          <p>ERental lidh klientet me biznese te pavarura te makinave me qera. <strong>ERental nuk eshte pronare, qeramarrese, apo operuese e asnje makine</strong> te listuar ne platforme. Cdo makine i takon biznesit qe e ka shtuar, dhe cdo rezervim eshte marreveshje mes klientit dhe atij biznesi specifik.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">1. Roli i ERental</h2>
          <p>ERental ofron mjete teknike per kerkim, rezervim dhe komunikim. Nuk marrim pjese ne, dhe nuk mbajme pergjegjesi per: gjendjen fizike te makinave, sigurimin, dokumentacionin e biznesit apo klientit, aksidentet, demtimet, mosmarreveshjet mes paleve, apo cilesine e sherbimit te ofruar nga biznesi.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">2. Verifikimi i bizneseve</h2>
          <p>ERental kontrollon NIPT-in e cdo biznesi para se t'i lejoje te listoje makina, per te konfirmuar qe eshte entitet biznesi real i regjistruar. Kjo <strong>nuk garanton</strong> cilesine e sherbimit apo gjendjen e makinave — eshte thjesht konfirmim identiteti biznesi.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">3. Pergjegjesia e klientit dhe biznesit</h2>
          <p>Klienti eshte pergjegjes te paraqese dokumentat e kerkuara (ID, patente) direkt tek biznesi ne momentin e marrjes se makines. Biznesi eshte pergjegjes per verifikimin e ketyre dokumentave dhe per gjendjen teknike/ligjore te makines qe ofron.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">4. Anulimet</h2>
          <p>Klienti mund te anuloje nje rezervim brenda 24 oreve nga krijimi, pa penalitet. Pas ketij afati, kushtet e anulimit percaktohen nga biznesi individual.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">5. Ndryshime</h2>
          <p>ERental mund t'i perditesoje keto kushte here pas here. Vazhdimi i perdorimit te platformes pas nje ndryshimi konsiderohet pranim i kushteve te reja.</p>
        </section>
      </div>
    </div>
  );
}

export function Careers({ showError }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ emri: "", email: "", pozicioni: "", mesazhi: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/Contact", null, {
        method: "POST",
        body: JSON.stringify({
          emri: form.emri,
          email: form.email,
          subjekti: `Aplikim karriere${form.pozicioni ? " — " + form.pozicioni : ""}`,
          mesazhi: form.mesazhi,
        }),
      });
      setSent(true);
    } catch (e) { showError && showError(e); } finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <CheckCircle2 size={32} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Faleminderit!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Aplikimi yt u dergua. Do te te kontaktojme nese ka pershtatje.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="flex items-center gap-2 mb-1"><Briefcase size={20} className="text-emerald-700 dark:text-emerald-400" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Karriere</h1></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Ne rritje jemi — nese do te doje te bashkohesh me ekipin e ERental, na trego pak per veten.</p>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-emerald-700 dark:text-emerald-400 underline">{SUPPORT_EMAIL}</a>
      <form onSubmit={submit} className="mt-4">
        <Field label="Emri i plote"><input required className={inputClass} value={form.emri} onChange={set("emri")} placeholder="Emri Mbiemri" /></Field>
        <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="ti@email.com" /></Field>
        <Field label="Pozicioni qe te intereson"><input className={inputClass} value={form.pozicioni} onChange={set("pozicioni")} placeholder="p.sh. Zhvillues, Marketing, Suport" /></Field>
        <Field label="Mesazh i shkurter">
          <textarea required className={inputClass} rows={4} value={form.mesazhi} onChange={set("mesazhi")} placeholder="Pak fjale per veten..." />
        </Field>
        <PrimaryButton type="submit" disabled={loading} className="flex items-center justify-center gap-2">
          <Send size={14} /> {loading ? "Duke derguar..." : "Dergo aplikimin"}
        </PrimaryButton>
      </form>
    </div>
  );
}
