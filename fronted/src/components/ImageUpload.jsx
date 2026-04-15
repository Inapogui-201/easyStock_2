import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api.js";

const ImageUpload = ({
  value = "",
  onChange,
  onRemove,
  className = "",
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  },
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);

  const onDrop = useCallback(
    async (acceptedFiles, fileRejections) => {
      // Gérer les erreurs de fichiers
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ errors }) => {
          errors.forEach((error) => {
            if (error.code === "file-too-large") {
              toast.error("Fichier trop volumineux (max 5MB)");
            } else if (error.code === "file-invalid-type") {
              toast.error("Format non supporté. Utilisez JPG, PNG ou WebP");
            } else {
              toast.error(`Erreur: ${error.message}`);
            }
          });
        });
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Afficher l'aperçu immédiatement
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Uploader le fichier
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post("/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          const imageUrl = response.data.data.url;
          setPreview(imageUrl);
          onChange(imageUrl);
          toast.success("Image uploadée avec succès");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Erreur lors de l'upload de l'image");
        setPreview(value); // Restaurer l'ancienne valeur
      } finally {
        setUploading(false);
      }
    },
    [onChange, value],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: uploading,
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
    if (onRemove) onRemove();
    toast.info("Image supprimée");
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Zone d'upload - toujours visible en haut */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4
          ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <div className="text-sm">
            {uploading ? (
              <span className="text-blue-600">Upload en cours...</span>
            ) : isDragActive ? (
              <span className="text-blue-600">Déposez l'image ici</span>
            ) : (
              <>
                <span className="text-gray-600">
                  Glissez-déposez une image ici
                </span>
                <span className="text-gray-400 block">
                  ou cliquez pour parcourir
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Formats: JPG, PNG, WebP (max 5MB)
          </div>
        </div>
      </div>

      {/* Card d'aperçu de l'image - en bas quand il y a une image */}
      {preview && (
        <div className="relative group">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="relative">
              <img
                src={preview}
                alt="Aperçu du produit"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleRemove}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                  title="Supprimer l'image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ImageIcon className="w-4 h-4" />
                  <span>Image uploadée</span>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  ✓ Prête
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
