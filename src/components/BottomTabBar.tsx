import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function BottomTabBar({ tabs, activeTab, onTabPress }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {isActive && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F4',
    paddingTop: 6,
    paddingBottom: 28,
  },
  tab: { flex: 1, alignItems: 'center', position: 'relative' },
  icon: { fontSize: 24, marginBottom: 2, color: '#B0B8C1' },
  iconActive: { color: '#191F28' },
  label: { fontSize: 11, color: '#B0B8C1', fontWeight: '500', letterSpacing: -0.2 },
  labelActive: { color: '#191F28', fontWeight: '700' },
  indicator: { position: 'absolute', top: -6, width: 20, height: 2, borderRadius: 1, backgroundColor: '#191F28' },
});
