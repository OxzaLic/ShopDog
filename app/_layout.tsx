import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { CustomAlert } from '../components/CustomAlert';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // จำลองการโหลด 2 วินาที เพื่อแสดงหน้า Splash Screen
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer); // Cleanup timer เมื่อ component unmount
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* ส่วนแสดง Logo วงกลม */}
        <View style={styles.logoCircle}>
          <Image
            // ตรวจสอบว่ามีไฟล์รูปภาพที่ assets/images/logo.png หรือปรับ path ตามจริง
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
          />
        </View>

        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.brandText}>Greyhound's Farm</Text>

        {/* ตัวหมุน Loading */}
        <ActivityIndicator size="small" color="#ff4444" style={{ marginTop: 10 }} />

        <Text style={styles.footerText}>EXCELLENCE IN CANINE BREEDING SINCE 2012</Text>
      </View>
    );
  }

  return (
    <AlertProvider>
      <AuthProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="details/product/[id]"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="details/dog/[id]"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="details/[id]"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="news/[id]"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="orders/index"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="orders/[id]"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="cart"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }}
            />
          </Stack>
          <CustomAlert />
        </CartProvider>
      </AuthProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  logoCircle: {
    width: 150,           // ปรับขนาดวงกลม (กว้าง)
    height: 150,          // ปรับขนาดวงกลม (สูง)
    borderRadius: 75,     // ค่านี้ต้องเป็นครึ่งหนึ่งของ width/height เสมอเพื่อให้เป็นวงกลม
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    // เพิ่มเงา (Shadow) ให้ดูทันสมัยขึ้น
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,         // สำหรับ Android
  },
  logoImage: {
    width: '75%',         // ปรับขนาดรูปภาพภายในวงกลม (75% ของวงกลม)
    height: '75%',
    resizeMode: 'contain', // ปรับให้รูปคงสัดส่วนเดิม ไม่บิดเบี้ยว
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
    letterSpacing: 1
  },
  brandText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a2a3a',
    marginBottom: 20,
    textAlign: 'center'
  },
  footerText: {
    position: 'absolute',
    bottom: 50,
    fontSize: 10,
    color: '#bbb',
    letterSpacing: 1.5,
    fontWeight: '600'
  }
});