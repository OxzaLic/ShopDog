import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../../context/CartContext';

const { width } = Dimensions.get('window');

export default function DogDetails() {
    const { id } = useLocalSearchParams(); // รับค่า id (เช่น d1, d2)
    const router = useRouter();
    const { addToCart } = useCart();

    const [dog, setDog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDog();
    }, [id]);

    const loadDog = async () => {
        try {
            const stored = await AsyncStorage.getItem('shopdog_dogs');
            if (stored) {
                const dogs = JSON.parse(stored);
                const foundDog = dogs.find((item: any) => item.id === id);
                if (foundDog) {
                    setDog(foundDog);
                }
            }
        } catch (error) {
            console.error("Error loading dog details", error);
        }
        setLoading(false);
    };

    const handleAddToCart = () => {
        if (dog && !dog.isOut) {
            addToCart({
                id: dog.id,
                name: dog.name,
                price: dog.price,
                image: dog.image,
                type: 'PET',
            }, 1);
            router.push('/cart');
        }
    };

    // 3. ป้องกัน Error "Cannot read property of null"
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#e63946" />
            </View>
        );
    }

    if (!dog) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>ไม่พบข้อมูลสุนัขรหัส: {id}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnError}>
                    <Text style={{ color: '#fff' }}>กลับหน้าหลัก</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 1. รูปภาพหลัก (Fixed Background) */}
            <Image source={{ uri: dog.image }} style={styles.mainImg} />

            {/* 2. ปุ่มย้อนกลับแบบลอยตัว */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#1e293b" />
            </TouchableOpacity>

            {/* ป้าย NEW */}
            {dog.isNew && (
                <View style={styles.newBadge}>
                    <Text style={styles.newText}>NEW</Text>
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* 3. Spacer เพื่อดันเนื้อหาลงมาให้เห็นรูปภาพ */}
                <View style={{ height: 350 }} />

                <View style={styles.contentCard}>
                    {/* 3.1 ขีดจับด้านบน (Handle Bar) */}
                    <View style={styles.handleBar} />

                    <View style={styles.headerRow}>
                        <Text style={styles.itemName}>{dog.name}</Text>
                        <Text style={styles.priceText}>฿{dog.price.toLocaleString()}</Text>
                    </View>

                    {/* ข้อมูลเพศและอายุ */}
                    <View style={styles.tagRow}>
                        <View style={[styles.tag, { backgroundColor: '#eef2ff' }]}>
                            <Text style={{ color: '#6366f1', fontWeight: 'bold' }}>
                                {dog.gender === 'M' ? '♂ ตัวผู้' : '♀ ตัวเมีย'}
                            </Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: '#f1f5f9' }]}>
                            <Ionicons name="calendar-outline" size={14} />
                            <Text> {dog.age}</Text>
                        </View>
                    </View>

                    {/* Grid ข้อมูลคุณลักษณะ */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Ionicons name="color-palette-outline" size={20} color="#94a3b8" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>สีสุนัข</Text>
                                <Text style={styles.infoVal} numberOfLines={1}>{dog.color}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="paw-outline" size={20} color="#94a3b8" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>ลักษณะนิสัย</Text>
                                <Text style={styles.infoVal} numberOfLines={1}>{dog.character}</Text>
                            </View>
                        </View>
                    </View>


                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#cbd5e1" />
                        <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
                    </View>
                    <View style={styles.descBox}>
                        <Text style={styles.descText}>
                            น้อง {dog.name} เป็นสุนัขที่ {dog.character} สุขภาพแข็งแรงสมบูรณ์
                            ได้รับการตรวจเช็คจากสัตวแพทย์เบื้องต้นแล้ว พร้อมย้ายบ้านครับ
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* ปุ่มติดต่อ/สถานะ (Fixed Bottom) */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.mainBtn, dog.isOut && styles.disabledBtn]}
                    disabled={dog.isOut}
                    onPress={handleAddToCart}
                >
                    <Ionicons name={dog.isOut ? "ban" : "calendar-outline"} size={22} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.mainBtnText}>
                        {dog.isOut ? 'ขายแล้ว' : 'จอง'}
                    </Text>
                </TouchableOpacity>
                
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: 10, borderRadius: 15 },
    mainImg: { width: '100%', height: 450, position: 'absolute', top: 0, left: 0 },
    newBadge: { position: 'absolute', top: 60, right: 20, zIndex: 10, backgroundColor: '#FFD700', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
    newText: { fontWeight: '900', fontSize: 12, color: '#000', letterSpacing: 1 },

    contentCard: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, minHeight: 600, paddingBottom: 100 },
    handleBar: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 25 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    itemName: { fontSize: 28, fontWeight: '900', color: '#0f172a', fontStyle: 'italic', flex: 1 },
    priceText: { fontSize: 26, fontWeight: '900', color: '#ef4444' },

    tagRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },

    infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
    infoItem: { flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
    infoVal: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },

    descBox: { backgroundColor: '#f8fafc', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
    descText: { fontSize: 15, color: '#334155', lineHeight: 26 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 35, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f8fafc' },
    mainBtn: { backgroundColor: '#1e293b', flexDirection: 'row', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    disabledBtn: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
    mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    errorText: { fontSize: 16, color: '#94a3b8', marginBottom: 20 },
    backBtnError: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    backHintContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 5 },
    backHint: { fontSize: 12, color: '#cbd5e1', fontWeight: 'bold', letterSpacing: 1 }
});