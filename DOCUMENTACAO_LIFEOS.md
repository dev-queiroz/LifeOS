# Documentação Oficial: LifeOS Navigator 🚀

Bem-vindo à documentação oficial do **LifeOS Navigator**, o seu centro de comando para a vida, carreira e longevidade. Este documento detalha a estrutura, funcionalidades e a inteligência por trás de cada tela do ecossistema.

---

## 🏛️ Estratégia & Estrutura
O LifeOS é construído sobre a filosofia de **Consistência > Intensidade**. Ele organiza sua vida em 7 eixos principais, acessíveis através da **Sidebar Lateral Esquerda**.

### Navegação Principal
- **Dashboard (Início)**: Visão geral e Score Global.
- **Faculdade**: Gestão acadêmica e prazos.
- **Inglês Fluente**: Foco em Speaking e simulados.
- **Mestre Programação**: Radar de skills e projetos.
- **Shape & Saúde**: Longevidade, peso e treinos.
- **Finanças & Freelance**: Balanço e pipeline de lucro.
- **Plano 2031**: Visão de longo prazo (Berlim).

---

## 📱 Detalhamento das Telas

### 1. Dashboard (O Cérebro)
A porta de entrada do app, focada no **Score Global (0-100)**.
- **Score Ring**: Visualização dinâmica do seu progresso médio.
- **Breakdown**: Consistência, Eficiência e Foco calculados em tempo real.
- **Áreas Grid**: Cards rápidos para cada setor com barra de progresso individual.
- **Previsão 2031**: Probabilidade de sucesso baseada na sua performance atual.
- **Floating Action**: Botão azul central para lançar sessões rápidas em qualquer lugar.

### 2. Faculdade (O Acadêmico)
Foco em não perder prazos e manter a média.
- **Cards de Matérias**: % de presença e média atual.
- **Calendário de Deadlines**: Lista de entregas próximas com contagem regressiva.
- **Métrica Chave**: Média Global e % de Presença.

### 3. Inglês Fluente (O Passaporte)
Focado no caminho para o B2+/C1.
- **Prática de Speaking**: Contador de horas acumuladas de conversação.
- **Simulados**: Registro de notas (IELTS/TOEFL style).
- **Métrica Chave**: Total de horas de prática e Streak de dias seguidos falando inglês.

### 4. Mestre Programação (O Construtor)
Gestão de hard skills e portfólio.
- **Radar de Skills**: Gráfico de teia mostrando domínio em diferentes stacks.
- **Projetos Concluidos**: Pipeline de repositórios e projetos reais.
- **Top Language**: Identificação automática da linguagem mais praticada.

### 5. Shape & Saúde (A Longevidade)
Transformação física e manutenção de energia.
- **Peso & Bio**: Monitoramento de peso com cálculo de **Delta (Atual vs Inicial)**.
- **IMC Dinâmico**: Calculado automaticamente com base na altura das configurações.
- **Log de Treinos**: Streak de dias ativos e check-in rápido de exercícios.
- **Hidratação**: Contador de copos d'água diários.

### 6. Finanças & Freelance (O Combustível)
Poder de investimento e liberdade geográfica.
- **Balanço Mensal**: Fluxo de caixa simples (Entradas e Saídas).
- **Reserva de Emergência**: Barra de progresso para a meta de liberdade.
- **Freelance Pipeline**: Gestão de leads por status (Lead -> Prova -> Ativo -> Pago).

### 7. Plano 2031 (O Norte)
Onde tudo se conecta.
- **Fases do Destino**: Divisão da vida em 5 fases (de 2024 a 2031).
- **Countdown**: Quantos anos e dias faltam para o marco zero em Berlim.
- **Milestones**: Adição rápida de metas de longo prazo.

---

## ⚙️ Funcionalidades Transversais

### Modais e IA
- **IA Motivacional (Chat IA)**: Um bot de mindset que gera frases de alto impacto e foco.
- **Sessão Rápida**: Modal simplificado para registrar estudos ou trabalho sem atritos.
- **Configurações Centralizadas**: Definição de metas de peso, altura e metas financeiras que impactam todo o app.

---

## 🛠️ Princípios Técnicos
- **Offline-First**: Os dados são salvos localmente via `AsyncStorage`.
- **Pure Functions**: A lógica de score e previsão é isolada em serviços puros (`score.ts`).
- **Glow System**: Design premium usando cartões com brilho dinâmico e tipografia moderna (Inter).

---
*LifeOS Navigator — Construído para quem não aceita o mediano.*
