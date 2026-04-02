import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import logoImage from 'figma:asset/1abedf885993685a4d6cd6ba7515a93facdfdba3.png';
import { SPLASH_ROOT_CLASS } from '../../lib/nativeLayout';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        navigate('/app', { replace: true });
      } else {
        navigate('/app/login', { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className={SPLASH_ROOT_CLASS}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-64"
      >
        <img
          src={logoImage}
          alt="Web3Star"
          className="w-full mix-blend-screen opacity-90"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 flex flex-col items-center gap-4"
      >
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-center text-sm text-gray-500">잠시 후 로그인 화면으로 이동합니다.</p>
        <button
          type="button"
          onClick={() => navigate(user ? '/app' : '/app/login', { replace: true })}
          className="text-sm font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
        >
          바로 로그인으로 가기
        </button>
      </motion.div>
    </div>
  );
}
