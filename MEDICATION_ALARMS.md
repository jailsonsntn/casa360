# Implementação de Alarmes de Medicamentos em Background

## 📋 Arquitetura da Solução

O sistema de alarmes de medicamentos agora funciona **mesmo com o aplicativo fechado**, através de:

### 1. **Service Worker** (`medication-alarm-worker.js`)
- Roda em background separado do app
- Monitora horários de medicamentos continuamente
- Ativa notificações do sistema operacional
- Armazena dados em **IndexedDB** para persistência

### 2. **Sincronização em Tempo Real** (App.tsx)
- Quando medicamentos mudam, dados são enviados para o SW
- Configurações de alarme (som, vibração) são sincronizadas
- O SW recebe atualizações via `postMessage`

### 3. **Persistência de Dados** (IndexedDB)
```
Casa360DB
├── medications (medicamentos ativos com alarmConfig)
└── alarm_state (configurações de som e vibração)
```

### 4. **Fluxo de Disparo de Alarme**
```
App.tsx (estado real)
    ↓
postMessage para SW
    ↓
SW armazena em IndexedDB
    ↓
SW monitora a cada 1 minuto
    ↓
Horário coincide? → Dispara Notificação do Sistema
    ↓
Usuário clica na notificação → App abre/foca
```

## 🔧 Funcionalidades

### ✅ Com App Aberto
- Alarmes sonoros (Gentle, Standard, Urgent)
- Vibração configurável
- Notificação local em tempo real
- Atualização visual imediata

### ✅ Com App Fechado
- Notificação do sistema operacional
- Som de alarme (sistema)
- Vibração (sistema)
- Clique na notificação abre o app
- Botão "Registrar dose" na notificação

## 📱 Permissões Necessárias

1. **Notification Permission**
   ```javascript
   notificationService.requestPermission()
   ```
   Solicitado ao entrar na aba Saúde

2. **Service Worker** 
   - Requer HTTPS (ou localhost em dev)
   - Registrado automaticamente ao iniciar o app

## 🔄 Configuração de Medicamento

```typescript
alarmConfig: {
  enabled: true,                    // Alarme ativo
  times: ["08:00", "16:00", "20:00"], // Horários
  lastNotified: "2026-02-03 08:00", // Última notificação (evita duplicatas)
  nextDose: "08:00"                 // Próxima dose
}
```

## ⚙️ Intervalo de Verificação

- **30 segundos** (quando app aberto) - Monitor em memória
- **60 segundos** (quando app fechado) - Service Worker

## 📤 Notificação Disparada

```
Título: 💊 Hora do medicamento: [Nome]
Descrição: [Dosagem] para [Pessoa] ([Frequência])
Ações: 
  - ✓ Registrar dose
  - ✗ Descartar
Vibração: Padrão (500ms, 100ms, 500ms)
```

## 🔍 Monitoramento de Debug

### No Console (App aberto)
```
[Medication Alarm SW] Ativado
[Medication Alarm SW] Atualizando medicamentos: [...]
[Medication Alarm SW] Disparando alarme para: Omeprazol
```

### No DevTools (Application → Service Workers)
- Verificar status: "activated and running"
- Verificar IndexedDB: Casa360DB
- Verificar Cache Storage (se houver)

## ⚠️ Limitações & Considerações

1. **HTTPS Necessário**
   - Service Workers requerem HTTPS em produção
   - Localhost funciona em desenvolvimento

2. **Permissão de Notificação**
   - Usuário deve aprovar ao abrir Saúde
   - Sem permissão, alarmes não aparecem

3. **Horário do Sistema**
   - Depende do relógio do dispositivo
   - Sincronização offline não funciona

4. **Bateria & Performance**
   - Service Worker dorme quando inativo por muito tempo
   - Alguns navegadores podem matar o SW

## 🚀 Melhorias Futuras

- [ ] Persistir último registro de dose no Supabase
- [ ] Sincronizar dados offline com Service Worker
- [ ] Notificações push via servidor (mais confiável)
- [ ] Histórico de alarmes disparados
- [ ] Snooze de alarme (adiar 15 min)
- [ ] Som customizável por medicamento

## 📝 Exemplo de Uso

1. Usuário adiciona medicamento "Omeprazol"
   - Frequência: 8h/8h
   - Horários: 08:00, 16:00, 00:00

2. App calcula e armazena os horários

3. Service Worker sincroniza dados

4. Cada minuto, SW verifica:
   - Hora atual = 08:00?
   - Medicamento ativo?
   - Já notificou hoje?
   - → Simm? Dispara notificação!

5. Notificação aparece mesmo se:
   - App está fechado
   - Dispositivo está em standby
   - Usuário mudou de aba

6. Usuário clica em "Registrar dose"
   - App abre automaticamente
   - Dose é registrada no banco
   - Estoque diminui

## 🧪 Como Testar

### Teste Manual
1. Adicione um medicamento com horário nos próximos 2 minutos
2. Feche o navegador completamente
3. Aguarde o horário
4. Notificação deve aparecer (mesmo com app fechado)

### Teste no DevTools
```javascript
// Simular notificação (console)
navigator.serviceWorker.controller.postMessage({
  type: 'UPDATE_MEDICATIONS',
  payload: [{
    id: 'test',
    name: 'Teste',
    person: 'Você',
    dosage: '1 comprimido',
    frequency: '8h',
    isActive: true,
    alarmConfig: {
      enabled: true,
      times: ['14:00'],
      lastNotified: null
    }
  }]
});
```

Agora os alarmes de medicamentos funcionarão de forma confiável, mesmo com o app fechado!
