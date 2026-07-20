// Shared by PaymentSuccessModal (right after paying) and the per-booking "Fatura" buttons in
// Bookings.jsx / Business.jsx (CompanyBookings) — an invoice needs to stay retrievable long after
// the payment moment, not just in a modal that's gone once closed.
export async function generateInvoicePdf({ bookingId, carMakeModel, dataFillimit, dataPerfundimit, cmimiPerDite, dite, totalPrice, amountPaid, eshtePagesePlote, clientLabel, company }) {
  const { jsPDF } = await import("jspdf");

  const confirmim = `ER-${String(bookingId).padStart(6, "0")}`;
  const mbetetCash = eshtePagesePlote ? 0 : Math.max(0, totalPrice - amountPaid);
  const sot = new Date().toLocaleDateString("sq-AL");

  const NAVY = [26, 35, 58];
  const GOLD = [197, 160, 89];
  const CREAM = [244, 240, 230];
  const INK = [26, 26, 26];
  const GREY = [120, 120, 120];
  const PAID = [21, 128, 61];
  const CASH = [180, 83, 9];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mx = 50;
  const rightX = pageW - mx;

  // ---- header band ----
  const headerH = 165;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, headerH, "F");

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.3);
  doc.circle(mx + 28, 62, 22, "S");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("ER", mx + 28, 67, { align: "center" });

  doc.setTextColor(...CREAM);
  doc.setFontSize(11);
  doc.text("E R E N T A L", mx + 28, 104, { align: "center" });

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(46);
  doc.text("FATURË", rightX, 95, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...CREAM);
  doc.text("Marketplace i qerasë së makinave", rightX, 118, { align: "right" });

  // ---- meta ----
  let y = headerH + 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("NUMRI I FATURËS", mx, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(confirmim, mx + 125, y);

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("DATA", mx, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(sot, mx + 125, y);

  // ---- billed to ----
  y += 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...NAVY);
  doc.text("Faturuar për:", mx, y);

  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(`Klienti  :  ${clientLabel || "Klient ERental"}`, mx, y);

  // ---- table ----
  y += 34;
  const tableY = y;
  const tableW = rightX - mx;
  const headerRowH = 42;
  const rowH = 48;
  const tableH = headerRowH + rowH + 12;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.roundedRect(mx, tableY, tableW, tableH, 8, 8, "S");

  const descX = mx + 18;
  const priceX = mx + tableW * 0.55;
  const qtyX = mx + tableW * 0.74;
  const amtX = rightX - 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text("PËRSHKRIMI", descX, tableY + 24);
  doc.text("ÇMIM/DITË", priceX, tableY + 24, { align: "right" });
  doc.text("DITË", qtyX, tableY + 24, { align: "right" });
  doc.text("SHUMA", amtX, tableY + 24, { align: "right" });

  doc.setDrawColor(230, 224, 210);
  doc.setLineWidth(0.6);
  doc.line(mx + 14, tableY + headerRowH, rightX - 14, tableY + headerRowH);

  const rowY = tableY + headerRowH + 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(`Qera — ${carMakeModel}`, descX, rowY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(`${dataFillimit} → ${dataPerfundimit}`, descX, rowY + 13);

  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(`${cmimiPerDite}€`, priceX, rowY, { align: "right" });
  doc.text(`${dite}`, qtyX, rowY, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`${totalPrice}€`, amtX, rowY, { align: "right" });

  // ---- thank you + total pill ----
  y = tableY + tableH + 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("Faleminderit për besimin!", mx, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("Për pyetje rreth kësaj fature, na shkruaj.", mx, y + 16);
  doc.setTextColor(...NAVY);
  doc.text("info@erental.store", mx, y + 29);

  const pillW = 190, pillH = 42;
  const pillX = rightX - pillW, pillY = y - 26;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.roundedRect(pillX, pillY, pillW, pillH, 21, 21, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("Totali", pillX + 24, pillY + 26);
  doc.setFontSize(15);
  doc.text(`${totalPrice}€`, pillX + pillW - 22, pillY + 27, { align: "right" });

  // ---- footer band ----
  const footH = 150;
  const footY = pageH - footH;
  doc.setFillColor(...NAVY);
  doc.rect(0, footY, pageW, footH, "F");

  let fy = footY + 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GOLD);
  doc.text("Informacion pagese", mx, fy);

  const paymentLines = [
    ["Menyra", eshtePagesePlote ? "Kartë — pagesë e plotë" : "Kartë — depozitë", CREAM],
    ["Paguar online", `${amountPaid}€`, PAID],
  ];
  if (mbetetCash > 0) paymentLines.push(["Mbetet cash", `${mbetetCash}€`, CASH]);

  fy += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  paymentLines.forEach(([k, v, color]) => {
    doc.setTextColor(190, 197, 212);
    doc.text(k, mx, fy);
    doc.setTextColor(...color);
    doc.text(v, mx + 110, fy);
    fy += 17;
  });

  let ry = footY + 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GOLD);
  doc.text(company?.emri || "ERental", rightX, ry, { align: "right" });

  ry += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...CREAM);
  const bizLines = [];
  if (company?.adresa) bizLines.push(`${company.adresa}${company.qyteti ? `, ${company.qyteti}` : ""}`);
  if (company?.telefoni) bizLines.push(company.telefoni);
  bizLines.push("erental.store");
  bizLines.forEach((line) => { doc.text(line, rightX, ry, { align: "right" }); ry += 15; });

  doc.save(`fatura-${confirmim}.pdf`);
}
