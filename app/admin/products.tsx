import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Category = 'PET' | 'FOOD' | 'TOY';

interface ProductStats {
    id: string;
    name: string;
    brand: string;
    stock: number;
    sales: number;
    total: number;
    raw: any;
}

export default function AdminProductList() {
    const { fetchAllProfiles } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<Category>('PET');
    const [products, setProducts] = useState<ProductStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const { showAlert } = useAlert();
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, [selectedCategory]);

    const loadData = async () => {
        try {
            setLoading(true);
            const profiles = await fetchAllProfiles();

            const allOrders: any[] = [];
            profiles.forEach(p => {
                if (p.orders) allOrders.push(...p.orders);
            });

            let storageKey = '';
            let defaultData: any[] = [];

            if (selectedCategory === 'PET') {
                storageKey = 'shopdog_dogs';
                try { defaultData = require('../../assets/data/dogs.json'); } catch (e) { }
            } else if (selectedCategory === 'FOOD') {
                storageKey = 'shopdog_foods';
                try { defaultData = require('../../assets/data/foods.json'); } catch (e) { }
            } else {
                storageKey = 'shopdog_toys';
                // Fetch toys from GitHub if missing local
                try {
                    const response = await fetch('https://raw.githubusercontent.com/OxzaLic/json/main/toys.json');
                    if (response.ok) {
                        defaultData = await response.json();
                    }
                } catch (e) { }
            }

            const stored = await AsyncStorage.getItem(storageKey);
            const productList = stored ? JSON.parse(stored) : defaultData;

            const stats: ProductStats[] = productList.map((item: any) => {
                let salesCount = 0;
                let totalBaht = 0;

                allOrders.forEach(order => {
                    if (order.items) {
                        order.items.forEach((orderItem: any) => {
                            if (orderItem.id === item.id) {
                                salesCount += orderItem.quantity || 1;
                                totalBaht += (orderItem.price || 0) * (orderItem.quantity || 1);
                            }
                        });
                    }
                });

                return {
                    id: item.id,
                    name: item.name,
                    brand: item.brand || item.breed || '-',
                    stock: item.stock || 0,
                    sales: salesCount,
                    total: totalBaht,
                    raw: item
                };
            });

            setProducts(stats);
        } catch (error) {
            console.error('Error loading admin product stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        const newProduct: any = {
            id: (selectedCategory === 'PET' ? 'p' : selectedCategory === 'FOOD' ? 'f' : 't') + Date.now(),
            name: '',
            price: 0,
            stock: 0,
            image: '',
            isNew: true,
            isRecommended: false,
            isOut: false,
        };

        if (selectedCategory === 'PET') {
            newProduct.breed = '';
            newProduct.age = '';
            newProduct.gender = 'M';
            newProduct.type = 'PET';
        } else {
            newProduct.brand = '';
        }

        setEditingProduct(newProduct);
        setIsModalVisible(true);
    };

    const handleEdit = (product: ProductStats) => {
        setEditingProduct({ ...product.raw });
        setIsModalVisible(true);
    };

    const handleDelete = (id: string) => {
        showAlert(
            'ยืนยันการลบ',
            'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้าชิ้นนี้?',
            'confirm',
            {
                onConfirm: async () => {
                    await performDelete(id);
                }
            }
        );
    };

    const performDelete = async (id: string) => {
        try {
            const storageKey = selectedCategory === 'PET' ? 'shopdog_dogs' : selectedCategory === 'FOOD' ? 'shopdog_foods' : 'shopdog_toys';
            const stored = await AsyncStorage.getItem(storageKey);
            if (stored) {
                const list = JSON.parse(stored);
                const filtered = list.filter((item: any) => item.id !== id);
                await AsyncStorage.setItem(storageKey, JSON.stringify(filtered));
                loadData();
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
        }
    };

    const handleSave = async () => {
        if (!editingProduct.name || editingProduct.price <= 0) {
            showAlert('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อและราคาให้ถูกต้อง', 'warning');
            return;
        }

        try {
            const storageKey = selectedCategory === 'PET' ? 'shopdog_dogs' : selectedCategory === 'FOOD' ? 'shopdog_foods' : 'shopdog_toys';
            const stored = await AsyncStorage.getItem(storageKey);

            let list: any[] = [];
            if (stored) {
                list = JSON.parse(stored);
            } else {
                if (selectedCategory === 'PET') list = require('../../assets/data/dogs.json');
                else if (selectedCategory === 'FOOD') list = require('../../assets/data/foods.json');
                else {
                    // Fetch toys if no storage
                    const response = await fetch('https://raw.githubusercontent.com/OxzaLic/json/main/toys.json');
                    if (response.ok) list = await response.json();
                }
            }

            const existsIndex = list.findIndex(item => item.id === editingProduct.id);
            if (existsIndex > -1) {
                list[existsIndex] = editingProduct;
            } else {
                list.push(editingProduct);
            }

            await AsyncStorage.setItem(storageKey, JSON.stringify(list));
            setIsModalVisible(false);
            setEditingProduct(null);
            loadData();
            showAlert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product List</Text>
                <TouchableOpacity style={styles.addBtnHeader} onPress={handleAdd}>
                    <Ionicons name="add-circle" size={28} color="#529c81" />
                </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <View style={styles.tabContainer}>
                {(['PET', 'FOOD', 'TOY'] as Category[]).map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.tab, selectedCategory === cat && styles.activeTab]}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={[styles.tabText, selectedCategory === cat && styles.activeTabText]}>
                            {cat === 'PET' ? 'Pet' : cat === 'FOOD' ? 'Foods' : 'Toys'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#529c81" />
                    <Text style={styles.loadingText}>กำลังคำนวณข้อมูล...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.columnHeader, styles.colIndex]}>ลำดับ</Text>
                                <Text style={[styles.columnHeader, styles.colName]}>ชื่อ / แบรนด์</Text>
                                <Text style={[styles.columnHeader, styles.colStock]}>คงเหลือ</Text>
                                <Text style={[styles.columnHeader, styles.colSales]}>ยอดขาย</Text>
                                <Text style={[styles.columnHeader, styles.colTotal]}>รวม (บาท)</Text>
                                <Text style={[styles.columnHeader, styles.colActions]}>จัดการ</Text>
                            </View>

                            {/* Table Body */}
                            {products.map((item, index) => (
                                <View key={item.id} style={styles.tableRow}>
                                    <View style={styles.colIndex}><Text style={styles.cellText}>{index + 1}</Text></View>
                                    <View style={styles.colName}>
                                        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
                                    </View>
                                    <View style={styles.colStock}><Text style={styles.cellText}>{item.stock}</Text></View>
                                    <View style={styles.colSales}><Text style={styles.cellText}>{item.sales}</Text></View>
                                    <View style={styles.colTotal}>
                                        <Text style={[styles.cellText, styles.totalText]}>฿{item.total.toLocaleString()}</Text>
                                    </View>
                                    <View style={[styles.colActions, styles.actionColumn]}>
                                        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIconBtn}>
                                            <Ionicons name="create" size={18} color="#f59e0b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIconBtn}>
                                            <Ionicons name="trash" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {products.length === 0 && (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>ไม่มีข้อมูลสินค้าในหมวดนี้</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Management Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {products.find(p => p.id === editingProduct?.id) ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>ชื่อสินค้า</Text>
                            <TextInput
                                style={styles.input}
                                value={editingProduct?.name}
                                onChangeText={(text) => setEditingProduct({ ...editingProduct, name: text })}
                                placeholder="ระบุชื่อสินค้า"
                            />

                            {selectedCategory === 'PET' ? (
                                <>
                                    <Text style={styles.label}>สายพันธุ์</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProduct?.breed}
                                        onChangeText={(text) => setEditingProduct({ ...editingProduct, breed: text })}
                                        placeholder="ระบุสายพันธุ์"
                                    />
                                    <Text style={styles.label}>อายุ</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProduct?.age}
                                        onChangeText={(text) => setEditingProduct({ ...editingProduct, age: text })}
                                        placeholder="เช่น 3 เดือน"
                                    />
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>แบรนด์</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProduct?.brand}
                                        onChangeText={(text) => setEditingProduct({ ...editingProduct, brand: text })}
                                        placeholder="ระบุแบรนด์"
                                    />
                                </>
                            )}

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.label}>ราคา (บาท)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProduct?.price?.toString()}
                                        onChangeText={(text) => setEditingProduct({ ...editingProduct, price: parseInt(text) || 0 })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>คงเหลือ (ชิ้น)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingProduct?.stock?.toString()}
                                        onChangeText={(text) => setEditingProduct({ ...editingProduct, stock: parseInt(text) || 0 })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>URL รูปภาพ</Text>
                            <TextInput
                                style={styles.input}
                                value={editingProduct?.image}
                                onChangeText={(text) => setEditingProduct({ ...editingProduct, image: text })}
                                placeholder="https://..."
                            />

                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>สินค้าใหม่ (New)</Text>
                                <Switch
                                    value={editingProduct?.isNew}
                                    onValueChange={(val) => setEditingProduct({ ...editingProduct, isNew: val })}
                                    trackColor={{ false: "#e2e8f0", true: "#529c81" }}
                                />
                            </View>

                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>แนะนำ (Recommended)</Text>
                                <Switch
                                    value={editingProduct?.isRecommended}
                                    onValueChange={(val) => setEditingProduct({ ...editingProduct, isRecommended: val })}
                                    trackColor={{ false: "#e2e8f0", true: "#529c81" }}
                                />
                            </View>

                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>สินค้าหมด (Out of Stock)</Text>
                                <Switch
                                    value={editingProduct?.isOut}
                                    onValueChange={(val) => setEditingProduct({ ...editingProduct, isOut: val })}
                                    trackColor={{ false: "#e2e8f0", true: "#ef4444" }}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>บันทึกข้อมูล</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    addBtnHeader: { padding: 5 },

    tabContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#f8fafc',
        gap: 10
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    activeTab: {
        backgroundColor: '#529c81',
        borderColor: '#529c81'
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b'
    },
    activeTabText: {
        color: '#fff'
    },

    scrollContent: { paddingBottom: 40 },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        paddingVertical: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
        minWidth: SCREEN_WIDTH
    },
    columnHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase'
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        alignItems: 'center',
        minWidth: SCREEN_WIDTH
    },
    cellText: {
        fontSize: 13,
        color: '#334155'
    },

    colIndex: { width: 45, alignItems: 'center' },
    colName: { width: 150, paddingLeft: 10 },
    colStock: { width: 60, alignItems: 'center' },
    colSales: { width: 60, alignItems: 'center' },
    colTotal: { width: 100, alignItems: 'flex-end' },
    colActions: { width: 80, alignItems: 'center' },

    actionColumn: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    actionIconBtn: { padding: 5 },

    nameText: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
    brandText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    totalText: { fontWeight: 'bold', color: '#529c81' },

    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#64748b', fontSize: 14 },
    emptyBox: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        maxHeight: '90%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    modalForm: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 8,
        marginTop: 15
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1e293b'
    },
    row: {
        flexDirection: 'row'
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    toggleLabel: {
        fontSize: 15,
        color: '#475569'
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        paddingBottom: 20
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
        alignItems: 'center'
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 16
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        backgroundColor: '#529c81',
        alignItems: 'center'
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
