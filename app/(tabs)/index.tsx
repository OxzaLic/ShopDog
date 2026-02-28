import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MainHeader } from '../../components/MainHeader';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';


export default function HomeScreen() {
  const { addToCart } = useCart();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [recommended, setRecommended] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [isNewsModalVisible, setIsNewsModalVisible] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadRecommended();
      loadNews();
    }, [])
  );

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
          // Add type field to each item
          const itemsWithType = parsed.map((item: any) => ({
            ...item,
            type: config.type
          }));
          allItems = [...allItems, ...itemsWithType];
        }
      }

      // Filter for items tagged as Recommended
      const recommendedItems = allItems
        .filter(item => item.isRecommended)
        .sort((a, b) => (b.id > a.id ? 1 : -1));

      // Separate for Home View (Limit 4) vs Full List
      setRecommended(recommendedItems);
    } catch (e) {
      console.error("Error loading recommended items", e);
    }
  };

  const loadNews = async () => {
    try {
      const stored = await AsyncStorage.getItem('shopdog_news');
      const jsonData = require('../../assets/data/news.json');

      if (stored) {
        const storedNews: any[] = JSON.parse(stored);
        const mergedNews = [...storedNews];

        jsonData.forEach((jItem: any) => {
          const index = mergedNews.findIndex(n => n.id === jItem.id);
          if (index !== -1) {
            // Update existing news with JSON data
            mergedNews[index] = { ...mergedNews[index], ...jItem };
          } else {
            // Add new news from JSON
            mergedNews.push(jItem);
          }
        });

        // Optional: Sort by ID or time if needed, for now just set
        setNews(mergedNews);
        await AsyncStorage.setItem('shopdog_news', JSON.stringify(mergedNews));
      } else {
        setNews(jsonData);
        await AsyncStorage.setItem('shopdog_news', JSON.stringify(jsonData));
      }
    } catch (e) {
      console.error("Error loading news", e);
    }
  };

  const saveNews = async (newNews: any[]) => {
    setNews(newNews);
    await AsyncStorage.setItem('shopdog_news', JSON.stringify(newNews));
  };

  const handleAddNews = () => {
    setEditingNews({
      id: 'n' + Date.now(),
      title: '',
      detail: '',
      time: 'เมื่อสักครู่',
      tag: 'NEW ARRIVAL',
      image: ''
    });
    setIsNewsModalVisible(true);
  };

  const handleEditNews = (newsItem: any) => {
    setEditingNews({ ...newsItem });
    setIsNewsModalVisible(true);
  };

  const handleDeleteNews = (id: string) => {
    showAlert(
      'ยืนยันการลบ',
      'คุณต้องการลบข่าวนี้ใช่หรือไม่?',
      'confirm',
      {
        onConfirm: () => {
          const filtered = news.filter(n => n.id !== id);
          saveNews(filtered);
        }
      }
    );
  };

  const handleSaveNews = () => {
    if (!editingNews?.title || !editingNews?.detail) {
      return;
    }

    let newNews;
    const exists = news.find(n => n.id === editingNews.id);
    if (exists) {
      newNews = news.map(n => n.id === editingNews.id ? editingNews : n);
    } else {
      newNews = [...news, editingNews];
    }

    saveNews(newNews);
    setIsNewsModalVisible(false);
    setEditingNews(null);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showAlert("ต้องการสิทธิ์", "กรุณาอนุญาตการเข้าถึงคลังรูปภาพ", "warning");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditingNews({ ...editingNews, image: result.assets[0].uri });
    }
  };

  const handleProfilePress = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/modal');
    }
  };

  const handleNewsPress = (newsId: string) => {
    router.push(`/news/${newsId}` as any);
  };

  const handleProductPress = (item: any) => {
    if (item.type === 'PET') {
      router.push(`/details/dog/${item.id}` as any);
    } else {
      router.push(`/details/product/${item.id}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <MainHeader backgroundImage={require('../../assets/images/home_banner.png')} />

        {user?.isAdmin && (
          <TouchableOpacity
            style={styles.adminShortcut}
            onPress={() => router.push('/admin/products' as any)}
          >
            <View style={styles.adminShortcutContent}>
              <Ionicons name="list-circle" size={24} color="#fff" />
              <Text style={styles.adminShortcutText}>จัดการสินค้า (Product List)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Latest News Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleIndicator} />
          <Text style={styles.sectionTitle}>อัปเดตจากฟาร์ม</Text>
          {user?.isAdmin && (
            <TouchableOpacity style={styles.adminAddBtn} onPress={handleAddNews}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.adminAddBtnText}>เพิ่มข่าว</Text>
            </TouchableOpacity>
          )}
          {!user?.isAdmin && (
            <View style={styles.latestNewsTag}>
              <Ionicons name="flash" size={14} color="#FFD700" />
              <Text style={styles.latestNewsText}>LATEST NEWS</Text>
            </View>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newsList}>
          {news.map((item) => (
            <TouchableOpacity key={item.id} style={styles.newsCard} onPress={() => handleNewsPress(item.id)}>
              {item.image ? (
                <ImageBackground
                  source={{ uri: item.image }}
                  style={styles.newsImagePlaceholder}
                  imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
                >
                  <View style={styles.newsImageOverlay}>
                    <View style={styles.newsTag}><Text style={styles.newsTagText}>{item.tag}</Text></View>
                    {user?.isAdmin && (
                      <View style={styles.newsAdminActions}>
                        <TouchableOpacity onPress={() => handleEditNews(item)} style={styles.newsAdminIconBtn}>
                          <Ionicons name="create-outline" size={16} color="#FFD700" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteNews(item.id)} style={styles.newsAdminIconBtn}>
                          <Ionicons name="trash-outline" size={16} color="#ff4d4d" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </ImageBackground>
              ) : (
                <View style={styles.newsImagePlaceholder}>
                  <View style={styles.newsTag}><Text style={styles.newsTagText}>{item.tag}</Text></View>
                  {user?.isAdmin && (
                    <View style={styles.newsAdminActions}>
                      <TouchableOpacity onPress={() => handleEditNews(item)} style={styles.newsAdminIconBtn}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteNews(item.id)} style={styles.newsAdminIconBtn}>
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <Text style={styles.newsDetail} numberOfLines={2}>{item.detail}</Text>
                <View style={styles.newsFooter}>
                  <Text style={styles.newsTime}>{item.time}</Text>
                  <View><Text style={styles.readMore}>อ่านต่อ <Ionicons name="arrow-forward" size={12} color="red" /></Text></View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended Items Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleIndicatorYellow} />
          <Text style={styles.sectionTitle}>สินค้าแนะนำ</Text>
          {recommended.length > 4 && (
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/recommended')}
            >
              <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
              <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gridContainer}>
          {recommended.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.premiumCard}>
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
          ))}
        </View>
      </ScrollView>

      <Modal visible={isNewsModalVisible} animationType="slide" transparent>
        <View style={styles.adminModalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{news.find(n => n.id === editingNews?.id) ? 'แก้ไขข่าว' : 'เพิ่มข่าวใหม่'}</Text>
              <TouchableOpacity onPress={() => setIsNewsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>หัวข้อข่าว</Text>
              <TextInput
                style={styles.input}
                value={editingNews?.title}
                onChangeText={(text) => setEditingNews({ ...editingNews, title: text })}
                placeholder="ระบุหัวข้อข่าว"
              />

              <Text style={styles.label}>รายละเอียด</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingNews?.detail}
                onChangeText={(text) => setEditingNews({ ...editingNews, detail: text })}
                placeholder="ระบุรายละเอียด"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>รูปภาพ</Text>
              {editingNews?.image && (
                <Image
                  source={{ uri: editingNews.image }}
                  style={styles.previewImage}
                />
              )}
              <View style={styles.imageButtonRow}>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={20} color="#fff" />
                  <Text style={styles.imagePickerBtnText}>เลือกรูปภาพ</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>หรือใส่ URL รูปภาพ</Text>
              <TextInput
                style={styles.input}
                value={editingNews?.image}
                onChangeText={(text) => setEditingNews({ ...editingNews, image: text })}
                placeholder="https://..."
              />

              <Text style={styles.label}>เวลา</Text>
              <TextInput
                style={styles.input}
                value={editingNews?.time}
                onChangeText={(text) => setEditingNews({ ...editingNews, time: text })}
                placeholder="เช่น: 2 ชม. ที่แล้ว"
              />

              <Text style={styles.label}>ประเภท</Text>
              <View style={styles.tagSelector}>
                {['NEW ARRIVAL', 'PROMOTION', 'EVENT'].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagOption, editingNews?.tag === tag && styles.tagOptionSelected]}
                    onPress={() => setEditingNews({ ...editingNews, tag })}
                  >
                    <Text style={[styles.tagOptionText, editingNews?.tag === tag && styles.tagOptionTextSelected]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsNewsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNews}>
                <Text style={styles.saveBtnText}>บันทึก</Text>
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
  adminShortcut: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#529c81',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adminShortcutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  adminShortcutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  headerGradient: { height: 200, paddingHorizontal: 20, paddingTop: 50 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  locationText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 5 },
  profileBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 12, position: 'relative' },
  onlineDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: '#4ade80', borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  welcomeText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  searchSection: { marginTop: -30, paddingHorizontal: 20 },
  searchBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 30, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  titleIndicator: { width: 4, height: 20, backgroundColor: '#D00', marginRight: 10, borderRadius: 2 },
  titleIndicatorYellow: { width: 4, height: 20, backgroundColor: '#FFD700', marginRight: 10, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  latestNewsTag: { flexDirection: 'row', alignItems: 'center' },
  latestNewsText: { fontSize: 11, fontWeight: 'bold', color: '#445', marginLeft: 4 },
  newsList: { paddingLeft: 20 },
  newsCard: { width: 280, backgroundColor: '#fff', borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  newsImagePlaceholder: { height: 140, backgroundColor: '#f5f5f5' },
  newsTag: { position: 'absolute', top: 10, left: 10, backgroundColor: '#445', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  newsTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  newsContent: { padding: 12 },
  newsTitle: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  newsDetail: { fontSize: 12, color: '#666', marginTop: 5, lineHeight: 18 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  newsTime: { fontSize: 11, color: '#999' },
  readMore: { fontSize: 12, color: '#D00', fontWeight: 'bold' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 12, color: '#999', marginRight: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },

  // Premium Card Styles
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
  },

  // Auth Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  authCard: { width: '85%', backgroundColor: '#fff', borderRadius: 35, padding: 25, alignItems: 'center', elevation: 10 },
  closeBtn: { alignSelf: 'flex-end' },
  logoCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  authSubtitle: { fontSize: 10, color: '#94a3b8', marginBottom: 25, letterSpacing: 1 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, fontSize: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  submitBtn: { backgroundColor: '#1e293b', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10, elevation: 3 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#94a3b8', fontSize: 13 },
  switchLink: { color: '#D00', fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' },

  // Admin Styles
  adminAddBtn: { backgroundColor: '#4ade80', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  adminAddBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  newsAdminActions: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 5 },
  newsAdminIconBtn: { padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8 },

  // Admin Modal Styles
  adminModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 20, maxHeight: '85%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  modalForm: { marginBottom: 10 },
  textArea: { height: 100, textAlignVertical: 'top' },
  tagSelector: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 10 },
  tagOption: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  tagOptionSelected: { backgroundColor: '#6366f1' },
  tagOptionText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  tagOptionTextSelected: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: '#1e293b', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 180, borderRadius: 15, marginBottom: 15, backgroundColor: '#f1f5f9' },
  imageButtonRow: { flexDirection: 'row', marginBottom: 15 },
  imagePickerBtn: { flex: 1, backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15, gap: 10 },
  imagePickerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // News Image Overlay
  newsImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', padding: 10 }
});