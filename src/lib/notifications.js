let Notifications;
try {
  // dynamic require to prevent crash if dependency missing in some env
  // eslint-disable-next-line global-require
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not available; push disabled');
  Notifications = null;
}
import { Platform } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from './firebaseApp';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function registerForPushNotificationsAsync() {
  let token;
  if(!Notifications) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.MAX,
    });
  }
  return token;
}

export async function savePushToken(token) {
  const auth = getAuth();
  const user = auth.currentUser;
  if(!user || !token) return;
  const ref = doc(db, 'users', user.uid, 'meta', 'push');
  await setDoc(ref, { token, updatedAt: serverTimestamp(), platform: Platform.OS }, { merge: true });
}

export async function initPushTokenFlow() {
  try {
    const token = await registerForPushNotificationsAsync();
    if(token) await savePushToken(token);
    return token;
  } catch(e) {
    console.warn('Push token registration failed', e);
    return null;
  }
}

export default { initPushTokenFlow, savePushToken };
