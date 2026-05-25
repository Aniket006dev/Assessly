import { motion } from 'framer-motion';
import styles from './DashboardCard.module.css';

const DashboardCard = ({ label, value, sub, icon: Icon, tone = 'blue', delay = 0 }) => (
  <motion.div
    className={`${styles.card} ${styles[tone]}`}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ duration: 0.26, delay, ease: 'easeInOut' }}
  >
    <div className={styles.top}>
      <span className={styles.icon}>{Icon && <Icon size={21} strokeWidth={2} />}</span>
      <span className={styles.kicker}>{label}</span>
    </div>
    <div className={styles.value}>{value}</div>
    {sub && <div className={styles.sub}>{sub}</div>}
  </motion.div>
);

export default DashboardCard;
