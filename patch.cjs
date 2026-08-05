const fs = require('fs');
let data = fs.readFileSync('src/hooks/useStore.ts', 'utf8');

// 1. Add imports
data = data.replace('import {', 'import { InventoryItem, InventoryMovement, Reservation, ');

// 2. Add State Declarations
const stateDeclarations = `
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('cafetin_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('cafetin_movements');
    return saved ? JSON.parse(saved) : [];
  });
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('cafetin_reservations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('cafetin_inventory', JSON.stringify(inventoryItems)); }, [inventoryItems]);
  useEffect(() => { localStorage.setItem('cafetin_movements', JSON.stringify(inventoryMovements)); }, [inventoryMovements]);
  useEffect(() => { localStorage.setItem('cafetin_reservations', JSON.stringify(reservations)); }, [reservations]);

  const [products, setProducts] = useState<Product[]>
`;
data = data.replace('const [products, setProducts] = useState<Product[]>', stateDeclarations);

// 3. Add Methods
const methods = `
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    setInventoryItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };
  const updateInventoryItem = (id: string, item: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
  };
  const addInventoryMovement = (movement: Omit<InventoryMovement, 'id' | 'date'>) => {
    const newMovement = { ...movement, id: Date.now().toString(), date: new Date().toISOString() };
    setInventoryMovements(prev => [...prev, newMovement]);
    setInventoryItems(prev => prev.map(i => i.id === movement.itemId ? { ...i, currentStock: i.currentStock + (movement.type === 'in' ? movement.quantity : -movement.quantity) } : i));
  };
  const addReservation = (res: Omit<Reservation, 'id'>) => {
    setReservations(prev => [...prev, { ...res, id: Date.now().toString() }]);
  };
  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return {
`;
data = data.replace('return {', methods);

// 4. Return new methods
const returnedMethods = `
    inventoryItems,
    inventoryMovements,
    reservations,
    addInventoryItem,
    updateInventoryItem,
    addInventoryMovement,
    addReservation,
    updateReservationStatus,
`;
data = data.replace('  return {\n', '  return {\n' + returnedMethods);

fs.writeFileSync('src/hooks/useStore.ts', data);
console.log('useStore updated successfully');
