import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MainHeader } from '../../components/MainHeader';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { CartItem, useCart } from '../../context/CartContext';
import { uploadImage } from '../../utils/storage';



export default function DogScreen() {
    const [dogs, setDogs] = useState<CartItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDog, setEditingDog] = useState<Partial<CartItem> | null>(null);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { showAlert } = useAlert();

    useFocusEffect(
        useCallback(() => {
            loadDogs();
        }, [])
    );

    const loadDogs = async () => {
        try {
            const stored = await AsyncStorage.getItem('shopdog_dogs');
            const jsonData = require('../../assets/data/dogs.json');

            if (stored) {
                const storedDogs: CartItem[] = JSON.parse(stored);
                let mergedDogs = [...storedDogs];
                let changed = false;

                // Sync with JSON: Only add items from JSON that don't exist in storage
                jsonData.forEach((jItem: any) => {
                    const exists = mergedDogs.some(d => d.id === jItem.id);
                    if (!exists) {
                        mergedDogs.push(jItem);
                        changed = true;
                    }
                });

                setDogs(mergedDogs);
                if (changed) {
                    await AsyncStorage.setItem('shopdog_dogs', JSON.stringify(mergedDogs));
                }
            } else {
                setDogs(jsonData);
                await AsyncStorage.setItem('shopdog_dogs', JSON.stringify(jsonData));
            }
        } catch (error) {
            console.error("Error loading dogs", error);
        }
    };

    const saveDogs = async (newDogs: CartItem[]) => {
        setDogs(newDogs);
        await AsyncStorage.setItem('shopdog_dogs', JSON.stringify(newDogs));
    };

    const handleAdd = () => {
        setEditingDog({
            id: 'd' + Date.now(),
            name: '',
            price: 0,
            age: '',
            gender: 'M',
            color: '',
            character: '',
            image: 'https://images.unsplash.com/photo-1543332164-6e82f3555776?q=80&w=2070&auto=format&fit=crop',
            isNew: true,
            isOut: false,
            isRecommended: false,
            stock: 1
        });
        setIsModalVisible(true);
    };

    const handleEdit = (dog: CartItem) => {
        setEditingDog({ ...dog });
        setIsModalVisible(true);
    };

    const handleDelete = (id: string) => {
        showAlert("ยืนยันการลบ", "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?", "confirm", {
            onConfirm: () => {
                const filtered = dogs.filter(d => d.id !== id);
                saveDogs(filtered);
                showAlert("สำเร็จ", "ลบข้อมูลเรียบร้อยแล้ว", "success");
            }
        });
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            showAlert("ต้องการสิทธิ์", "กรุณาอนุญาตการเข้าถึงคลังรูปภาพ", "warning");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setUploading(true);
            const fileName = `dog_${Date.now()}.jpg`;
            const publicUrl = await uploadImage(result.assets[0].uri, 'shopdog', `products/${fileName}`);
            setUploading(false);

            if (publicUrl) {
                setEditingDog(prev => ({ ...prev!, image: publicUrl }));
            } else {
                showAlert('ผิดพลาด', 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
            }
        }
    };

    const handleDogPress = (dog: CartItem) => {
        router.push(`/details/dog/${dog.id}` as any);
    };

    const handleSave = () => {
        if (!editingDog?.name || !editingDog?.price) {
            showAlert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อและราคา", "warning");
            return;
        }

        let newDogs;
        const exists = dogs.find(d => d.id === editingDog.id);
        if (exists) {
            newDogs = dogs.map(d => d.id === editingDog.id ? (editingDog as CartItem) : d);
        } else {
            newDogs = [...dogs, editingDog as CartItem];
        }

        saveDogs(newDogs);
        setIsModalVisible(false);
        setEditingDog(null);
    };

    return (
        <View style={styles.container}>
            <MainHeader backgroundImage={require('../../assets/images/dog_banner.png')} />
            <View style={styles.titleRow}>
                <Text style={styles.title}>สุนัขเกรฮาวด์</Text>
                {user?.isAdmin && (
                    <TouchableOpacity style={styles.adminAddBtn} onPress={handleAdd}>
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text style={styles.adminAddBtnText}>เพิ่มรายการ</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={dogs}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }: { item: CartItem }) => (
                    <View style={styles.premiumCard}>
                        <TouchableOpacity
                            style={styles.cardTouch}
                            activeOpacity={0.9}
                            onPress={() => handleDogPress(item)}
                        >
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item.image }} style={styles.premiumImage} />
                                <View style={styles.badgeContainer}>
                                    <View style={[styles.typeBadgeChip, { backgroundColor: '#6366f1' }]}>
                                        <Text style={styles.typeBadgeText}>PET</Text>
                                    </View>
                                    {item.isRecommended && (
                                        <View style={[styles.typeBadgeChip, { backgroundColor: '#4ade80' }]}>
                                            <Text style={styles.typeBadgeText}>แนะนำ</Text>
                                        </View>
                                    )}
                                    {item.isNew && (
                                        <View style={[styles.typeBadgeChip, { backgroundColor: '#FFD700' }]}>
                                            <Text style={[styles.typeBadgeText, { color: '#333' }]}>NEW</Text>
                                        </View>
                                    )}
                                </View>
                                {item.isOut && (
                                    <View style={styles.outOverlay}>
                                        <Text style={styles.outOverlayText}>สินค้าหมด</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.premiumContent}>
                                <Text style={styles.premiumName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.premiumSub} numberOfLines={1}>{item.age} • {item.gender === 'M' ? 'ผู้' : 'เมีย'}</Text>

                                <View style={styles.premiumFooter}>
                                    <View>
                                        <Text style={styles.premiumPrice}>฿{item.price.toLocaleString()}</Text>
                                        <Text style={styles.premiumStock}>คงเหลือ: {item.stock || 0}</Text>
                                    </View>
                                    {!item.isOut && (
                                        <TouchableOpacity
                                            style={styles.premiumActionBtn}
                                            onPress={() => addToCart({ ...item, type: 'PET' })}
                                        >
                                            <Ionicons name="add" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>

                        {user?.isAdmin && (
                            <View style={styles.adminActionsRow}>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.adminActionIcon}>
                                    <Ionicons name="create-outline" size={18} color="#FFD700" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.adminActionIcon}>
                                    <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 100 }}
            />

            {/* Admin Edit Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{dogs.find(d => d.id === editingDog?.id) ? 'แก้ไขข้อมูล' : 'เพิ่มรายการใหม่'}</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>ชื่อสุนัข</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editingDog?.name}
                                onChangeText={(val) => setEditingDog(prev => ({ ...prev!, name: val }))}
                                placeholder="เช่น Silver Streak"
                            />

                            <Text style={styles.inputLabel}>ราคา (บาท)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editingDog?.price?.toString()}
                                onChangeText={(val) => setEditingDog(prev => ({ ...prev!, price: parseInt(val) || 0 }))}
                                keyboardType="numeric"
                                placeholder="เช่น 45000"
                            />

                            <Text style={styles.inputLabel}>อายุ</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editingDog?.age}
                                onChangeText={(val) => setEditingDog(prev => ({ ...prev!, age: val }))}
                                placeholder="เช่น 4 เดือน"
                            />

                            <View style={styles.modalRow}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.inputLabel}>เพศ (M/F)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={editingDog?.gender}
                                        onChangeText={(val) => setEditingDog(prev => ({ ...prev!, gender: val.toUpperCase() as any }))}
                                        maxLength={1}
                                        placeholder="M"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>สี</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={editingDog?.color}
                                        onChangeText={(val) => setEditingDog(prev => ({ ...prev!, color: val }))}
                                        placeholder="สีเทา"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>ลักษณะนิสัย</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80 }]}
                                value={editingDog?.character}
                                onChangeText={(val) => setEditingDog(prev => ({ ...prev!, character: val }))}
                                multiline
                                placeholder="นิสัยร่าเริง..."
                            />

                            <Text style={styles.inputLabel}>จำนวนในคลัง (Stock)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editingDog?.stock?.toString()}
                                onChangeText={(val) => setEditingDog(prev => ({ ...prev!, stock: parseInt(val) || 0 }))}
                                keyboardType="numeric"
                                placeholder="เช่น 1"
                            />

                            <Text style={styles.inputLabel}>การจัดการแท็ก</Text>
                            <View style={styles.tagSettingsRow}>
                                <TouchableOpacity
                                    style={[styles.tagToggle, editingDog?.isNew && styles.tagToggleActive]}
                                    onPress={() => setEditingDog(prev => ({ ...prev!, isNew: !prev?.isNew }))}
                                >
                                    <Text style={[styles.tagToggleText, editingDog?.isNew && styles.tagToggleTextActive]}>NEW</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tagToggle, editingDog?.isRecommended && styles.tagToggleActive]}
                                    onPress={() => setEditingDog(prev => ({ ...prev!, isRecommended: !prev?.isRecommended }))}
                                >
                                    <Text style={[styles.tagToggleText, editingDog?.isRecommended && styles.tagToggleTextActive]}>แนะนำ</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tagToggle, editingDog?.isOut && styles.tagToggleActiveRed]}
                                    onPress={() => setEditingDog(prev => ({ ...prev!, isOut: !prev?.isOut }))}
                                >
                                    <Text style={[styles.tagToggleText, editingDog?.isOut && styles.tagToggleTextActive]}>สินค้าหมด</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>รูปภาพ</Text>
                            {editingDog?.image && (
                                <Image
                                    source={{ uri: editingDog.image }}
                                    style={styles.previewImage}
                                />
                            )}
                            <View style={styles.imageButtonRow}>
                                <TouchableOpacity
                                    style={styles.imagePickerBtn}
                                    onPress={pickImage}
                                >
                                    <Ionicons name="image" size={20} color="#fff" />
                                    <Text style={styles.imagePickerBtnText}>เลือกรูปภาพ</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.inputLabel}>หรือใส่ URL รูปภาพ</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editingDog?.image}
                                onChangeText={(val) => setEditingDog(prev => ({ ...prev!, image: val }))}
                                placeholder="https://..."
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, uploading && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={uploading}
                            >
                                <Text style={styles.saveBtnText}>บันทึกข้อมูล</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    titleRow: { paddingHorizontal: 20, marginVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', borderLeftWidth: 4, borderLeftColor: '#6366f1', paddingLeft: 10 },
    card: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 20, elevation: 4, overflow: 'hidden' },
    imgBg: { width: '100%', height: 180, justifyContent: 'space-between' },
    badgeCol: { padding: 10, gap: 5 },
    petTag: { backgroundColor: '#6366f1', alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 6 },
    newTag: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 6 },
    recTag: { backgroundColor: '#4ade80', alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 6 },
    outTag: { backgroundColor: '#e63946', alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 6 },
    tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    gradient: { padding: 12, paddingTop: 40, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    itemName: { color: '#fff', fontWeight: 'bold', fontSize: 14, fontStyle: 'italic' },
    itemSub: { color: '#eee', fontSize: 11 },
    priceRow: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
    priceText: { color: '#e63946', fontWeight: 'bold', fontSize: 18 },
    stockTextMini: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },

    // Premium Card Styles
    premiumCard: {
        width: '47%',
        margin: '1.5%',
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardTouch: { flex: 1 },
    imageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
        backgroundColor: '#f8fafc',
    },
    premiumImage: {
        width: '100%',
        height: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        gap: 6,
    },
    typeBadgeChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    typeBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    outOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOverlayText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    premiumContent: {
        padding: 12,
    },
    premiumName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    premiumSub: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 10,
    },
    premiumFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    premiumPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    premiumStock: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    premiumActionBtn: {
        backgroundColor: '#80ced8ff',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminActionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 8,
        backgroundColor: '#f8fafc',
        gap: 12,
    },
    adminActionIcon: {
        padding: 4,
    },

    addBtn: { backgroundColor: '#FFD700', borderRadius: 20, padding: 5 },
    addBtnContent: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { color: '#333', fontWeight: 'bold', fontSize: 18 },
    bookBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    bookBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    // Admin Styles
    adminAddBtn: { backgroundColor: '#4ade80', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
    adminAddBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    adminActions: { flexDirection: 'row', gap: 5 },
    adminIconBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    modalForm: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 6, marginTop: 10 },
    modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#334155' },
    modalRow: { flexDirection: 'row' },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
    cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    saveBtnText: { color: '#fff', fontWeight: 'bold' },

    // Image Picker Styles
    previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10, backgroundColor: '#f1f5f9' },
    imageButtonRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    imagePickerBtn: { flex: 1, backgroundColor: '#6366f1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    imagePickerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    tagSettingsRow: { flexDirection: 'row', gap: 10, marginTop: 5, marginBottom: 15 },
    tagToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    tagToggleActive: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
    tagToggleActiveRed: { backgroundColor: '#e63946', borderColor: '#e63946' },
    tagToggleText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
    tagToggleTextActive: { color: '#fff' }
});