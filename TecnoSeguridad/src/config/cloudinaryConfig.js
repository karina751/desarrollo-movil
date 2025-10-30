// TecnoSeguridad/src/config/cloudinaryConfig.js

/**
 * Sube un archivo de imagen (URI local) a Cloudinary.
 *
 * @param {string} uri - URI local de la imagen seleccionada por ImagePicker.
 * @param {string} [folder='general'] - Carpeta en Cloudinary donde se guardará la imagen.
 * @returns {Promise<string>} - Retorna la URL segura de la imagen subida.
 */
export const subirImagenACloudinary = async (uri, folder = 'general') => {
    const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Credenciales de Cloudinary faltantes en .env. Revisa CLOUD_NAME y UPLOAD_PRESET.");
    }

    // 1. Preparar el FormData para la subida HTTP
    const fileExtension = uri.split('.').pop();
    const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    
    const formData = new FormData();
    formData.append('file', {
        uri: uri,
        type: mimeType, 
        name: `upload.${fileExtension}`,
    }); 
    
    // 2. Añadir el Preset de Subida (sin firmar) y la Carpeta
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
    formData.append('folder', folder); 

    // 3. Realizar la petición POST a la API de Cloudinary
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        const data = await response.json();

        if (response.ok && data.secure_url) {
            return data.secure_url; 
        } else {
            console.error("Error de la API de Cloudinary:", data);
            throw new Error(data.error?.message || "Error desconocido al subir la imagen a Cloudinary.");
        }
    } catch (error) {
        console.error("Error de red/subida a Cloudinary:", error);
        throw new Error(`Fallo al subir la imagen: ${error.message}. Verifica tus credenciales y conexión.`);
    }
};