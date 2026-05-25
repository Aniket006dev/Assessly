// client/src/components/layout/AppLayout.jsx
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import BottomNav from './BottomNav';
import styles  from './AppLayout.module.css';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const AppLayout = ({ title = 'Assessly', children }) => {
  const location = useLocation();

  return (
    <div className={styles.app}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar title={title} />
        <motion.main
          key={location.pathname}
          className={styles.content}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: 'easeInOut' }}
        >
          {children}
        </motion.main>
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
