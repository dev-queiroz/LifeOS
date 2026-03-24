import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SidebarToggle } from '@/components/Sidebar';
import { Colors } from '@/constants/colors';
import type { Note } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

// Remaining items 
const ITEMS = [
  { label: 'Plano 2032', icon: 'star', route: '/(tabs)/plano', color: Colors.accent, desc: 'Metas e fases até a Europa' },
  { label: 'Finanças', icon: 'dollar-sign', route: '/(tabs)/financas', color: Colors.green, desc: 'Gestão de entradas e saídas' },
];

// ---------- Note Editor Modal ----------
function NoteEditorModal({ visible, note, onClose, onSave }: {
  visible: boolean;
  note?: Note;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  React.useEffect(() => {
    if (visible) {
      setTitle(note?.title ?? '');
      setContent(note?.content ?? '');
    }
  }, [visible, note]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Título obrigatório'); return; }
    onSave(title.trim(), content);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{note ? 'Editar Nota' : 'Nova Nota'}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={handleSave}>
              <Feather name="check" size={22} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.noteTitleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Título da nota..."
          placeholderTextColor={Colors.textMuted}
        />
        <TextInput
          style={styles.noteContentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Escreva aqui... (Markdown suportado)"
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />
      </View>
    </Modal>
  );
}

export default function MaisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, notes, addNote, updateNote, deleteNote } = useApp();
  const [pin, setPin] = useState('');
  const [locked, setLocked] = useState(!!settings.pin);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();

  if (locked) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 100, alignItems: 'center', paddingHorizontal: 40 }]}>
        <Feather name="lock" size={48} color={Colors.textMuted} style={{ marginBottom: 20 }} />
        <Text style={[styles.title, { marginBottom: 10 }]}>Acesso Restrito</Text>
        <Text style={[styles.itemDesc, { textAlign: 'center', marginBottom: 30 }]}>
          Digite seu PIN para acessar.
        </Text>
        <TextInput
          style={[styles.input, { width: '100%', textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
          value={pin}
          onChangeText={(v) => {
            setPin(v);
            if (v.length === (settings.pin?.length || 4) && v === settings.pin) {
              setLocked(false);
            }
          }}
          keyboardType="numeric"
          secureTextEntry
          maxLength={settings.pin?.length || 4}
          autoFocus
        />
      </View>
    );
  }

  const handleSaveNote = (title: string, content: string) => {
    if (editingNote) {
      updateNote({ ...editingNote, title, content, updatedAt: new Date().toISOString() });
    } else {
      addNote({ title, content, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setEditingNote(undefined);
    setEditorVisible(false);
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert('Remover', `Remover nota "${note.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteNote(note.id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.textSecondary} />
          <Text style={styles.title}>Mais</Text>
        </View>

        {/* Notas & Journal section */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Feather name="file-text" size={18} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Notas & Journal</Text>
              <Text style={styles.sectionDesc}>Editor Markdown</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setEditingNote(undefined); setEditorVisible(true); }}
          >
            <Feather name="plus" size={18} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyNotes}>
            <Feather name="file-text" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma nota ainda</Text>
            <Text style={styles.emptySubText}>Toque no + para criar sua primeira nota</Text>
          </View>
        ) : (
          notes.map(note => (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
              activeOpacity={0.75}
              onPress={() => { setEditingNote(note); setEditorVisible(true); }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
                <Text style={styles.notePreview} numberOfLines={2}>{note.content || 'Vazio'}</Text>
                <Text style={styles.noteDate}>{(note.updatedAt ?? note.createdAt).slice(0, 10)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteNote(note)}
                style={{ padding: 8, marginLeft: 8 }}
              >
                <Feather name="trash-2" size={18} color={Colors.red} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {/* Other items (Finanças) */}
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
              <Feather name={item.icon as never} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <NoteEditorModal
        visible={editorVisible}
        note={editingNote}
        onClose={() => { setEditorVisible(false); setEditingNote(undefined); }}
        onSave={handleSaveNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  sectionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  sectionDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent + '20', alignItems: 'center', justifyContent: 'center' },
  emptyNotes: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  emptySubText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  noteTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 4 },
  notePreview: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 6, lineHeight: 16 },
  noteDate: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  itemDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  comingSoon: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textMuted, backgroundColor: Colors.bgMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.text, fontFamily: 'Inter_400Regular' },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  noteTitleInput: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  noteContentInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text, paddingHorizontal: 20, paddingTop: 12, lineHeight: 24 },
});
