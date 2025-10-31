/**
 * COMPONENTE/MODAL: AgregarProducto.js
 * FUNCIÓN: Formulario dinámico para crear o editar un producto en el inventario.
 * -----------------------------------------------------------
 * - CRUD: Utiliza addDoc (Creación) o updateDoc (Edición), basado en la prop productToEdit.
 * - GESTIÓN DE ARCHIVOS: Integra expo-image-picker y Cloudinary (subirImagenACloudinary) para manejar imágenes y guardar solo la URL en Firestore.
 * - VALIDACIÓN: Realiza validaciones de campos (números, existencia de imagen).
 * - FLUJO: Activa una bandera (shouldReload) para forzar la recarga del componente padre (AdminProductos) al cerrar.
 */
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    Modal, 
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Image,
    ScrollView, 
    KeyboardAvoidingView, 
    Platform,
    Alert, // Se mantiene para permisos o errores nativos
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
// Importamos funciones de Firestore para agregar y actualizar documentos.
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig'; 
import { LinearGradient } from 'expo-linear-gradient';
// Importaciones de utilidades y librerías externas
import * as ImagePicker from 'expo-image-picker'; 
import { subirImagenACloudinary } from '../src/config/cloudinaryConfig'; // Función global de subida de imagen

// --- Variables de color globales ---
const BLUE_COLOR_SOFT = '#1E90FF'; // Azul principal
const RED_COLOR = '#FF4136';
const GREEN_COLOR = '#4CAF50';

/**
 * CustomAlert: Modal de alerta personalizado.
 * Muestra el feedback de las operaciones (ej. "Producto Guardado").
 */
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? GREEN_COLOR : RED_COLOR;
    const iconName = isSuccess ? 'check-circle' : 'exclamation-triangle';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={customAlertStyles.modalContainer}>
                <View style={[customAlertStyles.alertBox, { borderColor: feedbackColor, borderWidth: 2 }]}>
                    <View style={customAlertStyles.headerContainer}>
                           <FontAwesome name={iconName} size={24} color={feedbackColor} style={{ marginRight: 10 }} />
                           <Text style={[customAlertStyles.alertTitleBase, { color: feedbackColor }]}>{title}</Text>
                    </View>
                    <Text style={[customAlertStyles.alertMessageBase, { color: feedbackColor }]}>{message}</Text>
                    <TouchableOpacity 
                        style={[customAlertStyles.alertButton, { backgroundColor: feedbackColor }]} 
                        onPress={onClose}
                    >
                        <Text style={customAlertStyles.alertButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Estilos específicos para el Custom Alert (Se mantienen)
const customAlertStyles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    alertBox: {
        width: 300,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    alertTitleBase: { fontSize: 18, fontWeight: 'bold' },
    alertMessageBase: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});


/**
 * ImageSourceOptions: Modal personalizado para que el usuario elija entre
 * usar la cámara o seleccionar una foto de la galería.
 */
const ImageSourceOptions = ({ isVisible, onTakePhoto, onSelectGallery, onCancel }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onCancel}
        >
            <View style={styles.sourceModalContainer}>
                <View style={styles.sourceModalContent}>
                    <Text style={styles.sourceModalTitle}>Seleccionar Imagen</Text>
                    <Text style={styles.sourceModalSubtitle}>¿Deseas tomar una foto o seleccionar una de la galería?</Text>

                    {/* Botón Tomar Foto */}
                    <TouchableOpacity 
                        style={[styles.sourceOptionButton, { backgroundColor: BLUE_COLOR_SOFT }]}
                        onPress={onTakePhoto}
                    >
                        <FontAwesome name="camera" size={20} color="white" style={styles.sourceIcon} />
                        <Text style={styles.sourceButtonText}>Tomar Foto</Text>
                    </TouchableOpacity>

                    {/* Botón Seleccionar de Galería */}
                    <TouchableOpacity 
                        style={[styles.sourceOptionButton, { backgroundColor: BLUE_COLOR_SOFT }]}
                        onPress={onSelectGallery}
                    >
                        <FontAwesome name="image" size={20} color="white" style={styles.sourceIcon} />
                        <Text style={styles.sourceButtonText}>Galería</Text>
                    </TouchableOpacity>

                    {/* Botón Cancelar */}
                    <TouchableOpacity 
                        style={[styles.sourceCancelButton]}
                        onPress={onCancel}
                    >
                        <Text style={styles.sourceCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


// --- COMPONENTE PRINCIPAL (Modal de Formulario) ---
export default function AgregarProducto({ isVisible, onClose, onProductAdded, productToEdit }) {
    // --- ESTADOS DEL FORMULARIO (Datos) ---
    const [id, setId] = useState(null); // ID del producto si estamos editando
    const [productName, setProductName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageURL, setImageURL] = useState(''); // URL final de Cloudinary
    const [localImageUri, setLocalImageUri] = useState(null); // URI de la imagen seleccionada localmente
    
    // --- ESTADOS DE CONTROL (UI) ---
    const [isSaving, setIsSaving] = useState(false); // Bloquea el botón al guardar
    const [alertVisible, setAlertVisible] = useState(false); // Controla la visibilidad del CustomAlert
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error');
    
    const [shouldReload, setShouldReload] = useState(false); // Bandera para recargar la lista en AdminProductos
    const [isSourceModalVisible, setIsSourceModalVisible] = useState(false); // Controla la visibilidad del modal Cámara/Galería
    
    
    // Hook que carga los datos del producto a editar o resetea para uno nuevo.
    useEffect(() => {
        if (productToEdit) {
            setId(productToEdit.id);
            setProductName(productToEdit.name);
            setCategory(productToEdit.category);
            setPrice(String(productToEdit.price)); 
            setStock(String(productToEdit.stock || ''));
            setImageURL(productToEdit.image);
            setLocalImageUri(null);
        } else {
            // Modo Creación (Reset)
            setId(null);
            setProductName('');
            setCategory('');
            setPrice('');
            setStock('');
            setImageURL('');
            setLocalImageUri(null);
        }
    }, [productToEdit]);


    // Muestra el CustomAlert.
    const showAlert = (title, message, type = 'error') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
    };

    // Resetea todos los estados del formulario.
    const resetForm = () => {
        setId(null);
        setProductName('');
        setCategory('');
        setPrice('');
        setStock('');
        setImageURL('');
        setLocalImageUri(null);
        setIsSaving(false);
        setAlertVisible(false);
        setShouldReload(false);
    };

    /**
     * Cierra el modal, asegurando que la lista de productos se recargue 
     * en la pantalla de administración si hubo un guardado exitoso.
     */
    const handleClose = () => {
        if (shouldReload) {
            onProductAdded(); // Llama a la función de recarga en el componente padre
        }
        resetForm();
        onClose(); // Cierra el modal
    };
    
    
    /**
     * Lógica centralizada para subir la imagen:
     * 1. Cierra el modal de opciones.
     * 2. Llama a la función global subirImagenACloudinary.
     * 3. Almacena la URL final en el estado imageURL.
     */
    const handleUploadImage = async (uri) => {
        setIsSaving(true);
        setIsSourceModalVisible(false); // Cierra el modal de opciones

        try {
            showAlert('Subiendo Imagen', 'Por favor espera, procesando la imagen...', 'success'); 
            
            // Llama a la función global de subida y guarda en la carpeta 'productos'.
            const cloudinaryUrl = await subirImagenACloudinary(uri, 'productos');
            
            setLocalImageUri(uri); // Mantiene la URI local para la vista previa
            setImageURL(cloudinaryUrl); // Guarda la URL final de Cloudinary
            
            showAlert('Subida Exitosa', 'Imagen cargada correctamente. Continúa guardando el producto.', 'success');
            
        } catch (error) {
            console.error(error);
            showAlert('Error de Subida', error.message || 'No se pudo subir la imagen.', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    // Función para solicitar permisos de la cámara y tomar una foto.
    const takePhoto = async () => {
        setIsSourceModalVisible(false); 
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
             showAlert('Permiso Denegado', 'Necesitamos acceso a la cámara para tomar una foto.', 'error');
             return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, 
            aspect: [1, 1], 
            quality: 0.7, 
        });

        if (!result.canceled) {
            handleUploadImage(result.assets[0].uri);
        }
    };
    
    // Función para solicitar permisos de la galería y seleccionar una foto.
    const selectFromGallery = async () => {
        setIsSourceModalVisible(false); 
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus !== 'granted') {
            showAlert('Permiso Denegado', 'Necesitamos acceso a la galería para subir una foto.', 'error');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, 
            aspect: [1, 1], 
            quality: 0.7, 
        });

        if (!result.canceled) {
            handleUploadImage(result.assets[0].uri);
        }
    };

    // Función que muestra el modal personalizado para elegir el origen de la imagen.
    const pickImage = () => {
        setIsSourceModalVisible(true);
    };
    
    /**
     * Función que maneja el guardado o actualización del producto en Firestore.
     */
    const handleSaveProduct = async () => {
        Keyboard.dismiss();
        
        // --- 1. VALIDACIÓN ---
        if (!productName || !category || !price || !stock) {
            showAlert('Campos Incompletos', 'Por favor, completa todos los campos obligatorios.', 'error');
            return;
        }

        if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
            showAlert('Formato Incorrecto', 'El Precio y el Stock deben ser números válidos.', 'error');
            return;
        }
        
        if (!imageURL) {
            showAlert('Imagen Faltante', 'Debes subir una imagen para el producto.', 'error');
            return;
        }


        setIsSaving(true);

        // --- 2. GUARDAR EN FIRESTORE ---
        try {
            const productData = {
                name: productName,
                category: category,
                price: parseFloat(price), 
                stock: parseInt(stock), 
                image: imageURL, // Se guarda la URL de Cloudinary
            };

            if (id) {
                // MODO EDICIÓN: Actualiza el documento
                const productRef = doc(db, 'products', id);
                await updateDoc(productRef, productData);
                showAlert('Producto Actualizado', 'Los cambios se guardaron correctamente.', 'success');
            } else {
                // MODO CREACIÓN: Crea un nuevo documento
                const productsCollectionRef = collection(db, 'products');
                await addDoc(productsCollectionRef, {
                    ...productData,
                    createdAt: new Date(),
                });
                showAlert('Producto Guardado', 'El nuevo producto se ha añadido correctamente.', 'success');
            }
            
            // Activa la bandera de recarga
            setShouldReload(true);
            
            // Cierra el modal tras 1 segundo.
            setTimeout(() => {
                handleClose(); 
            }, 1000); 

        } catch (error) {
            console.error("Error al guardar producto en Firestore:", error);
            showAlert('Error al guardar', 'No se pudo guardar el producto en Firestore. Inténtalo de nuevo.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    // URL utilizada para la vista previa de la imagen.
    const previewUrl = localImageUri || imageURL;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
             {/* Modal para opciones de imagen */}
            <ImageSourceOptions 
                isVisible={isSourceModalVisible}
                onTakePhoto={takePhoto}
                onSelectGallery={selectFromGallery}
                onCancel={() => setIsSourceModalVisible(false)}
            />

            <LinearGradient 
                colors={['#97c1e6', '#e4eff9']} 
            
                style={styles.centeredView}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                {/* KeyboardAvoidingView ajusta el layout cuando el teclado aparece */}
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.keyboardAvoidingContainer}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      
                        <View style={styles.modalContentWrapper}>
                            <View style={styles.modalView}>
                                {/* Header del Modal */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {id ? "Editar Producto" : "Agregar Nuevo Producto"}
                                    </Text>
                                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                       <FontAwesome name="times" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
         
                                <Text style={styles.modalSubtitle}>
                                     {id ? "Modifica los detalles del producto seleccionado." : "Selecciona una imagen con la cámara o la galería."}
                                </Text>

                                <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
          
                                    {/* Campo Nombre del Producto */}
                                    <Text style={styles.label}>Nombre del Producto</Text>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="Ej. Teclado mecánico RGB"
                                        value={productName}
                                        onChangeText={setProductName}
                                        maxLength={50} 
                                        placeholderTextColor={BLUE_COLOR_SOFT}
                                    />

                                    {/* Campo Categoría */}
                                    <Text style={styles.label}>Categoría</Text>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="Ej. Gaming, Electrónica"
                                        value={category}
                                        onChangeText={setCategory}
                                        maxLength={20} 
                                        placeholderTextColor={BLUE_COLOR_SOFT}
                                    />

                                    <View style={styles.row}>
                                        {/* Campo Precio */}
                                        <View style={styles.halfWidth}>
                                            <Text style={styles.label}>Precio</Text>
                                            <TextInput 
                                                style={styles.input}
                                                placeholder="Ej. 75000"
                                                value={price}
                                                onChangeText={setPrice}
                                                keyboardType="numeric"
                                                maxLength={20} 
                                                placeholderTextColor={BLUE_COLOR_SOFT}
                                            />
                                        </View>
                        
                                        {/* Campo Stock */}
                                        <View style={styles.halfWidth}>
                                            <Text style={styles.label}>Stock</Text>
                                            <TextInput 
                                                style={styles.input}
                                                placeholder="Ej. 25"
                                                value={stock}
                                                onChangeText={setStock}
                                                keyboardType="numeric"
                                                maxLength={5} 
                                                placeholderTextColor={BLUE_COLOR_SOFT}
                                            />
                                        </View>
                     
                                    </View>

                                    {/* Botón para Seleccionar Imagen (Abre el modal ImageSourceOptions) */}
                                    <Text style={styles.label}>Imagen del Producto</Text>
                                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage} disabled={isSaving}>
                                        <FontAwesome name="image" size={20} color="#FFF" style={{marginRight: 10}} />
                                        <Text style={styles.imagePickerButtonText}>
                                            {imageURL ? 'Cambiar/Re-subir Imagen' : 'Seleccionar Imagen'}
                                        </Text>
                                    </TouchableOpacity>
                                    
            
                                    {/* Muestra la vista previa */}
                                    {previewUrl ? (
                                        <Image source={{ uri: previewUrl }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.previewImagePlaceholder}>
                                            <Text style={styles.placeholderText}>Vista previa de imagen</Text>
                                        </View>
                                    )}


                                    {/* Botón Guardar/Actualizar */}
                                    <TouchableOpacity 
                                        style={styles.saveButton} 
                                        onPress={handleSaveProduct}
                                        disabled={isSaving}
                                    >
                                        {isSaving ?
                                        (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>{id ? "Guardar Cambios" : "Guardar Producto"}</Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Botón Cancelar */}
                                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
                {/* Alerta visible si ocurre un error o éxito */}
                <CustomAlert
                    isVisible={alertVisible}
                    title={alertTitle}
                    message={alertMessage}
                    onClose={() => setAlertVisible(false)} 
                    type={alertType}
                />
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
        width: '100%',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContentWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20, 
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '100%', 
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    closeButton: {
        padding: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'left',
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        marginBottom: 5,
        marginTop: 10,
    },
    // Estilo del input (con bordes visibles)
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 10,
        color: BLUE_COLOR_SOFT, // Color del texto
        backgroundColor: '#f9f9f9',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    halfWidth: {
        width: '48%',
    },
    // ESTILOS DEL BOTÓN DE IMAGEN
    imagePickerButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    imagePickerButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewImagePlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#999',
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 15,
        resizeMode: 'contain',
        backgroundColor: '#eee',
    },
    // FIN ESTILOS DE IMAGEN
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BLUE_COLOR_SOFT,
    },
    cancelButtonText: {
        color: BLUE_COLOR_SOFT,
        fontSize: 17,
        fontWeight: 'bold',
    },
    
    // ESTILOS ADICIONALES PARA EL MODAL DE OPCIONES DE IMAGEN
    sourceModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sourceModalContent: {
        backgroundColor: 'white',
        width: '100%',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
    },
    sourceModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLUE_COLOR_SOFT,
        marginBottom: 5,
    },
    sourceModalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    sourceOptionButton: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    sourceIcon: {
        marginRight: 10,
    },
    sourceButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sourceCancelButton: {
        marginTop: 5,
        paddingVertical: 10,
    },
    sourceCancelText: {
        color: RED_COLOR,
        fontSize: 16,
    },
});