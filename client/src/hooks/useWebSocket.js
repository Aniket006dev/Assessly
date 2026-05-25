// client/src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  setGenProgress, setGeneratedPaper,
  updateAssignmentInList, setActiveAssignment,
} from '../store/slices/assignmentSlice';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:5000/ws`;

export const useWebSocket = () => {
  const ws = useRef(null);
  const dispatch = useDispatch();
  const reconnectTimer = useRef(null);
  const isConnected = useRef(false);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        isConnected.current = true;
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (_) {}
      };

      ws.current.onclose = () => {
        isConnected.current = false;
        // Auto-reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch (_) {}
  }, []);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'progress':
        dispatch(setGenProgress({
          progress: data.progress,
          step: data.step,
          stepLabel: data.stepLabel,
        }));
        break;

      case 'complete':
        dispatch(setGenProgress({ progress: 100, step: 5 }));
        if (data.assignment) {
          dispatch(updateAssignmentInList(data.assignment));
          dispatch(setActiveAssignment(data.assignment));
          if (data.assignment.paper) {
            dispatch(setGeneratedPaper(data.assignment.paper));
          }
        }
        toast.success('Question paper generated!', { icon: '✅' });
        break;

      case 'error':
        toast.error(data.message || 'Generation failed', { icon: '❌' });
        break;

      default:
        break;
    }
  }, [dispatch]);

  // Subscribe to a job
  const subscribeToJob = useCallback((jobId) => {
    if (!jobId) return;
    const send = () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'subscribe', jobId }));
      } else {
        setTimeout(send, 500);
      }
    };
    send();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { subscribeToJob, isConnected };
};
