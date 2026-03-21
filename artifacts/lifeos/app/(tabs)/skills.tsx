import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatRow } from '@/components/ui/StatRow';
import { Colors } from '@/constants/colors';
import type { Certification, EnglishSession, Project, ProgSession } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';

type Tab = 'ingles' | 'programacao';

const RADAR_ITEMS = [
  { label: 'Ingles B2+', key: 'ingles', target: 500 },
  { label: 'GitHub publico ativo', key: 'github', target: 30 },
  { label: 'Projeto deploy real', key: 'deploy', target: 3 },
  { label: 'LeetCode 100+', key: 'leetcode', target: 100 },
  { label: 'Certificacao AWS/GCP', key: 'cert', target: 1 },
];

export default function SkillsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('ingles');
  const { englishSessions, addEnglishSession, deleteEnglishSession, progSessions, addProgSession, deleteProgSession, projects, addProject, deleteProject, certifications, addCertification, deleteCertification, settings } = useApp();

  const totalEngHours = Math.round(englishSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
  const engStreak = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (englishSessions.some((s) => s.date === ds)) streak++;
      else break;
    }
    return streak;
  })();

  const leetcodeCount = progSessions.filter((s) => s.type === 'leetcode').length;
  const deployedCount = projects.filter((p) => p.status === 'deployed').length;
  const certsCount = certifications.filter((c) => c.status === 'completed').length;

  const [showAddEng, setShowAddEng] = useState(false);
  const [engDuration, setEngDuration] = useState('30');
  const [engType, setEngType] = useState<EnglishSession['type']>('speaking');
  const [engNotes, setEngNotes] = useState('');

  const [showAddProj, setShowAddProj] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  const handleAddEng = async () => {
    const session: EnglishSession = {
      id: genId(),
      type: engType,
      duration: parseInt(engDuration) || 30,
      notes: engNotes,
      date: new Date().toISOString().split('T')[0],
    };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addEnglishSession(session);
    setEngDuration('30');
    setEngNotes('');
    setShowAddEng(false);
  };

  const handleAddProj = async () => {
    if (!projName.trim()) return;
    const proj: Project = {
      id: genId(),
      name: projName.trim(),
      description: projDesc.trim(),
      status: 'building',
      tech: [],
      features: 0,
      bugsFixed: 0,
      createdAt: new Date().toISOString(),
    };
    if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addProject(proj);
    setProjName('');
    setProjDesc('');
    setShowAddProj(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <Text style={styles.screenTitle}>Skills</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['ingles', 'programacao'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => { setTab(t); if (settings.haptics) Haptics.selectionAsync(); }}
              style={[styles.tabBtn, tab === t && { backgroundColor: t === 'ingles' ? Colors.greenDim : Colors.purpleDim }]}
            >
              <Text style={[styles.tabBtnText, tab === t && { color: t === 'ingles' ? Colors.green : Colors.purple }]}>
                {t === 'ingles' ? 'Ingles Fluente' : 'Mestre Prog.'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'ingles' ? (
          <>
            {/* English Dashboard */}
            <View style={styles.scoreRow}>
              <ScoreRing
                value={(totalEngHours / 500) * 100}
                size={110}
                strokeWidth={8}
                color={Colors.green}
                label={`${totalEngHours}h / 500h`}
                sublabel="Meta Fluencia"
              />
              <View style={{ flex: 1, gap: 8 }}>
                <StatRow items={[
                  { label: 'Streak', value: `${engStreak}d`, color: Colors.green },
                  { label: 'Total horas', value: `${totalEngHours}h`, color: Colors.cyan },
                ]} />
                <ProgressBar value={totalEngHours} max={500} color={Colors.green} height={8} />
                <Text style={styles.progressLabel}>{Math.round((totalEngHours / 500) * 100)}% da meta 500h</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowAddEng(!showAddEng)}
              style={[styles.addBtn, { backgroundColor: Colors.greenDim, borderColor: Colors.green + '40' }]}
            >
              <Feather name={showAddEng ? 'minus' : 'plus'} size={16} color={Colors.green} />
              <Text style={[styles.addBtnText, { color: Colors.green }]}>Registrar Sessao</Text>
            </Pressable>

            {showAddEng && (
              <GlowCard color={Colors.green}>
                <Text style={styles.formLabel}>Tipo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(['speaking', 'listening', 'reading', 'writing', 'vocab', 'class'] as EnglishSession['type'][]).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setEngType(t)}
                      style={[styles.chip, engType === t && { backgroundColor: Colors.green + '30', borderColor: Colors.green }]}
                    >
                      <Text style={[styles.chipText, engType === t && { color: Colors.green }]}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Duracao (min)</Text>
                <TextInput
                  style={styles.formInput}
                  value={engDuration}
                  onChangeText={setEngDuration}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Notas</Text>
                <TextInput
                  style={styles.formInput}
                  value={engNotes}
                  onChangeText={setEngNotes}
                  placeholder="O que voce praticou?"
                  placeholderTextColor={Colors.textMuted}
                />
                <Pressable onPress={handleAddEng} style={[styles.saveSmall, { backgroundColor: Colors.green }]}>
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </Pressable>
              </GlowCard>
            )}

            <SectionHeader title="Historico" actionLabel="" />
            {englishSessions.length === 0 ? (
              <EmptyState icon="globe" title="Nenhuma sessao" subtitle="Registre suas praticas de ingles" />
            ) : (
              englishSessions.slice(0, 10).map((s) => (
                <GlowCard key={s.id} color={Colors.border} padding={12}>
                  <View style={styles.sessionRow}>
                    <Badge label={s.type} color={Colors.green} bg={Colors.greenDim} />
                    <Text style={styles.sessionMeta}>{s.duration}min</Text>
                    <Text style={styles.sessionDate}>{s.date}</Text>
                    <Pressable onPress={() => deleteEnglishSession(s.id)}>
                      <Feather name="trash-2" size={14} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                  {s.notes ? <Text style={styles.sessionNotes}>{s.notes}</Text> : null}
                </GlowCard>
              ))
            )}
          </>
        ) : (
          <>
            {/* Prog Dashboard */}
            <StatRow items={[
              { label: 'LeetCode', value: `${leetcodeCount}`, color: Colors.purple },
              { label: 'Projetos deploy', value: `${deployedCount}`, color: Colors.green },
              { label: 'Certs', value: `${certsCount}`, color: Colors.cyan },
              { label: 'Sessoes', value: `${progSessions.length}`, color: Colors.accent },
            ]} />

            <View style={{ height: 16 }} />

            {/* Radar Internacional */}
            <SectionHeader title="Radar Vaga Internacional" />
            <GlowCard color={Colors.purple}>
              {RADAR_ITEMS.map((item) => {
                const current = item.key === 'ingles' ? totalEngHours
                  : item.key === 'leetcode' ? leetcodeCount
                  : item.key === 'deploy' ? deployedCount
                  : item.key === 'cert' ? certsCount
                  : 0;
                const pct = Math.min(100, (current / item.target) * 100);
                const status = pct >= 100 ? 'PRONTO' : pct >= 60 ? 'QUASE' : 'NAO';
                const statusColor = status === 'PRONTO' ? Colors.green : status === 'QUASE' ? Colors.orange : Colors.red;
                return (
                  <View key={item.key} style={styles.radarItem}>
                    <View style={styles.radarLeft}>
                      <Text style={styles.radarLabel}>{item.label}</Text>
                      <ProgressBar value={current} max={item.target} color={statusColor} height={4} />
                    </View>
                    <Badge label={status} color={statusColor} bg={statusColor + '20'} size="md" />
                  </View>
                );
              })}
            </GlowCard>

            {/* Projects */}
            <SectionHeader
              title="Projetos"
              actionLabel="+ Projeto"
              onAction={() => setShowAddProj(!showAddProj)}
            />
            {showAddProj && (
              <GlowCard color={Colors.purple}>
                <Text style={styles.formLabel}>Nome do Projeto</Text>
                <TextInput
                  style={styles.formInput}
                  value={projName}
                  onChangeText={setProjName}
                  placeholder="Ex: SaaS de produtividade"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={[styles.formLabel, { marginTop: 12 }]}>Descricao</Text>
                <TextInput
                  style={styles.formInput}
                  value={projDesc}
                  onChangeText={setProjDesc}
                  placeholder="Breve descricao..."
                  placeholderTextColor={Colors.textMuted}
                />
                <Pressable onPress={handleAddProj} style={[styles.saveSmall, { backgroundColor: Colors.purple }]}>
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </Pressable>
              </GlowCard>
            )}

            {projects.length === 0 ? (
              <EmptyState
                icon="code"
                title="Nenhum projeto"
                subtitle="Adicione seus projetos em andamento"
                actionLabel="+ Projeto"
                onAction={() => setShowAddProj(true)}
              />
            ) : (
              projects.map((p) => (
                <GlowCard key={p.id} color={Colors.purple} padding={12}>
                  <View style={styles.projRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projName}>{p.name}</Text>
                      <Text style={styles.projDesc} numberOfLines={1}>{p.description}</Text>
                    </View>
                    <Badge
                      label={p.status}
                      color={p.status === 'deployed' ? Colors.green : p.status === 'building' ? Colors.purple : Colors.orange}
                      bg={p.status === 'deployed' ? Colors.greenDim : p.status === 'building' ? Colors.purpleDim : Colors.orangeDim}
                    />
                    <Pressable onPress={() => Alert.alert('Remover', `Remover ${p.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => deleteProject(p.id) }])}>
                      <Feather name="trash-2" size={14} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                </GlowCard>
              ))
            )}

            {/* Certifications */}
            <SectionHeader title="Certificacoes" actionLabel="+ Cert" onAction={async () => {
              const cert: Certification = { id: genId(), name: 'AWS Cloud Practitioner', provider: 'AWS', status: 'studying' };
              if (settings.haptics) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addCertification(cert);
            }} />
            {certifications.length === 0 ? (
              <EmptyState icon="award" title="Nenhuma certificacao" subtitle="Adicione suas metas de certificacao" />
            ) : (
              certifications.map((c) => (
                <GlowCard key={c.id} color={Colors.border} padding={12}>
                  <View style={styles.certRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.certName}>{c.name}</Text>
                      <Text style={styles.certProvider}>{c.provider}</Text>
                    </View>
                    <Badge
                      label={c.status}
                      color={c.status === 'completed' ? Colors.green : Colors.orange}
                      bg={c.status === 'completed' ? Colors.greenDim : Colors.orangeDim}
                    />
                  </View>
                </GlowCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.bgCard, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  addBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  formLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  formInput: { backgroundColor: Colors.bgMuted, borderRadius: 10, padding: 10, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  saveSmall: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.white },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionMeta: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text },
  sessionDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionNotes: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 6 },
  radarItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  radarLeft: { flex: 1, gap: 4 },
  radarLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text },
  projRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  projName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  projDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  certName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  certProvider: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
});
