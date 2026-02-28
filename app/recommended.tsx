import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';

export default function RecommendedScreen() {
    const router = useRouter();
    const { addToCart } = useCart();
    const [recommended, setRecommended] = useState<any[]>([]);

    useEffect(() => {
        loadRecommended();
    }, []);

    const loadRecommended = async () => {
        try {
            const storageConfig = [
                { key: 'shopdog_dogs', type: 'PET' },
                { key: 'shopdog_foods', type: 'FOOD' },
                { key: 'shopdog_toys', type: 'TOY' }
            ];
            let allItems: any[] = [];

            for (const config of storageConfig) {
                const stored = await AsyncStorage.getItem(config.key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const itemsWithType = parsed.map((item: any) => ({
                        ...item,
                        type: config.type
                    }));
                    allItems = [...allItems, ...itemsWithType];
                }
            }

            const recommendedItems = allItems.filter(item => item.isRecommended);
            setRecommended(recommendedItems);
        } catch (e) {
            console.error("Error loading recommended items", e);
        }
    };

    const handleProductPress = (item: any) => {
        if (item.type === 'PET') {
            router.push(`/details/dog/${item.id}` as any);
        } else {
            router.push(`/details/product/${item.id}` as any);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>สินค้าแนะนำทั้งหมด</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={recommended}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.premiumCard}>
                        <TouchableOpacity
                            style={styles.cardTouch}
                            activeOpacity={0.9}
                            onPress={() => handleProductPress(item)}
                        >
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item.image }} style={styles.premiumImage} />
                                <View style={styles.badgeContainer}>
                                    <View style={[styles.typeBadgeChip, {
                                        backgroundColor: item.type === 'PET' ? '#6366f1' : item.type === 'FOOD' ? '#FF8C00' : '#DA70D6'
                                    }]}>
                                        <Text style={styles.typeBadgeText}>{item.type}</Text>
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
                                <Text style={styles.premiumSub} numberOfLines={1}>
                                    {item.type === 'PET' ? `${item.age} • ${item.gender === 'M' ? 'ผู้' : 'เมีย'}` : item.brand}
                                </Text>

                                <View style={styles.premiumFooter}>
                                    <View>
                                        <Text style={styles.premiumPrice}>฿{item.price.toLocaleString()}</Text>
                                        <Text style={styles.premiumStock}>คงเหลือ: {item.stock || 0}</Text>
                                    </View>
                                    {!item.isOut && (
                                        <TouchableOpacity
                                            style={[styles.premiumActionBtn, {
                                                backgroundColor: item.type === 'PET' ? '#1e293b' : item.type === 'FOOD' ? '#FF8C00' : '#DA70D6'
                                            }]}
                                            onPress={() => addToCart({ ...item, type: item.type })}
                                        >
                                            <Ionicons name={item.type === 'PET' ? "add" : "cart"} size={item.type === 'PET' ? 20 : 18} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    listContent: { padding: 10 },
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
        height: 140,
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
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    premiumSub: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 8,
    },
    premiumFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    premiumPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    premiumStock: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    premiumActionBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
