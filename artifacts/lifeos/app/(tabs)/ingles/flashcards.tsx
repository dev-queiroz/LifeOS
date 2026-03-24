import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { Flashcard } from '@/constants/types';
import { useApp } from '@/context/AppContext';

export default function FlashcardsScreen() {
  const insets = useSafeAreaInsets();
  const { flashcards, addFlashcard, updateFlashcard, deleteFlashcard } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tag, setTag] = useState('');

  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  // Simplified study list (all cards)
  const studyList = useMemo(() => {
    return flashcards;
  }, [flashcards]);

  const handleCreate = () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Erro', 'Preencha frente e verso.');
      return;
    }
    addFlashcard({ front: front.trim(), back: back.trim(), tag: tag.trim() });
    setFront(''); setBack(''); setTag('');
    setModalVisible(false);
  };

  const handleReview = (ease: number) => {
    const card = studyList[studyIndex];
    if (!card) return;

    updateFlashcard({
      ...card,
      lastReview: new Date().toISOString(),
      ease,
    });

    if (studyIndex < studyList.length - 1) {
      setStudyIndex(studyIndex + 1);
      setShowBack(false);
    } else {
      Alert.alert('Fim do Estudo', 'Você revisou todos os cards!', [
        { text: 'OK', onPress: () => { setStudyMode(false); setStudyIndex(0); setShowBack(false); } }
      ]);
    }
  };

  if (studyMode && studyList.length > 0) {
    const current = studyList[studyIndex];
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.studyHeader}>
          <TouchableOpacity onPress={() => setStudyMode(false)}>
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.studyTitle}>Estudando ({studyIndex + 1}/{studyList.length})</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.studyContent}>
          <TouchableOpacity 
            style={styles.cardContainer} 
            activeOpacity={0.9}
            onPress={() => setShowBack(!showBack)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardType}>{showBack ? 'Verso' : 'Frente'}</Text>
              <Text style={styles.cardText}>{showBack ? current.back : current.front}</Text>
              {current.tag && !showBack && <Text style={styles.cardTag}>{current.tag}</Text>}
            </View>
            {!showBack && (
              <View style={styles.flipPrompt}>
                <Feather name="refresh-cw" size={16} color={Colors.textMuted} />
                <Text style={styles.flipText}>Virar ou Tocar para ver a resposta</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showBack ? (
          <View style={styles.reviewButtons}>
            <TouchableOpacity style={[styles.reviewBtn, { backgroundColor: Colors.red }]} onPress={() => handleReview(1)}>
              <Text style={styles.reviewBtnText}>Difícil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reviewBtn, { backgroundColor: Colors.orange }]} onPress={() => handleReview(2)}>
              <Text style={styles.reviewBtnText}>Médio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reviewBtn, { backgroundColor: Colors.green }]} onPress={() => handleReview(3)}>
              <Text style={styles.reviewBtnText}>Fácil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowBack(true)}>
              <Text style={styles.primaryBtnText}>Ver Verso</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Flashcards</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color={Colors.green} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {flashcards.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="layers" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum flashcard</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.addFirstText}>Criar Primeiro Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.studyBtn} onPress={() => { setStudyIndex(0); setShowBack(false); setStudyMode(true); }}>
              <Feather name="play" size={18} color={Colors.white} />
              <Text style={styles.studyBtnText}>Iniciar Estudo ({flashcards.length})</Text>
            </TouchableOpacity>

            {flashcards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardItemFront} numberOfLines={1}>{card.front}</Text>
                  <Text style={styles.cardItemBack} numberOfLines={2}>{card.back}</Text>
                  {card.tag && <Text style={styles.cardItemTag}>{card.tag}</Text>}
                </View>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Excluir', 'Deseja excluir este card?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => deleteFlashcard(card.id) }
                  ]);
                }}>
                  <Feather name="trash-2" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Flashcard</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Frente (Prompt)</Text>
            <TextInput style={styles.input} value={front} onChangeText={setFront} placeholder="Ex: Maçã" placeholderTextColor={Colors.textMuted} autoFocus />
            
            <Text style={styles.label}>Verso (Resposta)</Text>
            <TextInput style={[styles.input, { minHeight: 120 }]} value={back} onChangeText={setBack} placeholder="Ex: Apple" placeholderTextColor={Colors.textMuted} multiline />

            <Text style={styles.label}>Tag (Opcional)</Text>
            <TextInput style={styles.input} value={tag} onChangeText={setTag} placeholder="Ex: Frutas" placeholderTextColor={Colors.textMuted} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Criar Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  scroll: { padding: 20 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: Colors.textMuted, fontSize: 16, marginTop: 10, fontFamily: 'Inter_400Regular' },
  addFirstBtn: { marginTop: 20, backgroundColor: Colors.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addFirstText: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  studyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.green, padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  studyBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  cardItemFront: { color: Colors.text, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  cardItemBack: { color: Colors.textMuted, fontSize: 14, marginTop: 4, fontFamily: 'Inter_400Regular' },
  cardItemTag: { color: Colors.green, fontSize: 11, marginTop: 6, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalBody: { padding: 20 },
  label: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 20 },
  saveBtn: { backgroundColor: Colors.green, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  studyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  studyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  studyContent: { flex: 1, padding: 20, justifyContent: 'center' },
  cardContainer: { backgroundColor: Colors.bgCard, minHeight: 350, borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  cardContent: { alignItems: 'center' },
  cardType: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', marginBottom: 20 },
  cardText: { color: Colors.text, fontSize: 32, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  cardTag: { color: Colors.green, fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 20 },
  flipPrompt: { position: 'absolute', bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  flipText: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_500Medium' },
  reviewButtons: { flexDirection: 'row', padding: 20, gap: 10, paddingBottom: 40 },
  reviewBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  reviewBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Inter_700Bold' },
  bottomActions: { padding: 20, paddingBottom: 40 },
  primaryBtn: { backgroundColor: Colors.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
