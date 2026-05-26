import { http } from './http';

export const uploadService = {
  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await http.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },
};