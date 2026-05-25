import { motion } from 'framer-motion';

const AnimatedContainer = ({ children, className = '', delay = 0, as = 'div' }) => {
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeInOut' }}
    >
      {children}
    </Component>
  );
};

export default AnimatedContainer;
