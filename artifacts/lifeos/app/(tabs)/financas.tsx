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
import type { FinanceEntry, FreelanceProject } from '@/constants/types';
import { useApp } from '@/context/AppContext';

type TabKey = 'balanco' | 'freelance';

function AddFinanceModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (f: Omit<FinanceEntry, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { Alert.alert('Valor inválido'); return; }
    if (!category.trim()) { Alert.alert('Categoria obrigatória'); return; }
    onSave({ type, amount: val, category: category.trim(), description: desc.trim() || category, date: new Date().toISOString() });
    setAmount(''); setCategory(''); setDesc('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nova Movimentação</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.typeToggle}>
            <TouchableOpacity 
                style={[styles.toggleBtn, type === 'expense' && { backgroundColor: Colors.red + '20', borderColor: Colors.red }]} 
                onPress={() => setType('expense')}
            >
              <Text style={[styles.toggleText, type === 'expense' && { color: Colors.red }]}>Despesa</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleBtn, type === 'income' && { backgroundColor: Colors.green + '20', borderColor: Colors.green }]} 
                onPress={() => setType('income')}
            >
              <Text style={[styles.toggleText, type === 'income' && { color: Colors.green }]}>Receita</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.fieldLabel}>Valor (R$)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor={Colors.textMuted} autoFocus />
          
          <Text style={styles.fieldLabel}>Categoria</Text>
          <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Ex: Alimentação, Aluguel..." placeholderTextColor={Colors.textMuted} />
          
          <Text style={styles.fieldLabel}>Descrição</Text>
          <TextInput style={styles.input} value={desc} onChangeText={setDesc} placeholder="Opcional" placeholderTextColor={Colors.textMuted} />
          
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: type === 'income' ? Colors.green : Colors.red }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function AddFreelanceModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (p: Omit<FreelanceProject, 'id'>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [client, setClient] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('R$');

  const handleSave = () => {
    if (!client.trim() || !title.trim()) { Alert.alert('Campos obrigatórios'); return; }
    const val = parseFloat(value) || 0;
    onSave({ 
        client: client.trim(), 
        title: title.trim(), 
        value: val, 
        currency, 
        status: 'lead', 
        notes: '', 
        createdAt: new Date().toISOString() 
    });
    setClient(''); setTitle(''); setValue('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { paddingTop: insets.top + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Novo Lead Freelance</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.fieldLabel}>Cliente</Text>
          <TextInput style={styles.input} value={client} onChangeText={setClient} placeholder="Nome da empresa ou pessoa" placeholderTextColor={Colors.textMuted} />
          <Text style={styles.fieldLabel}>Projeto</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Website Institucional" placeholderTextColor={Colors.textMuted} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 80 }}>
                <Text style={styles.fieldLabel}>Moeda</Text>
                <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="R$" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Valor Estimado</Text>
                <TextInput style={styles.input} value={value} onChangeText={setValue} keyboardType="numeric" placeholder="0.00" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
          
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.orange }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Adicionar ao Pipeline</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function FinancasScreen() {
  const insets = useSafeAreaInsets();
  const { settings, finances, addFinance, deleteFinance, freelance, addFreelance, updateFreelance, deleteFreelance } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('balanco');
  const [entryModal, setEntryModal] = useState(false);
  const [freelaModal, setFreelaModal] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthEntries = finances.filter(f => {
      const d = new Date(f.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = monthEntries.filter(f => f.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = monthEntries.filter(f => f.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;

    return { income, expense, balance };
  }, [finances]);

  const freelaStats = useMemo(() => {
    const active = freelance.filter(p => p.status === 'active' || p.status === 'lead' || p.status === 'proposal');
    const totalNegotiation = active.reduce((a, b) => a + b.value, 0);
    const leadsCount = freelance.filter(p => p.status === 'lead').length;
    return { activeCount: active.length, totalNegotiation, leadsCount };
  }, [freelance]);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.green }]}>Finanças & Freelance</Text>
            <Text style={styles.subtitle}>Balanço Mensal: R$ {stats.balance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          {(['balanco', 'freelance'] as TabKey[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && { backgroundColor: Colors.green + '15', borderColor: Colors.green }]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabLabel, activeTab === t && { color: Colors.green }]}>
                {t === 'balanco' ? 'Balanço' : 'Freelance'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'balanco' ? (
          <View>
             <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.bgCard }]}>
            <Text style={styles.statLabel}>Entradas</Text>
            <Text style={[styles.statValue, { color: Colors.green }]}>
              R$ {stats.income.toLocaleString('pt-BR')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.bgCard }]}>
            <Text style={styles.statLabel}>Saídas</Text>
            <Text style={[styles.statValue, { color: Colors.red }]}>
              R$ {stats.expense.toLocaleString('pt-BR')}
            </Text>
          </View>
        </View>

        {settings.reserveTarget && (
          <GlowCard color={Colors.accent}>
            <View style={styles.reserveHeader}>
              <Text style={styles.reserveTitle}>Reserva de Emergência</Text>
              <Text style={styles.reserveValue}>
                {Math.round((stats.balance / (settings.reserveTarget || 1)) * 100)}%
              </Text>
            </View>
            <ProgressBar 
              value={(stats.balance / settings.reserveTarget) * 100} 
              color={Colors.accent} 
              height={8} 
            />
            <Text style={styles.reserveMeta}>
              R$ {stats.balance.toLocaleString('pt-BR')} de R$ {settings.reserveTarget.toLocaleString('pt-BR')}
            </Text>
          </GlowCard>
        )}

             <TouchableOpacity style={[styles.mainAction, { backgroundColor: Colors.green }]} onPress={() => setEntryModal(true)}>
                <Feather name="plus-circle" size={18} color={Colors.white} />
                <Text style={styles.mainActionText}>Lançar Movimentação</Text>
             </TouchableOpacity>

             <Text style={styles.sectionTitle}>Últimos Lançamentos</Text>
             {finances.length === 0 ? (
                <EmptyState icon="dollar-sign" title="Sem lançamentos" description="Registre suas finanças aqui." color={Colors.green} />
             ) : (
                finances.slice(0, 10).map(f => (
                  <View key={f.id} style={styles.entryRow}>
                    <View style={[styles.entryIcon, { backgroundColor: f.type === 'income' ? Colors.green + '15' : Colors.red + '15' }]}>
                      <Feather name={f.type === 'income' ? "arrow-up-right" : "arrow-down-left"} size={16} color={f.type === 'income' ? Colors.green : Colors.red} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryDesc}>{f.description}</Text>
                      <Text style={styles.entryMeta}>{f.date.slice(5, 10)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.entryAmount, { color: f.type === 'income' ? Colors.green : Colors.red }]}>
                        {f.type === 'income' ? '+' : '-'} R$ {f.amount.toFixed(2)}
                        </Text>
                        <TouchableOpacity onPress={() => deleteFinance(f.id)}>
                        <Feather name="trash-2" size={13} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                  </View>
                ))
             )}
          </View>
        ) : (
          <View>
             <View style={styles.statsRow}>
                <View style={styles.miniStat}>
                   <Text style={styles.miniStatLabel}>Leads</Text>
                   <Text style={styles.miniStatVal}>{freelaStats.leadsCount}</Text>
                </View>
                <View style={[styles.miniStat, { flex: 2 }]}>
                   <Text style={styles.miniStatLabel}>Em Negociação</Text>
                   <Text style={[styles.miniStatVal, { color: Colors.orange }]}>R$ {freelaStats.totalNegotiation.toFixed(0)}</Text>
                </View>
             </View>

             <TouchableOpacity style={[styles.mainAction, { backgroundColor: Colors.orange }]} onPress={() => setFreelaModal(true)}>
                <Feather name="user-plus" size={18} color={Colors.white} />
                <Text style={styles.mainActionText}>Novo Lead Freelance</Text>
             </TouchableOpacity>

             <Text style={styles.sectionTitle}>Pipeline Freelance</Text>
             {freelance.length === 0 ? (
                <EmptyState icon="briefcase" title="Sem projetos" description="Adicione seus leads e projetos freelance." color={Colors.orange} />
             ) : (
                freelance.map(p => (
                   <GlowCard key={p.id} color={Colors.orange}>
                      <View style={styles.freelaHeader}>
                         <View style={{ flex: 1 }}>
                            <Text style={styles.freelaClient}>{p.client}</Text>
                            <Text style={styles.freelaTitle}>{p.title}</Text>
                         </View>
                         <Badge label={p.status} color={Colors.orange} bg={Colors.orange + '15'} />
                      </View>
                      <View style={styles.freelaFooter}>
                         <Text style={styles.freelaValue}>{p.currency} {p.value.toFixed(2)}</Text>
                         <View style={styles.freelaActions}>
                            <TouchableOpacity onPress={() => {
                               const next: Record<string, string> = { lead: 'proposal', proposal: 'active', active: 'completed', completed: 'lead', lost: 'lead' };
                               updateFreelance({ ...p, status: (next[p.status] || 'lead') as any });
                            }}>
                               <Feather name="refresh-cw" size={15} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteFreelance(p.id)}>
                               <Feather name="trash-2" size={15} color={Colors.textMuted} />
                            </TouchableOpacity>
                         </View>
                      </View>
                   </GlowCard>
                ))
             )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddFinanceModal visible={entryModal} onClose={() => setEntryModal(false)} onSave={addFinance} />
      <AddFreelanceModal visible={freelaModal} onClose={() => setFreelaModal(false)} onSave={addFreelance} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  tabLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 }, // New style
  statCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, gap: 4 }, // New style
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' }, // Modified statValue
  reserveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, // New style
  reserveTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text }, // New style
  reserveValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.accent }, // New style
  reserveMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 8 }, // New style
  mainAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, marginBottom: 20, marginTop: 14 }, // Added marginTop
  mainActionText: { color: Colors.white, fontSize: 15, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginTop: 20, marginBottom: 12 }, // Modified sectionTitle
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  entryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryDesc: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  entryMeta: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  entryAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  miniStat: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  miniStatLabel: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_500Medium' },
  miniStatVal: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  freelaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  freelaClient: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text },
  freelaTitle: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  freelaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border + '20' },
  freelaValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text },
  freelaActions: { flexDirection: 'row', gap: 12 },
  modal: { flex: 1, backgroundColor: Colors.bg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalContent: { padding: 20, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  toggleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
