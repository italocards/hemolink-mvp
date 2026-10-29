# HemoLink MVP — Guia de Execução

## Pré-requisitos

- Node.js instalado ✅ (v24 detectado)
- npm instalado ✅ (v11 detectado)
- Expo Go instalado no celular (Android ou iPhone)
  → Android: https://play.google.com/store/apps/details?id=host.exp.exponent
  → iOS: https://apps.apple.com/app/expo-go/id982107779
- Conta no Firebase (gratuita): https://console.firebase.google.com

---

## PASSO 1 — Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Nome sugerido: `hemolink-mvp`
4. Desative o Google Analytics (opcional) → Criar projeto
5. No painel, clique em **"Web"** (ícone `</>`) para registrar um app web
6. Nome do app: `HemoLink Mobile`
7. Copie o objeto `firebaseConfig` que aparece na tela

---

## PASSO 2 — Configurar o Firebase no projeto

Abra o arquivo:
```
src/services/firebase.ts
```

Substitua os valores do `firebaseConfig`:

```typescript
const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_PROJECT.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_PROJECT.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
};
```

---

## PASSO 3 — Ativar Authentication e Firestore

### Authentication (login com e-mail):
1. No Firebase Console → **Authentication** → "Começar"
2. Aba "Sign-in method" → Clique em **E-mail/senha** → Ativar → Salvar

### Firestore Database:
1. No Firebase Console → **Firestore Database** → "Criar banco de dados"
2. Selecione **Modo de teste** (permite leitura/escrita por 30 dias)
3. Escolha a região: `southamerica-east1` (São Paulo) → Ativar

### Regras do Firestore (para o MVP):
No Firebase Console → Firestore → Aba "Regras" → Cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Clique em **Publicar**.

---

## PASSO 4 — Popular o banco com dados fictícios (seed)

Após configurar o Firebase, adicione temporariamente ao `App.tsx`:

```typescript
import { seedFirestore } from './src/utils/seedFirestore';

// Dentro do componente App, no useEffect:
useEffect(() => {
  seedFirestore(); // Execute UMA VEZ, depois remova
}, []);
```

Rode o app (passo 5), abra o console e aguarde a mensagem:
```
🎉 Seed concluído com sucesso!
```

**Remova o `seedFirestore()` depois** para não duplicar os dados.

---

## PASSO 5 — Rodar o aplicativo

Abra o terminal na pasta do projeto:

```bash
cd hemolink
npx expo start
```

Vai aparecer um **QR Code** no terminal.

### No Android:
- Abra o **Expo Go** → Clique em "Scan QR code" → Aponte para o QR

### No iPhone:
- Abra a **câmera nativa** → Aponte para o QR → Toque na notificação

> ⚠️ O celular e o computador precisam estar na **mesma rede Wi-Fi**.

---

## Estrutura do projeto

```
hemolink/
├── App.tsx                      # Raiz do app
├── index.ts                     # Entry point Expo
├── app.json                     # Configuração Expo
├── src/
│   ├── types/index.ts           # Tipos TypeScript
│   ├── constants/               # Cores, constantes
│   ├── services/
│   │   ├── firebase.ts          # ⚠️ CONFIGURAR AQUI
│   │   ├── auth.ts              # Login, cadastro, sair
│   │   └── solicitacoes.ts      # CRUD Firestore
│   ├── hooks/
│   │   └── useAuth.tsx          # Context de autenticação
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Stack principal
│   │   ├── MainTabs.tsx         # Tabs (Home/Mapa/Solic/Perfil)
│   │   └── SolicitacoesStack.tsx
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── CadastroScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SolicitacoesScreen.tsx
│   │   ├── DetalhesSolicitacaoScreen.tsx
│   │   ├── PerfilScreen.tsx
│   │   └── MapaScreen.tsx
│   ├── components/
│   │   ├── BotaoPrimario.tsx
│   │   ├── InputCampo.tsx
│   │   ├── TipoSanguineoTag.tsx
│   │   └── UrgenciaBadge.tsx
│   └── utils/
│       └── seedFirestore.ts     # Script de dados fictícios
```

---

## Fluxo de demonstração

```
1. Abrir app → Splash (2,5s) → Login
2. Criar conta → preencher dados → Home
3. Home → "Ver solicitações" → lista de pendentes
4. Tocar em uma solicitação → detalhes → "Posso doar"
5. Modal de confirmação → solicitação aparece em "Aceitas"
6. Home → Mapa → locais próximos → tocar num local → "Como chegar"
7. Home → Perfil → ver dados → editar perfil
```

---

## Estrutura do Firestore

```
users/{userId}
  nome, email, tipoSanguineo, ultimaDoacao, latitude, longitude

hemocentros/{hemocentroId}
  nome, endereco, latitude, longitude, horarioFuncionamento

solicitacoes/{solicitacaoId}
  tipoSanguineo, urgencia, hemocentroId, data, status

respostas/{respostaId}
  solicitacaoId, doadorId, resposta, data
```

---

## Problemas comuns

| Problema | Solução |
|---|---|
| `FirebaseError: projectId not provided` | Preencher `src/services/firebase.ts` com as credenciais reais |
| `Network request failed` | Verificar se celular e PC estão na mesma Wi-Fi |
| QR Code não abre | Usar tunnel: `npx expo start --tunnel` |
| App lento no emulador | Usar Expo Go no celular físico (muito mais rápido) |
| Mapa não aparece no iOS | Normal no Expo Go sem config extra — usar Android para o demo |
