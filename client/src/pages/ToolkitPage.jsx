import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, BrainCircuit, Building2, ClipboardList, Sparkles, Users } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import AnimatedContainer from '../components/ui/AnimatedContainer';
import styles from './ToolkitPage.module.css';

const TOOLS = [
  {
    icon: ClipboardList, title: 'AI Question Generator', badge: 'Core Feature',
    desc: 'Generate a structured question paper with sections, difficulty levels, and marks powered by Claude AI.',
    cta: 'Create Assignment', action: 'create',
  },
  {
    icon: BarChart3, title: 'Performance Analytics', badge: 'Insights',
    desc: 'Track assignment activity, subject distribution, and question difficulty breakdown over time.',
    cta: 'View Analytics', action: 'analytics',
  },
  {
    icon: BookOpen, title: 'Paper Library', badge: 'Storage',
    desc: 'Access completed question papers. View, print, or download any paper instantly.',
    cta: 'Open Library', action: 'library',
  },
  {
    icon: Users, title: 'Group Manager', badge: 'Organisation',
    desc: 'Create and manage groups, assign work to specific cohorts, and keep class details organized.',
    cta: 'Manage Groups', action: 'groups',
  },
  {
    icon: Sparkles, title: 'Rubric Builder', badge: 'Coming Soon',
    desc: 'Define marking criteria and rubrics for subjective questions with guided AI assistance.',
    cta: 'Coming Soon', action: null, disabled: true,
  },
  {
    icon: BrainCircuit, title: 'AI Auto-Grader', badge: 'Coming Soon',
    desc: 'Upload student submissions and grade them against the answer key automatically.',
    cta: 'Coming Soon', action: null, disabled: true,
  },
];

const ToolkitPage = () => {
  const navigate = useNavigate();
  const handleAction = (action) => {
    if (!action) return;
    if (action === 'create') navigate('/assignments?create=true');
    else navigate(`/${action}`);
  };

  return (
    <AppLayout title="AI Teacher's Toolkit">
      <AnimatedContainer className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>AI Teacher's Toolkit</h1>
          <p className={styles.sub}>Everything you need to run smarter assessments, in one place.</p>
        </div>

        <div className={styles.grid}>
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.title} className={`${styles.toolCard} ${tool.disabled ? styles.disabled : ''}`}>
                <div className={styles.toolTop}>
                  <span className={styles.toolIcon}><Icon size={25} strokeWidth={1.9} /></span>
                  <span className={`${styles.toolBadge} ${tool.badge === 'Coming Soon' ? styles.soon : ''}`}>
                    {tool.badge}
                  </span>
                </div>
                <h3 className={styles.toolTitle}>{tool.title}</h3>
                <p className={styles.toolDesc}>{tool.desc}</p>
                <Button
                  variant={tool.disabled ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={tool.disabled}
                  onClick={() => handleAction(tool.action)}
                >
                  {tool.cta}
                </Button>
              </div>
            );
          })}
        </div>

        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <h2 className={styles.bannerTitle}>Built for CBSE and ICSE Curricula</h2>
            <p className={styles.bannerSub}>Assessly understands NCERT standards and Indian school assessment patterns, making every question paper curriculum-aligned.</p>
          </div>
          {/* <div className={styles.bannerBadge}><Building2 size={15} strokeWidth={2} /> IIM Bangalore Incubated</div> */}
        </div>
      </AnimatedContainer>
    </AppLayout>
  );
};

export default ToolkitPage;
