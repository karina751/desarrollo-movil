/**
 * PANTALLA: AdminProductos.js
 * FUNCIÓN: Panel de administración para la gestión completa del inventario (CRUD).
 * -----------------------------------------------------------
 * - LÓGICA CLAVE: Implementa las operaciones CRUD de Edición (updateDoc), Eliminación (deleteDoc) y el Toggle de "Destacado".
 * - UX/SEGURIDAD: Utiliza ConfirmationModal para confirmar eliminaciones.
 * - MODULARIDAD: Reutiliza el componente AgregarProducto para las tareas de Creación/Edición.
 * - ACTUALIZACIÓN: Recarga la lista de productos al regresar o tras una modificación exitosa.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    Image,
    Modal,
    ActivityIndicator,
    Platform,
    StatusBar,
    Alert, // Se usa para pedir permisos o manejar errores nativos
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
// Importamos las funciones de Firestore para interactuar con la base de datos.
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AgregarProducto from './AgregarProducto';

// --- Variables de color globales ---
const RED_COLOR = '#FF4136'; 
const GREEN_COLOR = '#4CAF50';
const BLUE_COLOR = '#007AFF';
const YELLOW_COLOR = '#FFC107'; 


// --- Componentes de Feedback y Modales ---

/**
 * CustomAlert: Modal de alerta personalizado.
 * Muestra el resultado de operaciones (éxito o error) con íconos y colores definidos.
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
            <View style={modalCommonStyles.modalContainer}>
                <View style={[modalCommonStyles.alertBox, { borderColor: feedbackColor, borderWidth: 2 }]}>
                    <View style={modalCommonStyles.headerContainer}>
                         <FontAwesome name={iconName} size={24} color={feedbackColor} style={{ marginRight: 10 }} />
                         <Text style={[modalCommonStyles.alertTitleBase, { color: feedbackColor }]}>{title}</Text>
               
      </View>
                    <Text style={[modalCommonStyles.alertMessageBase, { color: '#333' }]}>{message}</Text>
                    <TouchableOpacity 
                        style={[modalCommonStyles.alertButton, { backgroundColor: feedbackColor }]} 
                    
     onPress={onClose}
                    >
                        <Text style={modalCommonStyles.alertButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
   
         </Modal>
    );
};

/**
 * ConfirmationModal: Modal personalizado de confirmación.
 * Se utiliza para operaciones destructivas (eliminar), reemplazando el Alert nativo.
 */
const ConfirmationModal = ({ isVisible, title, message, onConfirm, onCancel }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onCancel}
        >
            <View style={modalCommonStyles.modalContainer}>
                <View style={[modalCommonStyles.alertBox, { borderColor: RED_COLOR, borderWidth: 2 }]}>
                    <View style={modalCommonStyles.headerContainer}>
                         <FontAwesome name="exclamation-triangle" size={24} color={RED_COLOR} style={{ marginRight: 10 }} />
                         <Text style={[modalCommonStyles.alertTitleBase, { color: RED_COLOR }]}>{title}</Text>
                    </View>
                    <Text style={[modalCommonStyles.alertMessageBase, { color: '#333' }]}>{message}</Text>
                    
                    <View style={styles.confirmationButtonsContainer}>
                        <TouchableOpacity 
                            style={[modalCommonStyles.alertButton, styles.cancelConfirmationButton]} 
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelConfirmationButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[modalCommonStyles.alertButton, styles.confirmButton]} 
                            onPress={onConfirm}
                        >
                            <Text style={modalCommonStyles.alertButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


// Estilos comunes para los modales
const modalCommonStyles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
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
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});


/**
 * CustomHeader: Encabezado de la pantalla.
 * Muestra el título, el botón de retroceso y el avatar del usuario con navegación anidada.
 */
const CustomHeader = ({ navigation, title, onBackPress, profileImage }) => {
    // Decide si mostrar la foto de perfil real o un ícono genérico.
    const renderProfileAvatar = () => {
        if (profileImage) {
            return (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
            );
        } else {
            return (
                <FontAwesome name="user-circle" size={35} color={BLUE_COLOR} />
            );
        }
    };
    
    return (
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10 }]}>
            {/* Botón de retroceso */}
            <TouchableOpacity onPress={onBackPress || (() => navigation.goBack())} style={styles.backButton}>
                <FontAwesome name="chevron-left" size={24} color={BLUE_COLOR} />
            </TouchableOpacity>
            
             <Text style={styles.headerTitle}>{title}</Text>

            {/* Navegación anidada al perfil: Va a HomeTabs y luego a la pantalla Perfil. */}
            <TouchableOpacity 
                onPress={() => navigation.navigate('HomeTabs', { screen: 'Perfil' })} 
            >
                {renderProfileAvatar()}
            </TouchableOpacity>
        </View>
    );
};


/**
 * AdminProductCard: Tarjeta que presenta un producto individual en la lista de administración.
 * Contiene botones para editar, eliminar y cambiar el estado "destacado".
 */
const AdminProductCard = ({ product, onEditPress, onDeletePress, onToggleFeatured }) => {
    const isFeatured = product.isFeatured || false;
    return (
        <View style={styles.productCard}>
            
            {/* Botón para marcar/desmarcar como Destacado */}
            <TouchableOpacity 
                style={styles.featuredButton}
                onPress={() => onToggleFeatured(product)}
             >
                <FontAwesome 
                    name={isFeatured ? "star" : "star-o"} 
                    size={20} 
                    color={isFeatured ? YELLOW_COLOR : '#fff'} 
                 />
            </TouchableOpacity>

            <Image 
                source={product.image ? { uri: product.image } : { uri: 'https://via.placeholder.com/150/f0f0f0?text=No+Img' }} 
                style={styles.productImage} 
            />
       
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productPrice}>${product.price}</Text>
                <Text style={styles.productStock}>Stock: {product.stock}</Text>
                <View style={styles.productActions}>
                    {/* Botón de Editar */}
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => onEditPress(product)}>
                        <FontAwesome name="pencil" size={16} color="#FFF" />
                    </TouchableOpacity>
                    {/* Botón de Eliminar */}
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDeletePress(product.id)}>
                        <FontAwesome name="trash" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- COMPONENTE PRINCIPAL DE PANTALLA ---
export default function AdminProductos({ navigation }) {
    // --- ESTADOS DE LA VISTA Y DATOS ---
    const [searchQuery, setSearchQuery] = useState(''); // Texto de búsqueda
    const [profileImage, setProfileImage] = useState(null); 
    const [isLoading, setIsLoading] = useState(true); // Controla la carga
    const [products, setProducts] = useState([]); // Lista de productos
    const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Modal Agregar/Editar
    const [productToEdit, setProductToEdit] = useState(null); 

    const [isResultVisible, setIsResultVisible] = useState(false); // Visibilidad del CustomAlert
    const [resultData, setResultData] = useState({ title: '', message: '', type: 'error' });
    
    // Estados para la confirmación de eliminación
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [productIdToDelete, setProductIdToDelete] = useState(null);


    // Muestra la alerta personalizada de feedback (CustomAlert).
    const showAlert = (title, message, type = 'error') => {
        setResultData({ title, message, type });
        setIsResultVisible(true);
    };

    /**
     * Función que obtiene el avatar del usuario y carga la lista de productos desde Firestore.
     * Esta función es llamada al inicio y después de cada cambio importante.
     */
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Obtener foto de perfil
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
   
                 if (docSnap.exists()) {
                    setProfileImage(docSnap.data().profileImage || null);
                }
            }

            // 2. Obtener productos
            const productsCollection = collection(db, 'products');
            const productsSnapshot = await getDocs(productsCollection);
            const productsList = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                stock: doc.data().stock !== undefined ? doc.data().stock : 'N/A',
                isFeatured: doc.data().isFeatured || false,
            }));
            setProducts(productsList);
        } catch (error) {
            console.error("Error al cargar datos de Administración:", error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Hook para cargar datos al inicio y al enfocar la pantalla.
    useEffect(() => {
        fetchData();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });
        return unsubscribe;
    }, [navigation, fetchData]);
    
    // Configura el modal para editar.
    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsAddModalVisible(true);
    };
    
    // Función que prepara la eliminación: guarda el ID y muestra el modal de confirmación.
    const handleConfirmDelete = (id) => {
        setProductIdToDelete(id);
        setIsDeleteModalVisible(true);
    }
    
    /**
     * Ejecuta la eliminación real del producto en Firestore.
     * Se llama al presionar el botón 'Eliminar' en el ConfirmationModal.
     */
    const handleDelete = async () => {
        setIsDeleteModalVisible(false); // Cierra el modal
        if (!productIdToDelete) return; 

        try {
           await deleteDoc(doc(db, 'products', productIdToDelete));
            fetchData(); // Recarga la lista
            showAlert("Eliminado", "Producto eliminado correctamente.", 'success');
            setProductIdToDelete(null);
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            showAlert("Error", "No se pudo eliminar el producto. Intente de nuevo.", 'error');
        }
    };
    
    // Función para cambiar el estado 'Destacado' de un producto en Firestore.
    const handleToggleFeatured = async (product) => {
        const newFeaturedState = !product.isFeatured;
        try {
            const productRef = doc(db, 'products', product.id);
            await updateDoc(productRef, {
                isFeatured: newFeaturedState,
            });
            fetchData();
            showAlert(
                "Actualizado", 
                newFeaturedState ? "Producto marcado como Destacado." : "Producto desmarcado como Destacado.", 
                'success'
            );
        } catch (error) {
            console.error("Error al marcar como destacado:", error);
            showAlert("Error", "No se pudo actualizar el estado Destacado.", 'error');
        }
    };
    
    // Cierra el modal Agregar/Editar y actualiza la lista.
    const handleCloseModal = () => {
        setProductToEdit(null);
        setIsAddModalVisible(false);
        fetchData();
    };
    
    // Filtra la lista de productos basada en la búsqueda.
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Muestra la pantalla de carga si los datos no están listos.
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Cargando panel de administración...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Modal de Feedback */}
            <CustomAlert
                isVisible={isResultVisible}
                title={resultData.title}
                message={resultData.message}
               onClose={() => setIsResultVisible(false)}
                type={resultData.type}
            />

            {/* Modal de Confirmación de Eliminación */}
            <ConfirmationModal
                isVisible={isDeleteModalVisible}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que deseas eliminar este producto permanentemente?`}
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
            />

            {/* Header */}
            <CustomHeader
                navigation={navigation}
                title="Administración de Productos"
                onBackPress={() => navigation.goBack()}
                profileImage={profileImage}
            />

            {/* Barra de Búsqueda */}
            <View style={styles.searchBarContainer}>
                <FontAwesome name="search" size={20} color="#888" style={styles.searchIcon} />
                 <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Galería de Productos (Lista) */}
            <ScrollView contentContainerStyle={styles.productsGrid}>
                {filteredProducts.length > 0 ?
                (
                    filteredProducts.map(product => (
                        <AdminProductCard
                            key={product.id}
                            product={product}
                            onEditPress={handleEdit}
                            onDeletePress={handleConfirmDelete} 
                            onToggleFeatured={handleToggleFeatured}
                        />
                    ))
                ) : (
                    <Text style={styles.noProductsText}>No hay productos registrados. Usa el botón '+' para agregar.</Text>
                )}
            </ScrollView>

            {/* Botón Flotante para Agregar Producto */}
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => { setProductToEdit(null);
                setIsAddModalVisible(true); }}
            >
                <FontAwesome name="plus" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Modal para Agregar/Editar Producto */}
            <AgregarProducto 
                isVisible={isAddModalVisible}
                onClose={handleCloseModal}
                onProductAdded={handleCloseModal}
                productToEdit={productToEdit}
            />
        </View>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e4eff9',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: BLUE_COLOR,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 
1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    backButtonPlaceholder: {
        width: 35,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        flex: 1,
        textAlign: 'center',
    },
    profileImage: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        borderWidth: 1,
        borderColor: BLUE_COLOR,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginHorizontal: 15,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 80,
    },
    productCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
    },
    productCategory: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 10,
    },
    productStock: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    productActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginHorizontal: 2,
    },
    editButton: {
        backgroundColor: YELLOW_COLOR,
    },
    deleteButton: {
        backgroundColor: RED_COLOR,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
    },
    addButton: {
        position: 'absolute',
        bottom: 20, 
        right: 20,
        backgroundColor: BLUE_COLOR,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: BLUE_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    featuredButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 5,
        borderRadius: 15,
    },
    noProductsText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        width: '100%',
    },
    // Estilos para el modal de confirmación
    confirmationButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    confirmButton: {
        backgroundColor: RED_COLOR,
        flex: 1,
        marginLeft: 10,
    },
    cancelConfirmationButton: {
        backgroundColor: '#ccc',
        flex: 1,
        marginRight: 10,
    },
    cancelConfirmationButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
});