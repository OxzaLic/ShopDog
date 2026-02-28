import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/storage';

export default function ProfileScreen() {
    const { user, logout, updateProfile, fetchAllProfiles } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [address, setAddress] = useState(user?.address || '');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    // Calculate real data
    const orderCount = user?.orders?.length || 0;
    const totalSpent = (user?.orders || []).reduce((sum, order) => sum + (order.total || 0), 0);
    const balance = "999,999";

    // Admin State
    const [newOrderCount, setNewOrderCount] = useState(0);
    const [totalAdminOrders, setTotalAdminOrders] = useState(0);
    const [totalAdminRevenue, setTotalAdminRevenue] = useState(0);

    // Map State
    const [showMap, setShowMap] = useState(false);
    const [tempLocation, setTempLocation] = useState({
        latitude: 13.7563, // Bangkok default
        longitude: 100.5018,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    React.useEffect(() => {
        if (user?.isAdmin) {
            loadAdminData();
        }
    }, [user?.isAdmin]);

    const loadAdminData = async () => {
        const profiles = await fetchAllProfiles();
        let preparingCount = 0;
        let totalOrders = 0;
        let totalRevenue = 0;

        profiles.forEach(profile => {
            if (profile.orders) {
                preparingCount += profile.orders.filter((o: any) => o.status === 'preparing').length;
                totalOrders += profile.orders.length;
                totalRevenue += profile.orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
            }
        });
        setNewOrderCount(preparingCount);
        setTotalAdminOrders(totalOrders);
        setTotalAdminRevenue(totalRevenue);
    };

    if (!user) {
        return (
            <View style={styles.errorContainer}>
                <Text>ไม่พบข้อมูลผู้ใช้</Text>
                <TouchableOpacity onPress={() => router.replace('/')}>
                    <Text style={styles.linkText}>กลับหน้าหลัก</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const pickImage = async () => {
        if (!isEditing) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setLoading(true);
            const fileName = `profile_${user.id}_${Date.now()}.jpg`;
            const publicUrl = await uploadImage(result.assets[0].uri, 'shopdog', `profiles/${fileName}`);
            setLoading(false);

            if (publicUrl) {
                setProfileImage(publicUrl);
            } else {
                showAlert('ผิดพลาด', 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('แจ้งเตือน', 'กรุณาระบุชื่อ', 'warning');
            return;
        }
        setLoading(true);
        const success = await updateProfile(name, address, profileImage);
        setLoading(false);
        if (success) {
            setIsEditing(false);
            showAlert('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
        } else {
            showAlert('ผิดพลาด', 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
        }
    };

    const confirmLocation = () => {
        setAddress(`ตำแหน่งจากแผนที่: (${tempLocation.latitude.toFixed(4)}, ${tempLocation.longitude.toFixed(4)})`);
        setShowMap(false);
    };

    const handleLogout = () => {
        showAlert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', 'confirm', {
            confirmText: 'ยืนยัน',
            onConfirm: async () => {
                await logout();
                router.replace('/');
            }
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{user.isAdmin ? 'Admid' : 'Personal Information'}</Text>
                    <TouchableOpacity
                        style={styles.editBtnBox}
                        onPress={() => {
                            setName(user.name);
                            setAddress(user.address || '');
                            setProfileImage(user.profileImage || '');
                            setIsEditing(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={20} color="#529c81" />
                    </TouchableOpacity>
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={[styles.avatarCircle, isEditing && styles.avatarEditing]}
                        onPress={pickImage}
                        disabled={!isEditing}
                    >
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Ionicons name="person" size={60} color="#fff" />
                            </View>
                        )}
                        {isEditing && (
                            <View style={styles.cameraOverlay}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userLocation}>{user.address || 'California, USA'}</Text>
                </View>

                {/* Stat Bar */}
                <View style={styles.statBar}>
                    {user.isAdmin ? (
                        <>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalAdminOrders}</Text>
                                <Text style={styles.statLabel}>Orders</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>฿{totalAdminRevenue.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Revenue</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{balance}</Text>
                                <Text style={styles.statLabel}>Balance</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{orderCount}</Text>
                                <Text style={styles.statLabel}>Orders</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>฿{totalSpent.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Total Spent</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Action List */}
                <View style={styles.actionList}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => router.push(user.isAdmin ? '/orders/admin' : '/orders' as any)}
                    >
                        <Ionicons name="cart-outline" size={22} color="#529c81" />
                        <Text style={styles.actionText}>{user.isAdmin ? 'Manage Orders' : 'Your Order'}</Text>
                        {user.isAdmin && newOrderCount > 0 && (
                            <View style={styles.orderBadgeSmall}>
                                <Text style={styles.orderBadgeTextSmall}>{newOrderCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {user.isAdmin && (
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => router.push('/admin/products' as any)}
                        >
                            <Ionicons name="list-outline" size={22} color="#529c81" />
                            <Text style={styles.actionText}>Product List</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionItem}>
                        <Ionicons name="card-outline" size={22} color="#529c81" />
                        <Text style={styles.actionText}>Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/recommended' as any)}>
                        <Ionicons name="leaf-outline" size={22} color="#529c81" />
                        <Text style={styles.actionText}>Recommended Shops</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                        <Text style={[styles.actionText, { color: '#ef4444' }]}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Edit Modal (Pop-up) */}
                <Modal
                    visible={isEditing}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setIsEditing(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.editModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>แก้ไขข้อมูลส่วนตัว</Text>
                                <TouchableOpacity onPress={() => setIsEditing(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <TouchableOpacity
                                    style={styles.modalAvatarCircle}
                                    onPress={pickImage}
                                >
                                    {profileImage ? (
                                        <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={40} color="#fff" />
                                    )}
                                    <View style={styles.cameraOverlaySmall}>
                                        <Ionicons name="camera" size={14} color="#fff" />
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>ชื่อ-นามสกุล</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="ระบุชื่อของคุณ"
                                    />
                                </View>

                                {!user.isAdmin && (
                                    <View style={styles.inputGroup}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.label}>ที่อยู่จัดส่ง</Text>
                                            <TouchableOpacity
                                                style={styles.mapBtn}
                                                onPress={() => setShowMap(true)}
                                            >
                                                <Ionicons name="map-outline" size={14} color="#529c81" />
                                                <Text style={styles.mapBtnText}>แผนที่</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={address}
                                            onChangeText={setAddress}
                                            multiline
                                            numberOfLines={3}
                                            placeholder="ระบุที่อยู่"
                                        />
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>บันทึกข้อมูล</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelLink}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={styles.cancelLinkText}>ยกเลิก</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Map Modal */}
                <Modal visible={showMap} animationType="slide">
                    <View style={{ flex: 1 }}>
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={tempLocation}
                            onRegionChangeComplete={setTempLocation}
                        >
                            <Marker coordinate={tempLocation} />
                        </MapView>

                        <View style={styles.mapOverlay}>
                            <Text style={styles.mapHint}>ลากแผนที่เพื่อเลื่อนจุดปักหมุด</Text>
                            <View style={styles.mapFooter}>
                                <TouchableOpacity style={styles.mapCancel} onPress={() => setShowMap(false)}>
                                    <Text style={styles.mapCancelText}>ยกเลิก</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.mapConfirm} onPress={confirmLocation}>
                                    <Text style={styles.mapConfirmText}>ยืนยันตำแหน่งนี้</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Map Marker Fixed in Center */}
                        <View style={styles.fixedMarkerContainer} pointerEvents="none">
                            <Ionicons name="location" size={40} color="#e63946" />
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20
    },
    backBtn: { padding: 5 },
    editBtnBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f1f1',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    profileSection: { alignItems: 'center', paddingVertical: 20 },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#fff',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    avatarEditing: { borderColor: '#529c81', borderStyle: 'dashed' },
    avatarImage: { width: '100%', height: '100%' },
    placeholderAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },

    userName: { fontSize: 24, fontWeight: 'bold', color: '#334155', marginBottom: 5 },
    userLocation: { fontSize: 16, color: '#64748b' },

    statBar: {
        flexDirection: 'row',
        backgroundColor: '#529c81',
        marginHorizontal: 20,
        borderRadius: 20,
        paddingVertical: 20,
        marginVertical: 25,
        alignItems: 'center',
        justifyContent: 'space-around',
        elevation: 4,
        shadowColor: '#529c81',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    statDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.3)' },

    actionList: { paddingHorizontal: 20 },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    actionText: { flex: 1, fontSize: 16, color: '#475569', marginLeft: 15, fontWeight: '500' },

    editForm: { padding: 20, backgroundColor: '#f8fafc', margin: 20, borderRadius: 20 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 5 },
    input: { backgroundColor: '#fff', borderRadius: 15, padding: 15, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
    textArea: { height: 100, textAlignVertical: 'top' },
    mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    mapBtnText: { fontSize: 11, color: '#529c81', fontWeight: 'bold', marginLeft: 4 },
    saveBtn: { backgroundColor: '#529c81', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    editModalContent: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 25,
        width: '100%',
        maxHeight: '80%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    modalAvatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#cbd5e1',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        position: 'relative'
    },
    cameraOverlaySmall: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        height: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cancelLink: {
        alignItems: 'center',
        marginTop: 15,
        paddingVertical: 10
    },
    cancelLinkText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 14
    },

    orderBadgeSmall: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
    orderBadgeTextSmall: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    mapOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 15, elevation: 5 },
    mapHint: { textAlign: 'center', fontSize: 12, color: '#64748b', marginBottom: 15 },
    mapFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    mapCancel: { padding: 15, borderRadius: 15, backgroundColor: '#f1f5f9', flex: 0.4, alignItems: 'center' },
    mapCancelText: { fontWeight: 'bold', color: '#64748b' },
    mapConfirm: { padding: 15, borderRadius: 15, backgroundColor: '#1e293b', flex: 0.55, alignItems: 'center' },
    mapConfirmText: { fontWeight: 'bold', color: '#fff' },
    fixedMarkerContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40 },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    linkText: { color: '#1e293b', fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 10 },

    // Logout Modal Styles
    logoutModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30
    },
    logoutModalContent: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 25,
        width: '100%',
        alignItems: 'center',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    logoutIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    logoutTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10
    },
    logoutSubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 30
    },
    logoutActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    logoutCancelBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
        alignItems: 'center'
    },
    logoutCancelText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 16
    },
    logoutConfirmBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8
    },
    logoutConfirmText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
