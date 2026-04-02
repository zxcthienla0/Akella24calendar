import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import AuthService from './authService';

interface IUser {
    id?: number;
    email: string;
}

interface AuthState {
    user: IUser | null;
    isAuth: boolean;
    isLoading: boolean;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    register: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuth: false,
            isLoading: false,

            login: async (credentials) => {
                const response = await AuthService.login(credentials.email, credentials.password);
                localStorage.setItem('accessToken', response.data.accessToken);
                set({user: response.data.user, isAuth: true});
            },

            logout: async () => {
                await AuthService.logout();
                localStorage.removeItem('accessToken');
                set({user: null, isAuth: false});
            },

            register: async (credentials) => {
                const response = await AuthService.register(credentials.email, credentials.password);
                localStorage.setItem('accessToken', response.data.accessToken);
                set({user: response.data.user, isAuth: true});
            },

            checkAuth: async () => {
                try {
                    const response = await AuthService.refresh();
                    localStorage.setItem('accessToken', response.data.accessToken);
                    set({user: response.data.user, isAuth: true});
                } catch (error) {
                    localStorage.removeItem('accessToken');
                    set({user: null, isAuth: false});
                }
            },
        }),
        {
            name: 'auth-storage-v2',
            partialize: (state) => ({
                user: state.user,
                isAuth: state.isAuth
            })
        }
    )
);