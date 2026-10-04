import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SolicitacoesStackParamList } from '../types';
import SolicitacoesScreen from '../screens/SolicitacoesScreen';
import DetalhesSolicitacaoScreen from '../screens/DetalhesSolicitacaoScreen';
import { Colors } from '../constants';

const Stack = createNativeStackNavigator<SolicitacoesStackParamList>();

export default function SolicitacoesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ListaSolicitacoes"
        component={SolicitacoesScreen}
        options={{ title: 'Solicitações' }}
      />
      <Stack.Screen
        name="DetalhesSolicitacao"
        component={DetalhesSolicitacaoScreen}
        options={{ title: 'Detalhes da Solicitação' }}
      />
    </Stack.Navigator>
  );
}
