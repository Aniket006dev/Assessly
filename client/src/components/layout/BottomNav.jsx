import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, isNavItemActive } from './navItems';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { total } = useSelector((s) => s.assignments);

  return (
    <nav className={styles.bottomNav} aria-label="Primary mobile navigation">
      <div className={styles.scroller}>
        {NAV_ITEMS.map(({ path, shortLabel, icon: Icon, badgeKey }) => {
          const active = isNavItemActive(pathname, path);
          return (
            <button
              key={path}
              className={`${styles.item} ${active ? styles.active : ''}`}
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className={styles.activePill}
                  transition={{ duration: 0.24, ease: 'easeInOut' }}
                />
              )}
              <span className={styles.iconWrap}>
                <Icon size={19} strokeWidth={2} />
                {badgeKey === 'total' && total > 0 && <span className={styles.badge}>{total}</span>}
              </span>
              <span className={styles.label}>{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
