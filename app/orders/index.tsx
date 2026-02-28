import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../context/AlertContext';
import { Order, useAuth } from '../../context/AuthContext';

const STATUS_MAP = {
    preparing: { label: 'รอจัดเตรียมสินค้า', color: '#f59e0b', icon: 'time' },
    ready_to_ship: { label: 'รอจัดส่ง', color: '#6366f1', icon: 'cube' },
    shipping: { label: 'อยู่ระหว่างจัดส่ง', color: '#3b82f6', icon: 'airplane' },
    delivered: { label: 'จัดส่งสำเร็จ', color: '#10b981', icon: 'checkmark-circle' },
};

export default function OrderHistoryScreen() {
    const { user, refreshProfile, deleteOrder } = useAuth();
    const { showAlert } = useAlert();
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshProfile();
        setRefreshing(false);
    };

    const handleDeleteOrder = (orderId: string) => {
        showAlert(
            'ยืนยันการลบ',
            'คุณต้องการลบประวัติคำสั่งซื้อนี้ใช่หรือไม่?',
            'confirm',
            {
                confirmText: 'ลบข้อมูล',
                onConfirm: async () => {
                    const success = await deleteOrder(orderId);
                    if (!success) {
                        showAlert('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้ในขณะนี้', 'error');
                    }
                }
            }
        );
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
        const status = STATUS_MAP[item.status];

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${item.id}` as any)}
            >
                <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <View style={styles.headerRight}>
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                            <Ionicons name={status.icon as any} size={14} color={status.color} />
                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteOrder(item.id)}
                        >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.orderBody}>
                    <View style={styles.itemsSummary}>
                        <Text style={styles.itemsText}>รายการสินค้า: {item.items.length} รายการ</Text>
                        <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.totalLabel}>ยอดรวม</Text>
                        <Text style={styles.totalPrice}>฿{item.total.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.detailsLink}>ดูรายละเอียด</Text>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ประวัติการสั่งซื้อ</Text>
                <View style={{ width: 40 }} />
            </View>

            {user?.orders && user.orders.length > 0 ? (
                <FlatList
                    data={user.orders}
                    keyExtractor={item => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyCircle}>
                        <Ionicons name="receipt-outline" size={80} color="#cbd5e1" />
                    </View>
                    <Text style={styles.emptyText}>ยังไม่มีประวัติการสั่งซื้อ</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/')}>
                        <Text style={styles.shopBtnText}>ไปช้อปเลย</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    listContent: { padding: 15 },
    orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    orderId: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    deleteBtn: { marginLeft: 15, padding: 5 },
    orderBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15, marginBottom: 10 },
    itemsSummary: { flex: 1 },
    itemsText: { fontSize: 14, color: '#334155', fontWeight: 'bold' },
    dateText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    priceContainer: { alignItems: 'flex-end' },
    totalLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginBottom: 2 },
    totalPrice: { fontSize: 18, fontWeight: '900', color: '#e63946' },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    detailsLink: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginRight: 5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyCircle: { width: 160, height: 160, backgroundColor: '#fff', borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2 },
    emptyText: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold', marginBottom: 30 },
    shopBtn: { backgroundColor: '#1e293b', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 20 },
    shopBtnText: { color: '#fff', fontWeight: 'bold' }
});
