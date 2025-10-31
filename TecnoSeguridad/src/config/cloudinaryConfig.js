/**
 * Sube un archivo de imagen (URI local) a Cloudinary.
 * * Esta función es la que centraliza la comunicación con la API de Cloudinary.
 * Permite que componentes como Perfil o AgregarProducto suban imágenes sin 
 * exponer credenciales sensibles en el código.
 *
 * @param {string} uri - La ruta local de la imagen seleccionada desde la galería o cámara.
 * @param {string} [folder='general'] - La carpeta dentro de tu cuenta de Cloudinary donde se guardará la imagen
 * @returns {Promise<string>} - Devuelve la URL pública y segura de la imagen subida.
 */
export const subirImagenACloudinary = async (uri, folder = 'general') => {
    // Obtenemos las variables de entorno CLOUD_NAME y UPLOAD_PRESET. 
    // Es vital que estas variables estén definidas en el archivo .env con el prefijo EXPO_PUBLIC_.
    const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Verificamos que las credenciales existan antes de intentar la subida.
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Credenciales de Cloudinary faltantes en .env. Revisa CLOUD_NAME y UPLOAD_PRESET.");
    }

    // 1. Preparamos el objeto FormData para enviar el archivo.
    // FormData es el formato que la mayoría de las APIs de subida de archivos esperan en peticiones POST.
    const fileExtension = uri.split('.').pop();
    const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    
    const formData = new FormData();
    formData.append('file', { // 'file' es el nombre del campo que espera Cloudinary
        uri: uri,
        type: mimeType, // El tipo de contenido del archivo (ej: image/jpeg)
        name: `upload.${fileExtension}`, // Nombre de archivo genérico
    }); 
    
    // 2. Añadimos el Preset de Subida y la Carpeta de destino.
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // Crucial para la subida "Unsigned" (sin firmar)
    formData.append('folder', folder); // La carpeta dinámica

    // 3. Realizamos la petición POST a la API de Cloudinary.
    try {
        const response = await fetch(
            // Construimos el endpoint usando el CLOUD_NAME específico de la cuenta.
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data', // Indica que estamos enviando un formulario con datos de archivo
                },
            }
        );

        const data = await response.json();

        // Verificamos si la respuesta HTTP fue exitosa y si se recibió la URL segura.
        if (response.ok && data.secure_url) {
            return data.secure_url; // Devolvemos la URL que se guardará en Firestore.
        } else {
            // Manejo de errores de la API (ej: Preset inválido, Cloud Name erróneo).
            console.error("Error de la API de Cloudinary:", data);
            throw new Error(data.error?.message || "Error desconocido al subir la imagen a Cloudinary.");
        }
    } catch (error) {
        // Manejo de errores de red (ej: sin conexión).
        console.error("Error de red/subida a Cloudinary:", error);
        throw new Error(`Fallo al subir la imagen: ${error.message}. Verifica tus credenciales y conexión.`);
    }
};