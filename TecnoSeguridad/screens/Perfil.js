import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    Modal,
    Platform, 
    Keyboard, 
    KeyboardAvoidingView, 
    Alert, 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';
import { signOut } from 'firebase/auth'; 
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { subirImagenACloudinary } from '../src/config/cloudinaryConfig'; 

// --- Variables de color ---
const BLUE_COLOR = '#007AFF';
const RED_COLOR = '#FF4136';
const SUCCESS_COLOR = '#4CAF50'; 

// --- Componente CustomAlert (Reutilizado para Feedback) ---
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? SUCCESS_COLOR : RED_COLOR; 
    const iconName = isSuccess ? 'check-circle' : 'exclamation-triangle';
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={customAlertStyles.modalContainer}>
                <View style={[customAlertStyles.alertBox, { borderColor: feedbackColor, borderWidth: 
2 }]}>
                    <View style={customAlertStyles.headerContainer}>
                           <FontAwesome name={iconName} size={24} color={feedbackColor} style={{ marginRight: 10 }} />
                           <Text style={[customAlertStyles.alertTitleBase, { color: feedbackColor }]}>{title}</Text>
                    </View>
                    <Text style={[customAlertStyles.alertMessageBase, { color: feedbackColor }]}>{message}</Text>
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
// Estilos específicos para el Custom Alert (Se mantienen)
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
    alertTitleBase: { fontSize: 18, fontWeight: 'bold' },
    alertMessageBase: { fontSize: 15, textAlign: 'center', marginBottom: 20 },
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
// --- FIN CustomAlert ---


// 🚨 NUEVO COMPONENTE: MODAL PERSONALIZADO PARA SELECCIÓN DE ORIGEN DE IMAGEN
const ImageSourceOptions = ({ isVisible, onTakePhoto, onSelectGallery, onCancel }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onCancel}
        >
            <View style={styles.sourceModalContainer}>
                <View style={styles.sourceModalContent}>
                    <Text style={styles.sourceModalTitle}>Seleccionar Imagen</Text>
                    <Text style={styles.sourceModalSubtitle}>¿Deseas tomar una foto o seleccionar una de la galería?</Text>

                    {/* Botón Tomar Foto */}
                    <TouchableOpacity 
                        style={[styles.sourceOptionButton, { backgroundColor: BLUE_COLOR }]}
                        onPress={onTakePhoto}
                    >
                        <FontAwesome name="camera" size={20} color="white" style={styles.sourceIcon} />
                        <Text style={styles.sourceButtonText}>Tomar Foto</Text>
                    </TouchableOpacity>

                    {/* Botón Seleccionar de Galería */}
                    <TouchableOpacity 
                        style={[styles.sourceOptionButton, { backgroundColor: BLUE_COLOR }]}
                        onPress={onSelectGallery}
                    >
                        <FontAwesome name="image" size={20} color="white" style={styles.sourceIcon} />
                        <Text style={styles.sourceButtonText}>Galería</Text>
                    </TouchableOpacity>

                    {/* Botón Cancelar */}
                    <TouchableOpacity 
                        style={[styles.sourceCancelButton]}
                        onPress={onCancel}
                    >
                        <Text style={styles.sourceCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


export default function Perfil() {
    const navigation = useNavigation();
    
    const [firstName, setFirstName] = useState(''); 
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(''); 
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [shouldNavigate, setShouldNavigate] = useState(false); 
    // 🚨 Nuevo estado para el modal de opciones de imagen
    const [isSourceModalVisible, setIsSourceModalVisible] = useState(false); 
    
    // Estados para el Custom Alert
    const [isAlertVisible, setIsAlertVisible] = useState(false); 
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' }); 

    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type }); 
        setIsAlertVisible(true); 
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
        setIsSaving(false); 
        
        if (shouldNavigate) {
            setShouldNavigate(false); 
            Keyboard.dismiss();
            navigation.reset({ 
                index: 0, 
                routes: [{ name: 'HomeTabs' }] 
            }); 
        }
    };
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                
                if (docSnap.exists()) { 
                    const userData = docSnap.data();
                    setFirstName(userData.firstName);
                    setLastName(userData.lastName);
                    setEmail(userData.email);
                    setProfileImage(userData.profileImage || null); 
                }
            }
            setIsLoading(false);
        };
        fetchUserData();
    }, []);

    // **Lógica de Cerrar Sesión**
    const handleSignOut = async () => {
        setIsSaving(true);
        try { 
            await signOut(auth); 
            showAlert('Sesión Cerrada', 'Has cerrado tu sesión con éxito.', 'success'); 
        } catch (error) {
            console.error('Error al cerrar sesión:', error); 
            showAlert('Error de Sesión', 'No se pudo cerrar la sesión correctamente.'); 
        } finally {
            // Se mantiene isSaving para bloquear UI
        }
    };

    // 🚨 Lógica de Subida Centralizada (llamada por takePhoto/selectFromGallery)
    const handleUploadImage = async (uri) => {
        setIsSaving(true);
        setIsSourceModalVisible(false); // Cierra el modal de opciones

        try {
            showAlert('Subiendo Imagen', 'Por favor espera...', 'success');
            
            const cloudinaryUrl = await subirImagenACloudinary(uri, 'perfiles'); 
            await saveProfileImageUrl(cloudinaryUrl);
            
        } catch (error) {
            console.error('Error al subir/guardar la foto de perfil:', error);
            showAlert('Error', error.message || 'No se pudo actualizar la foto de perfil.', 'error');
        } finally {
            // setIsSaving(false) se llama en saveProfileImageUrl
        }
    }
    
    // 🚨 FUNCIÓN PARA TOMAR FOTO CON CÁMARA
    const takePhoto = async () => {
        setIsSourceModalVisible(false); // Cierra el modal de opciones
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
             showAlert('Permiso Denegado', 'Necesitamos acceso a la cámara para tomar una foto.', 'error');
             return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, 
            aspect: [1, 1], 
            quality: 0.7, 
        });

        if (!result.canceled) {
            handleUploadImage(result.assets[0].uri);
        }
    };
    
    // 🚨 FUNCIÓN PARA SELECCIONAR DE GALERÍA
    const selectFromGallery = async () => {
        setIsSourceModalVisible(false); // Cierra el modal de opciones
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus !== 'granted') {
            showAlert('Permiso Denegado', 'Necesitamos acceso a la galería para subir una foto.', 'error');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, 
            aspect: [1, 1], 
            quality: 0.7, 
        });

        if (!result.canceled) {
            handleUploadImage(result.assets[0].uri);
        }
    };

    // 🚨 FUNCIÓN PRINCIPAL: MUESTRA EL MODAL DE OPCIONES
    const pickImage = () => {
        setIsSourceModalVisible(true);
    };


    // FUNCIÓN AUXILIAR: Guarda la URL en Firestore
    const saveProfileImageUrl = async (uri) => {
        const userUID = auth.currentUser.uid;
        const userRef = doc(db, 'users', userUID); 
        
        await updateDoc(userRef, { profileImage: uri }); 
        
        setProfileImage(uri);
        showAlert('Éxito', 'Foto de perfil actualizada correctamente.', 'success'); 
        setIsSaving(false); // Reinicia el estado de carga
    };

    // Lógica para guardar los cambios en el formulario y NAVEGAR A HOME
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try { 
            // Cerrar teclado antes de la alerta
            Keyboard.dismiss();

            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { 
                firstName: firstName,
                lastName: lastName,
            });
            
            // 1. Activar la bandera de navegación ANTES de la alerta de éxito
            setShouldNavigate(true);
            
            // 2. Mostrar alerta de éxito. hideAlert se encargará del resto.
            showAlert('Éxito', 'Datos de perfil actualizados correctamente.', 'success'); 
            
        } catch (error) {
            console.error('Error al guardar los cambios:', error); 
            showAlert('Error', 'No se pudieron guardar los cambios.'); 
            setShouldNavigate(false); 
            setIsSaving(false); 
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    } 

    return (
        <LinearGradient
            colors={['#97c1e6', '#e4eff9']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            {/* Modal para opciones de imagen */}
            <ImageSourceOptions 
                isVisible={isSourceModalVisible}
                onTakePhoto={takePhoto}
                onSelectGallery={selectFromGallery}
                onCancel={() => setIsSourceModalVisible(false)}
            />

            <CustomAlert
                isVisible={isAlertVisible} 
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type}
            />

            {/* 🚨 KeyboardAvoidingView para evitar que el teclado oculte el botón */}
            <KeyboardAvoidingView
                style={styles.scrollContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}> 
                        <Text style={styles.title}>Mi Perfil</Text>
                        
                        <View style={styles.profileImageContainer}>
                        
                            <Image
                                source={profileImage ? { uri: profileImage } : { uri: 'https://via.placeholder.com/150' }} 
                                style={styles.profileImage}
                            />
                            <TouchableOpacity style={styles.changeImageButton} onPress={pickImage} disabled={isSaving}> 
                                <FontAwesome name="camera" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}> 
                            <Text style={styles.etiqueta}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName} 
                                onChangeText={setFirstName}
                                placeholder="Nombre"
                                autoCapitalize="words" 
                                editable={!isSaving}
                            />

                            <Text style={styles.etiqueta}>Apellido</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName} 
                                onChangeText={setLastName}
                                placeholder="Apellido" 
                                autoCapitalize="words"
                                editable={!isSaving}
                            />

                            <Text style={styles.etiqueta}>Correo Electrónico</Text> 
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email} 
                                editable={false}
                            />
                        </View>

                        {/* Botón Guardar Cambios */} 
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? 
                            (
                                <ActivityIndicator color="white" /> 
                            ) : (
                                <Text style={styles.saveButtonText}>Guardar Cambios</Text> 
                            )}
                        </TouchableOpacity>

                        {/* Botón Cerrar Sesión */}
                        <TouchableOpacity 
                            style={styles.signOutButton} 
                            onPress={handleSignOut} 
                            disabled={isSaving} 
                        >
                            <FontAwesome name="sign-out" size={20} color="#FF4136" style={{ marginRight: 10 }} /> 
                            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
} 

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e4eff9' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#007AFF' },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF', 
        borderRadius: 15,
        padding: 25,
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5, 
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 20 },
    profileImageContainer: {
        marginBottom: 20,
        position: 'relative',
        width: 120,
        height: 120,
    },
    profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#007AFF' },
    changeImageButton: {
        position: 'absolute',
        bottom: 5, 
        right: 5,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 8,
    },
    formContainer: { width: '100%', marginBottom: 20 },
    etiqueta: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginTop: 15, marginBottom: 5 },
    input: {
        width: '100%',
        padding: 12,
        backgroundColor: '#f0f8ff', 
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        color: '#333',
    },
    disabledInput: {
        backgroundColor: '#e9e9e9',
        color: '#888',
    },
    saveButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 10, 
        width: '100%',
        alignItems: 'center',
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', 
    },
    
    // ESTILOS PARA EL BOTÓN CERRAR SESIÓN
    signOutButton: {
        marginTop: 20, 
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '100%', 
        alignItems: 'center',
        flexDirection: 'row', 
        justifyContent: 'center',
        backgroundColor: '#FF4136', 
        borderWidth: 1,
        borderColor: '#FF4136', 
    },
    signOutButtonText: {
        color: '#FFFFFF', 
        fontSize: 16,
        fontWeight: 'bold', 
    },
    
    // 🚨 ESTILOS ADICIONALES PARA EL MODAL DE OPCIONES DE IMAGEN
    sourceModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sourceModalContent: {
        backgroundColor: 'white',
        width: '100%',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
    },
    sourceModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 5,
    },
    sourceModalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    sourceOptionButton: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    sourceIcon: {
        marginRight: 10,
    },
    sourceButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sourceCancelButton: {
        marginTop: 5,
        paddingVertical: 10,
    },
    sourceCancelText: {
        color: RED_COLOR,
        fontSize: 16,
    },
});