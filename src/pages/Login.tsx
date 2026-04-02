import React, {useState} from 'react';
import {useAuthStore} from '../http/authStore.ts';
import {useNavigate} from 'react-router-dom';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const {user, login} = useAuthStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await login({email, password});
            setSuccess('Успешный вход!');
            navigate('/');
        } catch (err) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                const errorMessage = axiosError.response?.data?.message || 'Ошибка входа';
                setError(errorMessage);
            } else {
                setError('Ошибка входа');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <section className="m-auto max-w-200 px-2">
                <div className="pt-3 pb-3 mt-10 bg-white border-1 border-[#81818189] rounded-xl">
                    <h1 className="flex justify-center text-2xl">{user ? "Войти в другой аккаунт" : "Войти"}</h1>
                    <form onSubmit={handleSubmit} className="mt-5 px-5">
                        <input
                            type="text"
                            id="login-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="
                                    px-4 py-3
                                    border-2 border-[#81818189]
                                    rounded-lg
                                    text-base
                                    transition-all duration-200
                                    focus:outline-none
                                    focus:border-blue-500
                                    placeholder-[#818181f9]
                                    w-full
                                    "
                            placeholder="Почта" required/>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="
                                    px-4 py-3 mt-3
                                    border-2 border-[#81818189]
                                    rounded-lg
                                    text-base
                                    transition-all duration-200
                                    focus:outline-none
                                    focus:border-blue-500
                                    placeholder-[#818181f9]
                                    w-full
                                    "
                            placeholder="Пароль" required/>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-auto h-[40px] bg-indigo-600 text-white items-center justify-center cursor-pointer text-[16px] mt-3 px-3"
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </button>
                    </form>
                </div>
            </section>
            <div className="flex justify-center">
                <div className={error ? "text-red-500" : "text-green-500"}>
                    <p className="text-2xl"> {success}</p>
                </div>
            </div>
        </>
    )
};