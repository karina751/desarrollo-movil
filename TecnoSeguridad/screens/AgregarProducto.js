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
    Alert, // Mantener si lo necesitas en otro lugar, pero no lo usamos para el picker aquí
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig'; 
import { LinearGradient } from 'expo-linear-gradient';
// 🚨 Importaciones de navegación y ImagePicker
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; 
import { subirImagenACloudinary } from '../src/config/cloudinaryConfig'; 

// --- Variables de color ajustadas ---
const BLUE_COLOR_SOFT = '#1E90FF'; // Azul principal
const RED_COLOR = '#FF4136';
const GREEN_COLOR = '#4CAF50';

// Componente CustomAlert (Reutilizado para Feedback)
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


// 🚨 NUEVO COMPONENTE: MODAL PERSONALIZADO PARA SELECCIÓN DE ORIGEN DE IMAGEN
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


// 🚨 COMPONENTE PRINCIPAL (Reestructurado para ser un Modal)
export default function AgregarProducto({ isVisible, onClose, onProductAdded, productToEdit }) {
    // 🚨 Extraemos la lógica de estado del formulario aquí
    const [id, setId] = useState(null);
    const [productName, setProductName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [localImageUri, setLocalImageUri] = useState(null); 
    
    // 🚨 ESTADOS DE UI/FEEDBACK
    const [isSaving, setIsSaving] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error');
    
    const [shouldReload, setShouldReload] = useState(false); 
    const [isSourceModalVisible, setIsSourceModalVisible] = useState(false); // 🚨 Nuevo estado para el modal de opciones
    
    
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


    const showAlert = (title, message, type = 'error') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
    };

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

    // Lógica para manejar el cierre del modal después de la operación (llama a onProductAdded)
    const handleClose = () => {
        if (shouldReload) {
            onProductAdded(); // Recarga los productos en AdminProductos
        }
        resetForm();
        onClose(); // Cierra el modal
    };
    
    
    // 🚨 Lógica de Subida Centralizada (llamada por takePhoto/selectFromGallery)
    const handleUploadImage = async (uri) => {
        setIsSaving(true);
        setIsSourceModalVisible(false); // Cierra el modal de opciones

        try {
            showAlert('Subiendo Imagen', 'Por favor espera, procesando la imagen...', 'success'); 
            
            const cloudinaryUrl = await subirImagenACloudinary(uri, 'productos');
            
            setLocalImageUri(uri);
            setImageURL(cloudinaryUrl);
            
            showAlert('Subida Exitosa', 'Imagen cargada correctamente. Continúa guardando el producto.', 'success');
            
        } catch (error) {
            console.error(error);
            showAlert('Error de Subida', error.message || 'No se pudo subir la imagen.', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    // 🚨 FUNCIÓN PARA TOMAR FOTO CON CÁMARA (Llamada por el modal personalizado)
    const takePhoto = async () => {
        setIsSourceModalVisible(false); // Cierra el modal de opciones
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
    
    // 🚨 FUNCIÓN PARA SELECCIONAR DE GALERÍA (Llamada por el modal personalizado)
    const selectFromGallery = async () => {
        setIsSourceModalVisible(false); // Cierra el modal de opciones
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

    // 🚨 FUNCIÓN PRINCIPAL: MUESTRA EL MODAL DE OPCIONES
    const pickImage = () => {
        setIsSourceModalVisible(true);
    };
    
    // Manejar el guardado (URL en Firestore)
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
                image: imageURL, // ⬅️ URL FINAL DE CLOUDINARY
            };

            if (id) {
                // MODO EDICIÓN
                const productRef = doc(db, 'products', id);
                await updateDoc(productRef, productData);
                showAlert('Producto Actualizado', 'Los cambios se guardaron correctamente.', 'success');
            } else {
                // MODO CREACIÓN
                const productsCollectionRef = collection(db, 'products');
                await addDoc(productsCollectionRef, {
                    ...productData,
                    createdAt: new Date(),
                });
                showAlert('Producto Guardado', 'El nuevo producto se ha añadido correctamente.', 'success');
            }
            
            // 🚨 Activar la bandera de recarga antes de cerrar
            setShouldReload(true);
            
            // Cierre después de un breve delay para que el usuario vea la alerta
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
    
    // Determinamos qué URL mostrar para la vista previa
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
          
                                    {/* Campo Nombre */}
                                    <Text style={styles.label}>Nombre del Producto</Text>
                               
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej. Teclado mecánico RGB"
            
                                        value={productName}
                                        onChangeText={setProductName}
                                
                                        placeholderTextColor={BLUE_COLOR_SOFT}
                                    />

                                    <Text style={styles.label}>Categoría</Text>
                   
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej. Gaming, Electrónica"
                                        value={category}
                                        onChangeText={setCategory}
                   
                                        placeholderTextColor={BLUE_COLOR_SOFT}
                                    />

                                    <View style={styles.row}>
      
                                        <View style={styles.halfWidth}>
                                            <Text style={styles.label}>Precio</Text>
                    
                                            <TextInput
                                                style={styles.input}
                            
                                                placeholder="Ej. 75000"
                                                value={price}
                                                onChangeText={setPrice}
    
                                                keyboardType="numeric"
                                                placeholderTextColor={BLUE_COLOR_SOFT}
        
                                            />
                                        </View>
                        
                                        <View style={styles.halfWidth}>
                                            <Text style={styles.label}>Stock</Text>
                                      
                                            <TextInput
                                                style={styles.input}
                                              
                                                placeholder="Ej. 25"
                                                value={stock}
                                                onChangeText={setStock}
 
                                                keyboardType="numeric"
                                                placeholderTextColor={BLUE_COLOR_SOFT}
     
                                            />
                                        </View>
                     
                                    </View>

                                    {/* 🚨 Botón para Seleccionar Imagen */}
                                    <Text style={styles.label}>Imagen del Producto</Text>
                                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage} disabled={isSaving}>
                                        <FontAwesome name="image" size={20} color="#FFF" style={{marginRight: 10}} />
                                        <Text style={styles.imagePickerButtonText}>
                                            {imageURL ? 'Cambiar/Re-subir Imagen' : 'Seleccionar Imagen'}
                                        </Text>
                                    </TouchableOpacity>
                                    
            
                                    {/* Muestra la imagen seleccionada o la URL existente */}
                                    {previewUrl ? (
                                
                                        <Image source={{ uri: previewUrl }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.previewImagePlaceholder}>
                                            <Text style={styles.placeholderText}>Vista previa de imagen</Text>
                                        </View>
                                    )}


                                    {/* Botones de Acción */}
          
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
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 10,
        
        color: BLUE_COLOR_SOFT,
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
    // 🚨 ESTILOS DEL BOTÓN DE IMAGEN
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
    
    // 🚨 ESTILOS ADICIONALES PARA EL MODAL DE OPCIONES DE IMAGEN (COPIADOS DE PERFIL.JS)
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