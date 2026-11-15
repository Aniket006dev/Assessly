import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  ClipboardCheck,
  Menu,
  Pause,
  Play,
  ScanLine,
  ShieldCheck,
  Target,
  Timer,
  Sparkles,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const navItems = [
  { href: '#platform', label: 'Platform' },
  { href: '#workflow', label: 'How it works' },
  { href: '#principles', label: 'Our approach' },
];

const workflowSlides = [
  {
    label: '01 / CREATE',
    title: 'Start with what students should learn.',
    copy: 'Set learning outcomes and shape an assessment around the knowledge you want students to demonstrate.',
    note: 'Question papers, built around your brief',
  },
  {
    label: '02 / UNDERSTAND',
    title: 'Give every answer a fair reading.',
    copy: 'Read handwritten work in context, with response transcription and rubric-aligned evidence together in one view.',
    note: 'Handwriting-aware, rubric-guided review',
  },
  {
    label: '03 / REVIEW',
    title: 'Keep the final call in your hands.',
    copy: 'Inspect the reasoning, adjust suggested marks and feedback, then approve the result with confidence.',
    note: 'Faculty-reviewed, always',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const moveSlide = (direction) => {
    setActiveSlide((current) => (current + direction + workflowSlides.length) % workflowSlides.length);
  };

  useEffect(() => {
    if (carouselPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % workflowSlides.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [carouselPaused]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} to="/" aria-label="Assessly home" onClick={closeMenu}>
          <span className={styles.brandMark}>a</span>
          assessly<span className={styles.wordmarkDot}>.</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navItems.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>

        <div className={styles.headerActions}>
          <button className={styles.signIn} onClick={() => navigate('/login')}>Sign in</button>
          <button className={styles.headerCta} onClick={() => navigate('/register')}>
            Get started <ArrowUpRight size={15} />
          </button>
        </div>

        <button
          className={styles.menuToggle}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        {menuOpen && (
          <nav className={styles.mobileNav} id="mobile-navigation" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <a href={item.href} key={item.href} onClick={closeMenu}>{item.label}<ArrowUpRight size={15} /></a>
            ))}
            <button onClick={() => navigate('/login')}>Faculty sign in <ArrowRight size={15} /></button>
          </nav>
        )}
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroContent}>
            <motion.div
              className={styles.heroCopy}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <h1>Better assessments.<br /><span>More human</span> outcomes.</h1>
              <p>
                Create thoughtful question papers and review handwritten work with AI that
                supports your judgement—not replaces it.
              </p>
              <div className={styles.heroActions}>
                <button className={styles.primaryCta} onClick={() => navigate('/register')}>
                  Explore Assessly <ArrowRight size={17} />
                </button>
                <a className={styles.watchLink} href="#platform"><span><ArrowDown size={14} /></span> See what you can do</a>
              </div>
              <div className={styles.heroNote}><ShieldCheck size={15} /> Faculty-led from first draft to final mark</div>
            </motion.div>

            <motion.div
              className={styles.heroVisual}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12 }}
              aria-label="Assessly answer review interface preview"
              role="img"
            >
              <div className={styles.visualAura} />
              <div className={styles.visualCaption}><span /> ASSESSLY / WORKSPACE PREVIEW</div>
              <div className={styles.reviewWindow}>
                <div className={styles.windowBar}>
                  <div className={styles.windowDots}><i /><i /><i /></div>
                  <span>PHYSICS / RESPONSE 04</span>
                  <span className={styles.windowStatus}><i /> READY</span>
                </div>
                <div className={styles.reviewBody}>
                  <div className={styles.answerPane}>
                    <span className={styles.paneLabel}>STUDENT RESPONSE</span>
                    <h2>Explain how energy is conserved in this system.</h2>
                    <div className={styles.answerLines}>
                      <span>Energy changes from one form</span>
                      <span>to another but does not disappear.</span>
                      <span>The total energy stays the same.</span>
                    </div>
                    <div className={styles.answerHighlight}><Check size={13} /> Relevant idea found</div>
                    <div className={styles.paperLine} /><div className={`${styles.paperLine} ${styles.short}`} />
                  </div>
                  <div className={styles.rubricPane}>
                    <span className={styles.paneLabel}>RUBRIC MATCH</span>
                    <div className={styles.rubricScore}><strong>3</strong><span>/ 4 marks</span></div>
                    <div className={styles.rubricBar}><i /></div>
                    <p>Energy is conserved, but the response could explain the system boundary.</p>
                    <div className={styles.evidenceTag}><Sparkles size={12} /> Evidence highlighted</div>
                  </div>
                </div>
                <div className={styles.windowFooter}><span><ShieldCheck size={13} /> Suggested, not final</span><button>Review marks <ArrowRight size={13} /></button></div>
              </div>
              <div className={styles.floatingBadge}><span><Check size={14} /></span><div><strong>Meaning understood</strong><small>Equivalent wording accepted</small></div></div>
              <div className={styles.visualStat}><span>YOUR WORKSPACE</span><strong>Faculty-led <i>↗</i></strong><small>Every decision stays yours.</small></div>
            </motion.div>
          </div>
          <div className={styles.heroFooter}><span>THOUGHTFUL TOOLS FOR TEACHERS</span><span>01 — 03</span></div>
        </section>

        <section className={styles.platform} id="platform">
          <div className={styles.sectionHeading}>
            <div><span className={styles.sectionEyebrow}>One considered workspace</span><h2>Less busywork.<br /><span>More good teaching.</span></h2></div>
            <p>Bring assessment creation and review together, with helpful AI at the right moments and your expertise at the center.</p>
          </div>
          <div className={styles.mosaic}>
            <article className={`${styles.mosaicCard} ${styles.cardAssessment}`}>
              <div className={styles.cardTop}><span className={styles.cardIcon}><BookOpenCheck size={18} /></span><span>01 / CREATE</span></div>
              <div className={styles.miniPaper}>
                <div className={styles.miniPaperTop}><i /> MID-TERM / BIOLOGY <span>•••</span></div>
                <strong>Explain the role of photosynthesis in an ecosystem.</strong>
                <div className={styles.miniTags}><span>Understanding</span><span>4 marks</span></div>
                <div className={styles.miniRule} /><div className={`${styles.miniRule} ${styles.ruleShort}`} />
              </div>
              <div className={styles.cardCopy}><h3>Question papers, your way.</h3><p>Start from your brief. Refine the questions, structure and difficulty until it feels right.</p></div>
              <span className={styles.cardArrow}><ArrowUpRight size={17} /></span>
            </article>

            <article className={`${styles.mosaicCard} ${styles.cardReading}`}>
              <div className={styles.cardTop}><span className={styles.cardIcon}><ScanLine size={18} /></span><span>02 / UNDERSTAND</span></div>
              <div className={styles.readingVisual}><div className={styles.scanPage}><span>STUDENT ANSWER</span><i /><i /><i className={styles.lineLong} /><i className={styles.lineShort} /><b><Check size={12} /></b></div><div className={styles.scanGlow} /></div>
              <div className={styles.cardCopy}><h3>Handwritten work, in context.</h3><p>Read answers in their own words, with the original page and transcription close at hand.</p></div>
              <span className={styles.cardArrow}><ArrowUpRight size={17} /></span>
            </article>

            <article className={`${styles.mosaicCard} ${styles.cardReview}`}>
              <div className={styles.cardTop}><span className={styles.cardIcon}><ClipboardCheck size={18} /></span><span>03 / REVIEW</span></div>
              <div className={styles.reviewSnippet}>
                <div><span className={styles.snippetCheck}><Check size={12} /></span><span>Explains energy transfer</span><strong>+2</strong></div>
                <div><span className={styles.snippetCheck}><Check size={12} /></span><span>Uses scientific vocabulary</span><strong>+1</strong></div>
                <div className={styles.snippetMuted}><span>!</span><span>Could name the system boundary</span><strong>—</strong></div>
              </div>
              <div className={styles.cardCopy}><h3>Feedback with a reason.</h3><p>See what matches, what is missing and why—then make the final call yourself.</p></div>
              <span className={styles.cardArrow}><ArrowUpRight size={17} /></span>
            </article>
          </div>
        </section>

        <section className={styles.workflow} id="workflow">
          <div className={styles.workflowIntro}>
            <span className={styles.sectionEyebrow}>A clearer way through</span>
            <h2>From the first question<br />to the <span>final word.</span></h2>
            <p>One connected workflow, designed to leave more space for the parts of teaching only you can do.</p>
            <div className={styles.carouselControls}>
              <button onClick={() => moveSlide(-1)} aria-label="Previous workflow step"><ArrowLeft size={17} /></button>
              <span>0{activeSlide + 1} <i>/</i> 0{workflowSlides.length}</span>
              <button onClick={() => moveSlide(1)} aria-label="Next workflow step"><ArrowRight size={17} /></button>
              <button
                className={styles.carouselPause}
                onClick={() => setCarouselPaused((paused) => !paused)}
                aria-label={carouselPaused ? 'Play workflow carousel' : 'Pause workflow carousel'}
                aria-pressed={carouselPaused}
              >
                {carouselPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
          </div>
          <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Assessly workflow" aria-live="off">
            <div className={styles.carouselTrack} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {workflowSlides.map((slide, index) => (
                <article className={styles.workflowSlide} key={slide.label} aria-hidden={activeSlide !== index}>
                  <div className={styles.slideTop}><span>{slide.label}</span><span>ASSESSLY / FIELD NOTES</span></div>
                  <div className={styles.slideVisual}>
                    <div className={styles.slideOrb} />
                    <div className={styles.slideNumber}>0{index + 1}</div>
                    <div className={styles.slideNote}><span><Check size={13} /></span>{slide.note}</div>
                  </div>
                  <h3>{slide.title}</h3>
                  <p>{slide.copy}</p>
                  <div className={styles.slideProgress}>{workflowSlides.map((step, stepIndex) => <i key={step.label} className={stepIndex === activeSlide ? styles.progressActive : ''} />)}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.principles} id="principles">
          <div className={styles.approachHeader}>
            <span className={styles.sectionEyebrow}>Why a thoughtful approach matters</span>
            <h2>Assessment shapes more than a score.</h2>
            <p>It influences what students learn next, how fairly their work is understood and how much time educators can give to teaching.</p>
          </div>
          <div className={styles.approachReasons}>
            <article className={styles.approachReason}>
              <span className={styles.reasonIcon}><Target size={19} /></span>
              <span className={styles.reasonNumber}>01 / CONSISTENCY</span>
              <h3>Clear criteria. More consistent reviews.</h3>
              <p>A shared rubric makes expectations visible and helps keep feedback grounded in the same learning goals.</p>
            </article>
            <article className={styles.approachReason}>
              <span className={styles.reasonIcon}><Timer size={19} /></span>
              <span className={styles.reasonNumber}>02 / TIME</span>
              <h3>Less repetition. More time to teach.</h3>
              <p>Reduce repetitive review work so educators can focus on the context and conversations students need.</p>
            </article>
            <article className={styles.approachReason}>
              <span className={styles.reasonIcon}><UserRoundCheck size={19} /></span>
              <span className={styles.reasonNumber}>03 / TRUST</span>
              <h3>Helpful AI. Human decisions.</h3>
              <p>Keep evidence and suggestions open to review, with faculty in control of every final mark.</p>
            </article>
          </div>
          <div className={styles.principleBottom}><span>BUILT FOR FACULTY JUDGEMENT</span><button onClick={() => navigate('/register')}>Explore the faculty workspace <ArrowRight size={15} /></button></div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.ctaGlow} />
          <span className={styles.sectionEyebrow}>Make room for what matters</span>
          <h2>More teaching.<br /><span>Less marking alone.</span></h2>
          <p>Start building a more thoughtful assessment workflow.</p>
          <button className={styles.primaryCta} onClick={() => navigate('/register')}>Create your workspace <ArrowRight size={17} /></button>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link className={styles.wordmark} to="/" aria-label="Assessly home"><span className={styles.brandMark}>a</span>assessly<span className={styles.wordmarkDot}>.</span></Link>
        <span>Assessment, with the human still in it.</span>
        <button onClick={() => navigate('/login')}>Faculty sign in <ArrowUpRight size={14} /></button>
        <small>© {new Date().getFullYear()} Assessly</small>
      </footer>
    </div>
  );
};

export default LandingPage;
