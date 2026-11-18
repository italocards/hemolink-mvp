# HemoLink — Scripts Utilitários

## `seed-usuarios.js`

Cria **50 usuários de teste** no Firebase Auth e no Firestore, distribuídos por bairros reais de Fortaleza, com tipos sanguíneos, pontuações e histórico de doações variados.

---

## Pré-requisitos

- Node.js instalado
- Acesso de administrador ao projeto Firebase `hemolink-mvp`

---

## 1. Baixar a chave de serviço do Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Selecione o projeto **hemolink-mvp**
3. Clique na engrenagem ⚙️ → **Configurações do projeto**
4. Vá para a aba **Contas de serviço**
5. Clique em **Gerar nova chave privada**
6. Confirme clicando em **Gerar chave**
7. Um arquivo `.json` será baixado — renomeie para `serviceAccountKey.json`

---

## 2. Colocar a chave na pasta correta

Mova o arquivo para dentro desta pasta:

```
hemolink/scripts/serviceAccountKey.json   ← aqui
hemolink/scripts/seed-usuarios.js
hemolink/scripts/package.json
hemolink/scripts/README.md
```

> ⚠️ **NUNCA** commite o `serviceAccountKey.json` no Git. Ele já está no `.gitignore`.

---

## 3. Instalar dependências e rodar

Abra um terminal dentro da pasta `scripts/`:

```bash
cd hemolink/scripts
npm install
node seed-usuarios.js
```

---

## 4. O que esperar no terminal

```
🩸 HemoLink — Seed de Usuários

─────────────────────────────────────────────
📋 Inserindo 50 usuários...

  [██████████████████████████████] 100% (50/50)

─────────────────────────────────────────────

✅ Seed concluído!

  Criados:     50
  Atualizados: 0
  Erros:       0

📊 Distribuição por tipo sanguíneo:

  A+   ██████■              7
  A-   ██████               6
  AB+  ██████               6
  AB-  ██████               6
  B+   ██████               6
  B-   ██████               7
  O+   ██████               6
  O-   ██████               6

💡 Todos os usuários criados com senha: Hemolink@123
```

---

## Dados gerados por usuário

| Campo           | Detalhe                                              |
|-----------------|------------------------------------------------------|
| `nome`          | Combinação aleatória de nomes e sobrenomes brasileiros |
| `email`         | `nome.sobrenome.N@hemolink.test`                     |
| `senha`         | `Hemolink@123`                                       |
| `tipoSanguineo` | Distribuído uniformemente entre os 8 tipos           |
| `latitude/longitude` | Coordenadas reais de bairros de Fortaleza + pequena variação |
| `pontos`        | Aleatório entre 0–600                                |
| `titulo`        | Calculado automaticamente pelos pontos               |
| `ultimaDoacao`  | 70% dos usuários têm (30–400 dias atrás), 30% `null` |

### Títulos por pontuação

| Pontos   | Título           |
|----------|------------------|
| 0–99     | 🩸 Iniciante     |
| 100–199  | 💉 Doador        |
| 200–349  | ❤️ Herói Local   |
| 350–499  | 🏅 Guardião      |
| 500–600  | 🌟 Lenda         |

### Bairros cobertos

Meireles, Aldeota, Cocó, Fátima, Benfica, Centro, Barra do Ceará, Parangaba, Messejana, Maraponga, Montese, Jacarecanga, Papicu, Varjota, Mucuripe, Praia de Iracema, Joaquim Távora, São João do Tauape, Sapiranga, Edson Queiroz, Dendê, Itaperi, Damas, Antônio Bezerra, Jóquei Clube, Caucaia, Maracanaú, Eusébio, Aquiraz.

---

## Rodar novamente (re-seed)

Se você rodar o script mais de uma vez, os usuários já existentes no Auth **não** serão duplicados — o script atualiza o documento do Firestore e conta como "Atualizado".
