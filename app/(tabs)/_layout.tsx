import { FloatingCart } from '@/components/FloatingCart';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#e63946', // สีแดงเมื่อเลือกเมนู
                    tabBarInactiveTintColor: '#999',  // สีเทาเมื่อไม่ได้เลือก
                    tabBarStyle: {
                        backgroundColor: '#ffffff',
                        height: 70,
                        paddingBottom: 10,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        position: 'absolute',
                        borderTopWidth: 0,
                        elevation: 10, // เงาสำหรับ Android
                        shadowColor: '#000', // เงาสำหรับ iOS
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                    },
                    headerShown: false,
                }}>

                {/* 1. หน้าหลัก (Home) */}
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                        ),
                    }}
                />


                {/* 2. ขายสุนัข (Pet) */}
                <Tabs.Screen
                    name="dog"
                    options={{
                        title: 'Pet',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "paw" : "paw-outline"} size={24} color={color} />
                        ),
                    }}
                />

                {/* 3. ขายอาหาร (Food) */}
                <Tabs.Screen
                    name="food"
                    options={{
                        title: 'Food',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={24} color={color} />
                        ),
                    }}
                />

                {/* 4. ของเล่น (Toy) */}
                <Tabs.Screen
                    name="toys"
                    options={{
                        title: 'Toy',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "game-controller" : "game-controller-outline"} size={24} color={color} />
                        ),
                    }}
                />

                {/* 5. ติดต่อและแผนที่ (Contact) */}
                <Tabs.Screen
                    name="contact"
                    options={{
                        title: 'Contact',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "location" : "location-outline"} size={24} color={color} />
                        ),
                    }}
                />
            </Tabs>


            <FloatingCart />
        </>
    );
}