import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { GlowCard } from '@/components/ui/GlowCard';
import { Colors } from '@/constants/colors';
import type { Flashcard } from '@/constants/types';
import { useApp } from '@/context/AppContext';

export default function FlashcardsScreen() {
  const insets = useSafeAreaInsets();
  const { flashcards, addFlashcard, deleteFlashcard } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({});

  const handleSave = () => {
    if (!front.trim() || !back.trim()) return;
    addFlashcard(front.trim(), back.trim(), []);
    setFront(''); setBack('');
    setModalVisible(false);
  };

  const toggleFlip = (id: string) => {
    setFlippedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={Colors.green} />
        </TouchableOpacity>
        <Text style={styles.title}>Flashcards Inglês</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Feather name="plus" size={24} color={Colors.green} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={flashcards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GlowCard color={Colors.green} onPress={() => toggleFlip(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSideLabel}>{flippedMap[item.id] ? 'Verso' : 'Frente'}</Text>
              <TouchableOpacity onPress={() => deleteFlashcard(item.id)}>
                <Feather name="trash-2" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardText}>
              {flippedMap[item.id] ? item.back : item.front}
            </Text>
            <Text style={styles.tapToFlip}>Tocar para virar</Text>
          </GlowCard>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="layers" size={48} color={Colors.green + '40'} />
            <Text style={styles.emptyText}>Nenhum card criado.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { paddingTop: 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Flashcard</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Frente (Inglês)</Text>
            <TextInput
              style={styles.input}
              value={front}
              onChangeText={setFront}
              placeholder="Ex: I look forward to it"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <Text style={styles.label}>Verso (Tradução/Explicação)</Text>
            <TextInput
              style={styles.input}
              value={back}
              onChangeText={setBack}
              placeholder="Ex: Estou ansioso por isso"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardSideLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.green, textTransform: 'uppercase' },
  cardText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text, textAlign: 'center', marginVertical: 20 },
  tapToFlip: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 15, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: Colors.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
