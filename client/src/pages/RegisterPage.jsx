import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, BrainCircuit, Building2, Eye, EyeOff, Lock, Target, TriangleAlert } from 'lucide-react';
import { registerUser, clearError } from '../store/slices/authSlice';
import Button from '../components/ui/Button';
import styles from './AuthPage.module.css';
import toast from 'react-hot-toast';

const PILLARS = [
  { icon: Target, text: 'Generate a full question paper in under 2 minutes' },
  { icon: BarChart3, text: 'Track student performance with smart analytics' },
  { icon: BrainCircuit, text: 'AI trained on NCERT and CBSE curriculum' },
  { icon: Lock, text: 'Your data stays private and secure' },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    schoolName: '', schoolCity: '',
  });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const res = await dispatch(registerUser({
      name: form.name, email: form.email, password: form.password,
      schoolName: form.schoolName, schoolCity: form.schoolCity,
    }));
    if (registerUser.fulfilled.match(res)) {
      toast.success('Account created! Welcome to Assessly');
      navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Registration failed');
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
            Built for<br />
            <span className={styles.highlight}>India's Teachers</span>
          </h1>
          <p className={styles.heroSub}>
            Join educators creating AI-powered assessments, saving hours every week, and delivering better outcomes for their students.
          </p>
          <div className={styles.pillars}>
            {PILLARS.map(({ icon: Icon, text }) => (
              <div key={text} className={styles.pillar}><Icon size={14} strokeWidth={2.1} /> {text}</div>
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
            <h2 className={styles.cardTitle}>Create your account</h2>
            <p className={styles.cardSub}>Free forever for individual teachers</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Full Name *</label>
              <input className={`${styles.fieldInput} ${errors.name ? styles.fieldError : ''}`} placeholder="Priya Sharma" value={form.name} onChange={(e) => set('name', e.target.value)} />
              {errors.name && <span className={styles.errText}>{errors.name}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email address *</label>
              <input type="email" className={`${styles.fieldInput} ${errors.email ? styles.fieldError : ''}`} placeholder="teacher@school.edu" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
              {errors.email && <span className={styles.errText}>{errors.email}</span>}
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>School Name</label>
                <input className={styles.fieldInput} placeholder="Delhi Public School" value={form.schoolName} onChange={(e) => set('schoolName', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>City</label>
                <input className={styles.fieldInput} placeholder="New Delhi" value={form.schoolCity} onChange={(e) => set('schoolCity', e.target.value)} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Password *</label>
              <div className={styles.passWrap}>
                <input type={showPass ? 'text' : 'password'} className={`${styles.fieldInput} ${errors.password ? styles.fieldError : ''}`} placeholder="Min. 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((p) => !p)}>
                  {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <span className={styles.errText}>{errors.password}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Confirm Password *</label>
              <input type="password" className={`${styles.fieldInput} ${errors.confirm ? styles.fieldError : ''}`} placeholder="Repeat password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
              {errors.confirm && <span className={styles.errText}>{errors.confirm}</span>}
            </div>

            {error && <div className={styles.serverError}><TriangleAlert size={14} strokeWidth={2} /> {error}</div>}

            <Button type="submit" variant="brand" fullWidth loading={loading} size="lg">
              Create Account
            </Button>

            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.switchLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
