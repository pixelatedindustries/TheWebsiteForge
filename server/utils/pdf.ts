import PDFDocument from "pdfkit";
import { formatUsdCents } from "../../shared/billing";
import { supportEmail } from "../../shared/site";

/**
 * Invoice PDF rendering, isolated behind one function so the pdfkit dependency
 * stays swappable. pdfkit is pure Node (no headless browser) and streams the
 * document to a Buffer we return straight from an H3 handler.
 *
 * Note for deploys: pdfkit reads bundled .afm font-metric files at runtime. On
 * a bundled/serverless target, ensure these ship (Nitro: keep pdfkit external).
 */

export interface InvoiceLineItem {
  description: string;
  amountCents: number;
}

export interface InvoicePdfInput {
  invoice: {
    number: number;
    type: string;
    status: string;
    amountCents: number;
    vatCents: number;
    currency: string;
    issuedAt: Date | string;
    paidAt: Date | string | null;
  };
  customer: {
    name: string;
    email: string;
    company?: string | null;
  };
  lineItems: InvoiceLineItem[];
}

const BRAND = "TheWebsiteForge";

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function renderInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  const { invoice, customer, lineItems } = input;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fillColor("#111111")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(BRAND, 50, 50);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text(supportEmail, 50, 78);

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#111111")
        .text("INVOICE", 0, 50, { align: "right" });
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`#${String(invoice.number).padStart(5, "0")}`, 0, 76, {
          align: "right",
        })
        .text(`Issued: ${fmtDate(invoice.issuedAt)}`, 0, 90, {
          align: "right",
        })
        .text(`Status: ${invoice.status.toUpperCase()}`, 0, 104, {
          align: "right",
        });

      // Bill-to
      doc
        .moveTo(50, 130)
        .lineTo(545, 130)
        .strokeColor("#dddddd")
        .stroke();
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#999999")
        .text("BILL TO", 50, 145);
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#111111")
        .text(customer.company || customer.name, 50, 160);
      doc
        .fontSize(10)
        .fillColor("#666666")
        .text(customer.name, 50, 176)
        .text(customer.email, 50, 190);

      // Table header
      const tableTop = 235;
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#999999")
        .text("DESCRIPTION", 50, tableTop)
        .text("AMOUNT", 0, tableTop, { align: "right" });
      doc
        .moveTo(50, tableTop + 16)
        .lineTo(545, tableTop + 16)
        .strokeColor("#dddddd")
        .stroke();

      // Line items
      let y = tableTop + 28;
      doc.font("Helvetica").fontSize(10).fillColor("#111111");
      const items = lineItems.length
        ? lineItems
        : [{ description: invoice.type, amountCents: invoice.amountCents }];
      for (const item of items) {
        doc.text(item.description, 50, y, { width: 380 });
        doc.text(formatUsdCents(item.amountCents), 0, y, { align: "right" });
        y += 22;
      }

      // Totals
      doc
        .moveTo(330, y + 4)
        .lineTo(545, y + 4)
        .strokeColor("#dddddd")
        .stroke();
      y += 14;
      if (invoice.vatCents > 0) {
        doc
          .fillColor("#666666")
          .text("VAT", 330, y)
          .text(formatUsdCents(invoice.vatCents), 0, y, { align: "right" });
        y += 18;
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#111111")
        .text("Total", 330, y)
        .text(formatUsdCents(invoice.amountCents + invoice.vatCents), 0, y, {
          align: "right",
        });

      if (invoice.status === "paid") {
        y += 30;
        doc
          .font("Helvetica-Bold")
          .fontSize(13)
          .fillColor("#1a8a4a")
          .text(`PAID — ${fmtDate(invoice.paidAt)}`, 50, y);
      }

      // Footer
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#999999")
        .text(
          `Thank you for your business. Questions? ${supportEmail}`,
          50,
          760,
          { align: "center", width: 495 },
        );

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}
