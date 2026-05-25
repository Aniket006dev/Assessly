import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Files,
  LayoutDashboard,
  Library,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

const steps = [
  { title: 'Create Assignment', text: 'Set subject, due date, marks, difficulty, and instructions in a focused workflow.', icon: ClipboardCheck },
  { title: 'Customize & Review', text: 'Review AI-generated questions, refine structure, and keep assessment quality high.', icon: Edit3 },
  { title: 'Share with Students', text: 'Export, print, or organize completed papers for every class and group.', icon: Users },
];

const features = [
  { title: 'AI Assignment Generation', text: 'Generate polished assessments from a short brief, topic, or curriculum note.', icon: WandSparkles },
  { title: 'Smart Templates', text: 'Keep question types, marks, and difficulty mixes consistent across classes.', icon: Files },
  { title: 'Quick Editing', text: 'Move from draft to classroom-ready paper with fewer manual formatting steps.', icon: Edit3 },
  { title: 'Organized Library', text: 'Store completed papers in one clean, searchable assessment library.', icon: Library },
  { title: 'Teacher Workflow Optimization', text: 'Reduce repetitive setup and keep assignment creation moving quickly.', icon: CheckCircle2 },
];

const mockups = [
  { title: 'Home Dashboard', icon: LayoutDashboard },
  { title: 'Assignment Section', icon: ClipboardCheck },
  { title: 'AI Toolkit Section', icon: Sparkles },
];

const DashboardPreview = ({ compact = false, title = 'Assessly Workspace' }) => (
  <div className={`${styles.preview} ${compact ? styles.compactPreview : ''}`}>
    <div className={styles.browserBar}>
      <span />
      <span />
      <span />
      <div>{title}</div>
    </div>
    <div className={styles.previewBody}>
      <aside className={styles.previewSide}>
        <div />
        <div />
        <div />
        <div />
      </aside>
      <main className={styles.previewMain}>
        <div className={styles.previewHero} />
        <div className={styles.previewGrid}>
          <div />
          <div />
          <div />
        </div>
        <div className={styles.previewRows}>
          <span />
          <span />
          <span />
        </div>
      </main>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">
          <span className={styles.logo}>A</span>
          <span>Assessly</span>
        </Link>
        <nav className={styles.nav}>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#showcase">Showcase</a>
        </nav>
        <div className={styles.actions}>
          <button className={styles.signIn} onClick={() => navigate('/login')}>Sign In</button>
          <button className={styles.getStarted} onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <motion.div className={styles.heroText} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: 'easeInOut' }}>
            <span className={styles.kicker}>Create smarter assignments in minutes.</span>
            <h1>AI-powered assessment creation for modern educators</h1>
            <p>
              Assessly helps teachers generate structured assignments faster, keep class workflows organized,
              and move from planning to polished assessment without the busywork.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryCta} onClick={() => navigate('/register')}>
                Get Started <ArrowRight size={16} strokeWidth={2.2} />
              </button>
              <button className={styles.secondaryCta} onClick={() => navigate('/login')}>View Demo</button>
            </div>
          </motion.div>
          <motion.div className={styles.heroVisual} initial={{ opacity: 0, y: 22, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.34, delay: 0.05, ease: 'easeInOut' }}>
            <DashboardPreview />
            <div className={styles.floatCard}>
              <BookOpen size={18} strokeWidth={2} />
              <div>
                <strong>12 min saved</strong>
                <span>per assessment draft</span>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section id="how" className={styles.section} {...fadeUp}>
          <div className={styles.sectionHead}>
            <span>Workflow</span>
            <h2>How it works</h2>
            <p>A calm, teacher-first process from assignment idea to classroom-ready paper.</p>
          </div>
          <div className={styles.steps}>
            {steps.map(({ title, text, icon: Icon }, index) => (
              <motion.div key={title} className={styles.stepCard} whileHover={{ y: -4 }} transition={{ duration: 0.22, ease: 'easeInOut' }}>
                <div className={styles.stepIndex}>0{index + 1}</div>
                <div className={styles.cardIcon}><Icon size={23} strokeWidth={1.9} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section id="features" className={styles.section} {...fadeUp}>
          <div className={styles.sectionHead}>
            <span>Features</span>
            <h2>Built for everyday teaching velocity</h2>
            <p>Focused tools that support assessment creation without making the workflow feel heavy.</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map(({ title, text, icon: Icon }) => (
              <motion.div key={title} className={styles.featureCard} whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.22, ease: 'easeInOut' }}>
                <div className={styles.cardIcon}><Icon size={22} strokeWidth={1.9} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section id="showcase" className={`${styles.section} ${styles.showcase}`} {...fadeUp}>
          <div className={styles.sectionHead}>
            <span>Showcase</span>
            <h2>Designed around the teacher dashboard</h2>
            <p>Premium placeholders for the key product surfaces, ready for real screenshots later.</p>
          </div>
          <div className={styles.showcaseGrid}>
            {mockups.map(({ title, icon: Icon }) => (
              <motion.div key={title} className={styles.mockupCard} whileHover={{ y: -5 }} transition={{ duration: 0.22, ease: 'easeInOut' }}>
                <div className={styles.mockupTitle}>
                  <Icon size={18} strokeWidth={2} />
                  {title}
                </div>
                <DashboardPreview compact title={title} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className={styles.finalCta} {...fadeUp}>
          <h2>Start creating smarter assessments today.</h2>
          <p>Bring AI-assisted assignment creation into a polished workflow built for modern educators.</p>
          <div className={styles.heroActions}>
            <button className={styles.primaryCta} onClick={() => navigate('/register')}>Get Started</button>
            <button className={styles.secondaryCta} onClick={() => navigate('/login')}>Sign In</button>
          </div>
        </motion.section>
      </main>

      <footer className={styles.footer}>
        <span>Assessly</span>
        <span>AI-powered assessment creation for modern educators</span>
      </footer>
    </div>
  );
};

export default LandingPage;
