import { useCart } from '@/context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function FloatingCart() {
    const { cartCount, totalPrice } = useCart();
    const router = useRouter();

    // จะแสดงแถบสีแดงก็ต่อเมื่อมีสินค้าในตะกร้าอย่างน้อย 1 ชิ้น
    if (cartCount === 0) return null;

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.9}
            onPress={() => router.push('/cart')}
        >
            <View style={styles.leftRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
                <Ionicons name="cart" size={24} color="#fff" />
                <Text style={styles.label}>ดูรายการสั่งซื้อ</Text>
            </View>
            <Text style={styles.price}>฿{totalPrice.toLocaleString()}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute', bottom: 100, left: 15, right: 15,
        backgroundColor: '#e63946', flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderRadius: 15, elevation: 10, zIndex: 999
    },
    leftRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    badge: {
        backgroundColor: '#FFD700', width: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -10, left: -5
    },
    badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
    label: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    price: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});