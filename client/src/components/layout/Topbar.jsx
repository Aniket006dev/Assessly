import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bell, ChevronDown, LayoutGrid, LogOut, Menu, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import styles from './Topbar.module.css';

const Topbar = ({ title }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);

  const isDetail = location.pathname.split('/').length > 2;

  return (
    <header className={styles.topbar}>
      <button className={styles.menuBtn} onClick={() => dispatch(toggleSidebar())} aria-label="Open menu">
        <Menu size={18} strokeWidth={2} />
      </button>

      {isDetail && (
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={17} strokeWidth={2.2} />
        </button>
      )}

      <div className={styles.pageInfo}>
        <span className={styles.gridIcon}><LayoutGrid size={15} strokeWidth={2} /></span>
        <span className={styles.pageLabel}>{title}</span>
      </div>

      <div className={styles.right}>
        <button className={styles.bellBtn} aria-label="Notifications">
          <Bell size={17} strokeWidth={2} />
          <span className={styles.bellDot} />
        </button>

        <div className={styles.userWrap}>
          <button className={styles.userBtn} onClick={() => setOpen((p) => !p)} aria-expanded={open}>
            <div className={styles.avatar}>
              {user?.name?.[0]?.toUpperCase() || 'T'}
            </div>
            <span className={styles.userName}>{user?.name || 'Teacher'}</span>
            <span className={styles.chevron}><ChevronDown size={14} strokeWidth={2.2} /></span>
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div className={styles.dropBackdrop} onClick={() => setOpen(false)} />
                <motion.div
                  className={styles.dropdown}
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <div className={styles.dropHead}>
                    <div className={styles.dropAvatar}>{user?.name?.[0]?.toUpperCase() || 'T'}</div>
                    <div>
                      <div className={styles.dropName}>{user?.name || 'Teacher'}</div>
                      {/* <div className={styles.dropEmail}>{user?.email}</div> */}
                    </div>
                  </div>
                  <div className={styles.dropDivider} />
                  <button className={styles.dropItem} onClick={() => { navigate('/settings'); setOpen(false); }}>
                    <User size={14} strokeWidth={2} /> Profile
                  </button>
                  <button className={styles.dropItem} onClick={() => { navigate('/settings'); setOpen(false); }}>
                    <Settings size={14} strokeWidth={2} /> Settings
                  </button>
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.danger}`} onClick={() => { dispatch(logout()); navigate('/login'); }}>
                    <LogOut size={14} strokeWidth={2} /> Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
