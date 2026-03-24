import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatRow } from '@/components/ui/StatRow';
import { Colors } from '@/constants/colors';
import type { Activity } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { subjects, updateSubject, settings } = useApp();
  const subject = subjects.find((s) => s.id === id);

  const [showAddGrade, setShowAddGrade] = useState(false);
  const [gradeInput, setGradeInput] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actName, setActName] = useState('');
  const [actDue, setActDue] = useState('');
  const [actWeight, setActWeight] = useState('1');
  const [actType, setActType] = useState<Activity['type']>('prova');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

  const calculateSubjectAverage = (sub: typeof subject) => {
    if (!sub) return 0;

    const gradedActivities = sub.activities.filter(
      (a) => a.grade !== undefined && a.grade !== null && a.status === 'done'
    );

    if (gradedActivities.length > 0) {
      const totalWeight = gradedActivities.reduce((acc, act) => acc + (act.weight || 1), 0);
      if (totalWeight > 0) {
        const weightedSum = gradedActivities.reduce(
          (acc, act) => acc + (act.grade ?? 0) * (act.weight || 1),
          0
        );
        return weightedSum / totalWeight;
      }
    }

    if (sub.grades && sub.grades.length > 0) {
      const sum = sub.grades.reduce((acc, g) => acc + g, 0);
      return sum / sub.grades.length;
    }

    return 0;
  };

  if (!subject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ padding: 16 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="alert-circle"
            title="Matéria não encontrada"
            description="Esta matéria pode ter sido removida ou o ID é inválido."
            color={Colors.red}
            actionLabel="Voltar para Faculdade"
            onAction={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const avg = calculateSubjectAverage(subject);

  const absRisk = subject.absences >= subject.maxAbsences * 0.75;
  const pendingActs = subject.activities.filter((a) => a.status !== 'done');
  const doneActs = subject.activities.filter((a) => a.status === 'done');

  const handleAddGrade = async () => {
    const g = parseFloat(gradeInput);
    if (isNaN(g) || g < 0 || g > 10) {
      Alert.alert('Nota inválida', 'Digite uma nota entre 0 e 10');
      return;
    }
    const updated = { ...subject, grades: [...subject.grades, g] };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateSubject(updated);
    setGradeInput('');
    setShowAddGrade(false);
  };

  const handleAddActivity = async () => {
    const act: Activity = {
      id: genId(),
      name: actName.trim(),
      dueDate: actDue || new Date().toISOString().slice(0, 10),
      status: 'pending',
      weight: parseFloat(actWeight) || 1,
      type: actType,
    };
    const updated = { ...subject, activities: [...subject.activities, act] };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSubject(updated);
    setActName('');
    setActDue('');
    setActWeight('1');
    setActType('prova');
    setShowAddActivity(false);
  };

  const removeGrade = (index: number) => {
    Alert.alert('Remover Nota', 'Deseja remover esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          const nextGrades = [...subject.grades];
          nextGrades.splice(index, 1);
          const updated = { ...subject, grades: nextGrades };
          if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await updateSubject(updated);
        }
      }
    ]);
  };

  const removeActivity = (actId: string) => {
    Alert.alert('Remover Atividade', 'Deseja remover esta atividade?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          const updated = {
            ...subject,
            activities: subject.activities.filter((a) => a.id !== actId)
          };
          if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await updateSubject(updated);
        }
      }
    ]);
  };

  const toggleActivity = async (actId: string) => {
    const updated = {
      ...subject,
      activities: subject.activities.map((a) =>
        a.id === actId ? { ...a, status: a.status === 'done' ? 'pending' as const : 'done' as const } : a
      ),
    };
    if (settings.haptics) await Haptics.selectionAsync();
    await updateSubject(updated);
  };

  const updateActivityGrade = async (actId: string, grade: string) => {
    const g = parseFloat(grade);
    if (isNaN(g)) return;

    const updated = {
      ...subject,
      activities: subject.activities.map((a) =>
        a.id === actId ? { ...a, grade: g, status: 'done' as const } : a
      ),
    };
    if (settings.haptics) await Haptics.selectionAsync();
    await updateSubject(updated);
  };

  const adjustAbsences = async (delta: number) => {
    const newAbs = Math.max(0, subject.absences + delta);
    const updated = { ...subject, absences: newAbs };
    if (settings.haptics) await Haptics.selectionAsync();
    await updateSubject(updated);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>{subject.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <StatRow items={[
          { label: 'Média', value: avg.toFixed(1), color: avg >= 7 ? Colors.green : avg >= 5 ? Colors.orange : Colors.red },
          { label: 'Créditos', value: `${subject.credits}` },
          { label: 'Faltas', value: `${subject.absences}/${subject.maxAbsences}`, color: absRisk ? Colors.red : Colors.text },
        ]} />

        {/* Controle de Faltas */}
        <GlowCard color={absRisk ? Colors.red : Colors.cyan} style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>Controle de Faltas</Text>
          <ProgressBar value={subject.absences} max={subject.maxAbsences} color={absRisk ? Colors.red : Colors.cyan} height={8} />
          <View style={styles.absControl}>
            <Pressable onPress={() => adjustAbsences(-1)} style={styles.absBtn}>
              <Feather name="minus" size={18} color={Colors.text} />
            </Pressable>
            <Text style={[styles.absCount, { color: absRisk ? Colors.red : Colors.cyan }]}>
              {subject.absences} faltas
            </Text>
            <Pressable onPress={() => adjustAbsences(1)} style={styles.absBtn}>
              <Feather name="plus" size={18} color={Colors.text} />
            </Pressable>
          </View>
          {absRisk && (
            <Text style={styles.absWarning}>Atenção: você está próximo do limite de faltas!</Text>
          )}
        </GlowCard>

        {/* Notas - COM BOTÃO DE REMOVER */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Pressable onPress={() => setShowAddGrade(!showAddGrade)} style={styles.addSmallBtn}>
            <Feather name={showAddGrade ? 'minus' : 'plus'} size={14} color={Colors.cyan} />
            <Text style={styles.addSmallText}>Adicionar</Text>
          </Pressable>
        </View>

        {showAddGrade && (
          <GlowCard color={Colors.cyan}>
            <TextInput
              style={styles.gradeInput}
              value={gradeInput}
              onChangeText={setGradeInput}
              keyboardType="numeric"
              placeholder="Nota (0-10)"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <Pressable onPress={handleAddGrade} style={[styles.saveBtn, { backgroundColor: Colors.cyan }]}>
              <Text style={styles.saveBtnText}>Salvar Nota</Text>
            </Pressable>
          </GlowCard>
        )}

        <View style={styles.gradesRow}>
          {subject.grades.map((g, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.gradeChip,
                { backgroundColor: g >= 7 ? Colors.greenDim : g >= 5 ? Colors.orangeDim : Colors.redDim }
              ]}
              onLongPress={() => removeGrade(i)}
            >
              <Text style={[
                styles.gradeValue,
                { color: g >= 7 ? Colors.green : g >= 5 ? Colors.orange : Colors.red }
              ]}>
                {g.toFixed(1)}
              </Text>
            </TouchableOpacity>
          ))}
          {subject.grades.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma nota registrada</Text>
          )}
        </View>

        {/* Atividades */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Atividades</Text>
          <Pressable onPress={() => setShowAddActivity(!showAddActivity)} style={styles.addSmallBtn}>
            <Feather name={showAddActivity ? 'minus' : 'plus'} size={14} color={Colors.cyan} />
            <Text style={styles.addSmallText}>Adicionar</Text>
          </Pressable>
        </View>

        {showAddActivity && (
          <GlowCard color={Colors.cyan}>
            <Text style={styles.formLabel}>Nome da Atividade</Text>
            <TextInput
              style={styles.formInput}
              value={actName}
              onChangeText={setActName}
              placeholder="Ex: Trabalho P1"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Data de Entrega</Text>
            <TextInput
              style={styles.formInput}
              value={actDue}
              onChangeText={setActDue}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={[styles.formLabel, { marginTop: 12 }]}>Peso</Text>
            <TextInput
              style={styles.formInput}
              value={actWeight}
              onChangeText={setActWeight}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable onPress={handleAddActivity} style={[styles.saveBtn, { backgroundColor: Colors.cyan }]}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </Pressable>
          </GlowCard>
        )}

        {pendingActs.length > 0 && (
          <>
            <Text style={styles.actGroup}>Pendentes</Text>
            {pendingActs.map((a) => (
              <GlowCard key={a.id} color={Colors.orange} padding={12} style={{ marginBottom: 10 }}>
                <View style={styles.actRow}>
                  <Pressable onPress={() => toggleActivity(a.id)}>
                    <Feather name="circle" size={18} color={Colors.orange} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actName}>{a.name}</Text>
                    {a.dueDate && <Text style={styles.actDue}>Entrega: {a.dueDate} · Peso {a.weight}</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.actGradeContainer}>
                      <TextInput
                        style={styles.actGradeInput}
                        placeholder="Nota"
                        keyboardType="numeric"
                        defaultValue={a.grade?.toString()}
                        onSubmitEditing={(e) => updateActivityGrade(a.id, e.nativeEvent.text)}
                      />
                    </View>
                    <TouchableOpacity onPress={() => removeActivity(a.id)}>
                      <Feather name="trash-2" size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlowCard>
            ))}
          </>
        )}

        {doneActs.length > 0 && (
          <>
            <Text style={styles.actGroup}>Concluídas</Text>
            {doneActs.map((a) => (
              <GlowCard key={a.id} color={Colors.green} padding={12} style={{ marginBottom: 10 }}>
                <View style={styles.actRow}>
                  <Pressable onPress={() => toggleActivity(a.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Feather name="check-circle" size={18} color={Colors.green} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actName, { textDecorationLine: 'line-through', color: Colors.textSecondary }]}>
                        {a.name}
                      </Text>
                      <Text style={styles.actDue}>Nota: {a.grade?.toFixed(1)} · Peso {a.weight}</Text>
                    </View>
                  </Pressable>
                  <TouchableOpacity onPress={() => removeActivity(a.id)}>
                    <Feather name="trash-2" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </GlowCard>
            ))}
          </>
        )}

        {subject.activities.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma atividade cadastrada</Text>
        )}
      </ScrollView>

      {editActivity && (
        <EditActivityModal
          visible={true}
          activity={editActivity}
          onClose={() => setEditActivity(null)}
          onSave={(updated) => {
            updateSubject({
              ...subject,
              activities: subject.activities.map(a => a.id === updated.id ? updated : a)
            });
          }}
        />
      )}
    </View>
  );
}

// Modal de edição de atividade (mantido)
function EditActivityModal({ visible, activity, onClose, onSave }: {
  visible: boolean;
  activity: Activity;
  onClose: () => void;
  onSave: (a: Activity) => void;
}) {
  const [name, setName] = useState(activity.name);
  const [due, setDue] = useState(activity.dueDate);
  const [weight, setWeight] = useState(String(activity.weight));
  const [type, setType] = useState<Activity['type']>(activity.type);
  const insets = useSafeAreaInsets();

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    onSave({
      ...activity,
      name: name.trim(),
      dueDate: due,
      weight: parseFloat(weight) || 1,
      type
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Editar Atividade</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.formLabel}>Nome</Text>
          <TextInput style={styles.formInput} value={name} onChangeText={setName} />

          <Text style={styles.formLabel}>Vencimento</Text>
          <TextInput style={styles.formInput} value={due} onChangeText={setDue} placeholder="YYYY-MM-DD" />

          <Text style={styles.formLabel}>Peso</Text>
          <TextInput style={styles.formInput} value={weight} onChangeText={setWeight} keyboardType="numeric" />

          <Text style={styles.formLabel}>Tipo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['prova', 'trabalho', 'exercicio', 'outro'] as Activity['type'][]).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: Colors.border }, type === t && { backgroundColor: Colors.cyan, borderColor: Colors.cyan }]}
              >
                <Text style={[{ fontSize: 12, color: Colors.textSecondary }, type === t && { color: Colors.white }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.cyan }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text, flex: 1, textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  absControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 12 },
  absBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgMuted, alignItems: 'center', justifyContent: 'center' },
  absCount: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  absWarning: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.red, marginTop: 8, textAlign: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: Colors.cyanDim },
  addSmallText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.cyan },
  gradeInput: { backgroundColor: Colors.bgMuted, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 18, borderWidth: 1, borderColor: Colors.border, textAlign: 'center' },
  saveBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.white },
  gradesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gradeChip: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gradeValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  formLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  formInput: { backgroundColor: Colors.bgMuted, borderRadius: 10, padding: 10, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  actGroup: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginTop: 8, marginBottom: 6 },
  actName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  actDue: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  actGradeContainer: { width: 60 },
  actGradeInput: { backgroundColor: Colors.bgMuted, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, color: Colors.text, fontSize: 12, borderWidth: 1, borderColor: Colors.border, textAlign: 'center' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
});
