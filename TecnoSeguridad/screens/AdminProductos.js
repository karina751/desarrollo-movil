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
    Alert, 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'; // Importamos updateDoc
import { auth, db } from '../src/config/firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AgregarProducto from './AgregarProducto'; 

// --- Variables de colores ---
const RED_COLOR = '#FF4136';
const GREEN_COLOR = '#4CAF50';
const BLUE_COLOR = '#007AFF';
const YELLOW_COLOR = '#FFC107';


//  Componente CustomAlert 
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
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

// Componente CustomHeader 
const CustomHeader = ({ navigation, title, onBackPress, profileImage }) => {
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
            <TouchableOpacity onPress={onBackPress || (() => navigation.goBack())} style={styles.backButton}>
                <FontAwesome name="chevron-left" size={24} color={BLUE_COLOR} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>{title}</Text>

            <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
                {renderProfileAvatar()}
            </TouchableOpacity>
        </View>
    );
};


// Componente para una tarjeta de producto en modo Admin
const AdminProductCard = ({ product, onEditPress, onDeletePress, onToggleFeatured }) => {
    const isFeatured = product.isFeatured || false; 
    return (
        <View style={styles.productCard}>
            
            {/* Botón de Destacado */}
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
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => onEditPress(product)}>
                        <FontAwesome name="pencil" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDeletePress(product.id)}>
                        <FontAwesome name="trash" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function AdminProductos({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null); 

    const [isResultVisible, setIsResultVisible] = useState(false);
    const [resultData, setResultData] = useState({ title: '', message: '', type: 'error' });
    const showAlert = (title, message, type = 'error') => {
        setResultData({ title, message, type });
        setIsResultVisible(true);
    };

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

            // 2. Obtener productos de Firestore
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

    useEffect(() => {
        fetchData(); 
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });
        return unsubscribe;
    }, [navigation, fetchData]);


    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsAddModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Confirmar Eliminación",
            "¿Estás seguro de que deseas eliminar este producto permanentemente?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'products', id));
                            fetchData();
                            showAlert("Eliminado", "Producto eliminado correctamente.", 'success');
                        } catch (error) {
                            console.error("Error al eliminar producto:", error);
                            showAlert("Error", "No se pudo eliminar el producto. Intente de nuevo.", 'error');
                        }
                    }
                },
            ]
        );
    };
    
    // FUNCIÓN PARA MARCAR/DESMARCAR COMO DESTACADO
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


    const handleCloseModal = () => {
        setProductToEdit(null);
        setIsAddModalVisible(false);
        fetchData(); 
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            {/* MODAL DE RESULTADO (Éxito/Error) */}
            <CustomAlert
                isVisible={isResultVisible}
                title={resultData.title}
                message={resultData.message}
                onClose={() => setIsResultVisible(false)}
                type={resultData.type}
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

            {/* Galería de Productos */}
            <ScrollView contentContainerStyle={styles.productsGrid}>
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <AdminProductCard
                            key={product.id}
                            product={product}
                            onEditPress={handleEdit} 
                            onDeletePress={handleDelete} 
                            onToggleFeatured={handleToggleFeatured} // 🚨 CONECTADO A TOGGLE FEATURED
                        />
                    ))
                ) : (
                    <Text style={styles.noProductsText}>No hay productos registrados. Usa el botón '+' para agregar.</Text>
                )}
            </ScrollView>

            {/* Botón Flotante para Agregar Producto */}
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => { setProductToEdit(null); setIsAddModalVisible(true); }}
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
        borderBottomWidth: 1,
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
    featuredButton: { // Estilo para el botón de estrella
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
});