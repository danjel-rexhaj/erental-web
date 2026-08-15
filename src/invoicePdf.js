import { monthName } from "./dateFormat";

// Not a React component, so it can't use useLang() -- callers pass the current lang instead.
const INVOICE_TEXT = {
  sq: {
    invoice: "Faturë", invoiceNumber: "Nr. faturës", date: "Data",
    billedTo: "Faturuar për", client: "Klient", defaultClient: "Klient ERental",
    total: "Totali", description: "Përshkrimi", pricePerDay: "Çmim/ditë", days: "Ditë", amount: "Shuma",
    rental: "Qera", from: "Nga", to: "deri", thanks: "Faleminderit për besimin!",
    invoiceQuestions: "Për pyetje rreth kësaj fature, na shkruaj në",
    cancellationTerms: "Kushtet e anulimit dhe rimbursimit",
    terms: "Anulimi brenda 12 orëve nga rezervimi rimbursohet plotësisht, automatikisht, në të njëjtën kartë me të cilën u krye pagesa online. Pas 12 orëve, rimbursimi i pjesës së paguar online varet nga marrëveshja mes klientit dhe biznesit — ERental si marketplace nuk ndërhyn më në këtë vendim. Pjesa e paguar cash (nëse ka) paguhet direkt te biznesi dhe nuk kalon nga ERental.",
    paymentInfo: "Informacion pagese", fullPaymentCard: "Kartë — pagesë e plotë", depositCard: "Kartë — depozitë",
    paidOnline: "Paguar online", card: "Karta", remainingCash: "Mbetet cash", contact: "Kontakt", locale: "sq-AL",
  },
  en: {
    invoice: "Invoice", invoiceNumber: "Invoice number", date: "Date",
    billedTo: "Billed to", client: "Client", defaultClient: "ERental client",
    total: "Total", description: "Description", pricePerDay: "Price/day", days: "Days", amount: "Amount",
    rental: "Rental", from: "From", to: "to", thanks: "Thank you for your business!",
    invoiceQuestions: "For questions about this invoice, contact us at",
    cancellationTerms: "Cancellation and refund terms",
    terms: "Cancelling within 12 hours of booking is refunded in full, automatically, to the same card the online payment was made with. After 12 hours, the refund of the portion paid online depends on the agreement between the customer and the business — ERental as a marketplace no longer intervenes in that decision. The portion paid in cash (if any) is paid directly to the business and never goes through ERental.",
    paymentInfo: "Payment information", fullPaymentCard: "Card — full payment", depositCard: "Card — deposit",
    paidOnline: "Paid online", card: "Card", remainingCash: "Remaining cash", contact: "Contact", locale: "en-GB",
  },
};

function formatLongDate(raw, lang) {
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  return `${d.getDate()} ${monthName(d.getMonth(), lang)} ${d.getFullYear()}`;
}

// jsPDF needs actual image data, not a URL — fetched once per invoice rather than bundled as a
// base64 string in the JS source, which would otherwise bloat every page load with an asset only
// needed at the moment someone downloads a PDF.
function loadImageDataUrl(url) {
  return fetch(url)
    .then((res) => res.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

// Shared by PaymentSuccessModal (right after paying) and the per-booking "Fatura" buttons in
// Bookings.jsx / Business.jsx (CompanyBookings) — an invoice needs to stay retrievable long after
// the payment moment, not just in a modal that's gone once closed.
export async function generateInvoicePdf({ bookingId, carMakeModel, dataFillimit, dataPerfundimit, cmimiPerDite, dite, totalPrice, amountPaid, eshtePagesePlote, clientLabel, company, cardLast4, lang = "sq" }) {
  const { jsPDF } = await import("jspdf");
  const L = INVOICE_TEXT[lang] || INVOICE_TEXT.sq;

  const confirmim = `ER-${String(bookingId).padStart(6, "0")}`;
  const mbetetCash = eshtePagesePlote ? 0 : Math.max(0, totalPrice - amountPaid);
  const sot = formatLongDate(new Date(), lang);

  const INK = [24, 24, 27];
  const GREY = [113, 113, 122];
  const LABEL_GREY = [161, 161, 170];
  const LINE = [228, 228, 231];
  const PAID = [21, 128, 61];
  const CASH = [180, 83, 9];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const mx = 50;
  const rightX = pageW - mx;

  let logoDataUrl = null;
  try { logoDataUrl = await loadImageDataUrl("/logo-light.png"); } catch { /* falls back to text below */ }

  // ---- header: logo left, invoice title + meta right ----
  let y = 56;
  if (logoDataUrl) {
    const logoH = 30;
    const logoW = logoH * (2034 / 773);
    doc.addImage(logoDataUrl, "PNG", mx, y - 22, logoW, logoH);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    doc.text("ERental", mx, y);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...INK);
  doc.text(L.invoice, rightX, y - 4, { align: "right" });

  const metaRows = [[L.invoiceNumber, confirmim], [L.date, sot]];
  let metaY = y + 20;
  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...LABEL_GREY);
    doc.text(label.toUpperCase(), rightX - 150, metaY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(value, rightX, metaY, { align: "right" });
    metaY += 16;
  });

  // ---- billed to / total due ----
  y = 150;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...LABEL_GREY);
  doc.text(L.billedTo.toUpperCase(), mx, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(L.total.toUpperCase(), rightX, y, { align: "right" });

  y += 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...INK);
  doc.text(clientLabel || L.defaultClient, mx, y);
  doc.setFontSize(18);
  doc.text(`${totalPrice}€`, rightX, y, { align: "right" });

  // ---- item table ----
  y += 36;
  const tableTop = y;
  const descX = mx;
  const priceX = mx + (rightX - mx) * 0.55;
  const qtyX = mx + (rightX - mx) * 0.74;
  const amtX = rightX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...LABEL_GREY);
  doc.text(L.description.toUpperCase(), descX, y);
  doc.text(L.pricePerDay.toUpperCase(), priceX, y, { align: "right" });
  doc.text(L.days.toUpperCase(), qtyX, y, { align: "right" });
  doc.text(L.amount.toUpperCase(), amtX, y, { align: "right" });

  y += 8;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.1);
  doc.line(mx, y, rightX, y);

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(`${L.rental} — ${carMakeModel}`, descX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text(`${L.from} ${formatLongDate(dataFillimit, lang)} ${L.to} ${formatLongDate(dataPerfundimit, lang)}`, descX, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(`${cmimiPerDite}€`, priceX, y, { align: "right" });
  doc.text(`${dite}`, qtyX, y, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`${totalPrice}€`, amtX, y, { align: "right" });

  y += 16;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.line(mx, y, rightX, y);

  // ---- totals ----
  y += 26;
  const totalsLabelX = rightX - 130;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY);
  doc.text(L.paidOnline, totalsLabelX, y);
  doc.setTextColor(...INK);
  doc.text(`${amountPaid}€`, rightX, y, { align: "right" });

  y += 20;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.1);
  doc.line(totalsLabelX, y - 13, rightX, y - 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(L.total, totalsLabelX, y);
  doc.text(`${totalPrice}€`, rightX, y, { align: "right" });

  // ---- thank you ----
  y += 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(L.thanks, mx, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(`${L.invoiceQuestions} info@erental.store`, mx, y + 15);

  // ---- payment info / contact ----
  y += 42;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.line(mx, y, rightX, y);

  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...LABEL_GREY);
  doc.text(L.paymentInfo.toUpperCase(), mx, y);
  doc.text(L.contact.toUpperCase(), rightX, y, { align: "right" });

  y += 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(eshtePagesePlote ? L.fullPaymentCard : L.depositCard, mx, y);
  doc.text(company?.emri || "ERental", rightX, y, { align: "right" });

  let leftY = y + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  if (cardLast4) {
    doc.setTextColor(...GREY);
    doc.text(`${L.card}: •••• •••• •••• ${cardLast4}`, mx, leftY);
    leftY += 14;
  }
  doc.setTextColor(...PAID);
  doc.setFont("helvetica", "bold");
  doc.text(`${L.paidOnline}: ${amountPaid}€`, mx, leftY);
  if (mbetetCash > 0) {
    leftY += 14;
    doc.setTextColor(...CASH);
    doc.text(`${L.remainingCash}: ${mbetetCash}€`, mx, leftY);
  }

  let rightY = y + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY);
  const bizLines = [];
  if (company?.adresa) bizLines.push(`${company.adresa}${company.qyteti ? `, ${company.qyteti}` : ""}`);
  if (company?.telefoni) bizLines.push(company.telefoni);
  bizLines.push("info@erental.store");
  bizLines.forEach((line) => { doc.text(line, rightX, rightY, { align: "right" }); rightY += 14; });

  // ---- cancellation terms, pinned near the bottom of the page ----
  const pageH = doc.internal.pageSize.getHeight();
  const termsY = pageH - 110;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.line(mx, termsY, rightX, termsY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(L.cancellationTerms.toUpperCase(), mx, termsY + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(doc.splitTextToSize(L.terms, rightX - mx), mx, termsY + 34, { lineHeightFactor: 1.5 });

  doc.save(`fatura-${confirmim}.pdf`);
}
