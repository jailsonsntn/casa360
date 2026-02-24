
# 🏠 Casa360 — Gestão Residencial Inteligente

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://casa360-eight.vercel.app/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

O **Casa360** é um ecossistema digital projetado para centralizar e simplificar a gestão completa de uma residência. Unindo uma interface ultra-moderna (UI/UX) com o poder da Inteligência Artificial Generativa, o aplicativo oferece controle total sobre finanças, rotinas domésticas, saúde e suprimentos.

---

## 🚀 Acesse o Projeto
O deploy oficial está disponível em:  
👉 **[https://casa360-eight.vercel.app/](https://casa360-eight.vercel.app/)**

---

## ✨ Funcionalidades Principais

### 💰 Fluxo de Caixa Avançado
*   **Visão Quinzenal**: Organização automática de receitas e despesas entre a 1ª e 2ª quinzena do mês.
*   **Projeções Fixas**: O sistema identifica gastos recorrentes e gera previsões (forecasts) para os meses seguintes.
*   **Confirmação Ultra-Slim**: Modal customizado de exclusão para evitar erros de lançamento.
*   **Métodos de Pagamento**: Gestão via Pix, Crédito, Débito, Dinheiro e Transferência.

### 📅 Rotina & Kanban
*   **Três Visualizações**: Escolha entre Kanban (Drag & Drop), Checklist clássico ou Calendário interativo.
*   **Urgência Inteligente**: Níveis de prioridade que definem a pontuação do usuário e a intensidade dos alertas.
*   **Notificações Háticas**: Feedback de vibração e som para lembretes críticos de tarefas.

### 💊 Gestão de Saúde
*   **Controle de Estoque**: Monitoramento de medicamentos com aviso automático de estoque baixo.
*   **Histórico de Doses**: Registro rápido de ingestão com um clique.
*   **Alarmes Personalizados**: Configuração de melodias (Cristal, Digital ou Sirene) e intensidades de vibração.

### 🛒 Abastecimento (Shopping List)
*   **Listas Dinâmicas**: Agrupamento por listas específicas (ex: "Mercado", "Farmácia", "Obras").
*   **Categorização por Cores**: Identificação visual rápida do tipo de insumo.

---

## 🎨 Design & Experiência (UI/UX)
*   **Modo Dark/Light Dinâmico**: Interface adaptativa que altera gradientes e sombras para conforto visual.
*   **Dashboard com Orbs de Luz**: O card de saldo utiliza efeitos de *Glassmorphism* e gradientes profundos de acordo com o modo escolhido.
*   **Mobile First**: Experiência de aplicativo nativo (PWA) com menu inferior otimizado para polegares.
*   **Animações Suaves**: Transições em `fade-in`, `zoom-in` e efeitos de flutuação.

---

## 🛠️ Stack Tecnológica

*   **Frontend**: React 19 + TypeScript.
*   **Estilização**: Tailwind CSS (com darkMode class-based).
*   **Backend & Auth**: Supabase (PostgreSQL + Auth + Storage).
*   **Ícones**: Lucide React.
*   **Deploy**: Vercel.

---

## ⚙️ Como rodar localmente

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/casa360.git
    ```
2.  **Instale as dependências**:
    ```bash
    npm install
    ```
3.  **Configure as variáveis de ambiente**:
    Crie um arquivo `.env` com suas chaves do Supabase:
    ```env
    SUPABASE_URL=sua_url
    SUPABASE_ANON_KEY=sua_chave
    ```
4.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

---

## 📄 Licença
Este projeto está sob a licença MIT. Sinta-se à vontade para usar, modificar e distribuir.

---
*Desenvolvido com ❤️ para transformar a gestão do lar.*
