import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { Note } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

export default function AddNoteModal() {
  const insets = useSafeAreaInsets();
  const { notes, addNote, deleteNote, settings } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'list' | 'add'>('list');

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    const note: Note = {
      id: genId(),
      title: title.trim() || 'Sem titulo',
      content: content.trim(),
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addNote(note);
    setTitle('');
    setContent('');
    setMode('list');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Notas</Text>
          <Pressable onPress={() => setMode(mode === 'add' ? 'list' : 'add')} style={styles.addBtn}>
            <Feather name={mode === 'add' ? 'list' : 'edit-2'} size={18} color={Colors.accent} />
          </Pressable>
        </View>

        {mode === 'add' ? (
          <ScrollView contentContainerStyle={styles.form}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Titulo da nota..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Escreva aqui... (suporta Markdown)"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Salvar Nota</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {notes.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="file-text" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Nenhuma nota ainda</Text>
                <Pressable onPress={() => setMode('add')} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Criar primeira nota</Text>
                </Pressable>
              </View>
            ) : (
              notes.map((n) => (
                <View key={n.id} style={styles.noteCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>{n.title}</Text>
                    <Text style={styles.noteContent} numberOfLines={2}>{n.content}</Text>
                    <Text style={styles.noteDate}>{new Date(n.createdAt).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <Pressable onPress={() => deleteNote(n.id)} style={styles.noteDelete}>
                    <Feather name="trash-2" size={14} color={Colors.textMuted} />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  form: { padding: 20, gap: 12 },
  titleInput: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text, padding: 0 },
  contentInput: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text, minHeight: 300, padding: 0, lineHeight: 24 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.white },
  list: { padding: 20, gap: 10 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  emptyBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, backgroundColor: Colors.accentDim },
  emptyBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.accentGlow },
  noteCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, flexDirection: 'row', borderWidth: 1, borderColor: Colors.border },
  noteTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 4 },
  noteContent: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },
  noteDate: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 8 },
  noteDelete: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
