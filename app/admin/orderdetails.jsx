import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GREEN = '#43ff00';

const SAMPLE_ORDERS = {
	'001': [
		{ name: 'FRIED RICE', price: 50 },
		{ name: 'PORK CHOP', price: 50 },
		{ name: 'NATURE SPRING 100ml', price: 50 },
	],
	'002': [
		{ name: 'FRIED RICE', price: 50 },
		{ name: 'HOTDOG', price: 40 },
	],
	'003': [
		{ name: 'BEEF RICE', price: 60 },
	],
};

export default function OrderDetails() {
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const orderId = typeof id === 'string' ? id : '001';
	const items = SAMPLE_ORDERS[orderId] || SAMPLE_ORDERS['001'];
	const total = items.reduce((sum, i) => sum + i.price, 0);

	return (
		<View style={styles.container}>
			{/* Sidebar */}
			<View style={styles.sidebar}>
				<Text style={styles.sidebarTitle}>ADMIN</Text>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/admindashboard')}>
					<Text style={styles.navText}>Dashboard</Text>
				</TouchableOpacity>
				<TouchableOpacity style={StyleSheet.compose(styles.navItem, styles.activeItem)} onPress={() => router.push('/admin/adminorders')}>
					<Text style={StyleSheet.compose(styles.navText, styles.activeText)}>Orders</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/students')}>
					<Text style={styles.navText}>Students</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navItem}>
					<Text style={styles.navText}>Canteen</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navItem}>
					<Text style={styles.navText}>Data</Text>
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
				<Text style={styles.header}>ORDERS-CLICK</Text>
				<View style={styles.panel}>
					<View style={styles.panelHeaderRow}>
						<Text style={styles.panelHeader}>ORDERED</Text>
						<Text style={styles.panelHeader}>PRICE</Text>
						<Text style={styles.panelHeader}>SCREENSHOT</Text>
					</View>
					<View style={styles.panelBodyRow}>
						<View style={styles.orderedCol}>
							{items.map((it) => (
								<Text key={it.name} style={styles.itemText}>{it.name}</Text>
							))}
						</View>
						<View style={styles.priceCol}>
							{items.map((it) => (
								<Text key={it.name} style={styles.itemText}>{it.price}</Text>
							))}
						</View>
						<View style={styles.screenshotCol}>
							<View style={styles.screenshotBox}>
								<Text style={styles.orderIdLabel}>ORDER ID:</Text>
								<Text style={styles.orderIdValue}>{orderId}</Text>
							</View>
						</View>
					</View>
					<Text style={styles.totalText}>{`TOTAL: ${total}`}</Text>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, flexDirection: 'row', backgroundColor: '#f3f7f9' },
	sidebar: { width: 170, backgroundColor: GREEN, paddingTop: 16, paddingHorizontal: 12 },
	sidebarTitle: { color: '#0a0a0a', fontWeight: 'bold', marginBottom: 12 },
	navItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 18, marginVertical: 6 },
	activeItem: { backgroundColor: '#ffffffcc' },
	navText: { color: '#0a0a0a', fontWeight: '600' },
	activeText: { color: '#c6d800', fontWeight: '800' },
	main: { flex: 1 },
	mainContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
	header: { fontWeight: '800', color: '#a0a0a0', marginBottom: 8 },
	panel: {
		backgroundColor: '#fff',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#b7f7a6',
		padding: 16,
		shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
	},
	panelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
	panelHeader: { color: '#e5e500', fontWeight: '800' },
	panelBodyRow: { flexDirection: 'row', gap: 16 },
	orderedCol: { flex: 2, gap: 20 },
	priceCol: { flex: 1, gap: 20, alignItems: 'center' },
	screenshotCol: { flex: 2, alignItems: 'center', justifyContent: 'center' },
	screenshotBox: { width: 200, height: 150, borderRadius: 6, borderColor: '#9cff64', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
	orderIdLabel: { color: GREEN, fontWeight: '800' },
	orderIdValue: { color: '#111', fontWeight: '800', marginTop: 4 },
	itemText: { fontWeight: '800', marginBottom: 6 },
	totalText: { alignSelf: 'center', marginTop: 12, fontWeight: '800' },
});


