
import React, { useState } from 'react';
import GoogleIcon from './icons/GoogleIcon';
import { useLanguage } from '../context/LanguageContext';

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; avatar: string }) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { t } = useLanguage();

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      onLogin({ name: "User", email: "user@demo.com", avatar: "" });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-xl">Z</span>
               </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">{t('appTitle')}</h1>
            <p className="text-muted-foreground text-sm">{t('loginSub')}</p>
          </div>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 px-4 rounded-lg font-medium shadow-sm transition-all"
          >
            {isLoggingIn ? "..." : <><GoogleIcon className="w-5 h-5" /><span>{t('loginGoogle')}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
