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

// 🚨 DEFINICIÓN GLOBAL DE CONSTANTES DEL CARRUSEL
const { width } = Dimensions.get('window');
const ITEM_WIDTH = 150; 
const ITEM_MARGIN = 15; 
const SNAP_WIDTH = ITEM_WIDTH + ITEM_MARGIN; // Ancho total de desplazamiento

// --- Variables de color ajustadas ---
const VOTE_COLOR_A = '#007AFF';
const VOTE_COLOR_B = '#4CAF50';
const USER_VOTE_COLOR = '#FFC107'; // Color para resaltar la opción votada por el usuario


// Componente CustomAlert (Reutilizado)
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

// COMPONENTE ITEM DEL CARRUSEL
const FeaturedProductItem = memo(({ item, navigation }) => (
    <TouchableOpacity 
        style={styles.featuredCard} 
        onPress={() => console.log('Ver detalle de', item.name)} 
    >
        <Image 
            source={item.image ? { uri: item.image } : { uri: 'https://via.placeholder.com/150/f0f0f0?text=Producto' }} 
            style={styles.featuredImage} 
            resizeMode="cover" 
        />
        <View style={styles.featuredTextContainer}>
            <Text style={styles.featuredName} numberOfLines={1}>{(item.name || 'Producto sin nombre').toString()}</Text> 
            <Text style={styles.featuredPrice}>${(item.price || '0.00').toString()}</Text>
        </View>
    </TouchableOpacity>
));


// 🚨 NUEVO COMPONENTE: TARJETA DE RESULTADOS DE ENCUESTA
const InteractiveSurvey = ({ surveyId, question, optionA, optionB, showAlert }) => {
    const [userVotedOption, setUserVotedOption] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    const userId = auth.currentUser ? auth.currentUser.uid : 'guest';

    const fetchResults = useCallback(async (id) => {
        try {
            const responsesRef = collection(db, 'survey_responses');
            const allVotesQuery = query(responsesRef, where('survey_id', '==', id));
            const allVotesSnapshot = await getDocs(allVotesQuery);

            let countA = 0;
            let countB = 0;
            const totalVotes = allVotesSnapshot.docs.length;

            allVotesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.voted_option === optionA) {
                    countA++;
                } else if (data.voted_option === optionB) {
                    countB++;
                }
            });

            const percentA = totalVotes > 0 ? ((countA / totalVotes) * 100).toFixed(0) : 0;
            const percentB = totalVotes > 0 ? ((countB / totalVotes) * 100).toFixed(0) : 0;
            
            setResults({
                countA,
                countB,
                percentA: Number(percentA),
                percentB: Number(percentB),
                totalVotes
            });

        } catch (error) {
            console.error(`Error al obtener resultados de encuesta ${surveyId}:`, error);
        }
    }, [surveyId, optionA, optionB]);


    const fetchSurveyStatus = useCallback(async () => {
        setLoading(true);
        if (!auth.currentUser) {
            setLoading(false);
            return; 
        }

        try {
            const responsesRef = collection(db, 'survey_responses');
            
            // 1. Verificar si el usuario ya votó
            const userVoteQuery = query(
                responsesRef,
                where('survey_id', '==', surveyId),
                where('user_id', '==', userId),
                limit(1)
            );
            const userVoteSnapshot = await getDocs(userVoteQuery);

            if (!userVoteSnapshot.empty) {
                const votedOption = userVoteSnapshot.docs[0].data().voted_option;
                setUserVotedOption(votedOption);
                await fetchResults(surveyId);
            } else {
                setUserVotedOption(null);
                setResults(null);
            }
        } catch (error) {
            console.error(`Error al obtener estado de encuesta ${surveyId}:`, error);
        } finally {
            setLoading(false);
        }
    }, [surveyId, userId, fetchResults]);

    useEffect(() => {
        // Ejecutamos fetchResults sin esperar que el usuario vote, para cargar resultados si existen
        fetchResults(surveyId); 
        fetchSurveyStatus();
    }, [fetchSurveyStatus, fetchResults, surveyId]); 

    const handleVote = async (option) => {
        if (!auth.currentUser) {
            showAlert("Acceso Denegado", "Debes iniciar sesión para votar en las encuestas.");
            return;
        }

        setLoading(true);
        try {
            // Guardar el voto del usuario
            await addDoc(collection(db, 'survey_responses'), {
                user_id: userId,
                survey_id: surveyId,
                voted_option: option,
                timestamp: serverTimestamp() 
            });

            // Actualizar la UI
            setUserVotedOption(option);
            await fetchResults(surveyId);
            showAlert("¡Voto Guardado!", `Tu voto por "${option}" ha sido registrado.`, 'success');

        } catch (error) {
            console.error("Error al registrar el voto:", error);
            showAlert("Error al votar", "No se pudo registrar tu voto. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const isVoted = userVotedOption !== null && results !== null;

    return (
        <View style={styles.surveyContainer}>
            <Text style={styles.surveyQuestion}>{question}</Text>
            
            {!isVoted ? (
                // --- BOTONES DE VOTACIÓN ---
                <View style={styles.votingButtonsContainer}>
                    <TouchableOpacity 
                        style={[styles.voteButton, { backgroundColor: VOTE_COLOR_A }]}
                        onPress={() => handleVote(optionA)}
                        disabled={loading}
                    >
                        <Text style={styles.voteButtonText}>{optionA}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.voteButton, { backgroundColor: VOTE_COLOR_B }]}
                        onPress={() => handleVote(optionB)}
                        disabled={loading}
                    >
                        <Text style={styles.voteButtonText}>{optionB}</Text>
                    </TouchableOpacity>
                </View>

            ) : (
                // 🚨 Renderizar resultados solo si results existe
                results ? (
                    // --- RESULTADOS DEL GRÁFICO ---
                    <View>
                        <Text style={styles.totalVotesText}>Total de votos: {results.totalVotes}</Text>
                        
                        {/* Opción A */}
                        <View style={styles.resultRow}>
                            <Text style={[styles.optionText, { 
                                color: userVotedOption === optionA ? USER_VOTE_COLOR : VOTE_COLOR_A 
                            }]}>{optionA}</Text>
                            <Text style={styles.resultText}>{results.percentA}%</Text>
                        </View>
                        <View style={styles.barContainer}>
                            <View style={[
                                styles.barFill, 
                                { 
                                    width: `${results.percentA}%`, 
                                    backgroundColor: userVotedOption === optionA ? USER_VOTE_COLOR : VOTE_COLOR_A 
                                }
                            ]} />
                        </View>

                        {/* Opción B */}
                        <View style={styles.resultRow}>
                            <Text style={[styles.optionText, { 
                                color: userVotedOption === optionB ? USER_VOTE_COLOR : VOTE_COLOR_B
                            }]}>{optionB}</Text>
                            <Text style={styles.resultText}>{results.percentB}%</Text>
                        </View>
                        <View style={styles.barContainer}>
                            <View style={[
                                styles.barFill, 
                                { 
                                    width: `${results.percentB}%`, 
                                    backgroundColor: userVotedOption === optionB ? USER_VOTE_COLOR : VOTE_COLOR_B
                                }
                            ]} />
                        </View>
                    </View>
                ) : (
                    <View style={{height: 100, justifyContent: 'center'}}>
                        <Text style={styles.placeholderText}>Cargando resultados de la encuesta...</Text>
                    </View>
                )
            )}
        </View>
    );
};


export default function Home({ navigation }) {
    const flatListRef = useRef(null); 
    const [currentIndex, setCurrentIndex] = useState(0); 

    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });
    const [profileImage, setProfileImage] = useState(null);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loopedProducts, setLoopedProducts] = useState([]);

    // 🚨 MOVIDO: DEFINICIÓN DE showAlert y hideAlert
    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
    };
    // ---------------------------------------------

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Obtener datos del usuario
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfileImage(userData.profileImage || null);
                    setUserName(userData.firstName + ' ' + userData.lastName);
                }
            }

            // 2. CONSULTA PARA PRODUCTOS DESTACADOS
            const productsRef = collection(db, 'products');
            const featuredQuery = query(
                productsRef, 
                where('isFeatured', '==', true)
            );
            const featuredSnapshot = await getDocs(featuredQuery);
            
            let productsList = featuredSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    price: data.price ? String(data.price) : 'N/A', 
                    isFeatured: data.isFeatured || false,
                };
            });

            // FALLBACK: Si no hay productos marcados, cargamos los 5 más recientes
            if (productsList.length === 0) {
                 const allProductsQuery = query(
                    productsRef,
                    orderBy('createdAt', 'desc'), 
                    limit(5)
                );
                const fallbackSnapshot = await getDocs(allProductsQuery);
                
                productsList = fallbackSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        price: data.price ? String(data.price) : 'N/A',
                        isFeatured: false, 
                    };
                });
            }

            setFeaturedProducts(productsList);

            // 🚨 CREACIÓN DEL BUCLE: Duplicamos la lista para simular un carrusel continuo
            if (productsList.length > 0) {
                // Duplicamos 10 veces para dar espacio al loop sin que se vea el final
                const loopList = [...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList].map((item, index) => ({
                    ...item,
                    id: `${item.id}-${index}` 
                }));
                setLoopedProducts(loopList);
                // Inicializamos el índice en el centro del bucle (quinto segmento)
                setCurrentIndex(productsList.length * 5); 
            } else {
                setLoopedProducts([]);
                setCurrentIndex(0);
            }

        } catch (error) {
            console.error("Error al cargar datos en Home:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const unsubscribe = navigation.addListener('focus', fetchData);
        return unsubscribe;
    }, [navigation, fetchData]);


    // 🚨 EFECTO PARA EL DESPLAZAMIENTO AUTOMÁTICO
    useEffect(() => {
        if (loopedProducts.length === 0) return;

        const interval = setInterval(() => {
            if (flatListRef.current) {
                const nextIndex = currentIndex + 1;
                
                // Si llegamos cerca del final del segmento actual, reiniciamos el índice (teletransporte)
                if (nextIndex >= featuredProducts.length * 9) { 
                    const resetIndex = featuredProducts.length * 5; 
                    flatListRef.current.scrollToIndex({ index: resetIndex, animated: false });
                    setCurrentIndex(resetIndex);
                } else {
                    flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
                    setCurrentIndex(nextIndex);
                }
            }
        }, 3000); // Cambia de slide cada 3 segundos

        return () => clearInterval(interval);
    }, [currentIndex, featuredProducts.length, loopedProducts.length]);


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
                
                {/* 🚨 SECCIÓN DE PRODUCTOS DESTACADOS (CARRUSEL) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>{featuredTitle}</Text> 
                    {loopedProducts.length > 0 ? (
                        <FlatList
                            ref={flatListRef} 
                            horizontal
                            data={loopedProducts}
                            renderItem={({ item }) => <FeaturedProductItem item={item} navigation={navigation} />}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            decelerationRate="fast" 
                            snapToAlignment="start"
                            snapToInterval={SNAP_WIDTH} 
                            contentContainerStyle={styles.carouselContainer}
                            // 🚨 PROPIEDAD PARA OPTIMIZACIÓN
                            getItemLayout={(data, index) => ({
                                length: SNAP_WIDTH,
                                offset: SNAP_WIDTH * index,
                                index,
                            })}
                            initialScrollIndex={featuredProducts.length * 5} 
                        />
                    ) : (
                        <Text style={styles.placeholderText}>No hay productos para mostrar en este momento.</Text> 
                    )}
                </View>
                {/* FIN SECCIÓN DESTACADOS */}

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Encuestas</Text>
                    
                    {/* 🚨 ENCUESTA 1: TEAM CPU */}
                    <InteractiveSurvey 
                        surveyId="cpu_team"
                        question="¿Eres Team AMD o Team Intel?"
                        optionA="AMD"
                        optionB="Intel"
                        showAlert={showAlert} // Pasamos la función de alerta
                    />

                    {/* 🚨 ENCUESTA 2: TEAM OS */}
                    <InteractiveSurvey 
                        surveyId="os_team"
                        question="¿Usas Windows o Linux?"
                        optionA="Windows"
                        optionB="Linux"
                        showAlert={showAlert} // Pasamos la función de alerta
                    />
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
    },
    voteButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: '45%',
        alignItems: 'center',
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
    }
});