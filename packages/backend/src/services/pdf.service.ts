import PDFDocument from 'pdfkit';
  import { Response } from 'express';
  import path from 'path';
  import fs from 'fs'

  const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

  type AuditData = {
    id: string;
    status: string;
    deadline: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    gpsLat: number | null;
    gpsLng: number | null;
    resolvedAddress: string | null;
    store: { name: string; address: string; city: string };
    template: {
      name: string;
      categories: {
        name: string;
        items: { id: string; description: string }[];
      }[];
    };
    auditor: { firstName: string; lastName: string };
    results: {
      checklistItemId: string;
      status: string;
      score: number | null;
      note: string | null;
      photoUrl: string | null;
    }[];
  };

  export function generateAuditPdf(audit: AuditData, res: Response) {
    const doc = new PDFDocument({ margin: 50 });
    const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? './uploads');

    doc.registerFont('Regular', FONT);
    doc.registerFont('Bold', FONT_BOLD);
    doc.font('Regular');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audyt-${audit.id}.pdf"`);
    doc.pipe(res);

    // Nagłówek
    doc.font('Bold').fontSize(20).text('Raport z audytu', { align: 'center' });
    doc.font('Regular').moveDown();

    // Informacje ogólne
    doc.fontSize(12).text(`Szablon: ${audit.template.name}`);
    doc.text(`Sklep: ${audit.store.name}, ${audit.store.address}, ${audit.store.city}`);
    doc.text(`Audytor: ${audit.auditor.firstName} ${audit.auditor.lastName}`);
    doc.text(`Status: ${audit.status}`);
    doc.text(`Termin: ${audit.deadline.toLocaleDateString('pl-PL')}`);
    if (audit.startedAt) doc.text(`Rozpoczęto: ${audit.startedAt.toLocaleString('pl-PL')}`);
    if (audit.completedAt) doc.text(`Zakończono: ${audit.completedAt.toLocaleString('pl-PL')}`);
    if (audit.resolvedAddress) doc.text(`Adres rozpoczęcia: ${audit.resolvedAddress}`);
    if (audit.gpsLat != null && audit.gpsLng != null) {
      doc.text(`Współrzędne GPS: ${audit.gpsLat.toFixed(6)}, ${audit.gpsLng.toFixed(6)}`);
    }
    
    doc.moveDown();

    // Wyniki
    const resultsMap = new Map(audit.results.map((r) => [r.checklistItemId, r]));

    for (const category of audit.template.categories) {
      doc.font('Bold').fontSize(13).text(category.name, { underline: true });
      doc.font('Regular').moveDown(0.3);

      for (const item of category.items) {
        const result = resultsMap.get(item.id);
        const status = result?.status ?? 'BRAK';
        const score = result?.score != null ? ` (${result.score}/5)` : '';
        const note = result?.note ? ` – ${result.note}` : '';
        const statusSymbol = status === 'OK' ? '✓' : status === 'FAIL' ? '✗' : '–';

        doc.fontSize(11).text(`${statusSymbol} ${item.description}${score}${note}`, { indent: 15 });
        const photoUrl = result?.photoUrl;
        if (photoUrl) {
            const photoPath = path.join(uploadsDir, path.basename(photoUrl));
            if (fs.existsSync(photoPath)) {
            try {
                doc.image(photoPath, 65, undefined, { width: 180 });
                doc.moveDown(0.3);
            } catch {}
            }
        }
      }
      doc.moveDown();
    }

    // Podsumowanie
    const total = audit.results.length;
    const ok = audit.results.filter((r) => r.status === 'OK').length;
    const fail = audit.results.filter((r) => r.status === 'FAIL').length;

    doc.addPage();
    doc.font('Bold').fontSize(13).text('Podsumowanie', { underline: true });
    doc.font('Regular').fontSize(12).text(`Łącznie punktów: ${total}`);
    doc.text(`OK: ${ok}`);
    doc.text(`FAIL: ${fail}`);
    doc.text(`N/A: ${total - ok - fail}`);
    if (total > 0) doc.text(`Wynik: ${Math.round((ok / total) * 100)}%`);

    doc.end();
  }