import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const DHIKR_OPTIONS = [
    { arabic: 'سُبْحَانَ اللَّهِ', translit: 'SubhanAllah', meaning: 'Glory be to Allah' },
    { arabic: 'الْحَمْدُ لِلَّهِ', translit: 'Alhamdulillah', meaning: 'Praise be to Allah' },
    { arabic: 'اللَّهُ أَكْبَرُ', translit: 'Allahu Akbar', meaning: 'Allah is the Greatest' },
    { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', translit: 'La ilaha illallah', meaning: 'There is no god but Allah' },
  ];

    const CYCLE_TARGET = 33;
    const STORAGE_KEY_COUNT = 'tasbih_count';
    const STORAGE_KEY_TOTAL = 'tasbih_daily_total';
    const STORAGE_KEY_DHIKR_INDEX = 'tasbih_dhikr_index';
    const STORAGE_KEY_DATE = 'tasbih_date';

    export default function TasbihCounter() {
        const [expanded, setExpanded] = useState(false);
        const [count, setCount] = useState(0);
        const [dailyTotal, setDailyTotal] = useState(0);
        const [dhikrIndex, setDhikrIndex] = useState(0);
        const scaleAnim = useRef(new Animated.Value(1)).current;

        const dhikr = DHIKR_OPTIONS[dhikrIndex];

        useEffect(() => {
          loadState();
        }, []);

        const loadState = async () => {
            try {
                const today = new Date().toDateString();
                const savedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);
                const savedCount = await AsyncStorage.getItem(STORAGE_KEY_COUNT);
                const savedTotal = await AsyncStorage.getItem(STORAGE_KEY_TOTAL);
                const savedDhikrIndex = await AsyncStorage.getItem(STORAGE_KEY_DHIKR_INDEX);
          
                if (savedDate !== today) {
                  // New day — reset daily total but keep cycle count
                  await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
                  await AsyncStorage.setItem(STORAGE_KEY_TOTAL, '0');
                  setDailyTotal(0);
                } else {
                  setDailyTotal(savedTotal ? parseInt(savedTotal, 10) : 0);
                }
          
                setCount(savedCount ? parseInt(savedCount, 10) : 0);
                setDhikrIndex(savedDhikrIndex ? parseInt(savedDhikrIndex, 10) : 0);
              } catch (e) {
                console.log('Error loading tasbih state', e);
              }
            };

            const handleTap = async () => {
                const newCount = count + 1;
                const newTotal = dailyTotal + 1;
            
                // Bounce animation
                Animated.sequence([
                  Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
                  Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
                ]).start();

                if (newCount >= CYCLE_TARGET) {
                    // Cycle complete — stronger haptic
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setCount(0);
                    await AsyncStorage.setItem(STORAGE_KEY_COUNT, '0');
                  } else {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCount(newCount);
                    await AsyncStorage.setItem(STORAGE_KEY_COUNT, newCount.toString());
                  }
              
                  setDailyTotal(newTotal);
                  await AsyncStorage.setItem(STORAGE_KEY_TOTAL, newTotal.toString());
                };

                const handleReset = async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setCount(0);
                    await AsyncStorage.setItem(STORAGE_KEY_COUNT, '0');
                  };
                
                  const handleChangeDhikr = async () => {
                    await Haptics.selectionAsync();
                    const newIndex = (dhikrIndex + 1) % DHIKR_OPTIONS.length;
                    setDhikrIndex(newIndex);
                    await AsyncStorage.setItem(STORAGE_KEY_DHIKR_INDEX, newIndex.toString());
                  };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Text style={styles.headerIcon}>📿</Text>
                <Text style={styles.headerTitle}>Tasbih Counter</Text>
                <Text style={styles.chip}>{count}/{CYCLE_TARGET}</Text>
                <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expanded && (
            <View style={styles.expandedContent}>
            <View style={styles.dhikrLabel}>
                <Text style={styles.arabicText}>{dhikr.arabic}</Text>
                <Text style={styles.translitText}>{dhikr.translit}</Text>
                <Text style={styles.meaningText}>{dhikr.meaning}</Text>
            </View>

            <TouchableOpacity onPress={handleTap} activeOpacity={0.85}>
                <Animated.View style={[styles.counterCircle, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.counterNumber}>{count}</Text>
                </Animated.View>
            </TouchableOpacity>

            <View style={styles.dotsRow}>
            {Array.from({ length: CYCLE_TARGET }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < count && styles.dotFilled,
                ]}
              />
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
              <Text style={styles.actionButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleChangeDhikr}>
              <Text style={styles.actionButtonPrimaryText}>Change Dhikr</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.dailyTotal}>Today: {dailyTotal}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    headerIcon: {
      fontSize: 20,
      marginRight: 10,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: '#1E3A5F',
    },
    chip: {
      backgroundColor: '#f0f4f8',
      color: '#1E3A5F',
      fontSize: 13,
      fontWeight: '600',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 10,
    },
    chevron: {
      fontSize: 12,
      color: '#999',
    },
    expandedContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      alignItems: 'center',
    },
    dhikrLabel: {
      alignItems: 'center',
      marginBottom: 20,
    },
    arabicText: {
      fontSize: 28,
      color: '#1E3A5F',
      marginBottom: 4,
    },
    translitText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#C9A84C',
    },
    meaningText: {
      fontSize: 13,
      color: '#999',
      marginTop: 2,
    },
    counterCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: '#1E3A5F',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    counterNumber: {
      fontSize: 48,
      fontWeight: '700',
      color: '#fff',
    },
    dotsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: 260,
      marginBottom: 20,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#eee',
      margin: 4,
    },
    dotFilled: {
      backgroundColor: '#C9A84C',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    actionButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#f0f4f8',
    },
    actionButtonText: {
      color: '#1E3A5F',
      fontWeight: '600',
      fontSize: 14,
    },
    actionButtonPrimary: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#C9A84C',
    },
    actionButtonPrimaryText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    dailyTotal: {
      fontSize: 13,
      color: '#999',
    },
  });