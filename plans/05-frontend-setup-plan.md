# Plan 05: Frontend Setup & Architecture

## Mục tiêu
Setup React + Vite project với TailwindCSS, React Router, Zustand state management, và Axios client.

## Tech Stack
- React 18 + Vite
- TypeScript
- React Router v6
- TailwindCSS + daisyUI
- Zustand (state management)
- React Hook Form + Zod
- Axios

---

## 1. Project Initialization

### Create Vite Project
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

### Install Dependencies
```bash
npm install react-router-dom zustand axios react-hook-form @hookform/resolvers zod date-fns
npm install -D tailwindcss postcss autoprefixer daisyui
npx tailwindcss init -p
```

---

## 2. Configuration Files

### package.json
```json
{
  "name": "flight-booking-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "date-fns": "^3.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.16",
    "daisyui": "^4.6.0"
  }
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "corporate"],
  },
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### .env.example
```env
VITE_API_URL=http://localhost:3000/api
```

### tsconfig.json (update)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 3. Project Structure

```
frontend/src/
├── api/
│   ├── axiosClient.ts
│   ├── authApi.ts
│   ├── flightApi.ts
│   ├── bookingApi.ts
│   └── adminApi.ts
├── components/
│   ├── common/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Loader.tsx
│   │   └── ErrorMessage.tsx
│   ├── flight/
│   │   ├── SearchForm.tsx
│   │   ├── FlightCard.tsx
│   │   └── FlightFilters.tsx
│   └── booking/
│       ├── PassengerForm.tsx
│       └── BookingCard.tsx
├── pages/
│   ├── Home.tsx
│   ├── FlightResults.tsx
│   ├── FlightDetail.tsx
│   ├── Checkout.tsx
│   ├── PaymentStatus.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   ├── MyBookings.tsx
│   ├── BookingDetail.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── Airports.tsx
│       ├── Routes.tsx
│       ├── Flights.tsx
│       ├── Aircrafts.tsx
│       ├── SeatInventories.tsx
│       ├── Coupons.tsx
│       └── Bookings.tsx
├── routes/
│   ├── index.tsx
│   ├── ProtectedRoute.tsx
│   └── AdminRoute.tsx
├── store/
│   ├── authStore.ts
│   ├── searchStore.ts
│   └── bookingStore.ts
├── types/
│   └── index.ts
├── utils/
│   ├── formatters.ts
│   └── validators.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 4. Setup Files

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-base-100 text-base-content;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white;
  }
  
  .card {
    @apply bg-base-100 shadow-xl rounded-lg;
  }
}
```

### src/types/index.ts
```typescript
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
}

export interface Airport {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Aircraft {
  id: string;
  model: string;
  totalSeats: number;
}

export interface Route {
  id: string;
  fromAirportId: string;
  toAirportId: string;
  basePrice: number;
  fromAirport: Airport;
  toAirport: Airport;
}

export interface Flight {
  id: string;
  flightNumber: string;
  routeId: string;
  aircraftId: string;
  departTime: string;
  arriveTime: string;
  duration: number;
  status: 'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
  route: Route;
  aircraft: Aircraft;
}

export interface SearchParams {
  fromAirportCode: string;
  toAirportCode: string;
  departDate: string;
  passengers: number;
  cabinClass: 'ECONOMY' | 'BUSINESS';
}

export interface FlightSearchResult {
  id: string;
  flightNumber: string;
  from: {
    code: string;
    name: string;
    city: string;
  };
  to: {
    code: string;
    name: string;
    city: string;
  };
  departTime: string;
  arriveTime: string;
  duration: number;
  aircraft: string;
  cabinClass: 'ECONOMY' | 'BUSINESS';
  availableSeats: number;
  pricePerPerson: number;
  totalPrice: number;
}

export interface Passenger {
  type: 'ADULT' | 'CHILD' | 'INFANT';
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  idNumber?: string;
}

export interface Booking {
  id: string;
  userId: string;
  flightId: string;
  cabinClass: 'ECONOMY' | 'BUSINESS';
  passengersCount: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  eTicketCode?: string;
  expiresAt: string;
  createdAt: string;
  flight: Flight;
  passengers: Passenger[];
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  amount: number;
  orderId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}
```

---

## 5. Axios Client

### src/api/axiosClient.ts
```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retried, try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
```

---

## 6. API Services

### src/api/authApi.ts
```typescript
import axiosClient from './axiosClient';
import { User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', data);
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    const response = await axiosClient.get('/auth/me');
    return response.data.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axiosClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};
```

### src/api/flightApi.ts
```typescript
import axiosClient from './axiosClient';
import { FlightSearchResult, Flight, SearchParams } from '../types';

export const flightApi = {
  searchFlights: async (params: SearchParams): Promise<FlightSearchResult[]> => {
    const response = await axiosClient.get('/search/flights', { params });
    return response.data.data;
  },

  getFlightDetail: async (id: string): Promise<Flight> => {
    const response = await axiosClient.get(`/search/flights/${id}`);
    return response.data.data;
  },
};
```

### src/api/bookingApi.ts
```typescript
import axiosClient from './axiosClient';
import { Booking, Passenger } from '../types';

export interface CreateBookingData {
  flightId: string;
  cabinClass: 'ECONOMY' | 'BUSINESS';
  passengers: Passenger[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  couponCode?: string;
}

export const bookingApi = {
  createBooking: async (data: CreateBookingData): Promise<Booking> => {
    const response = await axiosClient.post('/bookings', data);
    return response.data.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await axiosClient.get('/bookings/my');
    return response.data.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await axiosClient.get(`/bookings/${id}`);
    return response.data.data;
  },

  cancelBooking: async (id: string): Promise<Booking> => {
    const response = await axiosClient.patch(`/bookings/${id}/cancel`);
    return response.data.data;
  },

  createMoMoPayment: async (bookingId: string) => {
    const response = await axiosClient.post('/payments/momo/create', {
      bookingId,
    });
    return response.data.data;
  },

  getPaymentStatus: async (bookingId: string) => {
    const response = await axiosClient.get(`/payments/${bookingId}/status`);
    return response.data.data;
  },
};
```

---

## 7. Zustand Stores

### src/store/authStore.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi, LoginData, RegisterData } from '../api/authApi';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.login(data);
          localStorage.setItem('accessToken', result.accessToken);
          localStorage.setItem('refreshToken', result.refreshToken);
          set({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },

      fetchMe: async () => {
        try {
          const user = await authApi.getMe();
          set({ user });
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

### src/store/searchStore.ts
```typescript
import { create } from 'zustand';
import { FlightSearchResult, SearchParams } from '../types';
import { flightApi } from '../api/flightApi';

interface SearchState {
  searchParams: SearchParams | null;
  flights: FlightSearchResult[];
  isLoading: boolean;
  error: string | null;
  setSearchParams: (params: SearchParams) => void;
  searchFlights: () => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchParams: null,
  flights: [],
  isLoading: false,
  error: null,

  setSearchParams: (params) => {
    set({ searchParams: params });
  },

  searchFlights: async () => {
    const params = get().searchParams;
    if (!params) return;

    set({ isLoading: true, error: null });
    try {
      const flights = await flightApi.searchFlights(params);
      set({ flights, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Search failed',
        isLoading: false,
      });
    }
  },

  clearResults: () => {
    set({ flights: [], searchParams: null, error: null });
  },
}));
```

---

## Next Steps
→ Proceed to **Plan 06: Frontend User Pages**
