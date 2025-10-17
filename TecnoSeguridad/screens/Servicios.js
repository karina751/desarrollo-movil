import React, { useState, useEffect } from 'react'; 
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    Platform, 
    StatusBar,
    ActivityIndicator, 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../src/config/firebaseConfig'; 

const IMG_CAMARAS = require('../assets/camaras_seguridad.png.jpeg'); 
const IMG_PRODUCTOS = require('../assets/venta_productos.png.jpeg'); 
const IMG_REPARACION = require('../assets/reparacion_pc.png.jpeg'); 

const BLUE_COLOR = '#007AFF';


const FIXED_SERVICES = [
    {
        id: 'camaras',
        name: 'Instalación de Cámaras de Seguridad',
        description: 'Sistemas de vigilancia de alta tecnología para proteger tu hogar o negocio.',
        imageSource: IMG_CAMARAS, 
    },
    {
        id: 'productos',
        name: 'Venta de Productos Tecnológicos',
        description: 'Encuentra notebooks, componentes y accesorios de las mejores marcas.',
        imageSource: IMG_PRODUCTOS, 
    },
    {
        id: 'reparacion',
        name: 'Reparación y Mantenimiento de PC',
        description: 'Servicio técnico profesional para que tus equipos funcionen como nuevos.',
        imageSource: IMG_REPARACION, 
    },
];

// Componente para mostrar una tarjeta de servicio
const ServiceCard = ({ service }) => {
    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                <Image source={service.imageSource} style={styles.cardImage} />
            </View>
            
            <Text style={styles.cardTitle}>{service.name}</Text>
            <Text style={styles.cardDescription}>{service.description}</Text>
        </View>
    );
};

// Componente CustomHeader
const CustomHeader = ({ title, onProfilePress, profileImage }) => { 
    const insets = useSafeAreaInsets();
    
    const renderProfileAvatar = () => {
        if (profileImage) {
            return (
                <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                />
            );
        }
        return <FontAwesome name="user-circle" size={30} color={BLUE_COLOR} />;
    };

    return (
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : insets.top + 10 }]}>
            <TouchableOpacity onPress={() => useNavigation().goBack()} style={styles.profileButton}>
                <FontAwesome name="chevron-left" size={20} color={BLUE_COLOR} />
            </TouchableOpacity> 
            
            <Text style={styles.headerTitle}>{title}</Text>

            <TouchableOpacity onPress={onProfilePress} style={styles.profileButton}>
                {renderProfileAvatar()}
            </TouchableOpacity>
        </View>
    );
};


export default function Servicios({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuVisible, setIsMenuVisible] = useState(false); 

    // Cargar datos del usuario al inicio
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const docSnap = await getDoc(userRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfileImage(userData.profileImage || null);
                    setUserName(userData.firstName + ' ' + userData.lastName);
                }
            }
            setIsLoading(false);
        };
        fetchUserData();
    }, []);

    // Función de Cerrar Sesión
    const handleLogOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };
    
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BLUE_COLOR} />
                <Text style={styles.loadingText}>Cargando servicios...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            {/* Header */}
            <CustomHeader
                title="Nuestros Servicios"
                onProfilePress={() => setIsMenuVisible(!isMenuVisible)} 
                profileImage={profileImage} 
            />
            
            {/* Menú desplegable */}
            {isMenuVisible && (
                <View style={styles.profileMenu}>
                    <View style={styles.menuHeader}>
                        <Text style={styles.menuName}>{userName}</Text>
                    </View>
                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        setIsMenuVisible(false);
                        navigation.navigate('Perfil');
                    }}>
                        <FontAwesome name="user" size={20} color={BLUE_COLOR} style={{ marginRight: 10 }} />
                        <Text style={styles.menuText}>Mi Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogOut}>
                        <FontAwesome name="sign-out" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Servicios Destacados</Text>
                
                <View style={styles.cardContainer}>
                    {FIXED_SERVICES.map(service => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </View>

                <Text style={styles.footerText}>
                    ¿Necesitas un servicio a medida? Contáctanos para un presupuesto.
                </Text>
            </ScrollView>
        </View>
    );
}

// ---------------------------------------------------------------------------------------------------
// 2. Estilos para el Menú y Avatar 
// ---------------------------------------------------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7', 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
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
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        zIndex: 10, 
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        flex: 1,
        textAlign: 'center',
    },
    profileButton: {
        padding: 5,
        width: 40, 
        alignItems: 'flex-end',
    },
    profileImage: { 
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: BLUE_COLOR,
    },
    backButtonPlaceholder: { 
        width: 35, 
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    cardContainer: {
        width: '100%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderTopWidth: 5,
        borderTopColor: BLUE_COLOR,
    },
    imageContainer: {
        width: '100%', 
        height: 120, 
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#eaf4ff', 
        borderWidth: 1,
        borderColor: '#ddd'
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20, 
    },
    footerText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
    },
    // ------------------------------------------------------
    // ESTILOS DEL MENÚ DESPLEGABLE
    // ------------------------------------------------------
    profileMenu: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 50 : 80, 
        right: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 100, 
    },
    menuHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    menuName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BLUE_COLOR,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    menuText: {
        fontSize: 14,
        color: '#333',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        borderRadius: 5,
        paddingVertical: 10,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});