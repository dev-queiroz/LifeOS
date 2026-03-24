import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState, useEffect } from 'react';
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
import { Colors } from '@/constants/colors';
import type { Certification, Project, ProjectItem, ProgSession } from '@/constants/types';
import { genId, useApp } from '@/context/AppContext';
import { calcProgStats } from '@/services/score';

// Only 2 session types as requested
const PROG_TYPES: { key: ProgSession['type']; label: string; icon: string }[] = [
  { key: 'leetcode', label: 'LeetCode', icon: 'cpu' },
  { key: 'study', label: 'Estudo', icon: 'book-open' },
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

type TabKey = 'stats' | 'projects' | 'certs';

// ---------- Session Modal ----------
function AddSessionModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Omit<ProgSession, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<ProgSession['type']>('leetcode');
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
          <Text style={styles.fieldLabel}>Output / O que estudou?</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} value={output} onChangeText={setOutput} multiline placeholder="Descreva brevemente..." placeholderTextColor={Colors.textMuted} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ---------- Project Modal ----------
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
    onSave({
      name: name.trim(),
      description: desc,
      status: 'planning',
      tech: tech.split(',').map((t) => t.trim()).filter(Boolean),
      url,
      featuresList: [],
      bugsList: [],
      deploysList: [],
      createdAt: new Date().toISOString(),
      features: 0,
      bugsFixed: 0
    });
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
            { label: 'Descrição breve', value: desc, onChange: setDesc, placeholder: 'Breve descrição' },
            { label: 'Stack (sep. vírgula)', value: tech, onChange: setTech, placeholder: 'React Native, Node.js' },
            { label: 'Repo / URL', value: url, onChange: setUrl, placeholder: 'https://github.com/...' },
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

// ---------- Project Sub-Item Modal ----------
function AddProjectItemModal({ visible, projectName, kind, onClose, onSave }: {
  visible: boolean;
  projectName: string;
  kind: 'feature' | 'bugfix' | 'deploy';
  onClose: () => void;
  onSave: (item: Omit<ProjectItem, 'id' | 'createdAt'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [desc, setDesc] = useState('');
  const [link, setLink] = useState('');
  const kindLabels = { feature: 'Feature', bugfix: 'Bug Fix', deploy: 'Deploy' };

  const handleSave = () => {
    if (!desc.trim()) { Alert.alert('Descrição obrigatória'); return; }
    onSave({ description: desc.trim(), link: link.trim() || undefined });
    setDesc(''); setLink('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{kindLabels[kind]}</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>{projectName}</Text>
          <Text style={styles.fieldLabel}>Descrição *</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholder={kind === 'deploy' ? 'O que foi deployado?' : kind === 'feature' ? 'Descreva a feature...' : 'Descreva o bug corrigido...'}
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
          {kind === 'deploy' && (
            <>
              <Text style={styles.fieldLabel}>Link / URL</Text>
              <TextInput style={styles.input} value={link} onChangeText={setLink} placeholder="https://..." placeholderTextColor={Colors.textMuted} />
            </>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Add Certification Modal ----------
function AddCertModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (c: Omit<Certification, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    onSave({
      name: name.trim(),
      provider: provider.trim(),
      description: description.trim(),
      hours: hours ? parseInt(hours) : undefined,
      status: 'planned'
    });
    setName(''); setProvider(''); setDescription(''); setHours('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nova Certificação</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {[
            { label: 'Nome *', value: name, onChange: setName, placeholder: 'Ex: AWS Cloud Practitioner' },
            { label: 'Emissor', value: provider, onChange: setProvider, placeholder: 'Ex: Amazon Web Services' },
            { label: 'Descrição', value: description, onChange: setDescription, placeholder: 'O que aborda?' },
            { label: 'Carga horária (h)', value: hours, onChange: setHours, placeholder: '40', keyboardType: 'numeric' as const },
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
            <Text style={styles.saveBtnText}>Adicionar Certificação</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ====================== EDIT CERT MODAL - CORRIGIDO (sem crash) ======================
function EditCertModal({ visible, cert, onClose, onSave }: {
  visible: boolean;
  cert: Certification | null;
  onClose: () => void;
  onSave: (c: Certification) => void;
}) {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    name: '',
    provider: '',
    description: '',
    hours: '',
  });

  // Atualiza o formulário somente quando o modal abre com um certificado válido
  useEffect(() => {
    if (visible && cert) {
      setForm({
        name: cert.name,
        provider: cert.provider || '',
        description: cert.description || '',
        hours: cert.hours ? String(cert.hours) : '',
      });
    }
  }, [visible, cert]);

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Erro', 'Nome da certificação é obrigatório');
      return;
    }
    if (!cert) return;

    onSave({
      ...cert,
      name: form.name.trim(),
      provider: form.provider.trim(),
      description: form.description.trim(),
      hours: form.hours ? parseInt(form.hours) : undefined,
    });
    onClose();
  };

  if (!visible || !cert) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Editar Certificação</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {[
            { label: 'Nome *', value: form.name, onChange: (v: string) => setForm({ ...form, name: v }) },
            { label: 'Emissor', value: form.provider, onChange: (v: string) => setForm({ ...form, provider: v }) },
            { label: 'Descrição', value: form.description, onChange: (v: string) => setForm({ ...form, description: v }) },
            { label: 'Carga horária (h)', value: form.hours, onChange: (v: string) => setForm({ ...form, hours: v }), keyboardType: 'numeric' as const },
          ].map((f, idx) => (
            <View key={idx}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.label.includes('Nome') ? 'Ex: AWS Cloud Practitioner' : ''}
                placeholderTextColor={Colors.textMuted}
                keyboardType={f.keyboardType}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Atualizar Certificação</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// EditProjectModal também protegido
function EditProjectModal({ visible, project, onClose, onSave }: {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (p: Project) => void;
}) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    name: '',
    description: '',
    tech: '',
    url: '',
  });

  useEffect(() => {
    if (visible && project) {
      setForm({
        name: project.name,
        description: project.description || '',
        tech: project.tech.join(', '),
        url: project.url || '',
      });
    }
  }, [visible, project]);

  const handleSave = () => {
    if (!form.name.trim() || !project) { Alert.alert('Nome obrigatório'); return; }
    onSave({
      ...project,
      name: form.name.trim(),
      description: form.description,
      tech: form.tech.split(',').map(t => t.trim()).filter(Boolean),
      url: form.url.trim() || undefined,
    });
    onClose();
  };

  if (!visible || !project) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Editar Projeto</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {[
            { label: 'Nome *', value: form.name, onChange: (v: string) => setForm({ ...form, name: v }) },
            { label: 'Descrição breve', value: form.description, onChange: (v: string) => setForm({ ...form, description: v }) },
            { label: 'Stack (sep. vírgula)', value: form.tech, onChange: (v: string) => setForm({ ...form, tech: v }) },
            { label: 'Repo / URL', value: form.url, onChange: (v: string) => setForm({ ...form, url: v }) },
          ].map((f, idx) => (
            <View key={idx}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput style={styles.input} value={f.value} onChangeText={f.onChange} placeholder={f.label.includes('Nome') ? 'Ex: LifeOS API' : ''} placeholderTextColor={Colors.textMuted} />
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Atualizar Projeto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ====================== MAIN SCREEN ======================
export default function ProgramacaoScreen() {
  const insets = useSafeAreaInsets();
  const {
    progSessions, addProgSession, deleteProgSession,
    projects, addProject, updateProject, deleteProject,
    certifications, addCertification, updateCertification, deleteCertification
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const [sessionModal, setSessionModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [certModal, setCertModal] = useState(false);
  const [editCert, setEditCert] = useState<Certification | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [subItemModal, setSubItemModal] = useState<{ project: Project; kind: 'feature' | 'bugfix' | 'deploy' } | null>(null);

  const stats = useMemo(() => calcProgStats(progSessions, projects), [progSessions, projects]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'projects', label: 'Projetos' },
    { key: 'certs', label: 'Certs' },
  ];

  const handleAddSubItem = (project: Project, kind: 'feature' | 'bugfix' | 'deploy', item: Omit<ProjectItem, 'id' | 'createdAt'>) => {
    const newItem: ProjectItem = { ...item, id: genId(), createdAt: new Date().toISOString() };
    if (kind === 'feature') {
      updateProject({ ...project, featuresList: [...(project.featuresList ?? []), newItem] });
    } else if (kind === 'bugfix') {
      updateProject({ ...project, bugsList: [...(project.bugsList ?? []), newItem] });
    } else {
      updateProject({ ...project, deploysList: [...(project.deploysList ?? []), newItem] });
    }
    setSubItemModal(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.purple} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.purple }]}>Programação</Text>
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

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <View>
            <View style={styles.statsGrid}>
              {[
                { label: 'LeetCode', value: stats.leetcode, color: Colors.orange, icon: 'cpu' },
                { label: 'Horas Total', value: `${stats.totalHours}h`, color: Colors.purple, icon: 'clock' },
                { label: 'Linguagem Top', value: stats.topLanguage, color: Colors.cyan, icon: 'code' },
                { label: 'Streak Coding', value: `${stats.streak}d`, color: Colors.green, icon: 'zap' },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Feather name={s.icon as never} size={16} color={s.color} />
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                  <Text style={[styles.statVal, { color: s.color }]} numberOfLines={1}>{s.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.sessionBtn, { backgroundColor: Colors.purple }]} onPress={() => setSessionModal(true)}>
              <Feather name="code" size={16} color={Colors.white} />
              <Text style={styles.sessionBtnText}>+ Sessão Programação</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Últimas Sessões</Text>
            {progSessions.length === 0 ? (
              <EmptyState icon="code" title="Nenhuma sessão" color={Colors.purple} />
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

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <View>
            <TouchableOpacity style={[styles.sessionBtn, { backgroundColor: Colors.purple }]} onPress={() => setProjectModal(true)}>
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.sessionBtnText}>Novo Projeto</Text>
            </TouchableOpacity>
            {projects.length === 0 ? (
              <EmptyState icon="code" title="Nenhum projeto" color={Colors.purple} />
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
                      <Badge label={p.status} color={STATUS_COLORS[p.status]} bg={STATUS_COLORS[p.status] + '25'} />
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => setEditProject(p)}>
                          <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                        </TouchableOpacity>
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
                  </View>

                  {/* Project Timeline (Mini) */}
                  {((p.featuresList?.length || 0) + (p.bugsList?.length || 0) + (p.deploysList?.length || 0)) > 0 && (
                    <View style={styles.timelineContainer}>
                      <Text style={styles.timelineTitle}>Histórico Recente</Text>
                      {[...(p.featuresList || []), ...(p.bugsList || []), ...(p.deploysList || [])]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 3)
                        .map(item => (
                          <View key={item.id} style={styles.timelineItem}>
                            <View style={[styles.timelineDot, {
                              backgroundColor: p.featuresList?.some(f => f.id === item.id) ? Colors.green :
                                p.bugsList?.some(b => b.id === item.id) ? Colors.red : Colors.cyan
                            }]} />
                            <Text style={styles.timelineText} numberOfLines={1}>{item.description}</Text>
                          </View>
                        ))}
                    </View>
                  )}

                  {/* Sub-item action buttons */}
                  <View style={styles.subBtnsRow}>
                    {[
                      { kind: 'feature' as const, label: 'Feature', icon: 'git-branch', color: Colors.green, count: p.featuresList?.length ?? 0 },
                      { kind: 'bugfix' as const, label: 'Bug Fix', icon: 'alert-circle', color: Colors.red, count: p.bugsList?.length ?? 0 },
                      { kind: 'deploy' as const, label: 'Deploy', icon: 'upload-cloud', color: Colors.cyan, count: p.deploysList?.length ?? 0 },
                    ].map(btn => (
                      <TouchableOpacity
                        key={btn.kind}
                        style={[styles.subBtn, { borderColor: btn.color + '50' }]}
                        onPress={() => setSubItemModal({ project: p, kind: btn.kind })}
                      >
                        <Feather name={btn.icon as never} size={12} color={btn.color} />
                        <Text style={[styles.subBtnText, { color: btn.color }]}>{btn.count} {btn.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GlowCard>
              ))
            )}
          </View>
        )}

        {/* CERTS TAB */}
        {activeTab === 'certs' && (
          <View>
            <TouchableOpacity
              style={[styles.sessionBtn, { backgroundColor: Colors.purple }]}
              onPress={() => setCertModal(true)}
            >
              <Feather name="award" size={16} color={Colors.white} />
              <Text style={styles.sessionBtnText}>+ Certificação</Text>
            </TouchableOpacity>
            {certifications.length === 0 ? (
              <EmptyState icon="award" title="Nenhuma certificação" color={Colors.purple} />
            ) : (
              certifications.map((c) => (
                <View key={c.id} style={styles.certRow}>
                  <View style={[styles.certDot, { backgroundColor: CERT_STATUS_COLORS[c.status] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certName}>{c.name}</Text>
                    <Text style={styles.certProvider}>{c.provider || 'Sem emissor'}{c.hours ? ` · ${c.hours}h` : ''}</Text>
                    {c.description ? <Text style={styles.certDesc}>{c.description}</Text> : null}
                  </View>
                  <Badge label={c.status} color={CERT_STATUS_COLORS[c.status]} bg={CERT_STATUS_COLORS[c.status] + '25'} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setEditCert(c)}>
                      <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      const next: Record<Certification['status'], Certification['status']> = {
                        planned: 'studying', studying: 'completed', completed: 'planned',
                      };
                      updateCertification({
                        ...c,
                        status: next[c.status],
                        completedAt: next[c.status] === 'completed' ? new Date().toISOString() : undefined
                      });
                    }}>
                      <Feather name="check-circle" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteCertification(c.id)}>
                      <Feather name="trash-2" size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modais */}
      <AddSessionModal visible={sessionModal} onClose={() => setSessionModal(false)} onSave={addProgSession} />
      <AddProjectModal visible={projectModal} onClose={() => setProjectModal(false)} onSave={addProject} />
      <AddCertModal visible={certModal} onClose={() => setCertModal(false)} onSave={addCertification} />

      <EditCertModal
        visible={!!editCert}
        cert={editCert}
        onClose={() => setEditCert(null)}
        onSave={updateCertification}
      />

      <EditProjectModal
        visible={!!editProject}
        project={editProject}
        onClose={() => setEditProject(null)}
        onSave={updateProject}
      />

      {subItemModal && (
        <AddProjectItemModal
          visible={true}
          projectName={subItemModal.project.name}
          kind={subItemModal.kind}
          onClose={() => setSubItemModal(null)}
          onSave={(item) => handleAddSubItem(subItemModal.project, subItemModal.kind, item)}
        />
      )}
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
  statCard: { width: '47%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: Colors.border },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statVal: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, textTransform: 'uppercase' },
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
  subBtnsRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  subBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  subBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  certDot: { width: 10, height: 10, borderRadius: 5 },
  certName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  certProvider: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  certDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  typeLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  timelineContainer: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border + '50' },
  timelineTitle: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timelineDot: { width: 6, height: 6, borderRadius: 3 },
  timelineText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
