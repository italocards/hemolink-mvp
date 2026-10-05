import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerfilStackParamList } from '../types';
import { Colors } from '../constants';
import PerfilScreen from '../screens/PerfilScreen';
import DefinirCasaScreen from '../screens/DefinirCasaScreen';

const Stack = createNativeStackNavigator<PerfilStackParamList>();

export default function PerfilStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="PerfilHome"
        component={PerfilScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DefinirCasa"
        component={DefinirCasaScreen}
        options={{ title: 'Localização da Casa' }}
      />
    </Stack.Navigator>
  );
}
