// ─── Seed de Usuários HemoLink ────────────────────────────────────────────────
// Cria 50 usuários no Firebase Auth + documentos no Firestore
// Uso: node seed-usuarios.js
// Requisito: serviceAccountKey.json na mesma pasta

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// ─── Dados base ───────────────────────────────────────────────────────────────

const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const TITULOS = [
  { titulo: '🩸 Iniciante',    minPontos: 0,   maxPontos: 99  },
  { titulo: '💉 Doador',       minPontos: 100, maxPontos: 199 },
  { titulo: '❤️ Herói Local',  minPontos: 200, maxPontos: 349 },
  { titulo: '🏅 Guardião',     minPontos: 350, maxPontos: 499 },
  { titulo: '🌟 Lenda',        minPontos: 500, maxPontos: 600 },
];

const BAIRROS = [
  { bairro: 'Meireles',           lat: -3.7222, lon: -38.5110 },
  { bairro: 'Aldeota',            lat: -3.7357, lon: -38.5003 },
  { bairro: 'Cocó',               lat: -3.7447, lon: -38.4826 },
  { bairro: 'Fátima',             lat: -3.7500, lon: -38.5243 },
  { bairro: 'Benfica',            lat: -3.7420, lon: -38.5430 },
  { bairro: 'Centro',             lat: -3.7275, lon: -38.5283 },
  { bairro: 'Barra do Ceará',     lat: -3.6991, lon: -38.5724 },
  { bairro: 'Parangaba',          lat: -3.7784, lon: -38.5614 },
  { bairro: 'Messejana',          lat: -3.8211, lon: -38.4939 },
  { bairro: 'Maraponga',          lat: -3.7983, lon: -38.5704 },
  { bairro: 'Montese',            lat: -3.7667, lon: -38.5533 },
  { bairro: 'Jacarecanga',        lat: -3.7147, lon: -38.5494 },
  { bairro: 'Papicu',             lat: -3.7392, lon: -38.4870 },
  { bairro: 'Varjota',            lat: -3.7311, lon: -38.4987 },
  { bairro: 'Mucuripe',           lat: -3.7217, lon: -38.4703 },
  { bairro: 'Praia de Iracema',   lat: -3.7158, lon: -38.5147 },
  { bairro: 'Joaquim Távora',     lat: -3.7471, lon: -38.5131 },
  { bairro: 'São João do Tauape', lat: -3.7568, lon: -38.4953 },
  { bairro: 'Sapiranga',          lat: -3.7681, lon: -38.4693 },
  { bairro: 'Edson Queiroz',      lat: -3.7822, lon: -38.4694 },
  { bairro: 'Dendê',              lat: -3.7956, lon: -38.5064 },
  { bairro: 'Itaperi',            lat: -3.7897, lon: -38.5469 },
  { bairro: 'Damas',              lat: -3.7606, lon: -38.5368 },
  { bairro: 'Antônio Bezerra',    lat: -3.7347, lon: -38.6032 },
  { bairro: 'Jóquei Clube',       lat: -3.7556, lon: -38.5603 },
  { bairro: 'Caucaia',            lat: -3.7261, lon: -38.6534 },
  { bairro: 'Maracanaú',          lat: -3.8766, lon: -38.6260 },
  { bairro: 'Eusébio',            lat: -3.8893, lon: -38.4557 },
  { bairro: 'Aquiraz',            lat: -3.9013, lon: -38.3899 },
];

const PRIMEIROS_NOMES = [
  'Ana', 'Beatriz', 'Carla', 'Daniela', 'Eduarda',
  'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana',
  'Larissa', 'Mariana', 'Natália', 'Olivia', 'Paula',
  'Rafaela', 'Sabrina', 'Tatiana', 'Vanessa', 'Yasmin',
  'André', 'Bruno', 'Carlos', 'Diego', 'Eduardo',
  'Felipe', 'Gabriel', 'Henrique', 'Igor', 'João',
  'Lucas', 'Marcos', 'Nicolas', 'Otávio', 'Pedro',
  'Rafael', 'Samuel', 'Thiago', 'Vinicius', 'William',
  'Aline', 'Brenda', 'Camila', 'Débora', 'Elaine',
  'Flávia', 'Gisele', 'Heloísa', 'Ingrid', 'Joana',
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima',
  'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida',
  'Nascimento', 'Araújo', 'Carvalho', 'Melo', 'Ribeiro',
  'Gomes', 'Martins', 'Rocha', 'Cardoso', 'Cavalcante',
  'Bezerra', 'Moura', 'Figueiredo', 'Nogueira', 'Lopes',
  'Freitas', 'Vieira', 'Medeiros', 'Moreira', 'Nunes',
];

// ─── Utilitários ──────────────────────────────────────────────────────────────

function aleatorio(min, max) {
  return Math.random() * (max - min) + min;
}

function aleatorioInt(min, max) {
  return Math.floor(aleatorio(min, max + 1));
}

function escolher(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function calcularTitulo(pontos) {
  for (const t of TITULOS) {
    if (pontos >= t.minPontos && pontos <= t.maxPontos) return t.titulo;
  }
  return '🌟 Lenda';
}

function gerarUltimaDoacao() {
  // 70% dos usuários têm última doação (entre 30 e 400 dias atrás)
  if (Math.random() > 0.30) {
    const diasAtras = aleatorioInt(30, 400);
    const data = new Date();
    data.setDate(data.getDate() - diasAtras);
    return data.toISOString();
  }
  return null;
}

function gerarCoord(base, variacao = 0.015) {
  return parseFloat((base + aleatorio(-variacao, variacao)).toFixed(6));
}

// Barra de progresso simples no terminal
function barraProgresso(atual, total, largura = 30) {
  const pct = atual / total;
  const preenchido = Math.round(pct * largura);
  const barra = '█'.repeat(preenchido) + '░'.repeat(largura - preenchido);
  const pctStr = (pct * 100).toFixed(0).padStart(3);
  process.stdout.write(`\r  [${barra}] ${pctStr}% (${atual}/${total})`);
}

// ─── Geração dos usuários ─────────────────────────────────────────────────────

function gerarUsuarios(quantidade = 50) {
  const usuarios = [];

  for (let i = 0; i < quantidade; i++) {
    const nome = `${PRIMEIROS_NOMES[i % PRIMEIROS_NOMES.length]} ${escolher(SOBRENOMES)}`;
    const tipo = TIPOS_SANGUINEOS[i % TIPOS_SANGUINEOS.length]; // distribuição uniforme
    const bairroInfo = BAIRROS[i % BAIRROS.length];
    const pontos = aleatorioInt(0, 600);
    const titulo = calcularTitulo(pontos);
    const ultimaDoacao = gerarUltimaDoacao();

    // Email sem acentos para evitar problemas no Auth
    const nomeEmail = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '.');

    usuarios.push({
      nome,
      email: `${nomeEmail}.${i + 1}@hemolink.test`,
      senha: 'Hemolink@123',
      tipoSanguineo: tipo,
      latitude: gerarCoord(bairroInfo.lat),
      longitude: gerarCoord(bairroInfo.lon),
      bairro: bairroInfo.bairro,
      pontos,
      titulo,
      ultimaDoacao,
    });
  }

  return usuarios;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🩸 HemoLink — Seed de Usuários\n');
  console.log('─'.repeat(45));

  const usuarios = gerarUsuarios(50);
  const resultados = { criados: 0, atualizados: 0, erros: 0 };
  const contadorTipos = {};

  console.log(`\n📋 Inserindo ${usuarios.length} usuários...\n`);

  for (let i = 0; i < usuarios.length; i++) {
    const u = usuarios[i];
    barraProgresso(i, usuarios.length);

    try {
      let uid;

      // Tentar criar no Auth
      try {
        const userRecord = await auth.createUser({
          email: u.email,
          password: u.senha,
          displayName: u.nome,
        });
        uid = userRecord.uid;
        resultados.criados++;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-exists') {
          // Buscar UID existente
          const existing = await auth.getUserByEmail(u.email);
          uid = existing.uid;
          resultados.atualizados++;
        } else {
          throw authErr;
        }
      }

      // Salvar/atualizar documento no Firestore
      await db.collection('users').doc(uid).set({
        id: uid,
        nome: u.nome,
        email: u.email,
        tipoSanguineo: u.tipoSanguineo,
        latitude: u.latitude,
        longitude: u.longitude,
        pontos: u.pontos,
        titulo: u.titulo,
        ultimaDoacao: u.ultimaDoacao,
      }, { merge: true });

      // Contar tipos
      contadorTipos[u.tipoSanguineo] = (contadorTipos[u.tipoSanguineo] || 0) + 1;

    } catch (err) {
      resultados.erros++;
      console.error(`\n  ⚠️  Erro em ${u.email}: ${err.message}`);
    }
  }

  barraProgresso(usuarios.length, usuarios.length);
  console.log('\n');
  console.log('─'.repeat(45));
  console.log('\n✅ Seed concluído!\n');
  console.log(`  Criados:     ${resultados.criados}`);
  console.log(`  Atualizados: ${resultados.atualizados}`);
  console.log(`  Erros:       ${resultados.erros}`);

  console.log('\n📊 Distribuição por tipo sanguíneo:\n');
  const tipos = Object.entries(contadorTipos).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [tipo, count] of tipos) {
    const barra = '■'.repeat(count);
    console.log(`  ${tipo.padEnd(4)} ${barra.padEnd(20)} ${count}`);
  }

  console.log('\n💡 Todos os usuários criados com senha: Hemolink@123\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
