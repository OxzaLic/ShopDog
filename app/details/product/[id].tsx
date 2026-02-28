import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../../context/CartContext';

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            // Try finding in foods first
            const foodsStored = await AsyncStorage.getItem('shopdog_foods');
            if (foodsStored) {
                const foods = JSON.parse(foodsStored);
                const found = foods.find((p: any) => p.id === id);
                if (found) {
                    setItem({ ...found, type: 'FOOD' });
                    setLoading(false);
                    return;
                }
            }

            // Try toys if not found in foods
            const toysStored = await AsyncStorage.getItem('shopdog_toys');
            if (toysStored) {
                const toys = JSON.parse(toysStored);
                const found = toys.find((p: any) => p.id === id);
                if (found) {
                    setItem({ ...found, type: 'TOY' });
                    setLoading(false);
                    return;
                }
            }
        } catch (error) {
            console.error("Error loading product details", error);
        }
        setLoading(false);
    };

    const handleAddToCart = () => {
        if (item && !item.isOut) {
            addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                type: item.type as any
            }, quantity);
            router.push('/cart');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#e63946" />
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>ไม่พบสินค้าที่คุณต้องการ</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnError}>
                    <Text style={{ color: '#fff' }}>กลับสู่แอป</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 1. รูปภาพสินค้า (Fixed Background) */}
            <Image source={{ uri: item.image as string }} style={styles.mainImg} />

            {/* 2. ปุ่มย้อนกลับแบบลอยตัว */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#64748b" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* 3. Spacer เพื่อดันเนื้อหาลงมาให้เห็นรูปภาพ */}
                <View style={{ height: 350 }} />

                <View style={styles.content}>
                    {/* 3.1 ขีดจับด้านบน (Handle Bar) */}
                    <View style={styles.handleBar} />

                    {/* 4. ชื่อและราคา */}
                    <View style={styles.headerRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.priceText}>฿{Number(item.price).toLocaleString()}</Text>
                            <Text style={styles.stockText}>คงเหลือ: {item.stock} ชิ้น</Text>
                        </View>
                    </View>

                    {/* 5. แบรนด์และคะแนน */}
                    <View style={styles.metaRow}>
                        <View style={styles.brandBadge}><Text style={styles.brandText}>{item.brand}</Text></View>
                        {item.isNew === "true" && <View style={[styles.badge, styles.newBadge]}><Text style={styles.badgeText}>NEW</Text></View>}
                        {item.isRecommended === "true" && <View style={[styles.badge, styles.recBadge]}><Text style={styles.badgeText}>แนะนำ</Text></View>}
                        {item.isOut === "true" && <View style={[styles.badge, styles.outBadge]}><Text style={styles.badgeText}>สินค้าหมด</Text></View>}
                        <Text style={styles.ratingText}>⭐ (4.9/5.0)</Text>
                    </View>

                    <Text style={styles.sectionTitle}>ℹ️ รายละเอียดเพิ่มเติม</Text>
                    <View style={styles.descBox}>
                        <Text style={styles.descText}>{item.description || "สินค้าคุณภาพพรีเมียมสำหรับสัตว์เลี้ยงที่คุณรัก"}</Text>
                    </View>

                    {/* 6. ส่วนเลือกจำนวนสินค้า (Stepper) */}
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

            {/* 7. ปุ่มใส่ตะกร้าสินค้า (Fixed Bottom) */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.cartBtn, item.isOut && styles.disabledBtn]}
                    disabled={item.isOut}
                    onPress={handleAddToCart}
                >
                    <Ionicons name={item.isOut ? "ban" : "cart-outline"} size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.cartBtnText}>{item.isOut ? 'สินค้าหมด' : 'ใส่ตะกร้าสินค้า'}</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 15 },
    mainImg: { width: '100%', height: 450, position: 'absolute', top: 0, left: 0 },
    content: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, minHeight: 600, paddingBottom: 100 },
    handleBar: { width: 50, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 28, fontWeight: '900', color: '#1e293b', flex: 1, marginRight: 10, fontStyle: 'italic' },
    priceText: { fontSize: 26, fontWeight: 'bold', color: '#e63946' },
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
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    cartBtn: { backgroundColor: '#1e293b', flexDirection: 'row', width: '100%', padding: 20, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    cartBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backBtnText: { color: '#1e293b', fontWeight: 'bold' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    newBadge: { backgroundColor: '#FFD700' },
    recBadge: { backgroundColor: '#4ade80' },
    outBadge: { backgroundColor: '#e63946' },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
    backHint: { fontSize: 12, color: '#cbd5e1', marginTop: 15 },
    disabledBtn: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#94a3b8', marginBottom: 20 },
    backBtnError: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});