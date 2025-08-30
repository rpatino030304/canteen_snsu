import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GREEN = '#43ff00';
const BASE_URL = 'http://192.168.1.5:4000';

const SAMPLE_STUDENTS = [];

export default function StudentsScreen() {
	const router = useRouter();
	const [students, setStudents] = useState(SAMPLE_STUDENTS);
	const [showCredit, setShowCredit] = useState(false);
	const [selectedId, setSelectedId] = useState(null);
	const [amount, setAmount] = useState('');
	const [showAddStudent, setShowAddStudent] = useState(false);
	const [newStudentEmail, setNewStudentEmail] = useState('');
	const [newStudentPassword, setNewStudentPassword] = useState('');
	const [showEditStudent, setShowEditStudent] = useState(false);
	const [editingStudent, setEditingStudent] = useState(null);
	const [editStudentEmail, setEditStudentEmail] = useState('');
	const [editStudentPassword, setEditStudentPassword] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredStudents, setFilteredStudents] = useState([]);

	const loadStudents = async () => {
		try {
			const res = await fetch(`${BASE_URL}/students`);
			if (!res.ok) return;
			const data = await res.json();
			const list = Array.isArray(data?.students) ? data.students : [];
			// Map API rows to UI shape (ensure id, name, balance, email)
			const studentsList = list.map((s) => ({ 
				id: s.id, 
				name: s.name, 
				balance: Number(s.balance ?? 0),
				email: s.email 
			}));
			setStudents(studentsList);
			setFilteredStudents(studentsList);
		} catch (e) {
			// ignore for now
		}
	};

	useEffect(() => {
		loadStudents();
	}, []);

	const selectedStudent = students.find((s) => s.id === selectedId) || null;

	const openCredit = (id) => {
		setSelectedId(id);
		setAmount('');
		setShowCredit(true);
	};

	const confirmCredit = async () => {
		const numeric = parseInt(String(amount), 10) || 0;
		if (!selectedId || numeric <= 0) {
			setShowCredit(false);
			return;
		}
		try {
			// Try POST first
			const res = await fetch(`${BASE_URL}/students/${selectedId}/credit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: numeric }),
			});
			if (!res.ok) {
				// Fallback to GET with query params
				await fetch(`${BASE_URL}/students/${selectedId}/credit?amount=${numeric}`);
			}
			await loadStudents();
		} catch (e) {
			await loadStudents();
		} finally {
			setShowCredit(false);
		}
	};

	const openAddStudent = () => {
		setNewStudentEmail('');
		setNewStudentPassword('');
		setShowAddStudent(true);
	};

	const openEditStudent = (student) => {
		setEditingStudent(student);
		setEditStudentEmail(student.email);
		setEditStudentPassword(student.password || '');
		setShowEditStudent(true);
	};

	const confirmAddStudent = async () => {
		const trimmedEmail = newStudentEmail.trim();
		const trimmedPassword = newStudentPassword.trim();
		if (!trimmedEmail || !trimmedPassword) {
			setShowAddStudent(false);
			return;
		}
		try {
			const res = await fetch(`${BASE_URL}/students`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
			});
			if (!res.ok) {
				throw new Error('Failed to add student');
			}
			const data = await res.json();
			const created = data?.student;
			if (created) await loadStudents();
		} catch (e) {
			// No-op simple error handling for now
		} finally {
			setShowAddStudent(false);
		}
	};

	const confirmEditStudent = async () => {
		const trimmedEmail = editStudentEmail.trim();
		const trimmedPassword = editStudentPassword.trim();
		if (!trimmedEmail || !trimmedPassword || !editingStudent) {
			setShowEditStudent(false);
			return;
		}
		try {
			const res = await fetch(`${BASE_URL}/students/${editingStudent.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
			});
			if (!res.ok) {
				throw new Error('Failed to update student');
			}
			await loadStudents();
		} catch (e) {
			// No-op simple error handling for now
		} finally {
			setShowEditStudent(false);
			setEditingStudent(null);
		}
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
		if (!query.trim()) {
			setFilteredStudents(students);
			return;
		}
		
		const filtered = students.filter(student => {
			const searchLower = query.toLowerCase();
			const nameLower = student.name.toLowerCase();
			const emailLower = student.email.toLowerCase();
			
			// Search by name or email (including partial matches)
			return nameLower.includes(searchLower) || emailLower.includes(searchLower);
		});
		
		setFilteredStudents(filtered);
	};

	return (
		<View style={styles.container}>
			<View style={styles.sidebar}>
				<Text style={styles.sidebarTitle}>ADMIN</Text>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/admindashboard')}><Text style={styles.navText}>Dashboard</Text></TouchableOpacity>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/adminorders')}><Text style={styles.navText}>Orders</Text></TouchableOpacity>
				<TouchableOpacity style={StyleSheet.compose(styles.navItem, styles.activeItem)}><Text style={StyleSheet.compose(styles.navText, styles.activeText)}>Students</Text></TouchableOpacity>
				<TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/canteenadmin')}><Text style={styles.navText}>Canteen</Text></TouchableOpacity>
				<TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Data</Text></TouchableOpacity>
			</View>

			<ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
				<Text style={styles.header}>STUDENTS</Text>
				<View style={styles.toolbar}>
					<View style={styles.searchContainer}>
						<Text style={styles.searchIcon}>🔍</Text>
						<TextInput
							style={styles.searchInput}
							placeholder="Search by name or email..."
							placeholderTextColor="#bdbdbd"
							value={searchQuery}
							onChangeText={handleSearch}
						/>
					</View>
					<TouchableOpacity style={styles.addBtn} onPress={openAddStudent}><Text style={styles.addLabel}>ADD STUDENT</Text></TouchableOpacity>
				</View>
				{filteredStudents.map((s, idx) => (
					<View key={s.id} style={styles.row}>
						<Text style={styles.rowText}>{`${idx + 1}.  ${s.name}`}</Text>
						<Text style={styles.balanceText}>{`BALANCE: ${Number(s.balance ?? 0)}`}</Text>
						<View style={styles.actions}>
							<TouchableOpacity style={styles.creditBtn} onPress={() => openCredit(s.id)}><Text style={styles.actionLabel}>CREDIT</Text></TouchableOpacity>
							<TouchableOpacity style={styles.editBtn} onPress={() => openEditStudent(s)}><Text style={styles.actionLabel}>EDIT</Text></TouchableOpacity>
						</View>
					</View>
				))}
			</ScrollView>

			{/* Credit Modal */}
			<Modal visible={showCredit} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>CREDIT</Text>
						{selectedStudent && (
							<View style={{ marginBottom: 12 }}>
								<Text style={styles.metaText}>{`NAME: ${selectedStudent.name}`}</Text>
								<Text style={styles.metaText}>{`BALANCE: ${Number(selectedStudent.balance ?? 0)}`}</Text>
							</View>
						)}
						<TextInput
							style={styles.input}
							keyboardType="number-pad"
							placeholder="0"
							placeholderTextColor="#bdbdbd"
							value={amount}
							onChangeText={(txt) => setAmount(txt.replace(/[^0-9]/g, ''))}
						/>
						<View style={styles.modalActions}>
							<TouchableOpacity style={styles.confirmBtn} onPress={confirmCredit}><Text style={styles.confirmLabel}>CONFIRM</Text></TouchableOpacity>
							<TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCredit(false)}><Text style={styles.confirmLabel}>CANCEL</Text></TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add Student Modal */}
			<Modal visible={showAddStudent} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>ADD STUDENT</Text>
						<Text style={styles.metaText}>EMAIL</Text>
						<TextInput
							style={styles.input}
							keyboardType="email-address"
							autoCapitalize="none"
							placeholder="student@example.com"
							placeholderTextColor="#bdbdbd"
							value={newStudentEmail}
							onChangeText={setNewStudentEmail}
						/>
						<Text style={styles.metaText}>PASSWORD</Text>
						<TextInput
							style={styles.input}
							secureTextEntry
							placeholder="Enter password"
							placeholderTextColor="#bdbdbd"
							value={newStudentPassword}
							onChangeText={setNewStudentPassword}
						/>
						<View style={styles.modalActions}>
							<TouchableOpacity style={styles.confirmBtn} onPress={confirmAddStudent}><Text style={styles.confirmLabel}>ADD</Text></TouchableOpacity>
							<TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddStudent(false)}><Text style={styles.confirmLabel}>CANCEL</Text></TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Edit Student Modal */}
			<Modal visible={showEditStudent} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>EDIT STUDENT</Text>
						{editingStudent && (
							<View style={{ marginBottom: 12 }}>
								<Text style={styles.metaText}>{`NAME: ${editingStudent.name}`}</Text>
								<Text style={styles.metaText}>{`BALANCE: ${Number(editingStudent.balance ?? 0)}`}</Text>
							</View>
						)}
						<Text style={styles.metaText}>EMAIL</Text>
						<TextInput
							style={styles.input}
							keyboardType="email-address"
							autoCapitalize="none"
							placeholder="student@example.com"
							placeholderTextColor="#bdbdbd"
							value={editStudentEmail}
							onChangeText={setEditStudentEmail}
						/>
						<Text style={styles.metaText}>PASSWORD</Text>
						<TextInput
							style={styles.input}
							secureTextEntry
							placeholder="Enter password"
							placeholderTextColor="#bdbdbd"
							value={editStudentPassword}
							onChangeText={setEditStudentPassword}
						/>
						<View style={styles.modalActions}>
							<TouchableOpacity style={styles.confirmBtn} onPress={confirmEditStudent}><Text style={styles.confirmLabel}>UPDATE</Text></TouchableOpacity>
							<TouchableOpacity style={styles.cancelBtn} onPress={() => {
								setShowEditStudent(false);
								setEditingStudent(null);
							}}><Text style={styles.confirmLabel}>CANCEL</Text></TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
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
	toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: '#bff4a8',
		flex: 1,
		marginRight: 12,
	},
	searchIcon: {
		fontSize: 16,
		marginRight: 8,
		color: '#666',
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: '#333',
	},
	row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bff4a8', backgroundColor: '#fff', marginBottom: 10 },
	rowText: { flex: 1, fontWeight: '700' },
	balanceText: { fontWeight: '800' },
	actions: { flexDirection: 'row', gap: 8 },
	creditBtn: { backgroundColor: GREEN, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
	addBtn: { backgroundColor: '#1e90ff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
	addLabel: { color: '#fff', fontWeight: '800' },
	editBtn: { backgroundColor: '#ffcc00', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
	actionLabel: { color: '#fff', fontWeight: '800', fontSize: 12 },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
	modalCard: { width: '85%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#9cff64', borderRadius: 10, padding: 16 },
	modalTitle: { color: '#e5e500', fontWeight: '800', fontSize: 22, marginBottom: 10 },
	metaText: { fontWeight: '700', marginBottom: 4 },
	input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 14, marginBottom: 16 },
	modalActions: { flexDirection: 'row', gap: 14, justifyContent: 'center' },
	confirmBtn: { backgroundColor: GREEN, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
	cancelBtn: { backgroundColor: '#ff2a2a', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
	confirmLabel: { color: '#fff', fontWeight: '800' },
});


