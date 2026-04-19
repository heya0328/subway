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
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  icon: { fontSize: 22, marginBottom: 2, color: '#B0B8C1' },
  iconActive: { color: '#3182F6' },
  label: { fontSize: 11, color: '#B0B8C1', fontWeight: '500' },
  labelActive: { color: '#3182F6', fontWeight: '700' },
});
