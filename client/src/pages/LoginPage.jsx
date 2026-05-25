import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Check, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { loginUser, clearError } from '../store/slices/authSlice';
import Button from '../components/ui/Button';
import styles from './AuthPage.module.css';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const res = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(res)) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Login failed');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.brandLogo}>
            <div className={styles.logoBox}>A</div>
            <span>Assessly</span>
          </div>
          <h1 className={styles.heroTitle}>
            Academic Assessment,<br />
            <span className={styles.highlight}>Reimagined</span>
          </h1>
          <p className={styles.heroSub}>
            Deliver better academic outcomes, faster feedback, and stronger parent confidence - powered by AI.
          </p>
          <div className={styles.pillars}>
            {['AI Question Generation', 'Smart Grading', 'Real-time Analytics', 'PDF Export'].map((p) => (
              <div key={p} className={styles.pillar}><Check size={14} strokeWidth={2.2} /> {p}</div>
            ))}
          </div>
          {/* <div className={styles.incubated}>
            <span className={styles.incubatedBadge}><Building2 size={16} strokeWidth={2} /></span>
            <span>Incubated at IIM Bangalore</span>
          </div> */}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Welcome back</h2>
            <p className={styles.cardSub}>Sign in to your Assessly account</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email address</label>
              <input
                type="email"
                className={`${styles.fieldInput} ${errors.email ? styles.fieldError : ''}`}
                placeholder="teacher@school.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <span className={styles.errText}>{errors.email}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.fieldLabel}>Password</label>
                {/* <button type="button" className={styles.forgotLink}>Forgot password?</button> */}
              </div>
              <div className={styles.passWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`${styles.fieldInput} ${errors.password ? styles.fieldError : ''}`}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((p) => !p)}>
                  {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <span className={styles.errText}>{errors.password}</span>}
            </div>

            {error && <div className={styles.serverError}><TriangleAlert size={14} strokeWidth={2} /> {error}</div>}

            <Button type="submit" variant="brand" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <div className={styles.divider}><span>or</span></div>

          {/* <div className={styles.demoBox}>
            <div className={styles.demoTitle}>Demo credentials</div>
            <div className={styles.demoRow}>
              <span className={styles.demoLabel}>Email:</span>
              <code className={styles.demoVal}>demo@assessly.com</code>
            </div>
            <div className={styles.demoRow}>
              <span className={styles.demoLabel}>Password:</span>
              <code className={styles.demoVal}>demo123</code>
            </div>
          </div> */}

          <p className={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.switchLink}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
