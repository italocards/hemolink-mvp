/**
 * Script de seed para popular o Firestore com dados fictícios.
 *
 * COMO USAR:
 * 1. Configure o firebase.ts com as credenciais reais do seu projeto.
 * 2. Chame seedFirestore() uma vez no App.tsx (depois remova a chamada).
 *    Ex: import { seedFirestore } from './src/utils/seedFirestore'; seedFirestore();
 *
 * Ou importe e chame diretamente de um botão temporário na HomeScreen.
 */

import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

const HEMOCENTROS = [
  {
    nome: 'HEMOCE - Sede Fortaleza',
    endereco: 'Av. José Bastos, 3390 - Rodolfo Teófilo, Fortaleza - CE',
    latitude: -3.7485,
    longitude: -38.5619,
    horarioFuncionamento: 'Segunda a Sábado: 07h às 18h',
  },
  {
    nome: 'Banco de Sangue Albert Sabin',
    endereco: 'R. Tertuliano Sales, 544 - Vila União, Fortaleza - CE',
    latitude: -3.7231,
    longitude: -38.5752,
    horarioFuncionamento: 'Segunda a Sexta: 07h às 17h',
  },
  {
    nome: 'HEMOCE - Messejana',
    endereco: 'Av. Frei Cirilo, 3480 - Messejana, Fortaleza - CE',
    latitude: -3.8185,
    longitude: -38.4917,
    horarioFuncionamento: 'Segunda a Sábado: 07h às 17h',
  },
  {
    nome: 'Banco de Sangue Hospital Universitário',
    endereco: 'R. Cap. Francisco Pedro, 1290 - Rodolfo Teófilo, Fortaleza - CE',
    latitude: -3.7501,
    longitude: -38.5578,
    horarioFuncionamento: 'Segunda a Sexta: 07h às 19h',
  },
];

const SOLICITACOES_MOCK = [
  {
    tipoSanguineo: 'O+',
    urgencia: 'critica',
    data: new Date().toISOString(),
    status: 'pendente',
  },
  {
    tipoSanguineo: 'A-',
    urgencia: 'alta',
    data: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pendente',
  },
  {
    tipoSanguineo: 'B+',
    urgencia: 'media',
    data: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pendente',
  },
  {
    tipoSanguineo: 'AB-',
    urgencia: 'baixa',
    data: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'pendente',
  },
];

export async function seedFirestore(): Promise<void> {
  console.log('🌱 Iniciando seed do Firestore...');

  try {
    // Inserir hemocentros
    const hemoColl = collection(db, 'hemocentros');
    const hemoIds: string[] = [];

    for (const hemo of HEMOCENTROS) {
      const ref = await addDoc(hemoColl, hemo);
      hemoIds.push(ref.id);
      console.log(`✅ Hemocentro inserido: ${hemo.nome} (${ref.id})`);
    }

    // Inserir solicitações vinculadas aos hemocentros
    const solColl = collection(db, 'solicitacoes');
    for (let i = 0; i < SOLICITACOES_MOCK.length; i++) {
      const sol = {
        ...SOLICITACOES_MOCK[i],
        hemocentroId: hemoIds[i % hemoIds.length],
      };
      const ref = await addDoc(solColl, sol);
      console.log(`✅ Solicitação inserida: ${sol.tipoSanguineo} - ${sol.urgencia} (${ref.id})`);
    }

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

export async function limparFirestore(): Promise<void> {
  console.log('🧹 Limpando Firestore...');
  const colecoes = ['hemocentros', 'solicitacoes', 'respostas'];
  for (const nome of colecoes) {
    const snap = await getDocs(collection(db, nome));
    for (const documento of snap.docs) {
      await deleteDoc(doc(db, nome, documento.id));
    }
    console.log(`🗑️ ${nome}: ${snap.size} documentos removidos`);
  }
  console.log('✅ Firestore limpo');
}
