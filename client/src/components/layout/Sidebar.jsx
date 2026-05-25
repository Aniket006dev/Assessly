import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Plus } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { closeSidebar } from '../../store/slices/uiSlice';
import { resetForm } from '../../store/slices/assignmentSlice';
import { NAV_ITEMS, isNavItemActive } from './navItems';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { total } = useSelector((s) => s.assignments);

  const handleNav = (path) => {
    navigate(path);
    dispatch(closeSidebar());
  };

  const handleCreate = () => {
    dispatch(resetForm());
    navigate('/assignments?create=true');
    dispatch(closeSidebar());
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => dispatch(closeSidebar())} />
      )}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>A</div>
          <span className={styles.logoText}>Assessly</span>
        </div>

        <button className={styles.ctaBtn} onClick={handleCreate}>
          <Plus size={15} strokeWidth={2.4} />
          Create Assignment
        </button>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ path, label, icon: Icon, badgeKey }) => {
            const active = isNavItemActive(location.pathname, path);
            return (
              <button
                key={path}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                onClick={() => handleNav(path)}
              >
                <Icon size={17} strokeWidth={2} />
                <span className={styles.navLabel}>{label}</span>
                {badgeKey === 'total' && total > 0 && (
                  <span className={styles.badge}>{total}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={styles.bottom}>
          <button className={styles.settingsItem} onClick={handleLogout}>
            <LogOut size={17} strokeWidth={2} /> Logout
          </button>
          <div className={styles.schoolCard}>
            <div className={styles.schoolAvatar}>
              <GraduationCap size={18} strokeWidth={2} />
            </div>
            <div className={styles.schoolInfo}>
              <div className={styles.schoolName}>{user?.school?.name || 'Delhi Public School'}</div>
              <div className={styles.schoolCity}>{user?.school?.city || 'Bokaro Steel City'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
