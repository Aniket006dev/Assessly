import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchEvaluations = createAsyncThunk('evaluations/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/evaluations');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load evaluations');
  }
});

export const fetchEvaluation = createAsyncThunk('evaluations/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/evaluations/${id}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load evaluation');
  }
});

export const retryEvaluation = createAsyncThunk('evaluations/retry', async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/evaluations/${id}/retry`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not restart evaluation');
  }
});

export const approveEvaluation = createAsyncThunk('evaluations/approve', async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/evaluations/${id}/approve`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not approve evaluation');
  }
});

export const deleteEvaluation = createAsyncThunk('evaluations/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/evaluations/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not delete evaluation');
  }
});

export const createEvaluation = createAsyncThunk(
  'evaluations/create',
  async ({ formData, onUploadProgress }, { rejectWithValue }) => {
    try {
      const res = await api.post('/evaluations', formData, {
        timeout: 120000,
        onUploadProgress,
      });
      return res.data.data;
    } catch (err) {
      const details = err.response?.data?.message || err.response?.data?.error;
      return rejectWithValue(details || `Upload failed (HTTP ${err.response?.status || 'network error'}). Check each file is a valid PDF, JPG, PNG, or WebP under 25 MB.`);
    }
  }
);

export const updateEvaluationMapping = createAsyncThunk(
  'evaluations/updateMapping',
  async ({ id, questionId, answerId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/evaluations/${id}/mappings`, { questionId, answerId, status });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update mapping');
    }
  }
);

export const updateEvaluationGrade = createAsyncThunk(
  'evaluations/updateGrade',
  async ({ id, questionId, marksObtained, feedback }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/evaluations/${id}/grading`, { questionId, marksObtained, feedback });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save grade');
    }
  }
);

export const updateEvaluationAnswer = createAsyncThunk(
  'evaluations/updateAnswer',
  async ({ id, answerId, extractedText }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/evaluations/${id}/answers`, { answerId, extractedText });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save transcription');
    }
  }
);

const evaluationSlice = createSlice({
  name: 'evaluations',
  initialState: {
    list: [],
    activeEvaluation: null,
    loading: false,
    creating: false,
    uploadProgress: 0,
    error: null,
  },
  reducers: {
    setUploadProgress(state, { payload }) { state.uploadProgress = payload; },
    clearEvaluationError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvaluations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEvaluations.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data || [];
      })
      .addCase(fetchEvaluations.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(fetchEvaluation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEvaluation.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.activeEvaluation = payload;
      })
      .addCase(fetchEvaluation.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(retryEvaluation.fulfilled, (state, { payload }) => { state.activeEvaluation = payload; })
      .addCase(approveEvaluation.fulfilled, (state, { payload }) => {
        state.activeEvaluation = payload;
        const index = state.list.findIndex((item) => item._id === payload._id);
        if (index !== -1) state.list[index] = payload;
      })
      .addCase(deleteEvaluation.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((item) => item._id !== payload);
        if (state.activeEvaluation?._id === payload) state.activeEvaluation = null;
      })
      .addCase(createEvaluation.pending, (state) => {
        state.creating = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(createEvaluation.fulfilled, (state, { payload }) => {
        state.creating = false;
        state.uploadProgress = 100;
        state.activeEvaluation = payload;
        state.list.unshift(payload);
      })
      .addCase(createEvaluation.rejected, (state, { payload }) => {
        state.creating = false;
        state.error = payload;
      })
      .addCase(updateEvaluationMapping.fulfilled, (state, { payload }) => {
        state.activeEvaluation = payload;
        const index = state.list.findIndex((item) => item._id === payload._id);
        if (index !== -1) state.list[index] = payload;
      })
      .addCase(updateEvaluationGrade.fulfilled, (state, { payload }) => {
        state.activeEvaluation = payload;
        const index = state.list.findIndex((item) => item._id === payload._id);
        if (index !== -1) state.list[index] = payload;
      })
      .addCase(updateEvaluationAnswer.fulfilled, (state, { payload }) => {
        state.activeEvaluation = payload;
        const index = state.list.findIndex((item) => item._id === payload._id);
        if (index !== -1) state.list[index] = payload;
      });
  },
});

export const { setUploadProgress, clearEvaluationError } = evaluationSlice.actions;
export default evaluationSlice.reducer;
