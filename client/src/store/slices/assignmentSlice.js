// client/src/store/slices/assignmentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ── Thunks ────────────────────────────────────────────────────────────────────
export const fetchAssignments = createAsyncThunk(
  'assignments/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/assignments', { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load assignments');
    }
  }
);

export const fetchAssignment = createAsyncThunk(
  'assignments/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/assignments/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Not found');
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignments/create',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/assignments', formData);
      return res.data;  // { data: assignment, jobId }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Creation failed'
      );
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/assignments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed');
    }
  }
);

export const regenerateAssignment = createAsyncThunk(
  'assignments/regenerate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`/assignments/${id}/regenerate`);
      return { id, jobId: res.data.jobId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Regeneration failed');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const assignmentSlice = createSlice({
  name: 'assignments',
  initialState: {
    list: [],
    total: 0,
    currentPage: 1,
    activeAssignment: null,
    generatedPaper: null,
    currentJobId: null,
    genProgress: 0,
    genStep: 0,
    genStepLabel: '',
    loading: false,
    creating: false,
    error: null,
    searchQuery: '',
    openMenuId: null,
    // form state
    form: {
      title: '', subject: '', classGroup: '', dueDate: '', instructions: '',
      questionTypes: ['MCQ'], numQuestions: 10, marksPerQuestion: 2,
      difficulty: ['easy', 'medium', 'hard'], groupId: '',
    },
    formErrors: {},
    createStep: 1,
  },
  reducers: {
    setForm(state, { payload }) { state.form = { ...state.form, ...payload }; },
    setFormErrors(state, { payload }) { state.formErrors = payload; },
    setCreateStep(state, { payload }) { state.createStep = payload; },
    resetForm(state) {
      state.form = {
        title: '', subject: '', classGroup: '', dueDate: '', instructions: '',
        questionTypes: ['MCQ'], numQuestions: 10, marksPerQuestion: 2,
        difficulty: ['easy', 'medium', 'hard'], groupId: '',
      };
      state.formErrors = {};
      state.createStep = 1;
    },
    setSearchQuery(state, { payload }) { state.searchQuery = payload; },
    setOpenMenuId(state, { payload }) { state.openMenuId = payload; },
    setGenProgress(state, { payload }) {
      state.genProgress = payload.progress;
      state.genStep = payload.step ?? state.genStep;
      state.genStepLabel = payload.stepLabel ?? state.genStepLabel;
    },
    setGeneratedPaper(state, { payload }) { state.generatedPaper = payload; },
    setActiveAssignment(state, { payload }) { state.activeAssignment = payload; },
    updateAssignmentInList(state, { payload }) {
      const idx = state.list.findIndex((a) => a._id === payload._id);
      if (idx !== -1) state.list[idx] = payload;
      if (state.activeAssignment?._id === payload._id) state.activeAssignment = payload;
    },
    setCurrentJobId(state, { payload }) { state.currentJobId = payload; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetch all
      .addCase(fetchAssignments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAssignments.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data;
        state.total = payload.total;
        state.currentPage = payload.page;
      })
      .addCase(fetchAssignments.rejected, (state, { payload }) => {
        state.loading = false; state.error = payload;
      })
      // fetch one
      .addCase(fetchAssignment.fulfilled, (state, { payload }) => {
        state.activeAssignment = payload;
        if (payload.paper) state.generatedPaper = payload.paper;
      })
      // create
      .addCase(createAssignment.pending, (state) => { state.creating = true; state.error = null; })
      .addCase(createAssignment.fulfilled, (state, { payload }) => {
        state.creating = false;
        state.list.unshift(payload.data);
        state.total += 1;
        state.currentJobId = payload.jobId;
        state.activeAssignment = payload.data;
      })
      .addCase(createAssignment.rejected, (state, { payload }) => {
        state.creating = false; state.error = payload;
      })
      // delete
      .addCase(deleteAssignment.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((a) => a._id !== payload);
        state.total = Math.max(0, state.total - 1);
      })
      // regenerate
      .addCase(regenerateAssignment.fulfilled, (state, { payload }) => {
        state.currentJobId = payload.jobId;
        const idx = state.list.findIndex((a) => a._id === payload.id);
        if (idx !== -1) state.list[idx].status = 'pending';
      });
  },
});

export const {
  setForm, setFormErrors, setCreateStep, resetForm,
  setSearchQuery, setOpenMenuId, setGenProgress, setGeneratedPaper,
  setActiveAssignment, updateAssignmentInList, setCurrentJobId, clearError,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
