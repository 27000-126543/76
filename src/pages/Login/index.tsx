import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Boxes,
  Warehouse,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

const roleHints: Record<UserRole, { label: string; description: string; icon: typeof Boxes }> = {
  picker: { label: '分拣员', description: '负责商品分拣作业', icon: Boxes },
  leader: { label: '组长', description: '管理小组分拣任务', icon: Warehouse },
  manager: { label: '经理', description: '仓库运营管理', icon: TrendingUp },
  director: { label: '总监', description: '全局决策与管控', icon: Shield },
};

const testAccounts: { username: string; role: UserRole }[] = [
  { username: 'picker', role: 'picker' },
  { username: 'leader', role: 'leader' },
  { username: 'manager', role: 'manager' },
  { username: 'director', role: 'director' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [activeHint, setActiveHint] = useState<UserRole | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    const matched = testAccounts.find((a) => a.username === username.toLowerCase());
    if (matched) {
      setActiveHint(matched.role);
    } else {
      setActiveHint(null);
    }
  }, [username]);

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    }
    if (!password.trim()) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await login(username.trim().toLowerCase(), password.trim());
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (account: typeof testAccounts[0]) => {
    setUsername(account.username);
    setPassword('123456');
    setErrors({});
    setError('');
  };

  if (isAuthenticated && user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-4">
        <div className="tech-card overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 border-r border-dark-700/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center tech-glow">
                    <Warehouse className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-primary-500/20 blur-xl -z-10 animate-pulse-slow" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">智能仓储</h1>
                  <p className="text-sm text-dark-400">分拣调度管理平台</p>
                </div>
              </div>

              <div className="space-y-6 my-12">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">实时监控</h3>
                    <p className="text-sm text-dark-400">全链路数据可视化，掌握仓库运营脉搏</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
                    <Boxes className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">智能调度</h3>
                    <p className="text-sm text-dark-400">AI驱动的波次规划与路径优化</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-accent-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">权限分级</h3>
                    <p className="text-sm text-dark-400">多角色精细化权限管理，保障数据安全</p>
                  </div>
                </motion.div>
              </div>

              <div className="text-sm text-dark-500">
                © 2024 智能仓储分拣调度系统 · v2.0.0
              </div>
            </div>

            <div className="p-8 sm:p-12">
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">智能仓储</h1>
                  <p className="text-xs text-dark-400">分拣调度管理平台</p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">欢迎登录</h2>
                <p className="text-dark-400 mb-8">请输入您的账号信息以访问系统</p>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
                      }}
                      placeholder="请输入用户名"
                      className={`w-full h-11 pl-10 pr-4 rounded-lg tech-input text-sm ${
                        errors.username ? 'border-danger/50 focus:border-danger focus:ring-danger/15' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.username && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-1.5 text-xs text-danger flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.username}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                  {activeHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const Icon = roleHints[activeHint].icon;
                            return <Icon className="w-4 h-4 text-primary-400" />;
                          })()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary-300">
                            {roleHints[activeHint].label}账号
                          </p>
                          <p className="text-xs text-dark-400 truncate">
                            {roleHints[activeHint].description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                      }}
                      placeholder="请输入密码"
                      className={`w-full h-11 pl-10 pr-11 rounded-lg tech-input text-sm ${
                        errors.password ? 'border-danger/50 focus:border-danger focus:ring-danger/15' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-1.5 text-xs text-danger flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={loading}
                    leftIcon={!loading ? <LogIn className="w-5 h-5" /> : undefined}
                  >
                    {loading ? '登录中...' : '登录'}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <p className="text-xs text-dark-500 mb-3">测试账号（密码均为 123456）：</p>
                <div className="flex flex-wrap gap-2">
                  {testAccounts.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => fillAccount(account)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-dark-700/50 border border-dark-600 text-dark-300 hover:bg-dark-700 hover:border-primary-500/50 hover:text-primary-400 transition-all"
                    >
                      {roleHints[account.role].label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
