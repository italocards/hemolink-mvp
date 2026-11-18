import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configurar como as notificações devem ser tratadas quando recebidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra o token de push notification do usuário no Firestore
 */
export async function registrarTokenPush(userId: string): Promise<string | null> {
  try {
    // Verificar se é dispositivo físico (push não funciona no simulador)
    if (!Device.isDevice) {
      console.log('Push notifications só funcionam em dispositivos físicos');
      return null;
    }

    // Verificar se está rodando no Expo Go (limitação do Expo Go SDK 53+)
    const isExpoGo = typeof expo !== 'undefined';
    if (isExpoGo) {
      console.log('⚠️ Push notifications não funcionam no Expo Go. Use um Development Build para testar notificações.');
      return null;
    }

    // Solicitar permissão
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Obter token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'hemolink', // ID do projeto do Expo (slug do app.json)
    });
    const token = tokenData.data;

    // Salvar token no Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        pushToken: token,
        pushTokenUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✅ Token de push registrado:', token);
    return token;
  } catch (error) {
    // Silenciar erro do Expo Go (esperado)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Expo Go')) {
      console.log('ℹ️ Rodando no Expo Go - notificações push desabilitadas');
      return null;
    }
    
    console.error('Erro ao registrar token de push:', error);
    return null;
  }
}

/**
 * Configura listeners para notificações
 */
export function configurarListenersNotificacao(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener para quando uma notificação é recebida (app em foreground)
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notificação recebida:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener para quando o usuário toca na notificação
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notificação tocada:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Retornar função para limpar listeners
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Busca o token de push de um usuário
 */
export async function buscarTokenPush(userId: string): Promise<string | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.pushToken || null;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar token de push:', error);
    return null;
  }
}
