import { http } from './http';

export type AuditStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED';

export type AuditListItem = {
  id: string;
  status: AuditStatus;
  deadline: string;
  store: {
    id: string;
    name: string;
    city: string;
  };
  template: {
    id: string;
    name: string;
  };
  auditor: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type CreateAuditDto = {
  templateId: string;
  storeId: string;
  auditorId: string;
  deadline: string;
};

export const auditService = {
  getAudits: async () => {
    const res = await http.get('/audits');
    return res.data;
  },

  getAuditById: async (id: string) => {
    const res = await http.get(`/audits/${id}`);
    return res.data;
  },

  createAudit: async (payload: CreateAuditDto) => {
    const res = await http.post('/audits', payload);
    return res.data;
  },

  startAudit: async (id: string, payload?: { gpsLat?: number; gpsLng?: number }) => {
    const res = await http.patch(`/audits/${id}/start`, payload ?? {});
    return res.data;
  },

  downloadAuditPdf: async (id: string) => {
    const res = await http.get(`/audits/${id}.pdf`, {
      responseType: 'blob',
    });

    return res.data;
  },
    openAuditPdf: async (id: string) => {
  const blob = await auditService.downloadAuditPdf(id);
  const url = window.URL.createObjectURL(
    new Blob([blob], { type: 'application/pdf' })
  );

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
},

  
  saveAuditResults: async (
  id: string,
  payload: {
    results: {
      checklistItemId: string;
      status: 'OK' | 'FAIL' | 'NA';
      score?: number;
      note?: string;
      photoUrl?: string;
    }[];
  },
) => {
  const res = await http.put(`/audits/${id}/results`, payload);
  return res.data;
},

  getAuditPdfUrl: (id: string) => `/api/audits/${id}/pdf`,
};