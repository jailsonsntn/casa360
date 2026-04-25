# Guia de Geracao de APK (Metodo Usado no Projeto)

Este documento descreve o metodo atualmente usado neste projeto para gerar APK Android.

## 1. Como o projeto gera APK

Fluxo usado:

1. Build da aplicacao web com Vite
2. Sync do projeto web para o projeto Android com Capacitor
3. Build Android com Gradle (`assembleDebug` ou `assembleRelease`)

Os scripts oficiais estao em `package.json`:

- `npm run android:sync` -> `npm run build && npx cap sync android`
- `npm run apk:debug` -> `npm run android:sync && cd android && gradlew.bat assembleDebug`
- `npm run apk:release` -> `npm run android:sync && cd android && gradlew.bat assembleRelease`
- `npm run aab:release` -> `npm run android:sync && cd android && gradlew.bat bundleRelease`

## 2. Pre-requisitos

1. Node.js instalado
2. Android Studio com SDK Android instalado
3. Java JDK 21 configurado no ambiente (o projeto Android esta com `JavaVersion.VERSION_21`)
4. `ANDROID_HOME`/SDK correto no arquivo `android/local.properties`

Exemplo atual em `android/local.properties`:

```properties
sdk.dir=C:/Users/jails/AppData/Local/Android/Sdk
```

## 3. Gerar APK de DEBUG (rapido para testes)

Opcao recomendada para ambiente local (configura SDK/JDK e builda em um comando):

```powershell
npm run mobile:apk:dev
```

Esse comando executa o script `scripts/mobile-apk-dev.ps1`, que:

1. Resolve caminho do SDK Android
2. Gera `android/local.properties` com `sdk.dir`
3. Ajusta `JAVA_HOME` para o JDK do Android Studio (quando disponivel)
4. Executa `npm run apk:debug`

Opcao manual:

No terminal na raiz do projeto:

```powershell
npm install
npm run apk:debug
```

Saida esperada:

`android/app/build/outputs/apk/debug/app-debug.apk`

### 3.1 Instalar APK debug no dispositivo (via ADB)

Com o dispositivo conectado (depuracao USB ativada):

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

O parametro `-r` reinstala preservando dados do app quando possivel.

## 4. Gerar APK de RELEASE (assinado)

### 4.1 Configurar assinatura

O projeto aceita assinatura por variaveis de ambiente (prioridade) ou por arquivo local `android/keystore.properties`.

Variaveis aceitas:

- `ANDROID_KEYSTORE_FILE`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Exemplo PowerShell:

```powershell
$env:ANDROID_KEYSTORE_FILE="android/app/release.keystore"
$env:ANDROID_KEYSTORE_PASSWORD="SUA_SENHA_DO_STORE"
$env:ANDROID_KEY_ALIAS="SEU_ALIAS"
$env:ANDROID_KEY_PASSWORD="SUA_SENHA_DA_CHAVE"
```

Opcao alternativa (local):

1. Copiar `android/keystore.properties.example` para `android/keystore.properties`
2. Preencher com os dados reais do keystore

### 4.2 Gerar APK release

Opcao recomendada para ambiente local (configura SDK/JDK e builda em um comando):

```powershell
npm run mobile:apk:release
```

Opcao manual:

```powershell
npm run apk:release
```

Saida esperada:

`android/app/build/outputs/apk/release/casa360.apk`

Observacao: neste projeto o nome do APK release foi customizado no `android/app/build.gradle` para `casa360.apk`.

### 4.3 Instalar APK release no dispositivo (via ADB)

```powershell
adb install -r android/app/build/outputs/apk/release/casa360.apk
```

### 4.4 Instalar como app de terceiro (sem Play Store)

No Android, habilite a instalacao por fontes desconhecidas para o app que abrira o APK (Arquivos, Chrome, WhatsApp etc.).

Fluxo comum:

1. Enviar o APK para o celular (USB, Drive, WhatsApp)
2. Abrir o APK no aparelho
3. Permitir "Instalar apps desconhecidos" quando solicitado
4. Confirmar a instalacao

## 5. Gerar AAB release (Play Store)

```powershell
npm run aab:release
```

Saida esperada:

`android/app/build/outputs/bundle/release/app-release.aab`

## 6. Conferencia rapida apos build

1. Verifique se o arquivo foi gerado no caminho esperado
2. Instale em um dispositivo de teste
3. Para updates, mantenha o mesmo keystore da versao anterior

## 7. Solucao de problemas comum

- Erro de Java: confira se esta usando JDK 21
- Erro de SDK Android: valide `android/local.properties`
- Release sem assinatura: confira se as 4 credenciais de assinatura foram definidas
