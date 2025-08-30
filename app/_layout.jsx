import { Stack } from 'expo-router';
import { CartProvider } from '../contexts/CartContext';

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="homepage" options={{ headerShown: false }} />
        <Stack.Screen name="meal" options={{ headerShown: false }} />
        <Stack.Screen name="snacks" options={{ headerShown: false }} />
        <Stack.Screen name="drinks" options={{ headerShown: false }} />
        <Stack.Screen name="biscuit" options={{ headerShown: false }} />
        <Stack.Screen name="admin/admindashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin/adminorders" options={{ headerShown: false }} />
        <Stack.Screen name="admin/orderdetails" options={{ headerShown: false }} />
        <Stack.Screen name="admin/students" options={{ headerShown: false }} />
        <Stack.Screen name="admin/canteenadmin" options={{ headerShown: false }} />
      </Stack>
    </CartProvider>
  );
}
