# Android — Checklist de Notificação Agendada com Som

> Objetivo: verificar o que já existe no APK e o que precisa ser implementado para suportar notificações agendadas (ex: tarefa para amanhã 17h com som).

---

## 1. AndroidManifest.xml — Permissões

- [ ] `android.permission.POST_NOTIFICATIONS` — obrigatória Android 13+ (API 33+)
- [ ] `android.permission.SCHEDULE_EXACT_ALARM` — obrigatória Android 12+ (API 31+)
- [ ] `android.permission.USE_EXACT_ALARM` — alternativa sem prompt ao usuário (API 33+, restrita)
- [ ] `android.permission.RECEIVE_BOOT_COMPLETED` — para reagendar alarmes após reinício
- [ ] `android.permission.WAKE_LOCK` — mantém CPU ativa durante o disparo (opcional mas recomendado)
- [ ] `android.permission.VIBRATE` — para vibração junto com som (opcional)

---

## 2. AndroidManifest.xml — Registro de Componentes

- [ ] `<receiver>` do `BroadcastReceiver` de alarme registrado com `android:exported="true"`
- [ ] `<receiver>` do `BroadcastReceiver` de boot (`BOOT_COMPLETED`) registrado
- [ ] `<intent-filter>` com `android.intent.action.BOOT_COMPLETED` no receiver de boot
- [ ] `<intent-filter>` com a action customizada do alarme no receiver principal

---

## 3. Permissão em Runtime (código Kotlin/Java)

- [ ] Verificar `Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU` antes de pedir `POST_NOTIFICATIONS`
- [ ] Chamar `ActivityCompat.requestPermissions()` para `POST_NOTIFICATIONS` (Android 13+)
- [ ] Verificar `alarmManager.canScheduleExactAlarms()` antes de agendar (Android 12+)
- [ ] Redirecionar usuário para `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM` se não tiver permissão
- [ ] Tratar o resultado de `onRequestPermissionsResult()` para `POST_NOTIFICATIONS`

---

## 4. AlarmManager — Agendamento

- [ ] Obter instância: `getSystemService(Context.ALARM_SERVICE) as AlarmManager`
- [ ] Criar `Intent` apontando para o `BroadcastReceiver` correto
- [ ] Criar `PendingIntent` com `PendingIntent.FLAG_IMMUTABLE` (obrigatório API 31+)
- [ ] Usar `PendingIntent.FLAG_UPDATE_CURRENT` para atualizar alarme existente
- [ ] Calcular `Calendar` ou `timeInMillis` correto para o horário desejado (amanhã 17h00)
- [ ] Usar `setExactAndAllowWhileIdle()` — dispara mesmo em Doze Mode (recomendado)
  - Alternativas (menos confiáveis):
    - `setExact()` — não garante disparo em Doze Mode
    - `setAlarmClock()` — aparece no relógio do sistema, maior prioridade
- [ ] Verificar se `PendingIntent` já existe antes de criar (evitar duplicatas)
- [ ] Implementar lógica de cancelamento: `alarmManager.cancel(pendingIntent)`

---

## 5. BroadcastReceiver — Receptor do Alarme

- [ ] Classe que estende `BroadcastReceiver`
- [ ] Override de `onReceive(context: Context, intent: Intent)`
- [ ] Verificar se a action do intent é a esperada dentro de `onReceive()`
- [ ] Não fazer operações longas dentro de `onReceive()` (limite ~10s) — usar `goAsync()` ou delegar a um Service se necessário
- [ ] Chamar `context.getSystemService(NotificationManager::class.java)` dentro do receiver

---

## 6. BroadcastReceiver — Receptor de Boot

- [ ] Classe separada (ou mesma) que estende `BroadcastReceiver` para `BOOT_COMPLETED`
- [ ] Override de `onReceive()` verificando `intent.action == Intent.ACTION_BOOT_COMPLETED`
- [ ] Ler alarmes pendentes do banco de dados/SharedPreferences
- [ ] Reatualizar cada alarme usando `AlarmManager` (alarmes não sobrevivem ao reboot)

---

## 7. NotificationChannel — Canal de Notificação

- [ ] Verificar `Build.VERSION.SDK_INT >= Build.VERSION_CODES.O` antes de criar canal (API 26+)
- [ ] Definir `channelId` único e consistente (string constante)
- [ ] Criar `NotificationChannel(channelId, nome, importância)`
- [ ] Importância: `NotificationManager.IMPORTANCE_HIGH` — exibe heads-up + toca som
- [ ] Chamar `channel.enableVibration(true)` para vibração
- [ ] Definir som com `channel.setSound(uri, audioAttributes)`
  - URI: `RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)` ou URI customizado
  - `AudioAttributes` com `USAGE_NOTIFICATION` e `CONTENT_TYPE_SONIFICATION`
- [ ] Chamar `notificationManager.createNotificationChannel(channel)`
- [ ] Criar o canal apenas uma vez — chamadas repetidas são ignoradas pelo sistema
- [ ] Verificar se canal já existe com `notificationManager.getNotificationChannel(channelId)`

---

## 8. NotificationCompat.Builder — Montagem da Notificação

- [ ] Importar `androidx.core:core-ktx` ou `androidx.core:core` no `build.gradle`
- [ ] Instanciar `NotificationCompat.Builder(context, channelId)`
- [ ] `setSmallIcon()` — obrigatório, ícone monocromático (drawable vetorial recomendado)
- [ ] `setContentTitle()` — título da notificação
- [ ] `setContentText()` — texto/descrição
- [ ] `setPriority(NotificationCompat.PRIORITY_HIGH)` — compatibilidade pré-API 26
- [ ] `setAutoCancel(true)` — fecha ao tocar
- [ ] `setSound()` — para pré-API 26 (pós-26 o canal controla o som)
- [ ] `setVibrate()` — para pré-API 26 (pós-26 o canal controla a vibração)
- [ ] `setContentIntent(PendingIntent)` — ação ao tocar (abrir Activity)
- [ ] `setStyle()` — para texto longo: `NotificationCompat.BigTextStyle()`
- [ ] `build()` — retorna o objeto `Notification`

---

## 9. NotificationManager — Exibição

- [ ] Obter instância: `context.getSystemService(NotificationManager::class.java)`
- [ ] Chamar `notify(notificationId, notification)`
- [ ] Usar `notificationId` único por notificação (para poder cancelar individualmente)
- [ ] Implementar cancelamento: `notificationManager.cancel(notificationId)`
- [ ] Verificar `notificationManager.areNotificationsEnabled()` antes de exibir (Android 13+)

---

## 10. Dependências build.gradle (app)

- [ ] `implementation 'androidx.core:core-ktx:1.12.0'` (ou versão mais recente)
- [ ] `compileSdk` e `targetSdk` >= 33 para suporte completo ao Android 13
- [ ] `minSdk` compatível com os recursos usados (recomendado >= 21)

---

## 11. Persistência de Alarmes (opcional mas recomendado)

- [ ] Salvar dados do alarme (id, timestamp, descrição) em banco local (Room, SQLite ou SharedPreferences)
- [ ] Usar esse dado no `BootReceiver` para reagendar após reinício
- [ ] Implementar lógica para não reagendar alarmes cujo horário já passou

---

## 12. Testes e Edge Cases

- [ ] Testar disparo com app em foreground
- [ ] Testar disparo com app em background
- [ ] Testar disparo com app encerrado (processo morto)
- [ ] Testar disparo após reinício do dispositivo
- [ ] Testar com modo "Não Perturbe" ativo (o canal pode ser sobreposto)
- [ ] Testar em Android 12 (verificação de `canScheduleExactAlarms()`)
- [ ] Testar em Android 13 (permissão `POST_NOTIFICATIONS` em runtime)
- [ ] Verificar comportamento com bateria em modo de economia (Battery Saver / Doze)

---

## Resumo de APIs por versão do Android

| Recurso | API mínima | Observação |
|---|---|---|
| `NotificationChannel` | 26 (Android 8) | Obrigatório para som/vibração |
| `setExactAndAllowWhileIdle()` | 23 (Android 6) | Disparo em Doze Mode |
| `canScheduleExactAlarms()` | 31 (Android 12) | Verificação antes de agendar |
| `SCHEDULE_EXACT_ALARM` | 31 (Android 12) | Permissão manifesto |
| `POST_NOTIFICATIONS` | 33 (Android 13) | Permissão em runtime |
| `FLAG_IMMUTABLE` no PendingIntent | 31 (Android 12) | Obrigatório |