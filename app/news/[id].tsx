import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NewsDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNews();
    }, [id]);

    const loadNews = async () => {
        try {
            const stored = await AsyncStorage.getItem('shopdog_news');
            if (stored) {
                const newsData = JSON.parse(stored);
                const foundNews = newsData.find((n: any) => n.id === id);
                setNews(foundNews);
            }
        } catch (error) {
            console.error("Error loading news", error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    if (!news) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>ไม่พบข้อมูลข่าวสาร</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnError}>
                    <Text style={styles.backTextError}>ย้อนกลับ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>อัปเดตจากฟาร์ม</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* News Image */}
                {news.image ? (
                    <ImageBackground
                        source={{ uri: news.image }}
                        style={styles.newsImage}
                        resizeMode="cover"
                    >
                        <View style={styles.imageOverlay}>
                            <View style={styles.tagContainer}>
                                <Text style={styles.tagText}>{news.tag}</Text>
                            </View>
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="newspaper-outline" size={80} color="#cbd5e1" />
                        <View style={styles.tagContainer}>
                            <Text style={styles.tagText}>{news.tag}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.contentSection}>
                    <Text style={styles.newsTitle}>{news.title}</Text>
                    <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={14} color="#94a3b8" />
                        <Text style={styles.newsTime}>{news.time}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.newsDetail}>{news.detail}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    scrollContent: { paddingBottom: 40 },
    newsImage: {
        height: 250,
        width: '100%',
    },
    imageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
        padding: 20,
    },
    imagePlaceholder: {
        height: 250,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tagContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    contentSection: { padding: 25 },
    newsTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', lineHeight: 32 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    newsTime: { fontSize: 14, color: '#94a3b8', marginLeft: 6, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },
    newsDetail: { fontSize: 16, color: '#475569', lineHeight: 28 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: '#94a3b8', fontWeight: 'bold' },
    backBtnError: { marginTop: 20, padding: 10 },
    backTextError: { color: '#1e293b', fontWeight: 'bold', textDecorationLine: 'underline' },
});
