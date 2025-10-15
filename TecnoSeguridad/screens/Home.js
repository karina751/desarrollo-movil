import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    Modal, 
    ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componente CustomAlert: Modal de alerta con ícono y color dinámico.
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? '#4CAF50' : '#FF4136'; // Verde o Rojo
    const iconName = isSuccess ? 'check-circle' : 'exclamation-triangle'; // Check o Triángulo

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

export default function Home({ navigation }) {
    // Obtiene las distancias seguras de la pantalla
    const insets = useSafeAreaInsets();
    
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });

    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    const handleLogOut = async () => {
        try {
            await signOut(auth);
            showAlert("Sesión cerrada", "Has cerrado sesión correctamente.", 'success');
            navigation.replace('Login');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showAlert("Error", "Hubo un problema al cerrar sesión.");
        }
    };

    return (
        <View style={styles.fullScreenContainer}>
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type}
            />
            {/* Contenedor principal que usa los insets para no superponerse */}
            <View style={{ paddingTop: insets.top, flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header con el logo y el botón de perfil */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image 
                                source={require('../assets/logo.png')} 
                                style={styles.logo}
                            />
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
                            <FontAwesome name="user-circle" size={30} color="#007AFF" /> 
                        </TouchableOpacity>
                    </View>

                    {/* Sección de Bienvenida con gradiente */}
                    <LinearGradient
                        colors={['#007AFF', '#005bb5']}
                        style={styles.welcomeCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.welcomeTitle}>Bienvenido a TecnoSeguridad</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Tu solución en productos de informática y seguridad en el hogar.
                        </Text>
                    </LinearGradient>

                    {/* Sección de Acceso Rápido */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Acceso Rápido</Text>
                        <View style={styles.quickAccessButtonsContainer}>
                            <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Productos')}>
                                <FontAwesome name="cube" size={24} color="#007AFF" />
                                <Text style={styles.quickAccessButtonText}>Productos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Servicios')}>
                                <FontAwesome name="wrench" size={24} color="#007AFF" />
                                <Text style={styles.quickAccessButtonText}>Servicios</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* Placeholder para Productos y Servicios Destacados */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Productos Destacados</Text>
                        <Text style={styles.placeholderText}>Aquí se mostrarán los productos destacados.</Text>
                    </View>
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
                        <Text style={styles.placeholderText}>Aquí se mostrarán los servicios ofrecidos.</Text>
                    </View>

                    {/* Footer de Información de Contacto */}
                    <View style={styles.infoFooter}>
                        <Text style={styles.infoFooterText}>Barrio/Ciudad del Milagro, Ciudadela, Jujuy Mº37</Text>
                        <Text style={styles.infoFooterText}>Nº de Local: 21</Text>
                        <Text style={styles.infoFooterText}>Cel: 387-5523636</Text>
                    </View>
                    
                    {/* Botón para cerrar la sesión */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: { 
        flex: 1, 
        backgroundColor: '#f8f8f8',
    },
    scrollContent: { 
        paddingBottom: 20, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
    },
    logoContainer: { width: 40, height: 40 },
    logo: { width: '100%', height: '100%', resizeMode: 'contain' },
    welcomeCard: {
        margin: 15,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
    welcomeSubtitle: { fontSize: 14, color: '#E0E0E0' },
    sectionContainer: { paddingHorizontal: 15, marginTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    quickAccessButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickAccessButton: { 
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingVertical: 20,
        width: '48%',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    quickAccessButtonText: { fontSize: 14, color: '#007AFF', marginTop: 5 },
    placeholderText: { textAlign: 'center', color: '#888', fontStyle: 'italic', padding: 20 },
    infoFooter: {
        backgroundColor: '#007AFF',
        padding: 20,
        alignItems: 'center',
        marginTop: 30,
    },
    infoFooterText: { color: '#FFFFFF', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignSelf: 'center',
        marginVertical: 20,
    },
    logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});