import $api from './index.ts';
import type {AuthResponse} from '../models/response/AuthResponse.ts';
import type {AxiosResponse} from 'axios';

export default class AuthService {
    static async register(email: string, password: string): Promise<AxiosResponse<AuthResponse>> {
        return $api.post<AuthResponse>('/auth/registration', {email, password})
    }

    static async login(email: string, password: string): Promise<AxiosResponse<AuthResponse>> {
        return $api.post<AuthResponse>('/auth/login', {email, password});
    }

    static async logout(): Promise<void> {
        return $api.post('/auth/logout');
    }

    static async refresh(): Promise<AxiosResponse<AuthResponse>> {
        return $api.get<AuthResponse>('/auth/refresh');
    }
};