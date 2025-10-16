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
    Alert,
    Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// Componente CustomAlert: Modal de alerta con ícono y color dinámico.
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    // Definir colores e íconos para retroalimentación
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
    alertTitleBase: { fontSize: 18, fontWeight: 'bold' },
    alertMessageBase: { fontSize: 15, textAlign: 'center', marginBottom: 20 },
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default function Perfil() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados para el Custom Alert
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });
    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };
    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    // Al cargar la pantalla, obtenemos los datos del usuario desde Firestore.
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

    // 1. Lógica para seleccionar y subir una imagen de perfil
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permiso Denegado', 'Necesitamos acceso a la galería para subir una foto.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Permitimos que el usuario edite la imagen.
            aspect: [1, 1], // Forzamos un formato cuadrado (1:1).
            quality: 1,
        });

        if (!result.canceled) {
            // Guardamos la URL local de la imagen en Firestore.
            saveLocalImageUri(result.assets[0].uri);
        }
    };
    
    // 2. Lógica para guardar la URL de la imagen en Firestore
    const saveLocalImageUri = async (uri) => {
        setIsSaving(true);
        try {
            const userUID = auth.currentUser.uid;
            const userRef = doc(db, 'users', userUID);
            
            await updateDoc(userRef, { profileImage: uri });
            
            setProfileImage(uri);
            showAlert('Éxito', 'Foto de perfil actualizada correctamente.', 'success');
        } catch (error) {
            console.error('Error al guardar la URL de la imagen:', error);
            showAlert('Error', 'No se pudo actualizar la foto de perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Lógica para guardar los cambios en el formulario
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                firstName: firstName,
                lastName: lastName,
            });
            showAlert('Éxito', 'Datos de perfil actualizados correctamente.', 'success');
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            showAlert('Error', 'No se pudieron guardar los cambios.');
        } finally {
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
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type}
            />

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

                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e4eff9' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#007AFF' },
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
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});