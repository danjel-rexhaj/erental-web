import { formatLongDate, loadImageDataUrl } from "./invoicePdf";

const STATEMENT_TEXT = {
  sq: {
    title: "Pasqyrë transaksionesh", period: "Periudha", generated: "Gjeneruar",
    totalPaid: "Paguar gjithsej", totalCommission: "Komisioni gjithsej", totalNet: "Neto gjithsej", count: "Nr. transaksionesh",
    col: { date: "Data", ref: "Referenca", client: "Klienti", car: "Makina", business: "Biznesi", method: "Menyra", paid: "Paguar", commission: "Komisioni", net: "Neto", status: "Statusi" },
    methodFull: "E plote", methodDeposit: "Depozite",
    status: { completed: "Perfunduar", refunded: "Rimbursuar", refund_failed: "Rimbursim deshtoi", not_refunded: "Pa rimbursuar" },
    noTransactions: "Asnje transaksion ne kete periudhe.",
    page: "Faqe",
  },
  en: {
    title: "Transactions statement", period: "Period", generated: "Generated",
    totalPaid: "Total paid", totalCommission: "Total commission", totalNet: "Total net", count: "Transactions",
    col: { date: "Date", ref: "Reference", client: "Client", car: "Car", business: "Business", method: "Method", paid: "Paid", commission: "Commission", net: "Net", status: "Status" },
    methodFull: "Full", methodDeposit: "Deposit",
    status: { completed: "Completed", refunded: "Refunded", refund_failed: "Refund failed", not_refunded: "Not refunded" },
    noTransactions: "No transactions in this period.",
    page: "Page",
  },
};

export async function generateStatementPdf({ payments, admin = false, periodLabel, businessName, lang = "sq" }) {
  const { jsPDF } = await import("jspdf");
  const L = STATEMENT_TEXT[lang] || STATEMENT_TEXT.sq;

  const INK = [24, 24, 27];
  const GREY = [113, 113, 122];
  const LABEL_GREY = [161, 161, 170];
  const LINE = [228, 228, 231];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mx = 50;
  const rightX = pageW - mx;
  const bottomLimit = pageH - 50;

  let logoDataUrl = null;
  try { logoDataUrl = await loadImageDataUrl("/logo-light.png"); } catch { /* falls back to text below */ }

  let pageNum = 1;

  function drawHeader() {
    let y = 64;
    if (logoDataUrl) {
      const logoH = 34;
      const logoW = logoH * (2034 / 773);
      doc.addImage(logoDataUrl, "PNG", mx, y - 26, logoW, logoH);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...INK);
      doc.text("ERental", mx, y);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...INK);
    doc.text(L.title, rightX, y - 6, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text(`${L.period}: ${periodLabel}`, rightX, y + 12, { align: "right" });
    doc.text(`${L.generated}: ${formatLongDate(new Date(), lang)}`, rightX, y + 25, { align: "right" });
    return y + 50;
  }

  function drawFooter() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`${L.page} ${pageNum}`, rightX, pageH - 30, { align: "right" });
    doc.text(businessName || "ERental", mx, pageH - 30);
  }

  let y = drawHeader();

  // ---- summary totals ----
  const totals = payments.reduce((acc, p) => {
    acc.paid += p.shumaPaguarOnline || 0;
    acc.commission += p.komisioni || 0;
    acc.net += p.shumaBiznesit || 0;
    return acc;
  }, { paid: 0, commission: 0, net: 0 });

  const summaryItems = [
    [L.count, String(payments.length)],
    [L.totalPaid, `${totals.paid.toFixed(2)}€`],
    [L.totalCommission, `${totals.commission.toFixed(2)}€`],
    [L.totalNet, `${totals.net.toFixed(2)}€`],
  ];
  const colW = (rightX - mx) / summaryItems.length;
  summaryItems.forEach(([label, value], i) => {
    const x = mx + colW * i;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...LABEL_GREY);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(value, x, y + 20);
  });

  y += 44;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.1);
  doc.line(mx, y, rightX, y);
  y += 4;

  if (payments.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(L.noTransactions, mx, y + 30);
    drawFooter();
    doc.save(`pasqyre-${new Date().toISOString().split("T")[0]}.pdf`);
    return;
  }

  // ---- table ----
  const cols = [
    { key: "date", label: L.col.date, w: 0.11 },
    { key: "ref", label: L.col.ref, w: 0.13 },
    { key: "client", label: L.col.client, w: 0.15 },
    { key: "car", label: L.col.car, w: 0.13 },
    ...(admin ? [{ key: "business", label: L.col.business, w: 0.13 }] : []),
    { key: "method", label: L.col.method, w: admin ? 0.08 : 0.1 },
    { key: "paid", label: L.col.paid, w: 0.1, num: true },
    { key: "commission", label: L.col.commission, w: 0.09, num: true },
    { key: "net", label: L.col.net, w: 0.09, num: true },
  ];
  const tableW = rightX - mx;
  let colX = mx;
  const colsWithX = cols.map((c) => {
    const cx = colX;
    colX += tableW * c.w;
    return { ...c, x: cx };
  });

  // Cell text is always forced to one line (truncated with an ellipsis rather than wrapped) —
  // jsPDF's maxWidth wraps overflowing text onto a second line without adding row height for it,
  // which made long car names ("Mercedes-Benz S-Class") bleed into the next row's separator line.
  function fitText(text, maxWidth) {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 1 && doc.getTextWidth(truncated + "…") > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "…";
  }

  function drawTableHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...LABEL_GREY);
    colsWithX.forEach((c) => doc.text(c.label.toUpperCase(), c.x + (c.num ? tableW * c.w - 4 : 0), y, c.num ? { align: "right" } : undefined));
    y += 10;
    doc.setDrawColor(...INK);
    doc.setLineWidth(1);
    doc.line(mx, y, rightX, y);
    y += 20;
  }

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  payments.forEach((p) => {
    if (y > bottomLimit) {
      drawFooter();
      doc.addPage();
      pageNum += 1;
      y = drawHeader();
      drawTableHeader();
    }
    const row = {
      date: p.dataPageses ? formatLongDate(p.dataPageses, lang) : "-",
      ref: p.paypalCaptureId ? `${p.paypalCaptureId.slice(0, 12)}…` : "-",
      client: `${p.klienti?.emri || ""} ${p.klienti?.mbiemri || ""}`.trim() || "-",
      car: `${p.car?.marka || ""} ${p.car?.modeli || ""}`.trim() || "-",
      business: p.biznesi?.emri || "-",
      method: p.metodaPageses === "paypal_full" ? L.methodFull : L.methodDeposit,
      paid: p.shumaPaguarOnline != null ? `${p.shumaPaguarOnline}€` : "-",
      commission: p.komisioni != null ? `${p.komisioni.toFixed(2)}€` : "-",
      net: p.shumaBiznesit != null ? `${p.shumaBiznesit.toFixed(2)}€` : "-",
    };
    doc.setTextColor(...INK);
    colsWithX.forEach((c) => {
      const colWidth = tableW * c.w;
      const text = fitText(String(row[c.key] ?? "-"), colWidth - 6);
      doc.text(text, c.x + (c.num ? colWidth - 4 : 0), y, c.num ? { align: "right" } : undefined);
    });
    y += 18;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(mx, y - 6, rightX, y - 6);
  });

  drawFooter();
  doc.save(`pasqyre-${new Date().toISOString().split("T")[0]}.pdf`);
}
