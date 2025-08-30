import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GREEN = '#43ff00';
const BASE_URL = 'http://192.168.1.5:4000';

const CATEGORIES = ['MEAL', 'SNACKS', 'DRINKS', 'BISCUIT'];
const CATEGORY_IMAGES = {
  MEAL: require('../../assets/images/meal.png'),
  SNACKS: require('../../assets/images/snakcs.png'),
  DRINKS: require('../../assets/images/drinks.png'),
  BISCUIT: require('../../assets/images/biscuits.jpg'),
};

export default function CanteenAdmin() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MEAL');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showCombo, setShowCombo] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [comboImage, setComboImage] = useState('');
  const [comboUploading, setComboUploading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const loadItems = async () => {
    try {
      const res = await fetch(`${BASE_URL}/items`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {}
  };
  const loadCombos = async () => {
    try {
      const res = await fetch(`${BASE_URL}/combos`);
      if (!res.ok) return;
      const data = await res.json();
      setCombos(Array.isArray(data?.combos) ? data.combos : []);
    } catch {}
  };

  useEffect(() => { loadItems(); loadCombos(); }, []);

  const openAdd = (presetCat = 'MEAL') => {
    setName('');
    setCategory(presetCat);
    setPrice('');
    setImage('');
    setShowAdd(true);
  };

  const confirmAdd = async () => {
    const p = parseInt(String(price), 10) || 0;
    if (!name || p <= 0) { setShowAdd(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price: p, image: image || null }),
      });
      if (!res.ok) return;
      await loadItems();
    } catch {} finally { setShowAdd(false); }
  };

  const getImageSrc = (img) => {
    try {
      if (!img) return null;
      if (img.startsWith('http://') || img.startsWith('https://')) return { uri: img };
      if (img.startsWith('/')) return { uri: `${BASE_URL}${img}` };
      return { uri: `${BASE_URL}/images/${img}` };
    } catch (_) { return null; }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>ADMIN</Text>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/admindashboard')}><Text style={styles.navText}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/adminorders')}><Text style={styles.navText}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/admin/students')}><Text style={styles.navText}>Students</Text></TouchableOpacity>
        <TouchableOpacity style={StyleSheet.compose(styles.navItem, styles.activeItem)}><Text style={StyleSheet.compose(styles.navText, styles.activeText)}>Canteen</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Data</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
        {CATEGORIES.map((cat) => (
          <View key={cat} style={styles.catBlock}>
            <View style={styles.catHeader}>
              <View style={styles.catHeaderLeft}>
                <Image source={CATEGORY_IMAGES[cat]} style={styles.catHeaderImage} />
                <Text style={styles.catTitle}>{cat}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => openAdd(cat)}><Text style={styles.addLabel}>ADD {cat}</Text></TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>NAME</Text>
              <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>PRICE</Text>
              <Text style={[styles.th, { width: 160, textAlign: 'center' }]}>ACTIONS</Text>
            </View>
            {items.filter(i => i.category === cat).map((i) => (
              <View key={i.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2 }]}>{i.name}</Text>
                <Text style={[styles.td, { width: 100, textAlign: 'right' }]}>{`₱ ${i.price}`}</Text>
                <View style={{ width: 160, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <TouchableOpacity style={styles.btnSmall} onPress={async () => {
                    const newName = prompt('Edit name', i.name) || i.name;
                    const newPrice = parseInt(prompt('Edit price', String(i.price)) || String(i.price), 10) || i.price;
                    try {
                      await fetch(`${BASE_URL}/items/${i.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, price: newPrice }) });
                      await loadItems();
                    } catch {}
                  }}><Text style={styles.btnSmallText}>EDIT</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.btnSmall, { backgroundColor: '#ff2a2a' }]} onPress={async () => {
                    if (!confirm('Delete this item?')) return;
                    try { await fetch(`${BASE_URL}/items/${i.id}`, { method: 'DELETE' }); await loadItems(); } catch {}
                  }}><Text style={styles.btnSmallText}>DELETE</Text></TouchableOpacity>
                </View>
              </View>
            ))}
            {items.filter(i => i.category === cat).length === 0 && (
              <View style={styles.emptyRow}><Text style={styles.emptyText}>No items yet</Text></View>
            )}
          </View>
        ))}

        {/* Combos section */}
        <View style={[styles.catBlock, { marginTop: 24 }]}>
          <View style={styles.catHeader}>
            <View style={styles.catHeaderLeft}>
              <Image source={CATEGORY_IMAGES['MEAL']} style={styles.catHeaderImage} />
              <Text style={styles.catTitle}>COMBO MEAL</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCombo(true)}><Text style={styles.addLabel}>ADD COMBO</Text></TouchableOpacity>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>NAME</Text>
            <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>PRICE</Text>
            <Text style={[styles.th, { width: 160, textAlign: 'center' }]}>ACTIONS</Text>
          </View>
          {combos.map((c) => (
            <View key={c.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2 }]}>{c.name}</Text>
              <Text style={[styles.td, { width: 100, textAlign: 'right' }]}>{`₱ ${c.price}`}</Text>
              <View style={{ width: 160, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <TouchableOpacity style={styles.btnSmall} onPress={async () => {
                  const newName = prompt('Edit name', c.name) || c.name;
                  const newPrice = parseInt(prompt('Edit price', String(c.price)) || String(c.price), 10) || c.price;
                  try { await fetch(`${BASE_URL}/combos/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, price: newPrice }) }); await loadCombos(); } catch {}
                }}><Text style={styles.btnSmallText}>EDIT</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btnSmall, { backgroundColor: '#ff2a2a' }]} onPress={async () => {
                  if (!confirm('Delete this combo?')) return;
                  try { await fetch(`${BASE_URL}/combos/${c.id}`, { method: 'DELETE' }); await loadCombos(); } catch {}
                }}><Text style={styles.btnSmallText}>DELETE</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          {combos.length === 0 && (
            <View style={styles.emptyRow}><Text style={styles.emptyText}>No combos yet</Text></View>
          )}
        </View>
      </ScrollView>

      {/* Add Combo Modal */}
      <Modal visible={showCombo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ADD COMBO MEAL</Text>
            <Text style={styles.metaText}>NAME</Text>
            <TextInput style={styles.input} value={comboName} onChangeText={setComboName} placeholder="Combo name" placeholderTextColor="#bdbdbd" />
            <Text style={styles.metaText}>PRICE (₱, integer)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={comboPrice} onChangeText={(t) => setComboPrice(t.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor="#bdbdbd" />
            <Text style={styles.metaText}>INCLUDE ITEMS</Text>
            <View style={{ maxHeight: 220 }}>
              <ScrollView>
                {items.map((it) => {
                  const checked = selectedItemIds.includes(it.id);
                  return (
                    <TouchableOpacity key={it.id} style={styles.pickRow} onPress={() => setSelectedItemIds((prev) => checked ? prev.filter(id => id !== it.id) : [...prev, it.id])}>
                      <Text style={[styles.pickBox, checked && styles.pickBoxChecked]}>{checked ? '✓' : ''}</Text>
                      <Text style={{ flex: 1, fontWeight: '700' }}>{`${it.name} (${it.category})`}</Text>
                      <Text style={{ width: 60, textAlign: 'right', fontWeight: '800' }}>{`₱ ${it.price}`}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <Text style={[styles.metaText, { marginTop: 10 }]}>COMBO IMAGE (optional)</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity
                style={[styles.confirmBtn, { opacity: comboUploading ? 0.6 : 1 }]}
                disabled={comboUploading}
                onPress={async () => {
                  try {
                    if (Platform.OS === 'web') {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const file = input.files && input.files[0];
                        if (!file) return;
                        const form = new FormData();
                        form.append('file', file);
                        setComboUploading(true);
                        try {
                          const up = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form });
                          const text = await up.text();
                          let data = {}; try { data = JSON.parse(text); } catch {}
                          if (up.ok && data?.url) setComboImage(data.url);
                        } finally { setComboUploading(false); }
                      };
                      input.click();
                    } else {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') return;
                      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                      if (result.canceled || !result.assets || result.assets.length === 0) return;
                      const asset = result.assets[0];
                      const form = new FormData();
                      const uri = asset.uri; const name = uri.split('/').pop() || 'combo.jpg'; const type = asset.mimeType || 'image/jpeg';
                      form.append('file', { uri, name, type });
                      setComboUploading(true);
                      try {
                        const up = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form });
                        const data = await up.json(); if (up.ok && data?.url) setComboImage(data.url);
                      } finally { setComboUploading(false); }
                    }
                  } catch {}
                }}
              >
                <Text style={styles.confirmLabel}>{comboUploading ? 'UPLOADING...' : 'UPLOAD COMBO IMAGE'}</Text>
              </TouchableOpacity>
              {!!comboImage && (
                <Image source={getImageSrc(comboImage)} style={{ width: 54, height: 54, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }} />
              )}
              {!!comboImage && <Text style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>{comboImage}</Text>}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmBtn} onPress={async () => {
                const p = parseInt(String(comboPrice), 10) || 0;
                if (!comboName || p <= 0 || selectedItemIds.length === 0) { setShowCombo(false); return; }
                try {
                  const res = await fetch(`${BASE_URL}/combos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: comboName, price: p, itemIds: selectedItemIds, image: comboImage || null }),
                  });
                  if (res.ok) {
                    // Refresh the combos list to show the newly added combo
                    await loadCombos();
                  }
                } catch {} finally {
                  setShowCombo(false);
                  setComboName('');
                  setComboPrice('');
                  setComboImage('');
                  setSelectedItemIds([]);
                }
              }}><Text style={styles.confirmLabel}>ADD</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCombo(false); setSelectedItemIds([]); }}><Text style={styles.confirmLabel}>CANCEL</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ADD ITEM</Text>
            <Text style={styles.metaText}>NAME</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor="#bdbdbd" />
            <Text style={styles.metaText}>CATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.metaText}>PRICE (₱, integer)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={price} onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor="#bdbdbd" />
            <Text style={styles.metaText}>IMAGE (optional)</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity
                style={[styles.confirmBtn, { opacity: uploading ? 0.6 : 1 }]}
                disabled={uploading}
                onPress={async () => {
                  try {
                    setUploadError('');
                    if (Platform.OS === 'web') {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const file = input.files && input.files[0];
                        if (!file) return;
                        const form = new FormData();
                        form.append('file', file);
                        setUploading(true);
                        try {
                          const up = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form });
                          const text = await up.text();
                          let data = {};
                          try { data = JSON.parse(text); } catch {}
                          if (up.ok && data?.url) {
                            setImage(data.url);
                          } else {
                            console.error('Upload failed', up.status, text);
                            setUploadError(`Upload failed (${up.status})`);
                          }
                        } finally {
                          setUploading(false);
                        }
                      };
                      input.click();
                    } else {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') return;
                      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                      if (result.canceled || !result.assets || result.assets.length === 0) return;
                      const asset = result.assets[0];
                      const form = new FormData();
                      const uri = asset.uri;
                      const name = uri.split('/').pop() || 'upload.jpg';
                      const type = asset.mimeType || 'image/jpeg';
                      form.append('file', { uri, name, type });
                      setUploading(true);
                      try {
                        // IMPORTANT: let fetch set the correct multipart boundary automatically
                        const up = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form });
                        const data = await up.json();
                        if (up.ok && data?.url) setImage(data.url); else setUploadError('Upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }
                  } catch {}
                }}
              >
                <Text style={styles.confirmLabel}>{uploading ? 'UPLOADING...' : 'UPLOAD IMAGE'}</Text>
              </TouchableOpacity>
              {!!uploadError && <Text style={{ color: '#ff2a2a', fontWeight: '700' }}>{uploadError}</Text>}
              {!!image && (
                <TouchableOpacity onPress={() => setPreviewOpen(true)} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
                  <Image source={getImageSrc(image)} style={{ width: 54, height: 54, borderRadius: 8 }} />
                </TouchableOpacity>
              )}
              {!!image && <Text style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>{image}</Text>}
            </View>
            {/* Image Preview Modal */}
            <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { width: '90%' }]}>
                  <Text style={styles.modalTitle}>IMAGE PREVIEW</Text>
                  {getImageSrc(image) && (
                    <Image source={getImageSrc(image)} style={{ width: '100%', height: 220, borderRadius: 8, backgroundColor: '#eee' }} resizeMode="contain" />
                  )}
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => setPreviewOpen(false)}><Text style={styles.confirmLabel}>USE THIS</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPreviewOpen(false); setImage(''); }}><Text style={styles.confirmLabel}>REMOVE</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmAdd}><Text style={styles.confirmLabel}>ADD</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}><Text style={styles.confirmLabel}>CANCEL</Text></TouchableOpacity>
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
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  catBlock: { marginBottom: 16 },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catHeaderImage: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },
  catTitle: { fontWeight: '800', color: '#888' },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f3f7f9', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1, borderColor: '#e6f7dd' },
  th: { fontWeight: '800', color: '#666' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e6f7dd', backgroundColor: '#fff' },
  td: { fontWeight: '700', color: '#111' },
  emptyRow: { borderWidth: 1, borderTopWidth: 0, borderColor: '#e6f7dd', padding: 12, backgroundColor: '#fff', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  emptyText: { color: '#999', fontStyle: 'italic' },
  btnSmall: { backgroundColor: GREEN, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  btnSmallText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#9cff64', borderRadius: 10, padding: 16 },
  modalTitle: { color: '#e5e500', fontWeight: '800', fontSize: 22, marginBottom: 10 },
  metaText: { fontWeight: '700', marginBottom: 4 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 14, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 14, justifyContent: 'center' },
  confirmBtn: { backgroundColor: GREEN, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#ff2a2a', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  confirmLabel: { color: '#fff', fontWeight: '800' },
  chip: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14 },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { fontWeight: '700', color: '#333' },
  chipTextActive: { color: '#fff' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  pickBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: GREEN, textAlign: 'center', lineHeight: 18, fontWeight: '800', color: '#fff' },
  pickBoxChecked: { backgroundColor: GREEN, borderColor: GREEN },
});


