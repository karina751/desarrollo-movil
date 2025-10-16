import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    ScrollView, 
    Modal, 
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';

// Componente CustomAlert: Modal de alerta con ícono y color dinámico.
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

// Estilos específicos para el Custom Alert
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
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });
    const [profileImage, setProfileImage] = useState(null);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

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
            // 🚨 REMOVEMOS la navegación, la pantalla de autenticación se mostrará automáticamente
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showAlert("Error", "Hubo un problema al cerrar sesión.");
        }
    };
    
    // Contenido del avatar de perfil
    const renderProfileAvatar = () => {
        if (profileImage) {
            return (
                <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                />
            );
        } else {
            return (
                <FontAwesome name="user-circle" size={40} color="#007AFF" /> 
            );
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type}
            />
            {/* Header con el logo principal y el botón de perfil */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('../assets/logo.png')} 
                        style={styles.logo}
                    />
                </View>
                <TouchableOpacity onPress={() => setIsMenuVisible(!isMenuVisible)}>
                    {renderProfileAvatar()}
                </TouchableOpacity>
            </View>

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
                        <FontAwesome name="user" size={20} color="#007AFF" style={{ marginRight: 10 }} />
                        <Text style={styles.menuText}>Mi Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogOut}>
                        <FontAwesome name="sign-out" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Productos Destacados</Text>
                    <Text style={styles.placeholderText}>Aquí se mostrarán los productos destacados.</Text>
                </View>
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
                    <Text style={styles.placeholderText}>Aquí se mostrarán los servicios ofrecidos.</Text>
                </View>

                <View style={styles.infoFooter}>
                    <Text style={styles.infoFooterText}>Barrio/Ciudad del Milagro, Ciudadela, Jujuy Mº37</Text>
                    <Text style={styles.infoFooterText}>Nº de Local: 21</Text>
                    <Text style={styles.infoFooterText}>Cel: 387-5523636</Text>
                </View>
                
                {/* ❌ BOTÓN DE CERRAR SESIÓN ELIMINADO */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
        paddingBottom: 20,
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
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
    },
    logoContainer: { width: 40, height: 40 },
    logo: { width: '100%', height: '100%', resizeMode: 'contain' },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#007AFF',
    },
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
    // Estilos para el menú desplegable
    profileMenu: {
        position: 'absolute',
        top: 60, // Posiciona el menú debajo del header
        right: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 100, // Asegura que esté por encima de otros elementos
        padding: 10,
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
        color: '#007AFF',
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