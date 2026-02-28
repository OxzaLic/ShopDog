import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, ImageSourcePropType, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface MainHeaderProps {
    onProfilePress?: () => void;
    backgroundImage?: ImageSourcePropType;
}

export const MainHeader = ({ onProfilePress, backgroundImage }: MainHeaderProps) => {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Only show the overlay dog if we are NOT in a specific category (no backgroundImage)
    const showOverlayDog = !backgroundImage;

    const handleLogout = async () => {
        await logout();
        router.replace('/' as any);
    };

    const handlePress = () => {
        if (onProfilePress) {
            onProfilePress();
            return;
        }

        if (user) {
            router.push('/profile');
        } else {
            router.push('/modal');
        }
    };

    const renderBannerContent = () => (
        <>
            {/* Show dog only if default banner */}
            {showOverlayDog && (
                <Image
                    source={{ uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/58.png' }}
                    style={styles.dogImage}
                />
            )}

            <View style={styles.topRow}>
                <View style={styles.locationBadge}>
                    <Ionicons name="location" size={16} color="#333" />
                    <Text style={styles.locationText}>Pathum Thani Farm</Text>
                </View>
                <TouchableOpacity style={styles.profileBtn} onPress={handlePress}>
                    {user?.profileImage ? (
                        <Image source={{ uri: user.profileImage }} style={styles.profileAvatarSmall} />
                    ) : (
                        <Ionicons name={user ? "person" : "person-outline"} size={20} color={user ? "#333" : "#666"} />
                    )}
                    {user && <View style={styles.onlineDot} />}
                </TouchableOpacity>
            </View>

            {/* Welcome Text */}
            <Text style={styles.welcomeText}>
                {user ? `สวัสดี, ${user.name}` : 'ยินดีต้อนรับสู่ฟาร์ม'}
            </Text>
        </>
    );

    return (
        <View style={styles.container}>
            {backgroundImage ? (
                <ImageBackground
                    source={backgroundImage}
                    style={styles.banner}
                    imageStyle={styles.bannerImage}
                >
                    {renderBannerContent()}
                </ImageBackground>
            ) : (
                <View style={[styles.banner, styles.defaultBanner]}>
                    {renderBannerContent()}
                </View>
            )}

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput placeholder="ค้นหารายการ..." style={styles.searchInput} />
                    <Ionicons name="pricetag" size={20} color="#FFD700" />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 10 },
    banner: {
        height: 180,
        paddingHorizontal: 20,
        paddingTop: 50,
        position: 'relative',
        overflow: 'visible'
    },
    defaultBanner: {
        backgroundColor: '#FFD700', // Yellow fallback
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    bannerImage: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
    locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    locationText: { color: '#333', fontSize: 13, fontWeight: 'bold', marginLeft: 5 },
    profileBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 12, position: 'relative', elevation: 2, overflow: 'hidden' },
    profileAvatarSmall: { width: 20, height: 20, borderRadius: 10 },
    onlineDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: '#4ade80', borderRadius: 5, borderWidth: 2, borderColor: '#fff' },

    welcomeText: { color: '#333', fontSize: 22, fontWeight: '900', marginTop: 15, zIndex: 10, textShadowColor: 'rgba(255, 255, 255, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

    dogImage: {
        position: 'absolute',
        bottom: 0,
        right: 10,
        width: 140,
        height: 140,
        resizeMode: 'contain',
        zIndex: 1
    },

    searchSection: { marginTop: -25, paddingHorizontal: 20 },
    searchBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 30, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
});