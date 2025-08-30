import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCart } from '../contexts/CartContext';

const categories = [];
const CATEGORY_ORDER = ['MEAL', 'SNACKS', 'DRINKS', 'BISCUIT'];

export default function Homepage() {
  const router = useRouter();
  const { cartItems, addToCart, updateQuantity, getTotal, clearCart } = useCart();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [filteredCombos, setFilteredCombos] = useState([]);

  const BASE_URL = 'http://192.168.1.5:4000';

  const getImageSrc = (img) => {
    try {
      if (!img) return null;
      if (typeof img === 'string') {
        if (img.startsWith('http://') || img.startsWith('https://')) return { uri: img };
        if (img.startsWith('/')) return { uri: `${BASE_URL}${img}` };
        return { uri: `${BASE_URL}/images/${img}` };
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem('currentUser');
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
          // Refresh latest balance from backend
          if (parsed?.id) {
            const res = await fetch(`${BASE_URL}/students/${parsed.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.student) {
                setUser(data.student);
                await AsyncStorage.setItem('currentUser', JSON.stringify(data.student));
              }
            }
          }
        }
      } catch {}
    };
    const loadItems = async () => {
      try {
        console.log('Loading items...'); // Debug log
        const res = await fetch(`${BASE_URL}/items`);
        if (!res.ok) {
          console.log('Failed to load items:', res.status);
          return;
        }
        const data = await res.json();
        console.log('Items loaded:', data?.items?.length || 0); // Debug log
        const itemsList = Array.isArray(data?.items) ? data.items : [];
        setItems(itemsList);
        setFilteredItems(itemsList);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    };
    const loadCombos = async () => {
      try {
        const res = await fetch(`${BASE_URL}/combos`);
        if (!res.ok) return;
        const data = await res.json();
        const combosList = Array.isArray(data?.combos) ? data.combos : [];
        setCombos(combosList);
        setFilteredCombos(combosList);
      } catch {}
    };
    const loadOrderHistory = async () => {
      try {
        if (user?.id) {
          const res = await fetch(`${BASE_URL}/orders/student/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setOrderHistory(Array.isArray(data?.orders) ? data.orders : []);
          }
        }
      } catch (error) {
        console.error('Error loading order history:', error);
      }
    };
    
    // Initial load
    loadUser();
    loadItems();
    loadCombos();
    if (user?.id) {
      loadOrderHistory();
    }

    // Set up real-time updates every 10 seconds
    const intervalId = setInterval(() => {
      loadItems();
      loadCombos();
      if (user?.id) {
        loadOrderHistory();
        // Also refresh user balance
        loadUser();
      }
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const handleComboClick = (combo) => {
    console.log('Combo clicked:', combo); // Debug log
    if (!combo || !combo.id) {
      console.log('Invalid combo data:', combo);
      return;
    }
    
    // Ensure the combo has the correct structure for the cart
    const cartCombo = {
      id: combo.id,
      name: combo.name,
      price: combo.price,
      image: combo.image,
      quantity: 1
    };
    
    setSelectedCombo(cartCombo);
    setShowConfirmDialog(true);
  };

  const handleConfirmOrder = () => {
    if (selectedCombo) {
      console.log('Adding to cart:', selectedCombo);
      addToCart(selectedCombo);
    }
    setShowConfirmDialog(false);
    setSelectedCombo(null);
  };

  const handleCancelOrder = () => {
    setShowConfirmDialog(false);
    setSelectedCombo(null);
  };

  const handleBuyClick = () => {
    setShowBuyConfirm(true);
  };

  const handleConfirmBuy = async () => {
    try {
      if (!user) {
        alert('Please log in to make a purchase');
        return;
      }

      const total = getTotal();
      console.log('Creating order with total:', total);
      console.log('Cart items:', cartItems);
      
      // Create order in database
      const orderData = {
        studentId: user.id,
        studentName: user.name,
        totalAmount: total,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        }))
      };

      console.log('Order data being sent:', orderData);

      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        if (errorData.error === 'Insufficient balance') {
          alert('Insufficient balance to complete this purchase');
          return;
        }
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();
      console.log('Order created successfully:', result);
      
      // Update local user balance
      setUser(prev => ({ ...prev, balance: result.updatedBalance }));
      await AsyncStorage.setItem('currentUser', JSON.stringify({ ...user, balance: result.updatedBalance }));

      // Show success and clear cart
      setShowCart(false);
      setShowBuyConfirm(false);
      setShowReceipt(true);
      setOrderId(result.order.id); // Use the actual order ID from backend
      clearCart();
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const handleCancelBuy = () => {
    setShowBuyConfirm(false);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
  };

  const handleShowHistory = async () => {
    setShowUserProfile(false);
    if (user?.id) {
      try {
        const res = await fetch(`${BASE_URL}/orders/student/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrderHistory(Array.isArray(data?.orders) ? data.orders : []);
        }
      } catch (error) {
        console.error('Error loading order history:', error);
      }
    }
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleShowOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // Functions for manual refresh
  const loadItems = async () => {
    try {
      console.log('Loading items...'); // Debug log
      const res = await fetch(`${BASE_URL}/items`);
      if (!res.ok) {
        console.log('Failed to load items:', res.status);
        return;
      }
      const data = await res.json();
      console.log('Items loaded:', data?.items?.length || 0); // Debug log
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadCombos = async () => {
    try {
      const res = await fetch(`${BASE_URL}/combos`);
      if (!res.ok) return;
      const data = await res.json();
      setCombos(Array.isArray(data?.combos) ? data.combos : []);
    } catch {}
  };

  const loadOrderHistory = async () => {
    try {
      if (user?.id) {
        const res = await fetch(`${BASE_URL}/orders/student/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrderHistory(Array.isArray(data?.orders) ? data.orders : []);
        }
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const loadUser = async () => {
    try {
      if (user?.id) {
        const res = await fetch(`${BASE_URL}/students/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.student) {
            setUser(data.student);
            await AsyncStorage.setItem('currentUser', JSON.stringify(data.student));
          }
        }
      }
    } catch {}
  };

  // Function to handle search filtering
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredItems(items);
      setFilteredCombos(combos);
      return;
    }
    
    const searchLower = query.toLowerCase();
    
    // Filter items by name
    const filteredItemsList = items.filter(item => 
      item.name.toLowerCase().includes(searchLower)
    );
    setFilteredItems(filteredItemsList);
    
    // Filter combos by name
    const filteredCombosList = combos.filter(combo => 
      combo.name.toLowerCase().includes(searchLower)
    );
    setFilteredCombos(filteredCombosList);
  };

  // Function to handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadItems(),
        loadCombos(),
        user?.id ? loadOrderHistory() : Promise.resolve(),
        user?.id ? loadUser() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.currencyDisplay}>
          <Text style={styles.currencyIcon}>C</Text>
          <Text style={styles.pesoSign}>₱</Text>
          <Text style={styles.balanceAmount}>{user ? Number(user.balance ?? 0) : 0}</Text>
        </View>
                 <View style={styles.actionButtonsRow}>
           <TouchableOpacity style={styles.userButton} onPress={() => setShowUserProfile(true)}>
             <Text style={styles.userIcon}>👤</Text>
             <Text style={styles.userText}>{user ? user.name : 'USER'}</Text>
           </TouchableOpacity>
         </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#39FF14']}
            tintColor="#39FF14"
            title="Pull to refresh..."
            titleColor="#39FF14"
          />
        }
      >

      {/* User Profile Modal */}
      <Modal
        visible={showUserProfile}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.profilePicture}>
              <Text style={styles.profileIcon}>👤</Text>
            </View>
            <Text style={styles.userName}>{user ? user.name : 'User'}</Text>
            <Text style={styles.userBalance}>BALANCE: ₱ {user ? Number(user.balance ?? 0) : 0}</Text>
            
            
                         <TouchableOpacity style={styles.historyButton} onPress={handleShowHistory}>
               <Text style={styles.historyButtonText}>VIEW ORDER</Text>
             </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={async () => {
              setShowUserProfile(false);
              await AsyncStorage.removeItem('currentUser');
              router.push('/');
            }}>
              <Text style={styles.logoutButtonText}>LOG OUT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowUserProfile(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseHistory}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
                         <Text style={styles.historyTitle}>VIEW ORDER</Text>
            
            <ScrollView style={styles.historyItemsContainer}>
              {orderHistory.length > 0 ? (
                orderHistory.map((order) => (
                  <TouchableOpacity 
                    key={order.id} 
                    style={styles.historyItem}
                    onPress={() => handleShowOrderDetails(order)}
                  >
                    <View style={styles.historyItemInfo}>
                                                               <Text style={styles.historyItemDate}>
                       {(() => {
                         // Try multiple possible date field names from the backend
                         const dateValue = order.created_at || order.createdAt || order.orderDate || order.date;
                         if (!dateValue) return 'Date not available';
                         
                         const date = new Date(dateValue);
                         if (isNaN(date.getTime())) return 'Invalid date';
                         
                         return date.toLocaleString('en-US', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit'
                         });
                       })()}
                     </Text>
                      <Text style={styles.historyItemTotal}>₱ {order.totalAmount}</Text>
                    </View>
                    <Text style={styles.historyItemCount}>
                      {order.items?.length || 0} items
                    </Text>
                    <Text style={styles.historyItemStatus}>
                      {order.status || 'Completed'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>No orders yet</Text>
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseHistory}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseOrderDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.orderDetailsModal}>
            <Text style={styles.orderDetailsTitle}>ORDER DETAILS</Text>
            
            {selectedOrder && (
              <View style={styles.orderDetailsContent}>
                <View style={styles.orderDetailsHeader}>
                                     <Text style={styles.orderDetailsDate}>
                     Date: {(() => {
                       // Try multiple possible date field names from the backend
                       const dateValue = selectedOrder.created_at || selectedOrder.createdAt || selectedOrder.orderDate || selectedOrder.date;
                       if (!dateValue) return 'Date not available';
                       
                       const date = new Date(dateValue);
                       if (isNaN(date.getTime())) return 'Invalid date';
                       
                       return date.toLocaleString('en-US', {
                         year: 'numeric',
                         month: 'short',
                         day: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit'
                       });
                     })()}
                   </Text>
                  <Text style={styles.orderDetailsTotal}>
                    Total: ₱ {selectedOrder.totalAmount}
                  </Text>
                </View>
                
                <ScrollView style={styles.orderItemsContainer}>
                  {selectedOrder.items?.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>{item.name}</Text>
                        <Text style={styles.orderItemPrice}>₱ {item.price}</Text>
                      </View>
                      <Text style={styles.orderItemQuantity}>
                        Qty: {item.quantity}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseOrderDetails}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal
        visible={showCart}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCart(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <Text style={styles.cartTitle}>CART</Text>
            
            <ScrollView style={styles.cartItemsContainer}>
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>₱ {item.price}</Text>
                    </View>
                    
                    <Image source={item.image} style={styles.itemImage} />
                    
                    <View style={styles.quantityContainer}>
                      <View style={styles.quantityBadge}>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                      </View>
                      
                      <View style={styles.quantityButtons}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <Text style={styles.quantityButtonText}>–</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCart}>
                  <Text style={styles.emptyCartText}>No items in cart</Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.cartFooter}>
              <Text style={styles.totalText}>TOTAL: ₱ {getTotal()}</Text>
              <TouchableOpacity 
                style={[styles.buyButton, cartItems.length === 0 && styles.buyButtonDisabled]} 
                onPress={handleBuyClick}
                disabled={cartItems.length === 0}
              >
                <Text style={styles.buyButtonText}>BUY</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCart(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Buy Confirmation Dialog */}
      <Modal
        visible={showBuyConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelBuy}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>Are you sure you want to buy this?</Text>
            <Text style={styles.confirmSubtitle}>Total: ₱ {getTotal()}</Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBuy}>
                <Text style={styles.confirmButtonText}>CONFIRM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBuy}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={showReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseReceipt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            <Text style={styles.receiptTitle}>ORDERED</Text>
            
            <View style={styles.receiptContent}>
              <View style={styles.receiptLeft}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptHeaderText}>ORDERED</Text>
                  <Text style={styles.receiptHeaderText}>PRICE</Text>
                </View>
                
                {cartItems.length > 0 ? (
                  cartItems.map((item, index) => (
                    <View key={index} style={styles.receiptItems}>
                      <Text style={styles.receiptItem}>{item.name}</Text>
                      <Text style={styles.receiptPrice}>₱{item.price * item.quantity}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.receiptItems}>
                    <Text style={styles.receiptItem}>No items</Text>
                    <Text style={styles.receiptPrice}>₱0</Text>
                  </View>
                )}
                
                <View style={styles.receiptTotal}>
                  <Text style={styles.receiptTotalText}>TOTAL: ₱{getTotal()}</Text>
                </View>
              </View>
              
              <View style={styles.receiptRight}>
                <Text style={styles.receiptHeaderText}>SCREENSHOT</Text>
                                 <View style={styles.orderIdBox}>
                   <Text style={styles.orderIdLabel}>ORDER ID:</Text>
                   <Text style={styles.orderIdNumber}>{orderId ? String(orderId).padStart(2, '0') : '--'}</Text>
                 </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseReceipt}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            {selectedCombo && (
              <View style={styles.confirmItem}>
                <Image source={selectedCombo.image} style={styles.confirmItemImage} />
                <View style={styles.confirmItemInfo}>
                  <Text style={styles.confirmItemName}>{selectedCombo.name}</Text>
                  <Text style={styles.confirmItemPrice}>₱ {selectedCombo.price}</Text>
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

      {/* Header */}
      <View style={styles.header}>
                <View style={{ flex: 1 }}>
          <Text style={styles.snsu}><Text style={styles.snsuBold}>SNSU</Text> <Text style={styles.canteen}>CANTEEN</Text></Text>
          <Text style={styles.subtitle}>Surigao Del Norte State University Canteen</Text>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Food..."
              placeholderTextColor="#39FF14"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>
        <Image source={require('../assets/images/snsu.png')} style={styles.foodImage} />
      </View>

      

             {/* Categories removed (dynamic items only) */}

       

             

             {/* Items grouped by category */}
       {CATEGORY_ORDER.map((cat) => {
         const list = filteredItems.filter((it) => it.category === cat);
         if (list.length === 0) return null;
         return (
           <View key={cat}>
             <Text style={styles.sectionTitle}>{cat}</Text>
             <View style={styles.comboContainer}>
                               {list.map((it) => (
                                     <TouchableOpacity 
                     key={it.id} 
                     style={styles.comboBox} 
                     onPress={() => {
                       console.log('Item pressed:', it.name); // Debug log
                       handleComboClick({ 
                         id: it.id, 
                         name: it.name, 
                         price: it.price, 
                         image: getImageSrc(it.image) 
                       });
                     }}
                     activeOpacity={0.6}
                     hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                   >
                    {getImageSrc(it.image) ? (
                      <Image source={getImageSrc(it.image)} style={styles.comboImage} />
                    ) : (
                      <View style={[styles.comboImage, { backgroundColor: '#eee' }]} />
                    )}
                                         <Text style={styles.comboLabel}>{it.name}</Text>
                     <Text style={styles.comboPrice}>₱{it.price}</Text>
                  </TouchableOpacity>
                ))}
             </View>
           </View>
         );
       })}

             {filteredCombos.length > 0 && (
               <>
                 <Text style={styles.sectionTitle}>COMBO MEAL</Text>
                 <View style={styles.comboContainer}>
                   {filteredCombos.map((cb) => (
                     <TouchableOpacity 
                       key={cb.id} 
                       style={styles.comboBox} 
                       onPress={() => handleComboClick({ id: cb.id, name: cb.name, price: cb.price, image: getImageSrc(cb.image) })}
                       activeOpacity={0.6}
                       hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                     >
                       {getImageSrc(cb.image) ? (
                         <Image source={getImageSrc(cb.image)} style={styles.comboImage} />
                       ) : (
                         <View style={[styles.comboImage, { backgroundColor: '#eee' }]} />
                       )}
                       <Text style={styles.comboLabel}>{cb.name}</Text>
                       <Text style={styles.comboPrice}>₱{cb.price}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </>
             )}

      </ScrollView>

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={styles.fabCartButton}
        onPress={() => setShowCart(true)}
        accessibilityLabel="Open Cart"
      >
                 <Ionicons name="cart" size={32} color="#39FF14" />
        {cartItems.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>SURIGAO DEL NORTE STATE UNIVERSITY</Text>
    </View>
  );
}

const { width } = Dimensions.get('window');
const boxSize = width / 4.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingBottom: 20,
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
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabCartButton: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderColor: '#39FF14',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3333',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  snsu: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  snsuBold: {
    color: '#CFFF04',
    fontWeight: 'bold',
  },
  canteen: {
    fontStyle: 'italic',
    color: '#fff',
    fontWeight: '300',
  },
  subtitle: {
    color: '#3ad13a',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    marginTop: 8,
    height: 48,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 22,
    color: '#39FF14',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: '#39FF14',
  },

  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -20,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  categoryScroll: {
    marginTop: 16,
    maxHeight: boxSize + 30,
  },
  categoryBox: {
    width: boxSize,
    height: boxSize + 20,
    backgroundColor: '#eaffea',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryImage: {
    width: boxSize * 0.7,
    height: boxSize * 0.7,
    borderRadius: boxSize * 0.35,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  categoryLabel: {
    color: '#39FF14',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#39FF14',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 18,
    marginTop: 10,
    marginBottom: 2,
  },
  comboContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
  },
  comboBox: {
    width: boxSize + 10,
    height: boxSize + 40,
    backgroundColor: '#f6fff6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    // Make the entire area clickable
    overflow: 'visible',
  },
  comboImage: {
    width: boxSize * 0.7,
    height: boxSize * 0.7,
    borderRadius: boxSize * 0.35,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  comboLabel: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  comboPrice: {
    color: '#39FF14',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
  },
  cartIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    textAlign: 'center',
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 13,
    paddingVertical: 20,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  profileModal: {
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
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  profileIcon: {
    fontSize: 48,
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userBalance: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  historyButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  cartModal: {
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
  cartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  cartItemsContainer: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityBadge: {
    backgroundColor: '#39FF14',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#39FF14',
    borderRadius: 10,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartFooter: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
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
  confirmSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
    marginTop: 5,
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
  receiptModal: {
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
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  receiptContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  receiptLeft: {
    flex: 1,
    marginRight: 10,
  },
  receiptRight: {
    flex: 1,
    alignItems: 'center',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  receiptHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  receiptItem: {
    fontSize: 15,
    color: '#555',
  },
  receiptPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptTotal: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  receiptTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  orderIdNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 20,
  },
  historyModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyItemsContainer: {
    width: '100%',
    maxHeight: 400,
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '100%',
  },
  historyItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  historyItemDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  historyItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#39FF14',
  },
  historyItemCount: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3,
  },
  historyItemStatus: {
    fontSize: 12,
    color: '#39FF14',
    fontWeight: 'bold',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 18,
    color: '#666',
  },
  orderDetailsModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  orderDetailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  orderDetailsContent: {
    width: '100%',
    marginBottom: 20,
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderDetailsDate: {
    fontSize: 14,
    color: '#666',
  },
  orderDetailsTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#39FF14',
  },
  orderItemsContainer: {
    width: '100%',
    maxHeight: 300,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  orderItemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: '#39FF14',
    fontWeight: 'bold',
  },

});
