# HemoLink Web - Painel dos Hemocentros

Painel administrativo web para hemocentros gerenciarem solicitações de sangue, visualizarem doadores e acompanharem métricas em tempo real.

## 📋 Sobre o Projeto

Este é o painel web do HemoLink, complementar ao aplicativo mobile para doadores. Permite que hemocentros:

- Criem e gerenciem solicitações de sangue
- Acompanhem respostas de doadores em tempo real
- Visualizem métricas e estatísticas
- Gerenciem informações do hemocentro

## 🛠 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Firebase** - Backend (Auth + Firestore)
- **React Router** - Navegação

## 📁 Estrutura

```
src/
├── components/     # Componentes reutilizáveis (Sidebar, Cards, etc)
├── pages/          # Páginas/rotas da aplicação
├── services/       # Firebase e serviços de dados
├── hooks/          # Custom hooks (useAuth, etc)
└── types/          # TypeScript types compartilhados
```

## 🚀 Comandos

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🔐 Autenticação

Este projeto usa o mesmo Firebase do app mobile HemoLink (`hemolink-mvp`). 

### Criar conta de teste para hemocentro:

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **Authentication > Users > Add User**
3. Crie com:
   - Email: `hemoce@test.com`
   - Senha: `test123456`
4. Copie o UID gerado
5. Vá em **Firestore Database > hemocentros**
6. Adicione um documento com ID = UID copiado:
   ```json
   {
     "id": "UID_COPIADO",
     "nome": "HEMOCE - Centro de Hematologia",
     "endereco": "Av. José Bastos, 3390 - Rodolfo Teófilo, Fortaleza - CE",
     "latitude": -3.7532,
     "longitude": -38.5429,
     "horarioFuncionamento": "Seg-Sex: 7h30-18h30 | Sáb: 7h30-11h30",
     "email": "hemoce@test.com",
     "ownerId": "UID_COPIADO"
   }
   ```
7. Faça login com `hemoce@test.com` / `test123456`

## 🎯 Funcionalidades Implementadas

### ✅ Concluído
- [x] Autenticação com Firebase Auth
- [x] Dashboard com métricas em tempo real
- [x] Lista de solicitações com filtros
- [x] Criação de novas solicitações
- [x] Detalhes da solicitação com painel de candidatos
- [x] Acompanhamento de respostas em tempo real (Firestore onSnapshot)
- [x] Perfil do hemocentro editável
- [x] Sidebar com navegação
- [x] Design responsivo

### 🔜 Próxima Fase (Próximo Semestre)
- [ ] Algoritmo de classificação de doadores
- [ ] Sistema de notificação em lotes
- [ ] Score combinado (proximidade + histórico + disponibilidade)
- [ ] Priorização inteligente de candidatos

## 🔥 Firebase

### Collections Utilizadas
- `hemocentros` - Dados dos hemocentros
- `solicitacoes` - Solicitações de sangue criadas
- `respostas` - Respostas dos doadores (aceita/recusada)
- `users` - Doadores cadastrados no app mobile

### Firestore Rules
As regras estão configuradas para:
- Hemocentros podem criar/editar suas próprias solicitações
- Hemocentros podem ler respostas de suas solicitações
- Hemocentros podem atualizar seu perfil
- Doadores só acessam via app mobile

## 🖥 Desenvolvimento

O servidor de desenvolvimento roda em `http://localhost:5173` por padrão.

### Hot Module Replacement (HMR)
O Vite oferece HMR instantâneo - suas alterações aparecem imediatamente no navegador.

### Estrutura de Rotas
- `/` - Dashboard
- `/solicitacoes` - Lista de solicitações
- `/solicitacoes/nova` - Criar solicitação
- `/solicitacoes/:id` - Detalhes da solicitação
- `/perfil` - Perfil do hemocentro
- `/login` - Autenticação

## 📱 Integração com App Mobile

Este painel web compartilha o mesmo backend Firebase com o app mobile para doadores. Quando um hemocentro cria uma solicitação:
1. A solicitação é salva no Firestore
2. Aparece automaticamente para doadores compatíveis no app mobile
3. Respostas dos doadores aparecem em tempo real no painel web

## 🎨 Design System

### Cores Principais
- **Primary**: `#C1121F` (Vermelho institucional)
- **Primary Light**: `#FFE5E7`
- **Sidebar**: `#1E293B` (Slate 900)
- **Background**: `#F8FAFC` (Slate 50)

### Componentes
- Cards com shadow suave
- Badges coloridos por urgência
- Tabelas responsivas
- Loading states e empty states
- Toasts de feedback

## 📝 Notas de Desenvolvimento

- TypeScript strict mode habilitado
- ESLint configurado
- Tailwind CSS para estilização
- Firestore real-time listeners para dados ao vivo
- Protected routes com React Router
- Context API para autenticação

## 🤝 Contribuindo

Este projeto é parte do TCC. Desenvolvido com ❤️ para facilitar a doação de sangue.

---

**Versão:** 1.0.0  
**Última atualização:** Novembro 2026
