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
// Importamos funciones de autenticación y la base de datos de Firebase.
import { signOut } from 'firebase/auth'; // Función para cerrar sesión
import { auth, db } from '../src/config/firebaseConfig'; // Instancias de Auth y Firestore
// Importamos funciones avanzadas de Firestore para consultas y manipulación de datos.
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'; // Funciones para interactuar con Firestore
import { FontAwesome } from '@expo/vector-icons'; // Íconos
import { LinearGradient } from 'expo-linear-gradient'; // Componente para degradados

// Definiciones de constantes para el carrusel de productos
const { width } = Dimensions.get('window'); // Ancho de la ventana
const ITEM_WIDTH = 150; // Ancho fijo para cada ítem del carrusel
const ITEM_MARGIN = 15; // Margen entre ítems
const SNAP_WIDTH = ITEM_WIDTH + ITEM_MARGIN; // Ancho total de desplazamiento para el carrusel

// --- Variables de color ajustadas ---
const VOTE_COLOR_A = '#007AFF'; // Azul de votación/base
const VOTE_COLOR_B = '#4CAF50'; // Verde de votación/base
const USER_VOTE_COLOR = '#FFC107'; // Amarillo para resaltar la opción votada por el usuario
const RED_COLOR = '#dc3545'; // Rojo para cerrar sesión/error

/**
 * CustomAlert: Componente Modal reutilizable para mostrar feedback al usuario.
 * Muestra alertas de éxito o error con un diseño personalizado.
 */
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? VOTE_COLOR_B : '#FF4136'; // Color de feedback
    const iconName = isSuccess ? 'check-circle' : 'exclamation-triangle'; // Ícono de feedback

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

// Estilos para el CustomAlert
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

/**
 * FeaturedProductItem: Componente que renderiza una sola tarjeta de producto 
 * para el carrusel horizontal. Usa `memo` para optimizar el rendimiento.
 */
const FeaturedProductItem = memo(({ item, navigation }) => (
    <TouchableOpacity 
        style={styles.featuredCard} 
        onPress={() => console.log('Ver detalle de', item.name)} // Acción actual: registrar en consola
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


/**
 * InteractiveSurvey: Componente avanzado para mostrar una encuesta y sus resultados.
 * Maneja el voto del usuario y actualiza los resultados en tiempo real desde Firestore.
 */
const InteractiveSurvey = ({ surveyId, question, options, showAlert }) => {
    const [userVotedOption, setUserVotedOption] = useState(null); // Opción votada por el usuario actual
    const [results, setResults] = useState(null); // Resultados de la encuesta
    const [loading, setLoading] = useState(true); // Controla el estado de carga

    const userId = auth.currentUser ? auth.currentUser.uid : 'guest'; // Obtiene el ID del usuario
    const isDualOption = options.length === 2; // Bandera para usar el diseño de barra segmentada (2 opciones)


    /**
     * Carga el conteo total de votos y calcula los porcentajes desde Firestore.
     */
    const fetchResults = useCallback(async (id) => {
        try {
            const responsesRef = collection(db, 'survey_responses');
            const allVotesQuery = query(responsesRef, where('survey_id', '==', id));
            const allVotesSnapshot = await getDocs(allVotesQuery);

            const totalVotes = allVotesSnapshot.docs.length; // Conteo total de votos
            const voteCounts = {}; 

            options.forEach(opt => voteCounts[opt.name] = 0); // Inicializa el conteo en cero
            allVotesSnapshot.forEach(doc => {
                const data = doc.data();
                const votedOption = data.voted_option;
                if (votedOption && voteCounts.hasOwnProperty(votedOption)) { // Incrementa el conteo si la opción es válida
                    voteCounts[votedOption]++;
                }
            });

            // 2. Calcula el porcentaje para cada opción
            const formattedResults = options.map(opt => ({
                name: opt.name,
                color: opt.color,
                count: voteCounts[opt.name],
                percent: totalVotes > 0 ? ((voteCounts[opt.name] / totalVotes) * 100).toFixed(0) : 0, // Calcula el porcentaje
            }));
            
            setResults({
                formattedResults, // Resultados formateados
                totalVotes
            });

        } catch (error) {
            console.error(`Error al obtener resultados de encuesta ${surveyId}:`, error); // Manejo de error
        }
    }, [surveyId, options]);


    /**
     * Verifica si el usuario ya ha votado en esta encuesta.
     */
    const fetchSurveyStatus = useCallback(async () => {
        setLoading(true);
        if (!auth.currentUser) {
            setLoading(false);
            return; // Si no hay usuario, salimos
        }

        try {
            const responsesRef = collection(db, 'survey_responses');
            
            // Consulta para verificar si hay un voto de este usuario
            const userVoteQuery = query(
                responsesRef,
                where('survey_id', '==', surveyId),
                where('user_id', '==', userId),
                limit(1) // Solo necesitamos un documento
            );
            const userVoteSnapshot = await getDocs(userVoteQuery);

            if (!userVoteSnapshot.empty) {
                // Si ya votó, marcamos la opción y cargamos los resultados.
                const votedOption = userVoteSnapshot.docs[0].data().voted_option;
                setUserVotedOption(votedOption);
                await fetchResults(surveyId);
            } else {
                // Si no ha votado, reseteamos los estados.
                setUserVotedOption(null);
                setResults(null);
            }
        } catch (error) {
            console.error(`Error al obtener estado de encuesta ${surveyId}:`, error);
        } finally {
            setLoading(false); // Finaliza la carga
        }
    }, [surveyId, userId, fetchResults]);

    // Ejecuta la verificación del estado de la encuesta al cargar la vista.
    useEffect(() => {
        fetchSurveyStatus();
    }, [fetchSurveyStatus]);

    /**
     * Función para registrar el voto del usuario en Firestore.
     */
    const handleVote = async (optionName) => {
        if (!auth.currentUser) {
            showAlert("Acceso Denegado", "Debes iniciar sesión para votar en las encuestas.");
            return; // Bloquea si no hay sesión iniciada
        }

        setLoading(true); // Inicia el spinner
        try {
            // Registra el voto en la colección 'survey_responses'.
            await addDoc(collection(db, 'survey_responses'), {
                user_id: userId,
                survey_id: surveyId,
                voted_option: optionName,
                timestamp: new Date() 
            });

            // Actualiza la UI y recarga los resultados.
            setUserVotedOption(optionName);
            await fetchResults(surveyId);
            showAlert("¡Voto Guardado!", `Tu voto por "${optionName}" ha sido registrado.`, 'success');

        } catch (error) {
            console.error("Error al registrar el voto:", error);
            showAlert("Error al votar", "No se pudo registrar tu voto. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Función que renderiza la visualización de resultados (barra segmentada o tiles).
     */
    const renderResults = () => {
        if (!results) return null;

        if (isDualOption) { // Si solo hay dos opciones
            // OPCIÓN 1: BARRA SEGMENTADA (Diseño visual para dos opciones)
            const resultA = results.formattedResults[0];
            const resultB = results.formattedResults[1];

            return (
                <View>
                    <Text style={styles.totalVotesText}>Total de votos: {results.totalVotes}</Text>
                    
                    {/* Leyendas con porcentajes */}
                    <View style={styles.segmentedLegendContainer}>
                        <Text style={[styles.segmentedOptionText, { color: userVotedOption === resultA.name ? USER_VOTE_COLOR : resultA.color }]}>
                            {resultA.name} ({resultA.percent}%)
                        </Text>
                        <Text style={[styles.segmentedOptionText, { color: userVotedOption === resultB.name ? USER_VOTE_COLOR : resultB.color }]}>
                            {resultB.name} ({resultB.percent}%)
                        </Text>
                    </View>

                    {/* Barra de Progreso segmentada */}
                    <View style={styles.segmentedBarContainer}>
                        {/* Segmento A: Ancho según el porcentaje y color de voto */}
                        <View style={[
                            styles.barSegment, 
                            { 
                                width: `${resultA.percent}%`, 
                                backgroundColor: userVotedOption === resultA.name ? USER_VOTE_COLOR : resultA.color
                            }
                        ]} />
                        {/* Segmento B */}
                        <View style={[
                            styles.barSegment, 
                            { 
                                width: `${resultB.percent}%`, 
                                backgroundColor: userVotedOption === resultB.name ? USER_VOTE_COLOR : resultB.color
                            }
                        ]} />
                    </View>
                </View>
            );
        }

        // OPCIÓN 2: TILES DE PORCENTAJE (Diseño para tres o más opciones)
        return (
            <View>
                <Text style={styles.totalVotesText}>Total de votos: {results.totalVotes}</Text>
                
                <View style={styles.tileResultsContainer}>
                    {results.formattedResults
                        .sort((a, b) => b.count - a.count) // Ordena por la cantidad de votos
                        .map(result => (
                        <View key={result.name} style={[styles.resultTile, { backgroundColor: result.color }]}>
                            <Text style={[styles.tileName, { color: userVotedOption === result.name ? USER_VOTE_COLOR : '#fff' }]} numberOfLines={1}>
                                {result.name}
                            </Text>
                            <Text style={[styles.tilePercent, { color: userVotedOption === result.name ? USER_VOTE_COLOR : '#fff' }]}>
                                {result.percent}%
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const isVoted = userVotedOption !== null && results !== null; // Bandera si el usuario ya votó

    return (
        <View style={styles.surveyContainer}>
            <Text style={styles.surveyQuestion}>{question}</Text>
            
            {!isVoted ? (
                // Muestra los botones de votación si el usuario NO ha votado.
                <View style={styles.votingButtonsContainer}>
                    {options.map(option => (
                        <TouchableOpacity 
                            key={option.name}
                            style={[styles.voteButton, { backgroundColor: option.color }]}
                            onPress={() => handleVote(option.name)}
                            disabled={loading} // Deshabilita mientras carga o verifica
                        >
                            <Text style={styles.voteButtonText}>{option.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            ) : (
                // Muestra los resultados si el usuario YA votó.
                results ? (
                    renderResults()
                ) : (
                    <View style={{height: 100, justifyContent: 'center'}}>
                        <Text style={styles.placeholderText}>Cargando resultados de la encuesta...</Text>
                    </View>
                )
            )}
        </View>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PANTALLA ---
export default function Home({ navigation }) { // Componente de exportación por defecto
    const flatListRef = useRef(null); // Referencia para controlar el desplazamiento del carrusel
    const [currentIndex, setCurrentIndex] = useState(0); // Índice actual del carrusel

    // DEFINICIÓN DE LOS ESTADOS PRINCIPALES Y ALERTAS
    const [isAlertVisible, setIsAlertVisible] = useState(false); // Controla la visibilidad del CustomAlert
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' }); // Contenido del CustomAlert
    const [profileImage, setProfileImage] = useState(null); // URL de la foto de perfil
    const [userName, setUserName] = useState(''); // Nombre completo del usuario
    const [isLoading, setIsLoading] = useState(true); // Bloquea la UI durante la carga
    const [isMenuVisible, setIsMenuVisible] = useState(false); // Visibilidad del menú desplegable de perfil
    const [featuredProducts, setFeaturedProducts] = useState([]); // Lista de productos destacados/recientes
    const [loopedProducts, setLoopedProducts] = useState([]); // Lista duplicada para el carrusel infinito

    // Funciones para manejar la visibilidad del CustomAlert
    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    /**
     * Función que carga todos los datos necesarios desde Firestore.
     */
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Obtener datos del usuario autenticado (nombre y foto)
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfileImage(userData.profileImage || null);
                    setUserName(userData.firstName + ' ' + userData.lastName); // Concatena nombre y apellido
                }
            }

            // 2. Consulta para obtener productos destacados (isFeatured == true)
            const productsRef = collection(db, 'products');
            const featuredQuery = query(
                productsRef, 
                where('isFeatured', '==', true) // Filtro para productos destacados
            );
            const featuredSnapshot = await getDocs(featuredQuery);
            
            let productsList = featuredSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    price: data.price ? String(data.price) : 'N/A', // Asegura que el precio sea string
                    isFeatured: data.isFeatured || false, // Estado destacado
                };
            });

            // FALLBACK: Si no hay productos destacados, cargamos los 5 más recientes
            if (productsList.length === 0) {
                 const allProductsQuery = query(
                    productsRef,
                    orderBy('createdAt', 'desc'), // Ordena por fecha de creación
                    limit(5) // Limita a 5 productos
                );
                const fallbackSnapshot = await getDocs(allProductsQuery);
                
                productsList = fallbackSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        price: data.price ? String(data.price) : 'N/A',
                        isFeatured: false, // Se marcan como no destacados en el fallback
                    };
                });
            }

            setFeaturedProducts(productsList);

            // 3. Creación del bucle para el carrusel infinito
            if (productsList.length > 0) {
                // Duplica la lista 10 veces para simular el loop sin mostrar los bordes.
                const loopList = [...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList, ...productsList].map((item, index) => ({
                    ...item,
                    id: `${item.id}-${index}` // Asigna IDs únicos para evitar advertencias de React
                }));
                setLoopedProducts(loopList);
                // Inicia el carrusel en el centro de la lista duplicada.
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

    // Hook para ejecutar fetchData al montar y cada vez que la pantalla obtiene el foco.
    useEffect(() => {
        fetchData();
        const unsubscribe = navigation.addListener('focus', fetchData);
        return unsubscribe;
    }, [navigation, fetchData]);


    // EFECTO PARA EL DESPLAZAMIENTO AUTOMÁTICO del carrusel.
    useEffect(() => {
        if (loopedProducts.length === 0) return;

        const interval = setInterval(() => {
            if (flatListRef.current) {
                const nextIndex = currentIndex + 1;
                
                // Lógica de "teletransporte" para el carrusel infinito.
                if (nextIndex >= featuredProducts.length * 9) { 
                    const resetIndex = featuredProducts.length * 5; 
                    flatListRef.current.scrollToIndex({ index: resetIndex, animated: false }); // Vuelve al centro sin animación
                    setCurrentIndex(resetIndex);
                } else {
                    // Desplazamiento normal animado
                    flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
                    setCurrentIndex(nextIndex);
                }
            }
        }, 3000); // Cambia de slide cada 3 segundos

        return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente.
    }, [currentIndex, featuredProducts.length, loopedProducts.length]);


    /**
     * Cierra la sesión del usuario a través de Firebase Auth.
     */
    const handleLogOut = async () => {
        try {
            await signOut(auth); // Cierra la sesión en Firebase
            showAlert("Sesión cerrada", "Has cerrado sesión correctamente.", 'success');
            // La navegación al Login se maneja automáticamente por el listener en Navigation.js.
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showAlert("Error", "Hubo un problema al cerrar sesión.");
        }
    };
    
    // Renderiza la imagen de perfil real o un ícono genérico.
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

    // Si la aplicación está en estado de carga, muestra el spinner.
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    // Determina el título de la sección de productos (Destacados o Recientes).
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
            
            {/* Header: Logo, Título y Botón de Perfil */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('../assets/logo.png')} 
                        style={styles.logo}
                    />
                </View>
                {/* Al presionar el avatar, se muestra/oculta el menú desplegable. */}
                <TouchableOpacity onPress={() => setIsMenuVisible(!isMenuVisible)}>
                    {renderProfileAvatar()}
                </TouchableOpacity>
            </View>

            {/* Menú Desplegable de Perfil */}
            {isMenuVisible && (
                <View style={styles.profileMenu}>
                    <View style={styles.menuHeader}>
                        <Text style={styles.menuName}>{userName}</Text>
                    </View>
                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        setIsMenuVisible(false);
                        navigation.navigate('Perfil'); // Navega a la pestaña Perfil
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
                {/* Tarjeta de Bienvenida con Degradado */}
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

                {/* Sección de Acceso Rápido (Botones fijos a Productos y Servicios) */}
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
                
                {/* SECCIÓN DE CARRUSEL DE PRODUCTOS DESTACADOS */}
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
                            // Propiedad para optimización de renderizado
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

                {/* SECCIÓN DE ENCUESTAS INTERACTIVAS */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Encuestas</Text>

                    {/* Encuesta 1: CPU */}
                    <InteractiveSurvey 
                        surveyId="cpu_team"
                        question="¿Eres Team AMD o Team Intel?"
                        options={[
                            { name: "AMD", color: '#dc3545' }, 
                            { name: "Intel", color: '#007AFF' }
                        ]}
                        showAlert={showAlert}
                    />

                    {/* Encuesta 2: OS */}
                    <InteractiveSurvey 
                        surveyId="os_team"
                        question="¿Usas Windows o Linux?"
                        options={[
                            { name: "Windows", color: '#007AFF' }, 
                            { name: "Linux", color: '#4CAF50' }
                        ]}
                        showAlert={showAlert}
                    />
                    {/* Encuesta 3: Componente */}
                    <InteractiveSurvey 
                        surveyId="main_component"
                        question="¿Cuál es el componente más vital de tu PC?"
                        options={[
                            { name: "GPU", color: '#dc3545' },
                            { name: "CPU", color: '#007AFF' },
                            { name: "RAM", color: '#FFC107' },
                            { name: "Disco SSD", color: '#4CAF50' },
                        ]}
                        showAlert={showAlert}
                    />
                </View>

                {/* Pie de Página (Información de contacto) */}
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

// --- ESTILOS ---
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
    //  ESTILOS DEL MENÚ DESPLEGABLE 
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
    //  ESTILOS PARA BARRA SEGMENTADA (2 OPCIONES)
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
    //  ESTILOS PARA TILES (3+ OPCIONES)
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