import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAlert } from './AlertContext';

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    type?: 'PET' | 'FOOD' | 'TOY';
}

export interface Order {
    id: string;
    date: string;
    total: number;
    items: OrderItem[];
    status: 'preparing' | 'ready_to_ship' | 'shipping' | 'delivered';
}

export interface User {
    id: string;
    name: string;
    email: string;
    address?: string;
    joinDate: string;
    orders: Order[];
    profileImage?: string;
    isAdmin?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    register: (name: string, email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (name: string, address: string, profileImage?: string) => Promise<boolean>;
    addOrder: (items: any[], total: number) => Promise<string | null>;
    fetchAllProfiles: () => Promise<any[]>;
    adminUpdateOrderStatus: (userId: string, orderId: string, newStatus: Order['status']) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
    adminFetchUserProfile: (userId: string) => Promise<User | null>;
    deleteOrder: (orderId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showAlert } = useAlert();

    useEffect(() => {
        // One-time cleanup for legacy data
        const cleanupLegacy = async () => {
            try {
                // Clear the entire legacy users database
                await AsyncStorage.removeItem('shopdog_users_db');
                await AsyncStorage.removeItem('shopdog_user');
                await AsyncStorage.removeItem('shopdog_orders'); // Any other potential local keys
                console.log('Cleared all legacy user and order data from AsyncStorage');
            } catch (e) {
                console.error('Cleanup failed', e);
            }
        };
        cleanupLegacy();

        // Init Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Real-time Orders Listener (Session aware)
    useEffect(() => {
        if (!user?.id) return;

        const ordersSubscription = supabase
            .channel(`orders-realtime-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`
                },
                (payload: any) => {
                    if (payload.eventType === 'UPDATE') {
                        setUser(prev => {
                            if (!prev) return null;
                            const updatedOrders = prev.orders.map(o =>
                                o.id === payload.new.id
                                    ? {
                                        ...o,
                                        status: payload.new.status,
                                        date: payload.new.date_string || o.date
                                    }
                                    : o
                            );
                            return { ...prev, orders: updatedOrders };
                        });
                    } else if (payload.eventType === 'INSERT') {
                        const newOrder: Order = {
                            id: payload.new.id,
                            date: payload.new.date_string || new Date(payload.new.created_at).toLocaleDateString('th-TH'),
                            total: payload.new.total,
                            items: payload.new.items,
                            status: payload.new.status
                        };
                        setUser(prev => {
                            if (!prev) return null;
                            if (prev.orders.find(o => o.id === newOrder.id)) return prev;
                            return { ...prev, orders: [newOrder, ...prev.orders] };
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setUser(prev => {
                            if (!prev) return null;
                            return { ...prev, orders: prev.orders.filter(o => o.id !== payload.old.id) };
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            ordersSubscription.unsubscribe();
        };
    }, [user?.id]);

    const fetchProfile = async (uid: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (error) {
                console.warn("Profile not found, creating default", error);
                // If profile doesn't exist, create it (e.g. after registration)
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    const newProfile = {
                        id: uid,
                        name: userData.user.user_metadata?.name || 'User',
                        email: userData.user.email || '',
                        join_date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
                        orders: [],
                        address: '',
                        is_admin: false
                    };
                    await supabase.from('profiles').insert(newProfile);
                    setUser({
                        id: uid,
                        name: newProfile.name,
                        email: newProfile.email,
                        address: '',
                        joinDate: newProfile.join_date,
                        orders: [],
                        isAdmin: false
                    });
                }
            } else {
                // Fetch orders from the new dedicated table
                const { data: dbOrders, error: ordersErr } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', uid)
                    .order('created_at', { ascending: false });

                const formattedOrders: Order[] = (dbOrders || []).map(o => ({
                    id: o.id,
                    date: o.date_string || new Date(o.created_at).toLocaleDateString('th-TH'),
                    total: o.total,
                    items: o.items,
                    status: o.status
                }));

                setUser({
                    id: uid,
                    name: data.name,
                    email: data.email || '',
                    address: data.address,
                    joinDate: data.join_date,
                    orders: formattedOrders,
                    profileImage: data.profile_image,
                    isAdmin: data.is_admin
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: pass
            });

            if (error) {
                showAlert('เข้าสู่ระบบไม่สำเร็จ', error.message, 'error');
                return false;
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, pass: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: { name, password: pass }
                }
            });

            if (error) {
                showAlert('ลงทะเบียนไม่สำเร็จ', error.message, 'error');
                return false;
            }

            showAlert('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว! คุณสามารถเข้าสู่ระบบได้ทันที', 'success');
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (newName: string, newAddress: string, newProfileImage?: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: newName,
                    address: newAddress,
                    profile_image: newProfileImage !== undefined ? newProfileImage : user.profileImage
                })
                .eq('id', user.id);

            if (error) {
                showAlert('อัปเดตล้มเหลว', error.message, 'error');
                return false;
            }

            setUser(prev => prev ? ({
                ...prev,
                name: newName,
                address: newAddress,
                profileImage: newProfileImage !== undefined ? newProfileImage : prev.profileImage
            }) : null);

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const addOrder = async (items: any[], total: number): Promise<string | null> => {
        if (!user) return null;
        try {
            const orderId = 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase();
            const dateStr = new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const newOrderObj = {
                id: orderId,
                user_id: user.id,
                items,
                total,
                status: 'preparing',
                date_string: dateStr
            };

            const { error: dbErr } = await supabase
                .from('orders')
                .insert(newOrderObj);

            if (dbErr) throw dbErr;

            const newOrder: Order = {
                id: orderId,
                date: dateStr,
                total,
                items,
                status: 'preparing'
            };

            // --- Inventory Deduction Logic (Remains unchanged) ---
            try {
                const categories = [
                    { key: 'shopdog_foods', type: 'FOOD' },
                    { key: 'shopdog_toys', type: 'TOY' },
                    { key: 'shopdog_dogs', type: 'PET' }
                ];

                for (const cat of categories) {
                    const stored = await AsyncStorage.getItem(cat.key);
                    if (stored) {
                        let itemsList = JSON.parse(stored);
                        let changed = false;

                        itemsList = itemsList.map((p: any) => {
                            const orderItem = items.find(oi => oi.id === p.id && oi.type === cat.type);
                            if (orderItem) {
                                const currentStock = p.stock || 0;
                                const newStock = Math.max(0, currentStock - (orderItem.quantity || 1));
                                changed = true;
                                return {
                                    ...p,
                                    stock: newStock,
                                    isOut: newStock === 0 ? true : p.isOut
                                };
                            }
                            return p;
                        });

                        if (changed) {
                            await AsyncStorage.setItem(cat.key, JSON.stringify(itemsList));
                        }
                    }
                }
            } catch (invErr) {
                console.error("Inventory deduction failed", invErr);
            }
            // ---------------------------------

            setUser(prev => prev ? ({ ...prev, orders: [newOrder, ...prev.orders] }) : null);
            return orderId;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const fetchAllProfiles = async (): Promise<any[]> => {
        try {
            // First get all profiles
            const { data: profiles, error: pErr } = await supabase
                .from('profiles')
                .select('*');
            if (pErr) throw pErr;

            // Then get all orders
            const { data: orders, error: oErr } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (oErr) throw oErr;

            // Map orders back to profiles for the existing UI
            return profiles.map(p => ({
                ...p,
                joinDate: p.join_date,
                isAdmin: p.is_admin,
                orders: (orders || [])
                    .filter(o => o.user_id === p.id)
                    .map(o => ({
                        id: o.id,
                        date: o.date_string || new Date(o.created_at).toLocaleDateString('th-TH'),
                        total: o.total,
                        items: o.items,
                        status: o.status
                    }))
            }));
        } catch (e) {
            console.error("Fetch all profiles failed", e);
            return [];
        }
    };

    const adminUpdateOrderStatus = async (userId: string, orderId: string, newStatus: Order['status']): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state if it's the current user's order
            if (user?.id === userId) {
                setUser(prev => {
                    if (!prev) return null;
                    const updatedOrders = prev.orders.map(o =>
                        o.id === orderId ? { ...o, status: newStatus } : o
                    );
                    return { ...prev, orders: updatedOrders };
                });
            }

            return true;
        } catch (e) {
            console.error("Admin status update failed", e);
            return false;
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        setIsLoading(true);
        await fetchProfile(user.id);
        setIsLoading(false);
    };

    const adminFetchUserProfile = async (userId: string): Promise<User | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) throw error;

            // Fetch orders from the new dedicated table
            const { data: dbOrders, error: ordersErr } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            const formattedOrders: Order[] = (dbOrders || []).map(o => ({
                id: o.id,
                date: o.date_string || new Date(o.created_at).toLocaleDateString('th-TH'),
                total: o.total,
                items: o.items,
                status: o.status
            }));

            return {
                id: data.id,
                name: data.name,
                email: data.email || '',
                address: data.address,
                joinDate: data.join_date,
                orders: formattedOrders,
                profileImage: data.profile_image,
                isAdmin: data.is_admin
            };
        } catch (e) {
            console.error("Admin fetch user profile failed", e);
            return null;
        }
    };

    const deleteOrder = async (orderId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            setUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    orders: prev.orders.filter(o => o.id !== orderId)
                };
            });

            return true;
        } catch (e) {
            console.error("Delete order failed", e);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            updateProfile,
            addOrder,
            fetchAllProfiles,
            adminUpdateOrderStatus,
            refreshProfile,
            adminFetchUserProfile,
            deleteOrder
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
