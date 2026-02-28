import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { MainHeader } from '../../components/MainHeader';

const LOCATIONS = [
    {
        id: '1',
        name: 'Greyhound Paradise Farm (HQ)',
        type: 'HEADQUARTERS',
        address: '123 Meadow Lane, Pathum Thani, Thailand',
        latlng: { latitude: 14.1235, longitude: 100.6234 },
        icon: 'home'
    },
    {
        id: '2',
        name: 'Bangkok City Outlet',
        type: 'SHOP BRANCH',
        address: 'Sukhumvit Road Soi 24, Bangkok, Thailand',
        latlng: { latitude: 13.7299, longitude: 100.5678 },
        icon: 'storefront'
    },
    {
        id: '3',
        name: 'North Branch Service Center',
        type: 'SHOP BRANCH',
        address: '789 Northern Rd, Nonthaburi, Thailand',
        latlng: { latitude: 13.8591, longitude: 100.5414 },
        icon: 'storefront'
    },
    {
        id: '4',
        name: 'Eastern Greyhound Hub',
        type: 'SHOP BRANCH',
        address: '456 Eastern Coast Blvd, Chonburi, Thailand',
        latlng: { latitude: 13.3611, longitude: 100.9847 },
        icon: 'storefront'
    }
];

export default function ContactScreen() {
    const mapRef = useRef<MapView>(null);
    const [selectedId, setSelectedId] = useState('1');

    const handleSelectLocation = (loc: typeof LOCATIONS[0]) => {
        setSelectedId(loc.id);
        mapRef.current?.animateToRegion({
            ...loc.latlng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <MainHeader
                backgroundImage={require('../../assets/images/contact_banner.png')}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>ที่ตั้งสาขาของเรา</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>4 สาขาทั้งหมด</Text>
                    </View>
                </View>

                {/* Interactive Map */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={{
                            latitude: 14.1235,
                            longitude: 100.6234,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        {LOCATIONS.map((loc) => (
                            <Marker
                                key={loc.id}
                                coordinate={loc.latlng}
                                onPress={() => setSelectedId(loc.id)}
                            >
                                <View style={[styles.marker, selectedId === loc.id && styles.activeMarker]}>
                                    <Ionicons name={loc.icon as any} size={16} color="#fff" />
                                </View>
                                <Callout tooltip>
                                    <View style={styles.callout}>
                                        <Text style={styles.calloutTitle}>{loc.name}</Text>
                                        <Text style={styles.calloutText}>{loc.address}</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}
                    </MapView>
                </View>

                {/* Branches List */}
                <View style={styles.listSection}>
                    {LOCATIONS.map((loc) => {
                        const isActive = selectedId === loc.id;
                        return (
                            <TouchableOpacity
                                key={loc.id}
                                style={[styles.card, isActive && styles.activeCard]}
                                onPress={() => handleSelectLocation(loc)}
                            >
                                <View style={[styles.cardIconBox, isActive && styles.activeCardIconBox]}>
                                    <Ionicons name={loc.icon as any} size={24} color="#fff" />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.typeText, isActive && styles.activeTypeText]}>{loc.type}</Text>
                                    <Text style={[styles.nameText, isActive && styles.activeNameText]}>{loc.name}</Text>
                                    <Text style={[styles.addressText, isActive && styles.activeAddressText]}>{loc.address}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={isActive ? "#fff" : "#ddd"} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '900', color: '#1e293b', fontStyle: 'italic' },
    badge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

    mapContainer: {
        height: 250,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    map: { flex: 1 },
    marker: {
        backgroundColor: '#334155',
        padding: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    activeMarker: { backgroundColor: '#e63946' },
    callout: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        width: 200,
    },
    calloutTitle: { fontSize: 12, fontWeight: 'bold' },
    calloutText: { fontSize: 10, color: '#666', marginTop: 4 },

    listSection: { gap: 15 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    activeCard: {
        backgroundColor: '#c5eb93ff',
        borderColor: '#c5eb93ff',
        elevation: 8,
    },
    cardIconBox: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    activeCardIconBox: { backgroundColor: '#22c55e' },
    cardInfo: { flex: 1 },
    typeText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
    activeTypeText: { color: '#065f46' },
    nameText: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
    activeNameText: { color: '#1e293b' },
    addressText: { fontSize: 11, color: '#64748b', marginTop: 2 },
    activeAddressText: { color: '#374151' }
});
