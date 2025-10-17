import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    Platform, 
    StatusBar 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🚨 IMPORTACIÓN DE IMÁGENES LOCALES (Mantenemos la ruta verificada)
const IMG_CAMARAS = require('../assets/camaras_seguridad.png.jpeg'); 
const IMG_PRODUCTOS = require('../assets/venta_productos.png.jpeg'); 
const IMG_REPARACION = require('../assets/reparacion_pc.png.jpeg'); 

const BLUE_COLOR = '#007AFF';

// --- Estructura de datos de tus servicios fijos ---
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
            
            {/* ❌ BOTÓN ELIMINADO */}
        </View>
    );
};

// Componente CustomHeader 
const CustomHeader = ({ navigation, title }) => {
    const insets = useSafeAreaInsets();
    
    const renderProfileAvatar = () => {
        return <FontAwesome name="user-circle" size={30} color={BLUE_COLOR} />;
    };

    return (
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : insets.top + 10 }]}>
            <View style={styles.backButtonPlaceholder} /> 
            
            <Text style={styles.headerTitle}>{title}</Text>

            <TouchableOpacity onPress={() => navigation.navigate('Perfil')} style={styles.profileButton}>
                {renderProfileAvatar()}
            </TouchableOpacity>
        </View>
    );
};


export default function Servicios({ navigation }) {
    return (
        <View style={styles.container}>
            <CustomHeader
                navigation={navigation}
                title="Nuestros Servicios"
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
    // 🚨 AJUSTE DE MARGEN INFERIOR: Aumentamos el margen ya que el botón no está.
    cardDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20, // Más espacio al final de la descripción
    },
    // ❌ ESTILOS DEL BOTÓN ELIMINADOS
    footerText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
    }
});