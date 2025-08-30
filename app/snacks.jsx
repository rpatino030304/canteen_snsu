import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../contexts/CartContext';

const snackItems = [
  { id: 1, name: 'CHIPS', price: 50, image: require('../assets/images/snakcs.png') },
  { id: 2, name: 'CANDY', price: 50, image: require('../assets/images/icon.png') },
  { id: 3, name: 'CHOCOLATE', price: 50, image: require('../assets/images/icon.png') },
  { id: 4, name: 'COOKIES', price: 50, image: require('../assets/images/icon.png') },
  { id: 5, name: 'NUTS', price: 50, image: require('../assets/images/icon.png') },
  { id: 6, name: 'CRACKERS', price: 50, image: require('../assets/images/icon.png') },
];

export default function SnacksPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const handleConfirmOrder = () => {
    if (selectedItem) {
      addToCart(selectedItem);
    }
    setShowConfirmDialog(false);
    setSelectedItem(null);
  };

  const handleCancelOrder = () => {
    setShowConfirmDialog(false);
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.currencyDisplay}>
          <Text style={styles.currencyIcon}>C</Text>
          <Text style={styles.pesoSign}>₱</Text>
          <Text style={styles.balanceAmount}>500</Text>
        </View>
        <TouchableOpacity style={styles.userButton} onPress={() => router.push('/homepage')}>
          <Text style={styles.userIcon}>👤</Text>
          <Text style={styles.userText}>USER</Text>
        </TouchableOpacity>
      </View>

      

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={34} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SNACKS</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.itemsGrid}>
          {snackItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.itemBox} onPress={() => handleItemClick(item)}>
              <Image source={item.image} style={styles.itemImage} />
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₱{item.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Modal
        visible={showConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelOrder}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Add to Cart?</Text>
            {selectedItem && (
              <View style={styles.confirmItem}>
                <Image source={selectedItem.image} style={styles.confirmItemImage} />
                <View style={styles.confirmItemInfo}>
                  <Text style={styles.confirmItemName}>{selectedItem.name}</Text>
                  <Text style={styles.confirmItemPrice}>₱ {selectedItem.price}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
                <Text style={styles.confirmButtonText}>CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <Text style={styles.footer}>SURIGAO DEL NORTE STATE UNIVERSITY</Text>
    </View>
  );
}

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  leftBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconButton: {
    marginRight: 10,
    padding: 6,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  currencyIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  pesoSign: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#39FF14',
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  userText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  header: {
    backgroundColor: '#39FF14',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBackButton: {
    position: 'absolute',
    left: 16,
    padding: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  itemBox: {
    width: itemWidth,
    backgroundColor: '#f6fff6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#39FF14',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmDialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  confirmItemInfo: {
    flex: 1,
  },
  confirmItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmItemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  confirmButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
  cancelButton: {
    backgroundColor: '#FF3333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
  footer: {
    textAlign: 'center',
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 13,
    paddingVertical: 10,
    opacity: 0.7,
  },
}); 