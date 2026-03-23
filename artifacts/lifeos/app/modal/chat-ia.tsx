import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlowCard } from '@/components/ui/GlowCard';
import { Colors } from '@/constants/colors';

const QUOTES = [
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "Não pare quando estiver cansado. Pare quando tiver terminado.", author: "David Goggins" },
  { text: "Sua única competição é quem você era ontem.", author: "Anônimo" },
  { text: "Vontade de ganhar sem vontade de treinar é nada.", author: "Bernardinho" },
  { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt" },
  { text: "Focus follows the session. Just start.", author: "LifeOS" },
  { text: "Berlim em 2031 não é um sonho, é um compromisso.", author: "LifeOS" },
];

export default function ChatModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [quote, setQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const nextQuote = () => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>IA Motivacional</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.botIcon}>
          <View style={styles.iconCircle}>
            <Feather name="cpu" size={40} color={Colors.accent} />
          </View>
          <Text style={styles.botName}>Mindset LifeOS</Text>
          <Text style={styles.botStatus}>Online • Pronto para motivar</Text>
        </View>
        
        <GlowCard color={Colors.accent}>
           <Feather name="quote" size={24} color={Colors.accent} style={{ marginBottom: 16 }} />
           <Text style={styles.quoteText}>{quote.text}</Text>
           <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </GlowCard>

        <TouchableOpacity style={styles.refreshBtn} onPress={nextQuote} activeOpacity={0.8}>
          <Feather name="zap" size={20} color={Colors.white} />
          <Text style={styles.refreshText}>Injetar Motivação</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Use estas palavras como combustível para sua próxima sessão.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: { padding: 4 },
  content: { padding: 24, alignItems: 'center' },
  botIcon: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.accent + '40' },
  botName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  botStatus: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.green, marginTop: 4 },
  quoteText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text, lineHeight: 30 },
  quoteAuthor: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 16, fontStyle: 'italic' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 40, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  refreshText: { color: Colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' },
  footerNote: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 32, textAlign: 'center', paddingHorizontal: 40 },
});
