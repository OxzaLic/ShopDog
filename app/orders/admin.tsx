import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAlert } from '../../context/AlertContext';
import { Order, useAuth } from '../../context/AuthContext';

const STATUS_MAP = {
    preparing: { label: 'รอจัดเตรียมสินค้า', color: '#f59e0b', icon: 'time' },
    ready_to_ship: { label: 'รอจัดส่ง', color: '#6366f1', icon: 'cube' },
    shipping: { label: 'อยู่ระหว่างจัดส่ง', color: '#3b82f6', icon: 'airplane' },
    delivered: { label: 'จัดส่งสำเร็จ', color: '#10b981', icon: 'checkmark-circle' },
};

export default function AdminOrdersScreen() {
    const { fetchAllProfiles, adminUpdateOrderStatus, user } = useAuth();
    const { showAlert } = useAlert();
    const router = useRouter();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Navigation State
    const [viewMode, setViewMode] = useState<'members' | 'orders'>('members');
    const [selectedMember, setSelectedMember] = useState<any>(null);

    // Status Update Modal
    const [selectedOrder, setSelectedOrder] = useState<{ userId: string, orderId: string, status: string } | null>(null);
    const [tempStatus, setTempStatus] = useState<Order['status'] | null>(null);

    useEffect(() => {
        if (!user?.isAdmin) {
            router.replace('/');
            return;
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        const data = await fetchAllProfiles();
        setMembers(data);
        if (selectedMember) {
            const updated = data.find(m => m.id === selectedMember.id);
            if (updated) setSelectedMember(updated);
        }
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        const data = await fetchAllProfiles();
        setMembers(data);
        if (selectedMember) {
            const updated = data.find(m => m.id === selectedMember.id);
            if (updated) setSelectedMember(updated);
        }
        setRefreshing(false);
    };

    const handleSaveStatus = async () => {
        if (!selectedOrder || !tempStatus) return;

        const success = await adminUpdateOrderStatus(selectedOrder.userId, selectedOrder.orderId, tempStatus);
        if (success) {
            // Update local state
            setMembers(prevMembers => prevMembers.map(m => {
                if (m.id === selectedOrder.userId) {
                    return {
                        ...m,
                        orders: m.orders.map((o: any) =>
                            o.id === selectedOrder.orderId ? { ...o, status: tempStatus } : o
                        )
                    };
                }
                return m;
            }));

            if (selectedMember && selectedMember.id === selectedOrder.userId) {
                setSelectedMember((prev: any) => ({
                    ...prev,
                    orders: prev.orders.map((o: any) =>
                        o.id === selectedOrder.orderId ? { ...o, status: tempStatus } : o
                    )
                }));
            }

            showAlert('สำเร็จ', 'บันทึกสถานะเรียบร้อยแล้ว', 'success');
        } else {
            showAlert('ผิดพลาด', 'ไม่สามารถบันทึกสถานะได้', 'error');
        }
        setSelectedOrder(null);
        setTempStatus(null);
    };

    const renderMemberItem = ({ item }: { item: any }) => {
        const newOrdersCount = item.orders?.filter((o: any) => o.status === 'preparing').length || 0;

        return (
            <TouchableOpacity
                style={styles.memberCard}
                onPress={() => {
                    setSelectedMember(item);
                    setViewMode('orders');
                }}
            >
                <View style={styles.memberAvatar}>
                    {item.profile_image ? (
                        <Image source={{ uri: item.profile_image }} style={styles.memberImage} />
                    ) : (
                        <Ionicons name="person" size={24} color="#64748b" />
                    )}
                </View>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                    <View style={styles.memberMeta}>
                        <Text style={styles.orderCountText}>{item.orders?.length || 0} รายการสั่งซื้อ</Text>
                        {newOrdersCount > 0 && (
                            <View style={styles.miniBadge}>
                                <Text style={styles.miniBadgeText}>{newOrdersCount} ใหม่</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
        );
    };

    const renderOrderItem = ({ item }: { item: any }) => {
        const status = STATUS_MAP[item.status as keyof typeof STATUS_MAP] || STATUS_MAP.preparing;

        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderId}>ID: {item.id}</Text>
                        <Text style={styles.orderDate}>{item.date}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}
                        onPress={() => {
                            setSelectedOrder({ userId: selectedMember.id, orderId: item.id, status: item.status });
                            setTempStatus(item.status);
                        }}
                    >
                        <Ionicons name={status.icon as any} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        <Ionicons name="caret-down" size={12} color={status.color} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                <View style={styles.orderBody}>
                    <View style={styles.itemsList}>
                        {item.items.map((prod: any, idx: number) => (
                            <Text key={idx} style={styles.orderItemName}>• {prod.name} x{prod.quantity}</Text>
                        ))}
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.totalLabel}>ยอดรวม</Text>
                        <Text style={styles.totalPrice}>฿{item.total.toLocaleString()}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.cardFooter}
                    onPress={() => router.push({ pathname: `/orders/${item.id}`, params: { uid: selectedMember.id } } as any)}
                >
                    <Text style={styles.detailsLink}>ดูรายละเอียดเพิ่มเติม</Text>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => viewMode === 'orders' ? setViewMode('members') : router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>
                        {viewMode === 'members' ? 'รายชื่อสมาชิก' : `ออเดอร์ของ ${selectedMember?.name}`}
                    </Text>
                    {viewMode === 'orders' && (
                        <Text style={styles.headerSubtitle}>{selectedMember?.email}</Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={viewMode === 'members' ? members : (selectedMember?.orders || [])}
                keyExtractor={(item) => item.id}
                renderItem={viewMode === 'members' ? renderMemberItem : renderOrderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name={viewMode === 'members' ? 'people-outline' : 'receipt-outline'} size={60} color="#e2e8f0" />
                        <Text style={styles.emptyText}>ไม่พบข้อมูล{viewMode === 'members' ? 'สมาชิก' : 'รายการสั่งซื้อ'}</Text>
                    </View>
                }
            />

            {/* Status Selection Modal */}
            <Modal visible={!!selectedOrder} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>อัปเดตสถานะคำสั่งซื้อ</Text>
                        <Text style={styles.modalSubtitle}>ID: {selectedOrder?.orderId}</Text>

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

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedOrder(null)}>
                            <Text style={styles.cancelBtnText}>ยกเลิก</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { padding: 5 },
    headerTextContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    listContent: { padding: 15, paddingBottom: 50 },

    // Member Card Styles
    memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    memberAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    memberImage: { width: '100%', height: '100%' },
    memberInfo: { flex: 1, marginLeft: 15 },
    memberName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    memberEmail: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
    memberMeta: { flexDirection: 'row', alignItems: 'center' },
    orderCountText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    miniBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    miniBadgeText: { fontSize: 10, color: '#ef4444', fontWeight: 'bold' },

    // Order Card Styles
    orderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    orderId: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
    orderDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
    orderBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, marginBottom: 15 },
    itemsList: { marginBottom: 12 },
    orderItemName: { fontSize: 14, color: '#475569', marginBottom: 4 },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    totalLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },
    totalPrice: { fontSize: 18, fontWeight: '900', color: '#e63946' },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    detailsLink: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginRight: 5 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold', marginTop: 15 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 30, padding: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
    modalSubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20, marginTop: 5 },
    statusOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, backgroundColor: '#f8fafc' },
    statusOptionSelected: { backgroundColor: '#1e293b' },
    statusOptionText: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#334155', marginLeft: 15 },
    statusOptionTextSelected: { color: '#fff' },
    saveStatusBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 20, marginTop: 15, alignItems: 'center' },
    saveStatusBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    cancelBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
    cancelBtnText: { color: '#64748b', fontWeight: 'bold' }
});
