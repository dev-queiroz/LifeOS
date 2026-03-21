import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatRow } from '@/components/ui/StatRow';
import { Colors } from '@/constants/colors';
import type { Subject } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

function calcAvg(subject: Subject): number {
  if (subject.grades.length === 0) return 0;
  return subject.grades.reduce((a, b) => a + b, 0) / subject.grades.length;
}

function SubjectCard({ subject, onPress, onDelete }: { subject: Subject; onPress: () => void; onDelete: () => void }) {
  const avg = calcAvg(subject);
  const absRisk = subject.absences >= subject.maxAbsences * 0.75;
  const pending = subject.activities.filter((a) => a.status === 'pending').length;

  return (
    <GlowCard color={absRisk ? Colors.red : Colors.cyan} onPress={onPress}>
      <View style={styles.subjectRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <View style={styles.subjectBadges}>
            {absRisk && <Badge label="Atencao: faltas" color={Colors.red} bg={Colors.redDim} />}
            {pending > 0 && <Badge label={`${pending} pendente(s)`} color={Colors.orange} bg={Colors.orangeDim} />}
          </View>
        </View>
        <View style={styles.subjectRight}>
          <Text style={[styles.avg, { color: avg >= 7 ? Colors.green : avg >= 5 ? Colors.orange : Colors.red }]}>
            {avg.toFixed(1)}
          </Text>
          <Text style={styles.avgLabel}>Media</Text>
        </View>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={14} color={Colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.absRow}>
        <Text style={styles.absLabel}>Faltas: {subject.absences}/{subject.maxAbsences}</Text>
        <ProgressBar value={subject.absences} max={subject.maxAbsences} color={absRisk ? Colors.red : Colors.cyanDim} height={4} />
      </View>
    </GlowCard>
  );
}

function AddSubjectModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (s: Subject) => void }) {
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('4');
  const [maxAbsences, setMaxAbsences] = useState('8');

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>Nova Materia</Text>
        <Text style={styles.inputLabel}>Nome</Text>
        <TextInput
          style={styles.inputField}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Calculo II"
          placeholderTextColor={Colors.textMuted}
          autoFocus
        />
        <Text style={styles.inputLabel}>Creditos</Text>
        <TextInput
          style={styles.inputField}
          value={credits}
          onChangeText={setCredits}
          keyboardType="numeric"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.inputLabel}>Max. Faltas Permitidas</Text>
        <TextInput
          style={styles.inputField}
          value={maxAbsences}
          onChangeText={setMaxAbsences}
          keyboardType="numeric"
          placeholderTextColor={Colors.textMuted}
        />
        <View style={styles.modalBtns}>
          <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: Colors.bgMuted }]}>
            <Text style={[styles.modalBtnText, { color: Colors.textSecondary }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!name.trim()) return;
              onSave({
                id: genId(),
                name: name.trim(),
                credits: parseInt(credits) || 4,
                grades: [],
                absences: 0,
                maxAbsences: parseInt(maxAbsences) || 8,
                activities: [],
              });
              setName('');
              onClose();
            }}
            style={[styles.modalBtn, { backgroundColor: Colors.cyan }]}
          >
            <Text style={[styles.modalBtnText, { color: Colors.white }]}>Salvar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function FaculdadeScreen() {
  const insets = useSafeAreaInsets();
  const { subjects, addSubject, deleteSubject, sessions, settings } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const facSessions = sessions.filter((s) => s.type === 'faculdade');
  const weekMinutes = facSessions
    .filter((s) => {
      const d = new Date(s.date);
      const week = new Date();
      week.setDate(week.getDate() - 7);
      return d >= week;
    })
    .reduce((acc, s) => acc + s.duration, 0);

  const overallAvg =
    subjects.length > 0
      ? subjects.reduce((acc, s) => acc + calcAvg(s), 0) / subjects.length
      : 0;

  const riskCount = subjects.filter(
    (s) => s.absences >= s.maxAbsences * 0.75
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <SectionHeader
          title="Faculdade"
          actionLabel="+ Materia"
          onAction={() => setShowAddModal(true)}
        />

        <StatRow
          items={[
            { label: 'Media Geral', value: overallAvg.toFixed(1), color: overallAvg >= 7 ? Colors.green : Colors.orange },
            { label: 'Min/semana', value: `${weekMinutes}`, color: Colors.cyan },
            { label: 'Materias', value: `${subjects.length}` },
            { label: 'Em risco', value: `${riskCount}`, color: riskCount > 0 ? Colors.red : Colors.green },
          ]}
        />

        <View style={{ height: 20 }} />

        {subjects.length === 0 ? (
          <EmptyState
            icon="book"
            title="Nenhuma materia"
            subtitle="Adicione suas materias do semestre"
            actionLabel="+ Materia"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          subjects.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              onPress={() => router.push({ pathname: '/subject/[id]', params: { id: s.id } })}
              onDelete={() => {
                Alert.alert('Remover Materia', `Remover ${s.name}?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                      if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      deleteSubject(s.id);
                    },
                  },
                ]);
              }}
            />
          ))
        )}
      </ScrollView>

      <AddSubjectModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async (s) => {
          if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await addSubject(s);
          setShowAddModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  subjectBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  subjectRight: {
    alignItems: 'center',
    minWidth: 50,
  },
  avg: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  avgLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absRow: {
    gap: 6,
  },
  absLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputField: {
    backgroundColor: Colors.bgMuted,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
