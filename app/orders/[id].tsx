import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../context/AlertContext';
import { Order, useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';

const STATUS_MAP = {
    preparing: { label: 'รอจัดเตรียมสินค้า', color: '#f59e0b', icon: 'time' },
    ready_to_ship: { label: 'รอจัดส่ง', color: '#6366f1', icon: 'cube' },
    shipping: { label: 'อยู่ระหว่างจัดส่ง', color: '#3b82f6', icon: 'airplane' },
    delivered: { label: 'จัดส่งสำเร็จ', color: '#10b981', icon: 'checkmark-circle' },
};

export default function OrderDetailsScreen() {
    const { id, uid } = useLocalSearchParams();
    const { user, refreshProfile, adminFetchUserProfile, adminUpdateOrderStatus } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [orderOwnerId, setOrderOwnerId] = useState<string | null>(null);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [tempStatus, setTempStatus] = useState<Order['status'] | null>(null);
    const { showAlert } = useAlert();
    const router = useRouter();

    useEffect(() => {
        loadOrder();
    }, [id, uid]);

    const loadOrder = async () => {
        setLoading(true);
        try {
            // Priority 1: If admin and uid provided, fetch from orders table
            if (user?.isAdmin && (uid || id)) {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data) {
                    setCurrentOrder({
                        id: data.id,
                        date: data.date_string || new Date(data.created_at).toLocaleDateString('th-TH'),
                        total: data.total,
                        items: data.items,
                        status: data.status
                    });
                    setOrderOwnerId(data.user_id);
                    setTempStatus(data.status);
                    setLoading(false);
                    return;
                }
            }

            // Priority 2: Check current user's locally stored orders
            const found = user?.orders.find(o => o.id === id);
            if (found) {
                setCurrentOrder(found);
                setOrderOwnerId(user?.id || null);
                setTempStatus(found.status);
            }
        } catch (e) {
            console.error("Error loading order", e);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshProfile();
        await loadOrder();
        setRefreshing(false);
    };

    const handleSaveStatus = async () => {
        if (!currentOrder || !orderOwnerId || !tempStatus) return;

        const success = await adminUpdateOrderStatus(orderOwnerId, currentOrder.id, tempStatus);
        if (success) {
            setCurrentOrder(prev => prev ? ({ ...prev, status: tempStatus }) : null);
            showAlert('สำเร็จ', 'บันทึกสถานะคำสั่งซื้อเรียบร้อยแล้ว', 'success');
            setIsStatusModalVisible(false);
        } else {
            showAlert('ผิดพลาด', 'ไม่สามารถบันทึกสถานะได้ กรุณาลองใหม่', 'error');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text>กำลังโหลดข้อมูล...</Text>
            </View>
        );
    }

    if (!currentOrder) {
        return (
            <View style={styles.errorContainer}>
                <Text>ไม่พบข้อมูลคำสั่งซื้อ</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.linkText}>ย้อนกลับ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const stages = [
        { key: 'preparing', label: 'กำลังจัดเตรียม', color: '#f59e0b', icon: 'cube' },
        { key: 'ready_to_ship', label: 'รอจัดส่ง', color: '#6366f1', icon: 'cube' },
        { key: 'shipping', label: 'กำลังจัดส่ง', color: '#3b82f6', icon: 'truck' },
        { key: 'delivered', label: 'จัดส่งสำเร็จ', color: '#10b981', icon: 'checkmark-done' },
    ];

    const currentIdx = stages.findIndex(s => s.key === currentOrder.status);

    return (
        <View style={styles.container}>
            {/* White Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtnHeader} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>รายละเอียดคำสั่งซื้อ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Order Summary Block */}
                <View style={styles.orderMeta}>
                    <View>
                        <Text style={styles.metaLabel}>เลขที่ใบสั่งซื้อ</Text>
                        <Text style={styles.orderId}>{currentOrder.id}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.metaLabel}>วันที่สั่งซื้อ</Text>
                        <Text style={styles.orderDate}>{currentOrder.date}</Text>
                    </View>
                </View>

                {/* Status Tracker */}
                <View style={styles.trackerCard}>
                    <Text style={styles.trackerTitle}>ติดตามสถานะพัสดุ</Text>
                    <View style={styles.trackerRow}>
                        {stages.map((stage, index) => {
                            const isPast = index < currentIdx;
                            const isCurrent = index === currentIdx;
                            const isActive = isPast || isCurrent;
                            const stepColor = isActive ? stage.color : '#cbd5e1';

                            return (
                                <View key={stage.key} style={styles.stepContainer}>
                                    <View style={[
                                        styles.stepCircle,
                                        { backgroundColor: isActive ? stepColor : '#fff' },
                                        !isActive && { borderWidth: 1, borderColor: '#e2e8f0' }
                                    ]}>
                                        <Ionicons
                                            name={stage.icon as any}
                                            size={16}
                                            color={isActive ? "#fff" : "#cbd5e1"}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.stepLabel,
                                        isActive && { color: stepColor, fontWeight: '900' }
                                    ]}>
                                        {stage.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Admin Status Management */}
                {user?.isAdmin && (
                    <TouchableOpacity
                        style={styles.adminStatusBtn}
                        onPress={() => setIsStatusModalVisible(true)}
                    >
                        <Ionicons name="create-outline" size={20} color="#fff" />
                        <Text style={styles.adminStatusBtnText}>จัดการสถานะ (สำหรับ Admin)</Text>
                    </TouchableOpacity>
                )}

                {/* Items List */}
                <View style={styles.itemsBlock}>
                    <Text style={styles.sectionTitle}>รายการสินค้า</Text>
                    {currentOrder.items.map((item, index) => (
                        <View key={index} style={styles.productRow}>
                            <Image source={{ uri: item.image }} style={styles.productImage} />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productQty}>จำนวน: {item.quantity}</Text>
                            </View>
                            <Text style={styles.productPrice}>฿{item.price.toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                {/* Final Total */}
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>ราคาสุทธิ</Text>
                    <Text style={styles.grandTotal}>฿{currentOrder.total.toLocaleString()}</Text>
                </View>

                {/* Footer Action */}
                <TouchableOpacity style={styles.mainAction} onPress={() => router.back()}>
                    <Text style={styles.mainActionText}>ปิดหน้าต่าง</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Admin Status Modal */}
            <Modal visible={isStatusModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>อัปเดตสถานะคำสั่งซื้อ</Text>
                        <Text style={styles.modalSubtitle}>ID: {currentOrder.id}</Text>

                        {Object.entries(STATUS_MAP).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.statusOption,
                                    tempStatus === key && styles.statusOptionSelected
                                ]}
                                onPress={() => setTempStatus(key as any)}
                            >
                                <Ionicons name={value.icon as any} size={20} color={tempStatus === key ? '#fff' : value.color} />
                                <Text style={[
                                    styles.statusOptionText,
                                    tempStatus === key && styles.statusOptionTextSelected
                                ]}>
                                    {value.label}
                                </Text>
                                {tempStatus === key && (
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.saveStatusBtn}
                            onPress={handleSaveStatus}
                        >
                            <Text style={styles.saveStatusBtnText}>บันทึกสถานะ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsStatusModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>ยกเลิก</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        paddingBottom: 25,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtnHeader: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', fontStyle: 'italic' },
    closeBtn: {
        backgroundColor: '#f1f5f9',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },

    scrollContent: { padding: 25 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    orderMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    metaLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },
    orderId: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    orderDate: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

    trackerCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 30,
        padding: 25,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    trackerTitle: { textAlign: 'center', fontSize: 12, fontWeight: '900', color: '#94a3b8', marginBottom: 20, letterSpacing: 1 },
    trackerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stepContainer: { alignItems: 'center', flex: 1 },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    stepLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textAlign: 'center' },

    adminStatusBtn: {
        backgroundColor: '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 20,
        marginBottom: 30,
        gap: 10,
    },
    adminStatusBtnText: { color: '#fff', fontWeight: 'bold' },

    itemsBlock: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', marginBottom: 20 },
    productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#fff', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: '#f1f5f9' },
    productImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f0f0f0', marginRight: 12 },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
    productQty: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
    productPrice: { fontSize: 15, fontWeight: '900', color: '#1e293b' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 40 },
    totalLabel: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    grandTotal: { fontSize: 24, fontWeight: '900', color: '#e63946', fontStyle: 'italic' },

    mainAction: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 20, alignItems: 'center' },
    mainActionText: { color: '#64748b', fontSize: 16, fontWeight: '900' },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    linkText: { color: '#1e293b', fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 10 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 30, padding: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
    modalSubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20, marginTop: 5 },
    statusOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, backgroundColor: '#f8fafc' },
    statusOptionSelected: { backgroundColor: '#1e293b' },
    statusOptionText: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#334155', marginLeft: 15 },
    statusOptionTextSelected: { color: '#fff' },
    saveStatusBtn: {
        backgroundColor: '#10b981',
        padding: 18,
        borderRadius: 20,
        marginTop: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#10b981',
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    saveStatusBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    cancelBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
    cancelBtnText: { color: '#64748b', fontWeight: 'bold' }
});
