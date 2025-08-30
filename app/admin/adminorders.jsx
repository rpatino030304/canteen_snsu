import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GREEN = '#43ff00';
const BASE_URL = 'http://192.168.1.5:4000';

export default function AdminOrders() {
	const router = useRouter();
	const [orders, setOrders] = useState([]);
	const [filteredOrders, setFilteredOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		loadOrders();
	}, []);

	const loadOrders = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${BASE_URL}/orders`);
			if (!response.ok) {
				throw new Error('Failed to fetch orders');
			}
			const data = await response.json();
			const ordersData = data.orders || [];
			setOrders(ordersData);
			setFilteredOrders(ordersData);
		} catch (error) {
			console.error('Error loading orders:', error);
			Alert.alert('Error', 'Failed to load orders');
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
		if (!query.trim()) {
			setFilteredOrders(orders);
			return;
		}
		
		const filtered = orders.filter(order => 
			order.id.toString().includes(query.trim())
		);
		setFilteredOrders(filtered);
	};

	const handleStatusUpdate = async (orderId, newStatus) => {
		try {
			const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update order');
			}

			// Reload orders to get updated data
			await loadOrders();
			Alert.alert('Success', `Order ${newStatus.toLowerCase()} successfully`);
		} catch (error) {
			console.error('Error updating order status:', error);
			Alert.alert('Error', error.message || 'Failed to update order status');
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING': return '#FFA500';
			case 'CONFIRMED': return GREEN;
			case 'REFUNDED': return '#FF3333';
			default: return '#666';
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	};

	return (
		<View style={styles.container}>
			<View style={styles.sidebar}>
				<Text style={styles.sidebarTitle}>ADMIN</Text>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/admindashboard')}>
					<Text style={styles.navText}>Dashboard</Text>
				</TouchableOpacity>
				<TouchableOpacity style={StyleSheet.compose(styles.navItem, styles.activeItem)} onPress={() => router.push('/admin/adminorders')}>
					<Text style={StyleSheet.compose(styles.navText, styles.activeText)}>Orders</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/students')}><Text style={styles.navText}>Students</Text></TouchableOpacity>
				<TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Canteen</Text></TouchableOpacity>
				<TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Data</Text></TouchableOpacity>
			</View>

			<ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
				<View style={styles.headerRow}>
					<Text style={styles.header}>ORDERS</Text>
					<TouchableOpacity style={styles.refreshButton} onPress={loadOrders}>
						<Text style={styles.refreshButtonText}>🔄</Text>
					</TouchableOpacity>
				</View>
				
				{/* Search Bar */}
				<View style={styles.searchContainer}>
					<Text style={styles.searchIcon}>🔍</Text>
					<TextInput
						style={styles.searchInput}
						placeholder="Search by Order ID..."
						placeholderTextColor="#999"
						value={searchQuery}
						onChangeText={handleSearch}
						keyboardType="numeric"
					/>
				</View>
				
				{loading ? (
					<Text style={styles.loadingText}>Loading orders...</Text>
				) : filteredOrders.length === 0 ? (
					<Text style={styles.emptyText}>
						{searchQuery ? `No orders found with ID: ${searchQuery}` : 'No orders found'}
					</Text>
				) : (
					filteredOrders.map((order, index) => (
						<View key={order.id} style={styles.orderRow}>
							<View style={styles.orderInfo}>
								<Text style={styles.orderText}>{`${index + 1}. ${order.student_name}`}</Text>
								<Text style={styles.orderId}>{`ORDER ID: ${order.id}`}</Text>
								<Text style={styles.orderAmount}>{`TOTAL: ₱${order.total_amount}`}</Text>
								<Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
								
								{/* Order Items */}
								<View style={styles.orderItems}>
									<Text style={styles.orderItemsTitle}>Items:</Text>
									{order.items.map((item, itemIndex) => (
										<Text key={itemIndex} style={styles.orderItem}>
											{`• ${item.name} x${item.quantity} - ₱${item.price * item.quantity}`}
										</Text>
									))}
								</View>
							</View>
							
							<View style={styles.orderActions}>
								<View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
									<Text style={styles.statusText}>{order.status}</Text>
								</View>
								
								{order.status === 'PENDING' && (
									<View style={styles.actionButtons}>
										<TouchableOpacity 
											style={styles.confirmBtn} 
											onPress={() => handleStatusUpdate(order.id, 'CONFIRMED')}
										>
											<Text style={styles.actionText}>CONFIRM</Text>
										</TouchableOpacity>
										<TouchableOpacity 
											style={styles.refundBtn} 
											onPress={() => handleStatusUpdate(order.id, 'REFUNDED')}
										>
											<Text style={styles.actionText}>REFUND</Text>
										</TouchableOpacity>
									</View>
								)}
								
								{order.status === 'CONFIRMED' && (
									<Text style={styles.confirmedText}>✓ Confirmed</Text>
								)}
								
								{order.status === 'REFUNDED' && (
									<Text style={styles.refundedText}>↻ Refunded</Text>
								)}
							</View>
						</View>
					))
				)}
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
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	header: { fontWeight: '800', color: '#e5e500' },
	refreshButton: {
		padding: 8,
		backgroundColor: '#fff',
		borderRadius: 20,
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	refreshButtonText: {
		fontSize: 18,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 25,
		paddingHorizontal: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#bff4a8',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	searchIcon: {
		fontSize: 18,
		color: '#666',
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		height: 45,
		fontSize: 16,
		color: '#333',
	},
	orderRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#bff4a8',
		backgroundColor: '#fff',
		marginBottom: 10,
	},
	orderInfo: {
		flex: 1,
	},
	orderText: { fontWeight: '700', fontSize: 16 },
	orderId: { fontWeight: '800', fontSize: 14, marginTop: 4 },
	orderAmount: { fontWeight: '600', color: '#007bff', marginTop: 4, fontSize: 14 },
	orderDate: { fontSize: 12, color: '#666', marginTop: 4 },
	orderItems: { marginTop: 8 },
	orderItemsTitle: { fontWeight: '600', color: '#333', fontSize: 13 },
	orderItem: { fontSize: 12, color: '#555', marginTop: 2 },
	orderActions: {
		alignItems: 'center',
		minWidth: 100,
	},
	statusBadge: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 15,
		marginBottom: 8,
	},
	statusText: { color: '#fff', fontWeight: '800', fontSize: 12 },
	actionButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	confirmBtn: { backgroundColor: GREEN, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
	refundBtn: { backgroundColor: '#ff2552', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
	actionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
	confirmedText: { color: GREEN, fontWeight: '600', fontSize: 13 },
	refundedText: { color: '#ff2552', fontWeight: '600', fontSize: 13 },
	loadingText: { textAlign: 'center', marginTop: 20, color: '#666' },
	emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
});


