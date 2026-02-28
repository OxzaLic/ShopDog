import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAlert } from '../context/AlertContext';

const { width } = Dimensions.get('window');

export const CustomAlert = () => {
    const { alertState, hideAlert } = useAlert();
    const { visible, title, message, type, options } = alertState;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
        }
    }, [visible]);

    if (!visible) return null;

    const getTheme = () => {
        switch (type) {
            case 'success':
                return { icon: 'checkmark-circle', color: '#10b981' };
            case 'error':
                return { icon: 'close-circle', color: '#ef4444' };
            case 'warning':
                return { icon: 'warning', color: '#f59e0b' };
            case 'confirm':
                return { icon: 'help-circle', color: '#3b82f6' };
            default:
                return { icon: 'information-circle', color: '#6366f1' };
        }
    };

    const theme = getTheme();

    const handleConfirm = () => {
        if (options?.onConfirm) {
            options.onConfirm();
        }
        hideAlert();
    };

    const handleCancel = () => {
        if (options?.onCancel) {
            options.onCancel();
        }
        hideAlert();
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={hideAlert}
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.color + '15' }]}>
                        <Ionicons name={theme.icon as any} size={40} color={theme.color} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {type === 'confirm' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={handleCancel}
                                >
                                    <Text style={styles.cancelButtonText}>{options?.cancelText || 'ยกเลิก'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.color }]}
                                    onPress={handleConfirm}
                                >
                                    <Text style={styles.confirmButtonText}>{options?.confirmText || 'ยืนยัน'}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.color, width: '100%' }]}
                                onPress={hideAlert}
                            >
                                <Text style={styles.confirmButtonText}>ตกลง</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
