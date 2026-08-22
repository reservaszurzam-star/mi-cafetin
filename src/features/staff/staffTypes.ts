export type StaffMember = {
  id: string;
  name: string;
  role: 'Mozo' | 'Cocinero' | 'Parrillero' | 'Cajero' | 'Bartender' | 'Administrador' | 'Repartidor';
  dni: string;
  phone: string;
  shift: 'Mañana' | 'Tarde' | 'Noche' | 'Completo';
  status: 'Activo' | 'Inactivo';
  salaryDaily?: number;
};

export type AttendanceRecord = {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'Puntual' | 'Tardanza' | 'Falta' | 'Permiso';
  notes?: string;
};

export type TipDistribution = {
  id: string;
  date: string;
  shift: string;
  totalTips: number;
  staffCount: number;
  amountPerPerson: number;
  staffList: string[];
};

export const INITIAL_STAFF_PARADERO: StaffMember[] = [
  { id: 'st-p-1', name: 'Allison', role: 'Administrador', dni: '72418901', phone: '987111001', shift: 'Completo', status: 'Activo', salaryDaily: 80.00 },
  { id: 'st-p-2', name: 'Denisse', role: 'Administrador', dni: '72418902', phone: '987111002', shift: 'Completo', status: 'Activo', salaryDaily: 80.00 },
  { id: 'st-p-3', name: 'Jacky', role: 'Administrador', dni: '72418903', phone: '987111003', shift: 'Completo', status: 'Activo', salaryDaily: 80.00 },
  { id: 'st-p-4', name: 'Irina', role: 'Cajero', dni: '70984511', phone: '987222001', shift: 'Mañana', status: 'Activo', salaryDaily: 60.00 },
  { id: 'st-p-5', name: 'Gladys', role: 'Cajero', dni: '70984512', phone: '987222002', shift: 'Tarde', status: 'Activo', salaryDaily: 60.00 },
  { id: 'st-p-6', name: 'Jhoseline', role: 'Mozo', dni: '73418901', phone: '987333001', shift: 'Mañana', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-p-7', name: 'Alba', role: 'Mozo', dni: '73418902', phone: '987333002', shift: 'Mañana', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-p-8', name: 'Kiara', role: 'Mozo', dni: '73418903', phone: '987333003', shift: 'Tarde', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-p-9', name: 'Luisana', role: 'Mozo', dni: '73418904', phone: '987333004', shift: 'Tarde', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-p-10', name: 'Jocelyn', role: 'Mozo', dni: '73418905', phone: '987333005', shift: 'Noche', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-p-11', name: 'Alexandra', role: 'Mozo', dni: '73418906', phone: '987333006', shift: 'Noche', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-p-12', name: 'Repartidor Paradero', role: 'Repartidor', dni: '74129845', phone: '987777888', shift: 'Completo', status: 'Activo', salaryDaily: 55.00 },
  { id: 'st-p-13', name: 'Chef Cevichería', role: 'Cocinero', dni: '45129034', phone: '987555001', shift: 'Completo', status: 'Activo', salaryDaily: 75.00 }
];

export const INITIAL_STAFF_LASLOMAS: StaffMember[] = [
  { id: 'st-l-1', name: 'Denisse', role: 'Administrador', dni: '72418902', phone: '987111002', shift: 'Completo', status: 'Activo', salaryDaily: 80.00 },
  { id: 'st-l-2', name: 'Allison', role: 'Administrador', dni: '72418901', phone: '987111001', shift: 'Completo', status: 'Activo', salaryDaily: 80.00 },
  { id: 'st-l-3', name: 'Jacky', role: 'Administrador', dni: '72418903', phone: '987111003', shift: 'Completo', status: 'Activo', salaryDaily: 80.00 },
  { id: 'st-l-4', name: 'Karina', role: 'Cajero', dni: '70984513', phone: '987222003', shift: 'Completo', status: 'Activo', salaryDaily: 60.00 },
  { id: 'st-l-5', name: 'Eddy', role: 'Mozo', dni: '73418911', phone: '987333011', shift: 'Mañana', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-6', name: 'Jheniffer', role: 'Mozo', dni: '73418912', phone: '987333012', shift: 'Mañana', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-7', name: 'Yameli', role: 'Mozo', dni: '73418913', phone: '987333013', shift: 'Tarde', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-8', name: 'Liz', role: 'Mozo', dni: '73418914', phone: '987333014', shift: 'Tarde', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-9', name: 'Veronica', role: 'Mozo', dni: '73418915', phone: '987333015', shift: 'Noche', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-10', name: 'Sonia', role: 'Mozo', dni: '73418916', phone: '987333016', shift: 'Noche', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-11', name: 'Karol', role: 'Mozo', dni: '73418917', phone: '987333017', shift: 'Completo', status: 'Activo', salaryDaily: 50.00 },
  { id: 'st-l-12', name: 'Jessica', role: 'Repartidor', dni: '74129846', phone: '987445566', shift: 'Completo', status: 'Activo', salaryDaily: 55.00 },
  { id: 'st-l-13', name: 'Maestro Parrillero & Hornero', role: 'Parrillero', dni: '45129035', phone: '987555002', shift: 'Completo', status: 'Activo', salaryDaily: 75.00 }
];

export const INITIAL_STAFF: StaffMember[] = INITIAL_STAFF_LASLOMAS;

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    staffId: 'st-l-5',
    staffName: 'Eddy',
    role: 'Mozo',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00 AM',
    checkOut: '04:30 PM',
    status: 'Puntual'
  },
  {
    id: 'att-2',
    staffId: 'st-l-4',
    staffName: 'Karina',
    role: 'Cajero',
    date: new Date().toISOString().split('T')[0],
    checkIn: '07:55 AM',
    status: 'Puntual'
  },
  {
    id: 'att-3',
    staffId: 'st-l-12',
    staffName: 'Jessica',
    role: 'Repartidor',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:15 AM',
    status: 'Tardanza',
    notes: 'Retraso de 15 minutos por tráfico'
  }
];

export const INITIAL_TIPS: TipDistribution[] = [
  {
    id: 'tip-1',
    date: new Date().toISOString().split('T')[0],
    shift: 'Turno Noche',
    totalTips: 180.00,
    staffCount: 4,
    amountPerPerson: 45.00,
    staffList: ['Eddy', 'Jheniffer', 'Yameli', 'Karina']
  },
  {
    id: 'tip-2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    shift: 'Turno Completo',
    totalTips: 250.00,
    staffCount: 5,
    amountPerPerson: 50.00,
    staffList: ['Eddy', 'Jheniffer', 'Liz', 'Veronica', 'Karina']
  }
];
