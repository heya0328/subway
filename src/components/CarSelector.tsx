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
        {recommendedCar && recommendedCar !== selectedCar && (
          <TouchableOpacity onPress={() => onSelect(recommendedCar)}>
            <Text style={styles.recLabel}>추천 {recommendedCar}번 칸</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.track}>
        {cars.map((num) => {
          const isSelected = num === selectedCar;
          const isRecommended = num === recommendedCar && !isSelected;
          return (
            <TouchableOpacity
              key={num}
              style={[
                styles.car,
                isSelected && styles.carSelected,
                isRecommended && styles.carRecommended,
              ]}
              onPress={() => onSelect(num)}
              activeOpacity={0.7}
            >
              {isSelected && <Text style={styles.youLabel}>😊</Text>}
              <Text style={[
                styles.carText,
                isSelected && styles.carTextSelected,
                isRecommended && styles.carTextRecommended,
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
  container: { backgroundColor: '#F8F9FB', borderRadius: 16, padding: 20, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#191F28' },
  recLabel: { fontSize: 13, fontWeight: '600', color: '#00C853' },
  track: { flexDirection: 'row', justifyContent: 'space-between' },
  car: { width: 30, height: 42, borderRadius: 8, backgroundColor: '#E8EBED', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  carSelected: { backgroundColor: '#191F28' },
  carRecommended: { backgroundColor: '#00C853' },
  carText: { fontSize: 12, fontWeight: '700', color: '#8B95A1' },
  carTextSelected: { color: '#FFF' },
  carTextRecommended: { color: '#FFF' },
  youLabel: { fontSize: 14, marginBottom: 0 },
  direction: { fontSize: 12, color: '#8B95A1', marginTop: 10, letterSpacing: -0.3 },
});
