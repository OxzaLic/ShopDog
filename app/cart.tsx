import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { CartItem, useCart } from '../context/CartContext';

export default function CartScreen() {
    const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user, addOrder } = useAuth();
    const { showAlert } = useAlert();
    const router = useRouter();

    const handleCheckout = () => {
        if (cartItems.length === 0) return;

        if (!user) {
            showAlert(
                'กรุณาเข้าสู่ระบบ',
                'คุณต้องเข้าสู่ระบบก่อนดำเนินการชำระเงิน',
                'confirm',
                {
                    confirmText: 'เข้าสู่ระบบ',
                    onConfirm: () => router.push('/modal')
                }
            );
            return;
        }

        showAlert(
            'ยืนยันการสั่งซื้อ',
            `ราคารวมทั้งหมด ฿${totalPrice.toLocaleString()}\nยืนยันการสั่งซื้อและชำระเงิน?`,
            'confirm',
            {
                onConfirm: async () => {
                    const orderId = await addOrder(cartItems, totalPrice);
                    if (orderId) {
                        clearCart();
                        showAlert('สำเร็จ', 'ขอบคุณที่ใช้บริการ! สินค้าจะถูกจัดส่งเร็วๆนี้', 'success');
                        router.replace(`/orders/${orderId}` as any);
                    } else {
                        showAlert('ผิดพลาด', 'ไม่สามารถบันทึกรายการสั่งซื้อได้', 'error');
                    }
                }
            }
        );
    };

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            {/* Product Image */}
            <Image source={{ uri: item.image }} style={styles.productImage} />

            <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>฿{item.price.toLocaleString()}</Text>
                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        <Ionicons name="remove" size={16} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Ionicons name="add" size={16} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFromCart(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ตะกร้าสินค้า</Text>
                <View style={{ width: 40 }} />
            </View>

            {cartItems.length > 0 ? (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>รวมทั้งหมด:</Text>
                            <Text style={styles.totalPrice}>฿{totalPrice.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                            <Text style={styles.checkoutText}>ชำระเงิน</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color="#ddd" />
                    <Text style={styles.emptyText}>ตะกร้าว่างเปล่า</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()}>
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
    listContent: { padding: 15, paddingBottom: 100 },
    cartItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 10, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    productImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f0f0f0' },
    itemDetails: { flex: 1, marginLeft: 15 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    itemPrice: { fontSize: 14, color: '#6A5ACD', fontWeight: 'bold', marginTop: 2 },
    quantityControls: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: 'bold' },
    removeBtn: { padding: 10 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalRow: { justifyContent: 'center' },
    totalLabel: { fontSize: 12, color: '#666' },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#D00' },
    checkoutBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    checkoutText: { color: '#fff', fontWeight: 'bold', marginRight: 8, fontSize: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: '#999', marginTop: 20, marginBottom: 30 },
    shopBtn: { paddingHorizontal: 30, paddingVertical: 12, backgroundColor: '#FFD700', borderRadius: 25 },
    shopBtnText: { color: '#333', fontWeight: 'bold' }
});
