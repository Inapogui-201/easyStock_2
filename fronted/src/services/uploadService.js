import api from './api.js';

export const uploadService = {
  /**
   * Uploader une image
   * @param {File} file - Fichier image à uploader
   * @returns {Promise} - URL de l'image uploadée
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Supprimer une image de Cloudinary
   * @param {string} publicId - ID public de l'image Cloudinary
   * @returns {Promise} - Résultat de la suppression
   */
  deleteImage: async (publicId) => {
    const response = await api.delete(`/upload/image/${publicId}`);
    return response.data;
  }
};
