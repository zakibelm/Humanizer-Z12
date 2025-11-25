
import React, { useState } from 'react';
import GoogleIcon from './icons/GoogleIcon';

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; avatar: string }) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    // Simulation d'un délai réseau pour l'authenticité
    setTimeout(() => {
      // Mock user data (Simule un retour OAuth réussi)
      const mockUser = {
        name: "Utilisateur Pro",
        email: "user@demo.com",
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c"
      };
      onLogin(mockUser);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          
          {/* Logo & Header */}
          <div className="mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-white font-serif font-bold text-xl">Z</span>
               </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Humanizer Z12
            </h1>
            <p className="text-muted-foreground text-sm">
              Architecture de génération autonome.
            </p>
          </div>

          {/* Login Action */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-sm border border-gray-200 group relative overflow-hidden"
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                   <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connexion sécurisée...</span>
                </div>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Continuer avec Google</span>
                </>
              )}
            </button>
            
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#18181b] px-2 text-muted-foreground">Accès Sécurisé</span>
                </div>
            </div>

            <p className="text-xs text-muted-foreground/60 leading-relaxed px-4">
              En continuant, vous acceptez les conditions d'utilisation et la politique de confidentialité de Humanizer Z12.
              <br/>
              <span className="text-primary/60">Version Production Ready 1.2.0</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
