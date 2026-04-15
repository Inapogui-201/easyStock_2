import api from './api.js';

export const saleService = {
  getAll: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  create: async (saleData) => {
    // Format attendu:
    // {
    //   clientName: "Jean Dupont",
    //   clientPhone: "0600000000",
    //   products: [{ productId: "...", qty: 2 }],
    //   total: 2500,
    //   paymentMethod: "cash"
    // }
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  }
};
