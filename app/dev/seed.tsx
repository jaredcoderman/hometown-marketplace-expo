import { Button } from '@/components/ui/button';
import Colors from '@/constants/Colors';
import { useLocation } from '@/contexts/LocationContext';
import { seedDemoData } from '@/services/seed.service';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SeedScreen() {
  const { location } = useLocation();
  const [seeding, setSeeding] = useState(false);
  const [doneIds, setDoneIds] = useState<string[] | null>(null);

  const handleSeed = async () => {
    const ok = window.confirm('Seed demo data (5 sellers, 3 products each)?');
    if (!ok) return;
    setSeeding(true);
    try {
      const ids = await seedDemoData(location || undefined);
      setDoneIds(ids);
      window.alert('Seed complete!');
    } catch (e: any) {
      console.error('Seeding error:', e);
      window.alert('Seeding failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Seed Demo Data</Text>
      <Text style={styles.subtitle}>
        Creates 5 sample sellers around your current location and 3 products per seller.
      </Text>

      <Button title={seeding ? 'Seeding…' : 'Seed Now'} onPress={handleSeed} loading={seeding} />

      {doneIds && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Created Sellers</Text>
          {doneIds.map((id) => (
            <Text key={id} style={styles.resultItem}>{id}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  results: {
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  resultItem: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});


