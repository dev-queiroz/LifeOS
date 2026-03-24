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
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowCard } from '@/components/ui/GlowCard';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const CATEGORIES = ['Aluguel', 'Educação', 'Lazer', 'Saúde', 'Trabalho', 'Viagem', 'Outros'];

export default function FinancasScreen() {
  const insets = useSafeAreaInsets();
  const { finances, addFinance, deleteFinance, settings } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');

  const totalBalance = useMemo(() => {
    return finances.reduce((acc, f) => acc + (f.type === 'income' ? f.amount : -f.amount), 0);
  }, [finances]);

  const incomeTotal = useMemo(() => {
    return finances.filter(f => f.type === 'income').reduce((acc, f) => acc + f.amount, 0);
  }, [finances]);

  const expenseTotal = useMemo(() => {
    return finances.filter(f => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0);
  }, [finances]);

  const handleSave = () => {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor maior que zero.');
      return;
    }
    addFinance({
      type,
      category,
      amount: val,
      description: description.trim(),
      date: new Date().toISOString(),
    });
    setAmount('');
    setDescription('');
    setModalVisible(false);
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}
      >
        <View style={styles.header}>
          <SidebarToggle color={Colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: Colors.green }]}>Finanças</Text>
            <Text style={styles.subtitle}>Gestão de Entradas e Saídas</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: Colors.greenDim }]} 
            onPress={() => setModalVisible(true)}
          >
            <Feather name="plus" size={18} color={Colors.green} />
          </TouchableOpacity>
        </View>

        <GlowCard color={Colors.green}>
          <Text style={styles.balanceLabel}>Saldo Atual</Text>
          <Text style={[styles.balanceVal, { color: totalBalance >= 0 ? Colors.green : Colors.red }]}>
            R$ {formatBRL(totalBalance)}
          </Text>
          <View style={styles.balanceStats}>
            <View>
              <Text style={styles.statLabel}>Entradas</Text>
              <Text style={[styles.statValue, { color: Colors.green }]}>+ R$ {formatBRL(incomeTotal)}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Saídas</Text>
              <Text style={[styles.statValue, { color: Colors.red }]}>- R$ {formatBRL(expenseTotal)}</Text>
            </View>
          </View>
          {settings.reserveTarget && (
             <View style={styles.reserveProgress}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.reserveLabel}>Meta de Reserva</Text>
                  <Text style={styles.reserveValue}>{Math.round((totalBalance / settings.reserveTarget) * 100)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, Math.max(0, (totalBalance / settings.reserveTarget) * 100))}%`, 
                        backgroundColor: Colors.green 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.reserveSub}>Faltam R$ {formatBRL(Math.max(0, settings.reserveTarget - totalBalance))} para atingir R$ {formatBRL(settings.reserveTarget)}</Text>
             </View>
          )}
        </GlowCard>

        <Text style={styles.sectionTitle}>Histórico Recente</Text>
        {finances.length === 0 ? (
          <EmptyState 
            icon="dollar-sign" 
            title="Nenhum lançamento" 
            subtitle="Registre sua primeira entrada ou saída para começar." 
          />
        ) : (
          [...finances].reverse().slice(0, 20).map(f => (
            <View key={f.id} style={styles.entryItem}>
              <View style={[styles.entryIcon, { backgroundColor: f.type === 'income' ? Colors.greenDim : Colors.redDim }]}>
                <Feather 
                  name={f.type === 'income' ? 'trending-up' : 'trending-down'} 
                  size={14} 
                  color={f.type === 'income' ? Colors.green : Colors.red} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryDesc} numberOfLines={1}>{f.description || f.category}</Text>
                <Text style={styles.entryMeta}>{f.category} • {new Date(f.date).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.entryAmount, { color: f.type === 'income' ? Colors.green : Colors.red }]}>
                  {f.type === 'income' ? '+' : '-'} R$ {f.amount.toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Remover', 'Deseja remover este lançamento?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', style: 'destructive', onPress: () => deleteFinance(f.id) }
                  ]);
                }}>
                   <Feather name="trash-2" size={11} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Novo Lançamento</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && { backgroundColor: Colors.redDim, borderColor: Colors.red }]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && { color: Colors.red }]}>Saída</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && { backgroundColor: Colors.greenDim, borderColor: Colors.green }]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeBtnText, type === 'income' && { color: Colors.green }]}>Entrada</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput 
              style={styles.input} 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric" 
              placeholder="0,00" 
              placeholderTextColor={Colors.textMuted} 
              autoFocus 
            />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.catChip, category === c && { backgroundColor: Colors.greenDim, borderColor: Colors.green }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catLabel, category === c && { color: Colors.green }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descrição</Text>
            <TextInput 
              style={styles.input} 
              value={description} 
              onChangeText={setDescription} 
              placeholder="Ex: Compras no mercado" 
              placeholderTextColor={Colors.textMuted} 
            />

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: type === 'income' ? Colors.green : Colors.accent }]} 
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Confirmar Lançamento</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  balanceVal: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', marginVertical: 8 },
  balanceStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border + '50' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  reserveProgress: { marginTop: 24 },
  reserveLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  reserveValue: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.green },
  reserveSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 6 },
  progressBar: { height: 6, backgroundColor: Colors.bgMuted, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text, marginTop: 24, marginBottom: 16 },
  entryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  entryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryDesc: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  entryMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  entryAmount: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  modalBody: { padding: 20 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWhidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1 },
  typeBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },
  label: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  catLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
});
