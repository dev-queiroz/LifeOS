import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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
import type { Certification, Project, ProgSession } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';
import { calcProgStats } from '@/services/score';

const PROG_TYPES: { key: ProgSession['type']; label: string; icon: string }[] = [
  { key: 'leetcode', label: 'LeetCode', icon: 'cpu' },
  { key: 'feature', label: 'Feature', icon: 'git-branch' },
  { key: 'bug', label: 'Bug Fix', icon: 'alert-circle' },
  { key: 'deploy', label: 'Deploy', icon: 'upload-cloud' },
  { key: 'study', label: 'Estudo', icon: 'book-open' },
  { key: 'cert', label: 'Certificação', icon: 'award' },
  { key: 'project', label: 'Projeto', icon: 'code' },
];

const STATUS_COLORS: Record<Project['status'], string> = {
  planning: Colors.orange,
  building: Colors.cyan,
  deployed: Colors.green,
  paused: Colors.textMuted,
};

const CERT_STATUS_COLORS: Record<Certification['status'], string> = {
  planned: Colors.textMuted,
  studying: Colors.orange,
  completed: Colors.green,
};

const RADAR_ITEMS = [
  { label: 'Inglês B2+', pct: 0, color: Colors.green },
  { label: 'Portfolio 3+ projetos', pct: 0, color: Colors.purple },
  { label: 'Cert. Cloud', pct: 0, color: Colors.cyan },
  { label: 'LeetCode 50+', pct: 0, color: Colors.orange },
  { label: 'Deploy acessível', pct: 0, color: Colors.accent },
];

type TabKey = 'stats' | 'projects' | 'certs' | 'radar';

function AddSessionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Omit<ProgSession, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<ProgSession['type']>('feature');
  const [duration, setDuration] = useState('60');
  const [output, setOutput] = useState('');

  const handleSave = () => {
    const dur = parseInt(duration);
    if (!dur || dur < 5) { Alert.alert('Duração mínima: 5 min'); return; }
    onSave({ type, duration: dur, output, date: new Date().toISOString() });
    setDuration('60'); setOutput('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sessão Programação</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.typeGrid}>
            {PROG_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, type === t.key && { backgroundColor: Colors.purple + '25', borderColor: Colors.purple }]}
                onPress={() => setType(t.key)}
              >
                <Feather name={t.icon as never} size={14} color={type === t.key ? Colors.purple : Colors.textMuted} />
                <Text style={[styles.typeLabel, type === t.key && { color: Colors.purple }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Duração (min)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Output</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={output} onChangeText={setOutput} multiline placeholder="O que entregou?" placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function AddProjectModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (p: Omit<Project, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tech, setTech] = useState('');
  const [url, setUrl] = useState('');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    onSave({ name: name.trim(), description: desc, status: 'planning', tech: tech.split(',').map((t) => t.trim()).filter(Boolean), url, features: 0, bugsFixed: 0, createdAt: new Date().toISOString() });
    setName(''); setDesc(''); setTech(''); setUrl('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Novo Projeto</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {[
            { label: 'Nome *', value: name, onChange: setName, placeholder: 'Ex: LifeOS API' },
            { label: 'Descrição', value: desc, onChange: setDesc, placeholder: 'Breve descrição' },
            { label: 'Tecnologias (sep. vírgula)', value: tech, onChange: setTech, placeholder: 'React Native, Node.js' },
            { label: 'URL / Repo', value: url, onChange: setUrl, placeholder: 'https://github.com/...' },
          ].map((f) => (
            <View key={f.label}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput style={styles.input} value={f.value} onChangeText={f.onChange} placeholder={f.placeholder} placeholderTextColor={Colors.textMuted} />
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Criar Projeto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProgramacaoScreen() {
  const insets = useSafeAreaInsets();
  const { progSessions, addProgSession, deleteProgSession, projects, addProject, updateProject, deleteProject, certifications, addCertification, deleteCertification } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const [sessionModal, setSessionModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);

  const stats = useMemo(() => calcProgStats(progSessions), [progSessions]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'projects', label: 'Projetos' },
    { key: 'certs', label: 'Certs' },
    { key: 'radar', label: 'Radar' },
  ];

  const deployedProjects = projects.filter((p) => p.status === 'deployed').length;
  const radarItems = [
    { ...RADAR_ITEMS[0], pct: Math.min(100, 0) },
    { ...RADAR_ITEMS[1], pct: Math.min(100, Math.round((projects.length / 3) * 100)) },
    { ...RADAR_ITEMS[2], pct: Math.min(100, Math.round((certifications.filter((c) => c.status === 'completed').length / 1) * 100)) },
    { ...RADAR_ITEMS[3], pct: Math.min(100, Math.round((stats.leetcode / 50) * 100)) },
    { ...RADAR_ITEMS[4], pct: Math.min(100, Math.round((deployedProjects / 1) * 100)) },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.purple} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.purple }]}>Mestre Programação</Text>
            <Text style={styles.subtitle}>{stats.totalHours}h · {projects.length} projetos</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.purpleDim }]} onPress={() => setSessionModal(true)}>
            <Feather name="plus" size={18} color={Colors.purple} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && { backgroundColor: Colors.purpleDim, borderColor: Colors.purple }]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && { color: Colors.purple }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'stats' && (
          <View>
            <View style={styles.statsGrid}>
              {[
                { label: 'LeetCode', value: stats.leetcode, color: Colors.orange, icon: 'cpu' },
                { label: 'Features', value: stats.features, color: Colors.green, icon: 'git-branch' },
                { label: 'Bug Fixes', value: stats.bugs, color: Colors.red, icon: 'alert-circle' },
                { label: 'Deploys', value: deployedProjects, color: Colors.cyan, icon: 'upload-cloud' },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Feather name={s.icon as never} size={20} color={s.color} />
                  <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.sessionBtn, { backgroundColor: Colors.purple }]} onPress={() => setSessionModal(true)}>
              <Feather name="code" size={16} color={Colors.white} />
              <Text style={styles.sessionBtnText}>+ Sessão Programação</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Últimas Sessões</Text>
            {progSessions.length === 0 ? (
              <EmptyState icon="code" title="Nenhuma sessão" description="Registre suas sessões de programação." color={Colors.purple} />
            ) : (
              progSessions.slice(0, 6).map((s) => (
                <View key={s.id} style={styles.sessionRow}>
                  <View style={[styles.sessionIcon, { backgroundColor: Colors.purpleDim }]}>
                    <Feather name={PROG_TYPES.find((t) => t.key === s.type)?.icon as never ?? 'code'} size={14} color={Colors.purple} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionType}>{PROG_TYPES.find((t) => t.key === s.type)?.label ?? s.type}</Text>
                    <Text style={styles.sessionMeta}>{s.duration}min{s.output ? ` · ${s.output.slice(0, 40)}` : ''}</Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.sessionDate}>{s.date.slice(5, 10)}</Text>
                    <TouchableOpacity onPress={() => deleteProgSession(s.id)}>
                      <Feather name="trash-2" size={13} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'projects' && (
          <View>
            <TouchableOpacity style={[styles.sessionBtn, { backgroundColor: Colors.purple }]} onPress={() => setProjectModal(true)}>
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.sessionBtnText}>Novo Projeto</Text>
            </TouchableOpacity>
            {projects.length === 0 ? (
              <EmptyState icon="code" title="Nenhum projeto" description="Adicione seus projetos." color={Colors.purple} />
            ) : (
              projects.map((p) => (
                <GlowCard key={p.id} color={STATUS_COLORS[p.status]}>
                  <View style={styles.projectRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{p.name}</Text>
                      <View style={styles.techRow}>
                        {p.tech.slice(0, 3).map((t) => (
                          <View key={t} style={styles.techChip}>
                            <Text style={styles.techLabel}>{t}</Text>
                          </View>
                        ))}
                      </View>
                      {p.description ? <Text style={styles.projectDesc}>{p.description}</Text> : null}
                    </View>
                    <View style={styles.projectRight}>
                      <Badge
                        label={p.status}
                        color={STATUS_COLORS[p.status]}
                        bg={STATUS_COLORS[p.status] + '25'}
                      />
                      <TouchableOpacity onPress={() => {
                        const nextStatus: Record<Project['status'], Project['status']> = {
                          planning: 'building', building: 'deployed', deployed: 'paused', paused: 'planning',
                        };
                        updateProject({ ...p, status: nextStatus[p.status] });
                      }}>
                        <Feather name="refresh-cw" size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        Alert.alert('Remover', `Remover "${p.name}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Remover', style: 'destructive', onPress: () => deleteProject(p.id) },
                        ]);
                      }}>
                        <Feather name="trash-2" size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlowCard>
              ))
            )}
          </View>
        )}

        {activeTab === 'certs' && (
          <View>
            <TouchableOpacity
              style={[styles.sessionBtn, { backgroundColor: Colors.purple }]}
              onPress={() => addCertification({ name: 'Nova Certificação', provider: '', status: 'planned' })}
            >
              <Feather name="award" size={16} color={Colors.white} />
              <Text style={styles.sessionBtnText}>+ Certificação</Text>
            </TouchableOpacity>
            {certifications.length === 0 ? (
              <EmptyState icon="award" title="Nenhuma certificação" description="Adicione suas certificações." color={Colors.purple} />
            ) : (
              certifications.map((c) => (
                <View key={c.id} style={styles.certRow}>
                  <View style={[styles.certDot, { backgroundColor: CERT_STATUS_COLORS[c.status] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certName}>{c.name}</Text>
                    <Text style={styles.certProvider}>{c.provider || 'Sem emissor'}</Text>
                  </View>
                  <Badge label={c.status} color={CERT_STATUS_COLORS[c.status]} bg={CERT_STATUS_COLORS[c.status] + '25'} />
                  <TouchableOpacity onPress={() => {
                    const next: Record<Certification['status'], Certification['status']> = {
                      planned: 'studying', studying: 'completed', completed: 'planned',
                    };
                    updateCertification({ ...c, status: next[c.status], completedAt: next[c.status] === 'completed' ? new Date().toISOString() : undefined });
                  }}>
                    <Feather name="check-circle" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCertification(c.id)}>
                    <Feather name="trash-2" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'radar' && (
          <View>
            <Text style={styles.radarTitle}>Radar Vaga Internacional</Text>
            {radarItems.map((item) => (
              <View key={item.label} style={styles.radarItem}>
                <View style={styles.radarLabelRow}>
                  <Text style={styles.radarLabel}>{item.label}</Text>
                  <Text style={[styles.radarPct, { color: item.pct >= 100 ? Colors.green : item.pct >= 50 ? Colors.orange : Colors.red }]}>
                    {item.pct >= 100 ? 'PRONTO' : item.pct >= 50 ? 'QUASE' : 'NÃO'}
                  </Text>
                </View>
                <ProgressBar value={item.pct} color={item.color} height={8} />
                <Text style={styles.radarGap}>
                  {item.pct < 100 ? `Gap: ${100 - item.pct}%` : '✓ Alcançado'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddSessionModal visible={sessionModal} onClose={() => setSessionModal(false)} onSave={(s) => addProgSession(s)} />
      <AddProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onSave={(p) => addProject(p)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  tabLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '47%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: Colors.border },
  statVal: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, marginBottom: 14 },
  sessionBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  sessionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sessionType: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  sessionMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionRight: { alignItems: 'flex-end', gap: 4 },
  sessionDate: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  projectRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  projectName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 4 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  techChip: { backgroundColor: Colors.bgMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  techLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  projectDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  projectRight: { alignItems: 'flex-end', gap: 8 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  certDot: { width: 10, height: 10, borderRadius: 5 },
  certName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  certProvider: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  radarTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 14 },
  radarItem: { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  radarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radarLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text },
  radarPct: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  radarGap: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  typeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
