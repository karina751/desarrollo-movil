import React, { useState, useEffect, useCallback } from 'react';
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

// IMPORTACIONES DE FIREBASE
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../src/config/firebaseConfig'; 

const IMG_CAMARAS = require('../assets/camaras_seguridad.png.jpeg'); 
const IMG_PRODUCTOS = require('../assets/venta_productos.png.jpeg'); 
const IMG_REPARACION = require('../assets/reparacion_pc.png.jpeg'); 

const BLUE_COLOR = '#007AFF';

// --- Estructura de datos de servicios fijos ---
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


// Componente CustomHeader 
const CustomHeader = ({ navigation, title, profileImage }) => {

   const renderProfileAvatar = () => {
        if (profileImage) {
            return (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
            );
        } else {
            // Ícono de usuario de 35px si no hay imagen
            return <FontAwesome name="user-circle" size={35} color={BLUE_COLOR} />; 
        }
    };

    return (
        <View style={styles.header}>
            {/* Botón de volver */}

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <FontAwesome name="chevron-left" size={24} color={BLUE_COLOR} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>{title}</Text>

            <TouchableOpacity onPress={() => navigation.navigate('Perfil')} style={styles.profileButton}>
                {renderProfileAvatar()}
            </TouchableOpacity>
        </View>
    );
};


// Componente para mostrar una tarjeta de servicio
const ServiceCard = ({ service }) => {
    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                <Image source={service.imageSource} style={styles.cardImage} />
            </View>
            
            <Text style={styles.cardTitle}>{service.name}</Text>
            <Text style={styles.cardDescription}>{service.description}</Text>
            
            {/* ❌ BOTÓN ELIMINADO */}
        </View>
    );
};


export default function Servicios({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // LÓGICA PARA CARGAR LA IMAGEN DE PERFIL
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                try {
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    const docSnap = await getDoc(userRef);
    
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setProfileImage(userData.profileImage || null);
                    }
                } catch (error) {
                    console.error("Error cargando imagen de perfil:", error);
                }
            }
            setIsLoading(false);
        };
        fetchUserData();
    }, []);

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
            <CustomHeader
                navigation={navigation}
                title="Nuestros Servicios"

                profileImage={profileImage} 
            />
            
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7', 

        // EVITAR SUPERPOSICIÓN DE NOTIFICACIONES EN ANDROID
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
    },
    loadingText: {
        fontSize: 16,
        color: BLUE_COLOR,
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,

        paddingVertical: 5,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {

        fontSize: 17,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 5,

        width: 35,
    },
    profileButton: {
        padding: 5,
        width: 35, 
        alignItems: 'flex-end',
    },
    profileImage: {
        width: 35, //TAMAÑO DE LA IMAGEN DE PERFIL
        height: 35, 
        borderRadius: 17.5,
        borderWidth: 1,
        borderColor: BLUE_COLOR,
    },
    backButtonPlaceholder: { 
        width: 35, // Ajustamos el ancho para alineación
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
    }
});