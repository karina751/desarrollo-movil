import React, { useState, useEffect, useCallback, useRef, memo } from 'react'; 
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    ScrollView, 
    Modal, 
    SafeAreaView,
    ActivityIndicator,
    Platform,
    StatusBar,
    FlatList,
    Dimensions,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';

// Componente CustomAlert: Modal de alerta con ícono y color dinámico.
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? VOTE_COLOR_B : '#FF4136';
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
    alertTitleBase: { fontSize: 18, fontWeight: 'bold', color: VOTE_COLOR_A },
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
        }
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

    // DETERMINAR TÍTULO DE LA SECCIÓN
    const featuredTitle = featuredProducts.length > 0 && featuredProducts.some(p => p.isFeatured)
        ? 'Productos Destacados'
        : 'Productos Recientes';


    return (
        <SafeAreaView style={styles.fullScreenContainer}>
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type}
            />
            
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
                
                {/*  SECCIÓN DE PRODUCTOS DESTACADOS (CARRUSEL) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Productos Destacados</Text>
                    <Text style={styles.placeholderText}>Aquí se mostrarán los productos destacados.</Text>
                </View>
                {/* FIN SECCIÓN DESTACADOS */}

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
                    <Text style={styles.placeholderText}>Aquí se mostrarán los servicios ofrecidos.</Text>
                </View>
                {/* FIN SECCIÓN ENCUESTAS */}

                <View style={styles.infoFooter}>
                    <Text style={styles.infoFooterText}>Barrio/Ciudad del Milagro, Ciudadela, Jujuy Mº37</Text>
                    <Text style={styles.infoFooterText}>Nº de Local: 21</Text>
                    <Text style={styles.infoFooterText}>Cel: 387-5523636</Text>
                </View>
                
                <View style={styles.logoutButtonPlaceholder} /> 
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
    },
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f8f8f8' 
    },
    scrollContent: { paddingBottom: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e4eff9' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#007AFF' },
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
    profileImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#007AFF' },
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
    logoutButtonPlaceholder: { height: 20 }, 
    // ESTILOS DEL CARRUSEL
    carouselContainer: {
        paddingVertical: 5,
        paddingHorizontal: 5, 
    },
    featuredCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        width: ITEM_WIDTH, 
        height: 200, 
        marginRight: ITEM_MARGIN,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    featuredImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    featuredTextContainer: {
        padding: 10,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flex: 1,
    },
    featuredName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    featuredPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: VOTE_COLOR_B, 
    },
    // ESTILOS DE LA SECCIÓN DE ENCUESTAS INTERACTIVAS
    surveyContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    surveyQuestion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    // Estilos para los botones de votación
    votingButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        marginBottom: 5,
        flexWrap: 'wrap',
    },
    voteButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: '45%',
        alignItems: 'center',
        marginVertical: 5,
    },
    voteButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    // Estilos para el gráfico de resultados
    totalVotesText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
        marginBottom: 10,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    resultText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    barContainer: {
        width: '100%',
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 10,
        overflow: 'hidden', 
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    //  ESTILOS DEL MENÚ DESPLEGABLE 
    profileMenu: {
        position: 'absolute',
        top: 60, 
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
        color: VOTE_COLOR_A,
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
        backgroundColor: RED_COLOR,
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
    //  ESTILOS PARA BARRA SEGMENTADA (2 OPCIONES)
    segmentedBarContainer: {
        flexDirection: 'row',
        width: '100%',
        height: 15,
        backgroundColor: '#eee',
        borderRadius: 7.5,
        marginBottom: 15,
        overflow: 'hidden',
    },
    barSegment: {
        height: '100%',
    },
    segmentedLegendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    segmentedOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    //  ESTILOS PARA TILES (3+ OPCIONES)
    tileResultsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
        width: '100%',
    },
    resultTile: {
        width: '48%', // Dos por fila
        height: 65,
        marginVertical: 4,
        borderRadius: 10,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    tilePercent: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});