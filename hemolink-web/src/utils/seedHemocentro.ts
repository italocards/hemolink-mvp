/**
 * Script para criar um hemocentro de teste no Firebase
 * 
 * INSTRUÇÕES:
 * 1. Crie manualmente uma conta no Firebase Auth:
 *    - Email: hemoce@test.com
 *    - Senha: test123456
 *    - Copie o UID gerado
 * 
 * 2. No Firestore Console, crie um documento em /hemocentros com o UID como ID:
 *    {
 *      id: "UID_COPIADO",
 *      nome: "HEMOCE - Centro de Hematologia",
 *      endereco: "Av. José Bastos, 3390 - Rodolfo Teófilo, Fortaleza - CE",
 *      latitude: -3.7532,
 *      longitude: -38.5429,
 *      horarioFuncionamento: "Seg-Sex: 7h30-18h30 | Sáb: 7h30-11h30",
 *      email: "hemoce@test.com",
 *      ownerId: "UID_COPIADO"
 *    }
 * 
 * 3. Agora pode fazer login no painel web com:
 *    Email: hemoce@test.com
 *    Senha: test123456
 */

export const INSTRUCOES_SEED_HEMOCENTRO = `
Para criar um hemocentro de teste:

1. Acesse o Firebase Console: https://console.firebase.google.com
2. Vá em Authentication > Users > Add User
3. Crie com:
   - Email: hemoce@test.com
   - Senha: test123456
4. Copie o UID gerado
5. Vá em Firestore Database > hemocentros
6. Adicione um documento com ID = UID copiado e os campos:
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
7. Faça login no painel web com hemoce@test.com / test123456
`;

console.log(INSTRUCOES_SEED_HEMOCENTRO);
