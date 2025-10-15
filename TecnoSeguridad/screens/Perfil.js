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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../src/config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function Perfil() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
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

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso Denegado', 'Necesitamos acceso a la galería para subir una foto.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        setIsSaving(true);
        try {
            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response);
                };
                xhr.onerror = function (e) {
                    console.log(e);
                    reject(new TypeError('Network request failed'));
                };
                xhr.responseType = 'blob';
                xhr.open('GET', uri, true);
                xhr.send(null);
            });

            const userUID = auth.currentUser.uid;
            const storageRef = ref(storage, `profileImages/${userUID}`);
            
            await uploadBytes(storageRef, blob);
            
            const imageUrl = await getDownloadURL(storageRef);
            
            const userRef = doc(db, 'users', userUID);
            await updateDoc(userRef, { profileImage: imageUrl });
            
            setProfileImage(imageUrl);
            Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            Alert.alert('Error', 'No se pudo actualizar la foto de perfil.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                firstName: firstName,
                lastName: lastName,
            });
            Alert.alert('Éxito', 'Datos de perfil actualizados correctamente.');
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            Alert.alert('Error', 'No se pudieron guardar los cambios.');
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