import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  totalCars: number;
  selectedCar: number;
  recommendedCar: number | null;
  onSelect: (car: number) => void;
}

export function CarSelector({ totalCars, selectedCar, recommendedCar, onSelect }: Props) {
  const cars = Array.from({ length: totalCars }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>내 위치</Text>
      </View>
      <View style={styles.row}>
        {cars.map((num) => {
          const isSelected = num === selectedCar;
          const isRecommended = num === recommendedCar;
          return (
            <TouchableOpacity
              key={num}
              style={[
                styles.car,
                isSelected && styles.carSelected,
                isRecommended && !isSelected && styles.carRecommended,
              ]}
              onPress={() => onSelect(num)}
            >
              <Text style={[
                styles.carText,
                isSelected && styles.carTextSelected,
                isRecommended && !isSelected && styles.carTextRecommended,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.direction}>◀ 열차 진행 방향</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  car: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  carSelected: { backgroundColor: '#191F28' },
  carRecommended: { backgroundColor: '#00C853' },
  carText: { fontSize: 13, fontWeight: '600', color: '#666' },
  carTextSelected: { color: '#FFF' },
  carTextRecommended: { color: '#FFF' },
  direction: { fontSize: 12, color: '#8B95A1', marginTop: 8 },
});
