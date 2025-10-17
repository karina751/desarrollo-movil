import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    Image,
    SafeAreaView,
    Modal,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Componente CustomAlert 
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? '#4CAF50' : '#FF4136'; 
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
                         <Text style={customAlertStyles.alertTitleBase}>{title}</Text>
                    </View>
                    <Text style={customAlertStyles.alertMessageBase}>{message}</Text>
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
    alertTitleBase: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
    alertMessageBase: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

// Componente CustomHeader 
const CustomHeader = ({ navigation, title, showBackButton, onBackPress, onProfilePress, profileImage }) => {
    const renderProfileAvatar = () => {
        if (profileImage) {
            return (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
            );
        } else {
            return (
                <FontAwesome name="user-circle" size={45} color="#007AFF" /> 
            );
        }
    };
    
    return (
        <View style={styles.header}>
            {showBackButton ? (
                <TouchableOpacity onPress={onBackPress || (() => navigation.goBack())} style={styles.backButton}>
                    <FontAwesome name="chevron-left" size={24} color="#007AFF" />
                </TouchableOpacity>
            ) : <View style={styles.backButtonPlaceholder} />}
            
            <Text style={styles.headerTitle}>{title}</Text>

            <TouchableOpacity onPress={onProfilePress}>
                {renderProfileAvatar()}
            </TouchableOpacity>
        </View>
    );
};

// Componente para una tarjeta de producto
const ProductCard = ({ product, onVerMasPress, onAgregarPress }) => {
    return (
        <View style={styles.productCard}>
            <Image 
                source={product.image ? { uri: product.image } : { uri: 'https://via.placeholder.com/150/f0f0f0?text=No+Img' }} 
                style={styles.productImage} 
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productPrice}>${product.price}</Text>
                <View style={styles.productActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={onVerMasPress}>
                        <Text style={styles.actionButtonText}>Ver más</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.addToCartButton]} onPress={onAgregarPress}>
                        <FontAwesome name="shopping-cart" size={16} color="#FFF" style={{ marginRight: 5 }} />
                        <Text style={styles.addToCartButtonText}>Agregar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};


export default function Productos({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([]); 
    
    // Estados para alertas 
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });
    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };
    const hideAlert = () => {
        setIsAlertVisible(false);
    };


    // FUNCIÓN DE CARGA DE DATOS 
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
                ...doc.data()
            }));
            setProducts(productsList);

        } catch (error) {
            console.error("Error al cargar datos de Productos:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // LÓGICA DE ACTUALIZACIÓN AL ENFOCAR LA PANTALLA
    useEffect(() => {
        fetchData(); 
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });
        return unsubscribe;
    }, [navigation, fetchData]);


    // Filtra los productos basados en el texto de búsqueda
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type}
            />
            <View style={styles.container}>
                <CustomHeader
                    navigation={navigation}
                    title="Productos"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    showProfileButton={true}
                    profileImage={profileImage}
                    onProfilePress={() => navigation.navigate('Perfil')} 
                />
                <View style={styles.searchBarContainer}>
                    <FontAwesome name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView contentContainerStyle={styles.productsGrid}>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ProductCard 
                                key={product.id}
                                product={product}
                                onVerMasPress={() => console.log('Ver más de', product.name)}
                                onAgregarPress={() => console.log('Agregar a carrito', product.name)}
                            />
                        ))
                    ) : (
                        <Text style={styles.noProductsText}>No se encontraron productos. Añade algunos en Administración.</Text>
                    )}
                </ScrollView>

                <TouchableOpacity 
                    style={styles.adminPanelButton} 
                    onPress={() => navigation.navigate('AdminProductos')}
                >
                    <Text style={styles.adminPanelButtonText}>Panel de Administración</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f8f8f8',
        
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        // SOLUCIÓN PARA EVITAR SUPERPOSICIÓN DE NOTIFICACIONES EN ANDROID
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
        color: '#007AFF',
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
        width: 30,
    },
    headerTitle: {
        fontSize: 17, 
        fontWeight: 'bold',
        color: '#007AFF',
        flex: 1,
        textAlign: 'center',
    },
    profileImage: {
        width: 35, 
        height: 35,
        borderRadius: 17.5,
        borderWidth: 1,
        borderColor: '#007AFF',
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
        paddingBottom: 20,
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
        color: '#007AFF',
        marginBottom: 10,
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
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginHorizontal: 2,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    addToCartButton: {
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
    },
    addToCartButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    adminPanelButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    adminPanelButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    noProductsText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        width: '100%',
    },
});