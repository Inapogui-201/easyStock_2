import api from './api.js';

export const stockService = {
  getAll: async (params = {}) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },

  getAlerts: async () => {
    const response = await api.get('/stock/alerts');
    return response.data;
  },

  restock: async (id, quantity) => {
    const response = await api.post(`/stock/restock/${id}`, { quantity });
    return response.data;
  },

  adjust: async (id, stock) => {
    const response = await api.put(`/stock/adjust/${id}`, { stock });
    return response.data;
  }
};
