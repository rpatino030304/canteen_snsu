import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminDashboard() {
	const router = useRouter();
	return (
		<View style={styles.container}>
			{/* Sidebar */}
			<View style={styles.sidebar}>
				<Text style={styles.sidebarTitle}>ADMIN</Text>
				<TouchableOpacity
					style={StyleSheet.compose(styles.navItem, styles.activeItem)}
					onPress={() => router.push('/admin/admindashboard')}
				>
					<Text style={StyleSheet.compose(styles.navText, styles.activeText)}>Dashboard</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.navItem}
					onPress={() => router.push('/admin/adminorders')}
				>
					<Text style={styles.navText}>Orders</Text>
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

			{/* Main content */}
			<ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
				<Text style={styles.header}>DASHBOARD</Text>
				<View style={styles.cardsRow}>
					<View style={styles.card} />
					<View style={styles.card} />
					<View style={styles.card} />
				</View>
				<View style={styles.bigPanel} />
			</ScrollView>
		</View>
	);
}

const GREEN = '#43ff00';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: '#f3f7f9',
	},
	sidebar: {
		width: 170,
		backgroundColor: GREEN,
		paddingTop: 16,
		paddingHorizontal: 12,
	},
	sidebarTitle: {
		color: '#0a0a0a',
		fontWeight: 'bold',
		marginBottom: 12,
	},
	navItem: {
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 18,
		marginVertical: 6,
		backgroundColor: 'transparent',
	},
	activeItem: {
		backgroundColor: '#ffffffcc',
	},
	navText: {
		color: '#0a0a0a',
		fontWeight: '600',
	},
	activeText: {
		color: '#c6d800',
		fontWeight: '800',
	},
	main: {
		flex: 1,
	},
	mainContent: {
		paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 24,
	},
	header: {
		fontWeight: '800',
		color: '#e5e500',
		marginBottom: 8,
	},
	cardsRow: {
		flexDirection: 'row',
		gap: 16,
		marginBottom: 14,
	},
	card: {
		flexGrow: 1,
		flexBasis: 0,
		height: 90,
		backgroundColor: '#fff',
		borderRadius: 8,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 2,
	},
	bigPanel: {
		height: 360,
		backgroundColor: '#fff',
		borderRadius: 8,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 6,
		elevation: 2,
	},
});


