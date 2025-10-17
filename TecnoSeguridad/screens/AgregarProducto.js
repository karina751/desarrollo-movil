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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../src/config/firebaseConfig'; 
import { LinearGradient } from 'expo-linear-gradient'; 

// --- Variables de colores ---
const BLUE_COLOR_SOFT = '#1E90FF';
const RED_COLOR = '#FF4136';
const GREEN_COLOR = '#4CAF50';


// Componente CustomAlert 
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


export default function AgregarProducto({ isVisible, onClose, onProductAdded, productToEdit }) {
    const [id, setId] = useState(null); 
    const [productName, setProductName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageURL, setImageURL] = useState(''); 
    const [isSaving, setIsSaving] = useState(false); 

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error');

    // EFECTO PARA CARGAR DATOS DE EDICIÓN
    useEffect(() => {
        if (productToEdit) {
            setId(productToEdit.id);
            setProductName(productToEdit.name);
            setCategory(productToEdit.category);
            // Aseguramos que el valor sea un string
            setPrice(String(productToEdit.price)); 
            setStock(String(productToEdit.stock)); 
            setImageURL(productToEdit.image); // ⬅️ Carga la URL
        } else {
            // Modo Creación (Reset)
            setId(null);
            setProductName('');
            setCategory('');
            setPrice('');
            setStock('');
            setImageURL('');
        }
    }, [productToEdit]); // Se ejecuta cada vez que productToEdit cambia


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
        setIsSaving(false);
        setAlertVisible(false);
    };

    const handleClose = () => {
        resetForm();
        onClose(); 
    };

    // Función para validar si la entrada es una URL básica
    const isValidUrl = (string) => {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;  
      }
    };

    // Manejar el guardado (URL en Firestore)
    const handleSaveProduct = async () => {
        Keyboard.dismiss(); 
        
        // Validación de campos
        if (!productName || !category || !price || !stock || !imageURL) {
            showAlert('Campos Incompletos', 'Por favor, completa todos los campos y pega una URL de imagen.', 'error');
            return;
        }
        if (!isValidUrl(imageURL)) {
             showAlert('URL Inválida', 'La dirección de la imagen no es una URL válida. Debe empezar con http:// o https://', 'error');
             return;
        }
        if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
            showAlert('Formato Incorrecto', 'El Precio y el Stock deben ser números válidos.', 'error');
            return;
        }

        setIsSaving(true);
        
        try {
            const productData = {
                name: productName,
                category: category,
                price: parseFloat(price), 
                stock: parseInt(stock), 
                image: imageURL, // Guardamos la URL externa directamente
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
            
            setTimeout(() => {
                onProductAdded(); 
                handleClose(); 
            }, 1000); 

        } catch (error) {
            console.error("Error al guardar producto en Firestore:", error);
            showAlert('Error al guardar', 'No se pudo guardar el producto. Inténtalo de nuevo.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
            <LinearGradient 
                colors={['#97c1e6', '#e4eff9']} 
                style={styles.centeredView}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                {/* Usamos KeyboardAvoidingView para manejar el desplazamiento del teclado */}
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
                                     {id ? "Modifica los detalles del producto seleccionado." : "Copia y pega la URL de la imagen del producto (ej: desde Imgur o Cloudinary)."}
                                </Text>

                                <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                                    {/* Campos del Formulario */}
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

                                    {/* Campo de URL de Imagen */}
                                    <Text style={styles.label}>URL de la Imagen (Link Externo)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="https://via.placeholder.com/150"
                                        value={imageURL}
                                        onChangeText={setImageURL}
                                        placeholderTextColor={BLUE_COLOR_SOFT}
                                        autoCapitalize="none"
                                        keyboardType="url"
                                    />
                                    
                                    {/* Muestra la imagen seleccionada temporalmente */}
                                    {isValidUrl(imageURL) && (
                                        <Image source={{ uri: imageURL }} style={styles.previewImage} />
                                    )}


                                    {/* Botones de Acción */}
                                    <TouchableOpacity 
                                        style={styles.saveButton} 
                                        onPress={handleSaveProduct}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
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
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 15,
        resizeMode: 'contain',
        backgroundColor: '#eee',
    },
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
});