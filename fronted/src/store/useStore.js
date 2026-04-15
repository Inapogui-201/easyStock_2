import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SEED_PRODUCTS = [
  { id: '1', name: 'PC Dell Inspiron 15', description: 'Laptop Dell 15 pouces, Intel i5, 8GB RAM, 256GB SSD', price: 500, category: 'Ordinateurs', stock: 20, alertThreshold: 5, image: '', createdAt: '2024-01-01' },
  { id: '2', name: 'RAM DDR4 8GB Kingston', description: 'Barrette mémoire DDR4 8GB 3200MHz', price: 50, category: 'Composants', stock: 5, alertThreshold: 5, image: '', createdAt: '2024-01-02' },
  { id: '3', name: 'Souris Logitech MX Master', description: 'Souris sans fil ergonomique Bluetooth', price: 80, category: 'Périphériques', stock: 15, alertThreshold: 5, image: '', createdAt: '2024-01-03' },
  { id: '4', name: 'Clavier Mécanique Corsair K70', description: 'Clavier gaming mécanique RGB Cherry MX Red', price: 120, category: 'Périphériques', stock: 8, alertThreshold: 5, image: '', createdAt: '2024-01-04' },
  { id: '5', name: 'Écran Samsung 27"', description: 'Moniteur LED 27 pouces Full HD IPS', price: 250, category: 'Écrans', stock: 12, alertThreshold: 3, image: '', createdAt: '2024-01-05' },
  { id: '6', name: 'SSD Samsung 970 EVO 1TB', description: 'Disque NVMe M.2 1TB haute performance', price: 110, category: 'Composants', stock: 3, alertThreshold: 5, image: '', createdAt: '2024-01-06' },
  { id: '7', name: 'Imprimante HP LaserJet', description: 'Imprimante laser monochrome Wi-Fi', price: 200, category: 'Imprimantes', stock: 6, alertThreshold: 3, image: '', createdAt: '2024-01-07' },
  { id: '8', name: 'Câble HDMI 2.1 3m', description: 'Câble HDMI haute vitesse 4K 120Hz', price: 15, category: 'Accessoires', stock: 50, alertThreshold: 10, image: '', createdAt: '2024-01-08' },
  { id: '9', name: 'Casque Audio JBL Tune', description: 'Casque Bluetooth avec réduction de bruit', price: 65, category: 'Périphériques', stock: 2, alertThreshold: 5, image: '', createdAt: '2024-01-09' },
  { id: '10', name: 'Webcam Logitech C920', description: 'Webcam Full HD 1080p avec micro intégré', price: 75, category: 'Périphériques', stock: 10, alertThreshold: 5, image: '', createdAt: '2024-01-10' },
];

const SEED_SALES = [
  { id: 's1', items: [{ productId: '1', productName: 'PC Dell Inspiron 15', quantity: 2, unitPrice: 500 }], clientName: 'Mamadou Diallo', clientPhone: '620000001', total: 1000, date: '2024-03-01' },
  { id: 's2', items: [{ productId: '3', productName: 'Souris Logitech MX Master', quantity: 3, unitPrice: 80 }, { productId: '8', productName: 'Câble HDMI 2.1 3m', quantity: 5, unitPrice: 15 }], clientName: 'Aissatou Bah', clientPhone: '620000002', total: 315, date: '2024-03-05' },
  { id: 's3', items: [{ productId: '5', productName: 'Écran Samsung 27"', quantity: 1, unitPrice: 250 }], clientName: 'Ousmane Camara', clientPhone: '620000003', total: 250, date: '2024-03-10' },
  { id: 's4', items: [{ productId: '2', productName: 'RAM DDR4 8GB Kingston', quantity: 4, unitPrice: 50 }, { productId: '6', productName: 'SSD Samsung 970 EVO 1TB', quantity: 1, unitPrice: 110 }], clientName: 'Fatoumata Sow', clientPhone: '620000004', total: 310, date: '2024-03-15' },
  { id: 's5', items: [{ productId: '4', productName: 'Clavier Mécanique Corsair K70', quantity: 1, unitPrice: 120 }, { productId: '10', productName: 'Webcam Logitech C920', quantity: 2, unitPrice: 75 }], clientName: 'Ibrahim Barry', clientPhone: '620000005', total: 270, date: '2024-04-01' },
];

export const useStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      adminEmail: '',
      login: (email, password) => {
        if (email === 'admin@test.com' && password === 'pwd123') {
          set({ isAuthenticated: true, adminEmail: email });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, adminEmail: '' }),

      products: SEED_PRODUCTS,
      addProduct: (p) => {
        const id = Date.now().toString();
        set((s) => ({ products: [...s.products, { ...p, id, createdAt: new Date().toISOString() }] }));
      },
      updateProduct: (id, p) => set((s) => ({
        products: s.products.map((prod) => prod.id === id ? { ...prod, ...p } : prod),
      })),
      deleteProduct: (id) => set((s) => ({
        products: s.products.filter((p) => p.id !== id),
      })),

      cart: [],
      addToCart: (product, qty) => set((s) => {
        const existing = s.cart.find((c) => c.product.id === product.id);
        if (existing) {
          return { cart: s.cart.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + qty } : c) };
        }
        return { cart: [...s.cart, { product, quantity: qty }] };
      }),
      removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.product.id !== productId) })),
      updateCartQty: (productId, qty) => set((s) => ({
        cart: s.cart.map((c) => c.product.id === productId ? { ...c, quantity: qty } : c),
      })),
      clearCart: () => set({ cart: [] }),

      sales: SEED_SALES,
      createSale: (clientName, clientPhone) => {
        const { cart, products } = get();
        const alerts = [];

        for (const item of cart) {
          const prod = products.find((p) => p.id === item.product.id);
          if (!prod || prod.stock < item.quantity) {
            return { success: false, alerts: [`Stock insuffisant pour ${item.product.name} (dispo: ${prod?.stock ?? 0})`] };
          }
        }

        const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const sale = {
          id: Date.now().toString(),
          items: cart.map((c) => ({ productId: c.product.id, productName: c.product.name, quantity: c.quantity, unitPrice: c.product.price })),
          clientName,
          clientPhone,
          total,
          date: new Date().toISOString(),
        };

        const updatedProducts = products.map((p) => {
          const cartItem = cart.find((c) => c.product.id === p.id);
          if (cartItem) {
            const newStock = p.stock - cartItem.quantity;
            if (newStock <= p.alertThreshold) {
              alerts.push(`⚠️ Stock bas : ${p.name} (${newStock} restants)`);
            }
            return { ...p, stock: newStock };
          }
          return p;
        });

        set((s) => ({
          sales: [...s.sales, sale],
          products: updatedProducts,
          cart: [],
        }));

        return { success: true, alerts };
      },

      addStock: (productId, qty) => set((s) => ({
        products: s.products.map((p) => p.id === productId ? { ...p, stock: p.stock + qty } : p),
      })),

      darkMode: false,
      toggleDarkMode: () => set((s) => {
        const newMode = !s.darkMode;
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { darkMode: newMode };
      }),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    { name: 'easystock-storage' }
  )
);
