import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProductDetails() {
    const item = useLocalSearchParams();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1e293b" />
                </TouchableOpacity>

                <Image source={{ uri: item.image as string }} style={styles.mainImg} />

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.priceText}>฿{Number(item.price).toLocaleString()}</Text>
                            <Text style={styles.stockText}>คงเหลือ: {item.stock} ชิ้น</Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.brandBadge}><Text style={styles.brandText}>{item.brand}</Text></View>
                        <Text style={styles.ratingText}>⭐ (4.9/5.0)</Text>
                    </View>

                    <Text style={styles.sectionTitle}>ℹ️ รายละเอียดเพิ่มเติม</Text>
                    <View style={styles.descBox}>
                        <Text style={styles.descText}>{item.description || "สินค้าพรีเมียมคัดสรรเพื่อสัตว์เลี้ยงของคุณ"}</Text>
                    </View>

                    <Text style={styles.qtyTitle}>ระบุจำนวนที่ต้องการซื้อ</Text>
                    <View style={styles.stepper}>
                        <TouchableOpacity onPress={() => quantity > 1 && setQuantity(quantity - 1)} style={styles.stepBtn}>
                            <Ionicons name="remove" size={24} color="#64748b" />
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{quantity}</Text>
                        <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.stepBtn}>
                            <Ionicons name="add" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.cartBtn}>
                    <Ionicons name="cart-outline" size={22} color="#fff" />
                    <Text style={styles.cartBtnText}> ใส่ตะกร้าสินค้า</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 15 },
    mainImg: { width: '100%', height: 400 },
    content: { padding: 25, marginTop: -30, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, minHeight: 450 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 26, fontWeight: '900', color: '#1e293b', flex: 1, marginRight: 10 },
    priceText: { fontSize: 24, fontWeight: 'bold', color: '#e63946' },
    stockText: { fontSize: 12, color: '#94a3b8' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 15 },
    brandBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    brandText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
    ratingText: { fontSize: 14, color: '#64748b' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#64748b', marginTop: 20, marginBottom: 10 },
    descBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20 },
    descText: { fontSize: 15, color: '#334155', lineHeight: 24 },
    qtyTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 30, textAlign: 'center' },
    stepper: { flexDirection: 'row', backgroundColor: '#f8fafc', marginHorizontal: 40, marginTop: 15, padding: 10, borderRadius: 30, justifyContent: 'space-between', alignItems: 'center' },
    stepBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 20, elevation: 2 },
    qtyNum: { fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
    footer: { padding: 20, backgroundColor: '#fff', alignItems: 'center' },
    cartBtn: { backgroundColor: '#1e293b', flexDirection: 'row', width: '100%', padding: 20, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    cartBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backHint: { fontSize: 12, color: '#cbd5e1', marginTop: 15 }
});