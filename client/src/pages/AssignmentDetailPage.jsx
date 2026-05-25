// client/src/pages/AssignmentDetailPage.jsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignment } from '../store/slices/assignmentSlice';
import AppLayout from '../components/layout/AppLayout';
import QuestionPaper from '../components/assignments/QuestionPaper';
import GeneratingScreen from '../components/assignments/GeneratingScreen';
import styles from './AssignmentDetailPage.module.css';

const AssignmentDetailPage = ({ generating = false }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { activeAssignment, loading } = useSelector((s) => s.assignments);

  useEffect(() => {
    if (!activeAssignment || activeAssignment._id !== id) {
      dispatch(fetchAssignment(id));
    }
  }, [id, dispatch]);

  const title = activeAssignment?.title || 'Assignment';

  if (loading && !activeAssignment) {
    return (
      <AppLayout title={title}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading assignment...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={generating ? 'Generating Paper' : title}>
      {generating ? <GeneratingScreen /> : <QuestionPaper />}
    </AppLayout>
  );
};

export default AssignmentDetailPage;
