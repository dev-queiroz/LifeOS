import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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

import { SidebarToggle } from '@/components/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Colors } from '@/constants/colors';
import type { Activity, Subject } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

function calcWeightedAvg(subject: Subject): number {
  const graded = subject.activities.filter((a) => a.grade !== undefined && a.grade !== null);
  if (graded.length === 0) return 0;
  const totalWeight = graded.reduce((a, act) => a + act.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = graded.reduce((a, act) => a + (act.grade ?? 0) * act.weight, 0);
  return weighted / totalWeight;
}

function getDaysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function autoActivityStatus(act: Activity): Activity['status'] {
  if (act.grade !== undefined) return 'done';
  const due = new Date(act.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return 'late';
  return 'pending';
}

function SubjectCard({
  subject,
  onAddAbsence,
  onRemoveAbsence,
  onPress,
  onDelete,
}: {
  subject: Subject;
  onAddAbsence: () => void;
  onRemoveAbsence: () => void;
  onPress: () => void;
  onDelete: () => void;
}) {
  const avg = calcWeightedAvg(subject);
  const absRisk = subject.absences >= subject.maxAbsences * 0.75;
  const absCritical = subject.absences >= subject.maxAbsences;
  const pending = subject.activities.filter((a) => autoActivityStatus(a) === 'pending').length;
  const late = subject.activities.filter((a) => autoActivityStatus(a) === 'late').length;
  const absColor = absCritical ? Colors.red : absRisk ? Colors.orange : Colors.green;
  const absProgress = Math.min(1, subject.absences / Math.max(1, subject.maxAbsences));

  return (
    <GlowCard color={absCritical ? Colors.red : Colors.cyan} onPress={onPress}>
      <View style={styles.subjectRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          {subject.code && <Text style={styles.subjectCode}>{subject.code}</Text>}
          <View style={styles.badgeRow}>
            {absCritical && <Badge label="REPROVADO faltas" color={Colors.red} bg={Colors.redDim} />}
            {absRisk && !absCritical && <Badge label="Risco de faltas" color={Colors.orange} bg={Colors.orangeDim} />}
            {late > 0 && <Badge label={`${late} atrasado(s)`} color={Colors.red} bg={Colors.redDim} />}
            {pending > 0 && <Badge label={`${pending} pendente(s)`} color={Colors.orange} bg={Colors.orangeDim} />}
          </View>
          {(subject.professor || subject.room) && (
            <Text style={styles.subjectMeta}>
              {subject.professor && <><Feather name="user" size={10} /> {subject.professor} </>}
              {subject.room && <><Feather name="map-pin" size={10} /> {subject.room}</>}
            </Text>
          )}
        </View>
        <View style={styles.subjectRight}>
          <Text style={[styles.avg, { color: avg >= 7 ? Colors.green : avg >= 5 ? Colors.orange : Colors.red }]}>
            {avg.toFixed(1)}
          </Text>
          <Text style={styles.avgLabel}>Média Parcial</Text>
        </View>
      </View>

      <View style={styles.absRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.absCount, { color: absColor }]}>
            {subject.absences}/{subject.maxAbsences} faltas
          </Text>
          <ProgressBar value={absProgress * 100} color={absColor} height={5} />
        </View>
        <View style={styles.absBtns}>
          <TouchableOpacity style={[styles.absBtn, { backgroundColor: Colors.greenDim }]} onPress={onRemoveAbsence}>
            <Feather name="minus" size={14} color={Colors.green} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.absBtn, { backgroundColor: Colors.redDim }]} onPress={onAddAbsence}>
            <Feather name="plus" size={14} color={Colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.subjectFooter}>
        <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
          <Text style={styles.detailBtnText}>Ver Atividades</Text>
          <Feather name="chevron-right" size={14} color={Colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </GlowCard>
  );
}

function AddSubjectModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Omit<Subject, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [professorEmail, setProfessorEmail] = useState('');
  const [room, setRoom] = useState('');
  const [schedule, setSchedule] = useState('');
  const [credits, setCredits] = useState('4');
  const [maxAbsences, setMaxAbsences] = useState('6');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    onSave({
      name: name.trim(),
      code: code.trim(),
      professor: professor.trim(),
      professorEmail: professorEmail.trim(),
      room: room.trim(),
      schedule: schedule.trim(),
      credits: parseInt(credits) || 4,
      grades: [],
      absences: 0,
      maxAbsences: parseInt(maxAbsences) || 6,
      activities: [],
      notes: '',
    });
    setName(''); setCode(''); setProfessor(''); setProfessorEmail(''); setRoom(''); setSchedule(''); setCredits('4'); setMaxAbsences('6');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nova Matéria</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {[
            { label: 'Nome *', value: name, onChange: setName, placeholder: 'Ex: Cálculo II' },
            { label: 'Código', value: code, onChange: setCode, placeholder: 'Ex: MAT201' },
            { label: 'Professor', value: professor, onChange: setProfessor, placeholder: 'Nome do professor' },
            { label: 'E-mail do Professor', value: professorEmail, onChange: setProfessorEmail, placeholder: 'prof@uniso.br' },
            { label: 'Sala', value: room, onChange: setRoom, placeholder: 'Ex: Bloco B-102' },
            { label: 'Horário', value: schedule, onChange: setSchedule, placeholder: 'Ex: Segundas às 19h' },
            { label: 'Créditos', value: credits, onChange: setCredits, placeholder: '4', keyboardType: 'numeric' as const },
            { label: 'Máx. Faltas', value: maxAbsences, onChange: setMaxAbsences, placeholder: '6', keyboardType: 'numeric' as const },
          ].map((f) => (
            <View key={f.label}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textMuted}
                keyboardType={f.keyboardType}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar Matéria</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function FaculdadeScreen() {
  const insets = useSafeAreaInsets();
  const { subjects, addSubject, deleteSubject, addAbsence, removeAbsence } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddAbsence = (subjectId: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addAbsence(subjectId, new Date().toISOString().slice(0, 10));
  };

  const handleRemoveAbsence = (subjectId: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeAbsence(subjectId);
  };

  const handleDelete = (subject: Subject) => {
    Alert.alert('Remover', `Remover "${subject.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteSubject(subject.id) },
    ]);
  };

  const handleNavigate = (subject: Subject) => {
    router.push({ pathname: '/subject/[id]', params: { id: subject.id } });
  };

  const totalRisk = subjects.filter((s) => s.absences >= s.maxAbsences * 0.75).length;
  const totalPending = subjects.reduce((a, s) => a + s.activities.filter((act) => autoActivityStatus(act) === 'pending').length, 0);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) },
        ]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.cyan} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.cyan }]}>Faculdade</Text>
            <Text style={styles.subtitle}>{subjects.length} matérias cadastradas</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.cyanDim }]} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={18} color={Colors.cyan} />
          </TouchableOpacity>
        </View>

        {/* Destaque de Prazos */}
        {(() => {
          const allPending = subjects.flatMap(s => s.activities
            .filter(a => autoActivityStatus(a) !== 'done')
            .map(a => ({ ...a, subjectName: s.name }))
          ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 3);

          if (allPending.length === 0) return null;

          return (
            <View style={styles.deadlinesSection}>
              <Text style={styles.sectionHeader}>Próximos Prazos</Text>
              {allPending.map(act => {
                const days = getDaysUntil(act.dueDate);
                const deadlineColor = days < 0 ? Colors.red : days <= 2 ? Colors.orange : Colors.cyan;
                return (
                  <View key={act.id} style={styles.deadlineCard}>
                    <View style={[styles.deadlineDot, { backgroundColor: deadlineColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deadlineName}>{act.name}</Text>
                      <Text style={styles.deadlineSub}>{act.subjectName} · {act.dueDate}</Text>
                    </View>
                    <Text style={[styles.deadlineDays, { color: deadlineColor }]}>
                      {days < 0 ? 'Atrasado' : days === 0 ? 'Hoje' : `Em ${days}d`}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })()}

        {(totalRisk > 0 || totalPending > 0) && (
          <View style={styles.alertRow}>
            {totalRisk > 0 && (
              <View style={[styles.alertChip, { backgroundColor: Colors.redDim, borderColor: Colors.red + '40' }]}>
                <Feather name="alert-triangle" size={12} color={Colors.red} />
                <Text style={[styles.alertText, { color: Colors.red }]}>{totalRisk} com risco de falta</Text>
              </View>
            )}
            {totalPending > 0 && (
              <View style={[styles.alertChip, { backgroundColor: Colors.orangeDim, borderColor: Colors.orange + '40' }]}>
                <Feather name="clock" size={12} color={Colors.orange} />
                <Text style={[styles.alertText, { color: Colors.orange }]}>{totalPending} atividade(s) pendente(s)</Text>
              </View>
            )}
          </View>
        )}

        {subjects.length === 0 ? (
          <EmptyState
            icon="book"
            title="Nenhuma matéria"
            description="Adicione suas matérias para acompanhar notas, faltas e atividades."
            color={Colors.cyan}
          />
        ) : (
          subjects.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              onAddAbsence={() => handleAddAbsence(s.id)}
              onRemoveAbsence={() => handleRemoveAbsence(s.id)}
              onPress={() => handleNavigate(s)}
              onDelete={() => handleDelete(s)}
            />
          ))
        )}

        {subjects.length > 0 && (
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionHeader}>Sugestão de Grade Horária</Text>
            {subjects.filter(s => s.schedule).length === 0 ? (
              <Text style={styles.emptyScheduleText}>Configure o horário nas matérias para ver a grade.</Text>
            ) : (
              subjects.filter(s => s.schedule).map(s => (
                <View key={s.id} style={styles.scheduleRow}>
                  <View style={[styles.scheduleDot, { backgroundColor: Colors.cyan }]} />
                  <Text style={styles.scheduleTime}>{s.schedule}</Text>
                  <Text style={styles.scheduleName} numberOfLines={1}>{s.name}</Text>
                </View>
              ))
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddSubjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(s) => addSubject(s)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  deadlinesSection: { marginBottom: 20, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  deadlineCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  deadlineDot: { width: 8, height: 8, borderRadius: 4 },
  deadlineName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  deadlineSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  deadlineDays: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  alertChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  alertText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  subjectRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  subjectName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 2 },
  subjectCode: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 4 },
  subjectMeta: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  subjectRight: { alignItems: 'flex-end' },
  avg: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  avgLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  absRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  absCount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  absBtns: { flexDirection: 'row', gap: 8 },
  absBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subjectFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.accent },
  deleteBtn: { padding: 6 },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.cyan, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  scheduleSection: { marginTop: 20, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  emptyScheduleText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', marginVertical: 8 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  scheduleDot: { width: 6, height: 6, borderRadius: 3 },
  scheduleTime: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.cyan, width: 110 },
  scheduleName: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text, flex: 1 },
});
