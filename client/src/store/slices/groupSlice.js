// client/src/store/slices/groupSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchGroups = createAsyncThunk('groups/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/groups');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load groups');
  }
});

export const createGroup = createAsyncThunk('groups/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/groups', data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create group');
  }
});

export const deleteGroup = createAsyncThunk('groups/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/groups/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete group');
  }
});

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    list: [],
    loading: false,
    error: null,
    showCreateModal: false,
    form: { name: '', subject: '', grade: '', section: '', studentCount: 0, color: '#E8440A', description: '' },
    formErrors: {},
  },
  reducers: {
    setGroupForm(state, { payload }) { state.form = { ...state.form, ...payload }; },
    setGroupFormErrors(state, { payload }) { state.formErrors = payload; },
    resetGroupForm(state) {
      state.form = { name: '', subject: '', grade: '', section: '', studentCount: 0, color: '#E8440A', description: '' };
      state.formErrors = {};
    },
    setShowCreateModal(state, { payload }) { state.showCreateModal = payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => { state.loading = true; })
      .addCase(fetchGroups.fulfilled, (state, { payload }) => { state.loading = false; state.list = payload; })
      .addCase(fetchGroups.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(createGroup.fulfilled, (state, { payload }) => { state.list.unshift(payload); state.showCreateModal = false; })
      .addCase(deleteGroup.fulfilled, (state, { payload }) => { state.list = state.list.filter((g) => g._id !== payload); });
  },
});

export const { setGroupForm, setGroupFormErrors, resetGroupForm, setShowCreateModal } = groupSlice.actions;
export default groupSlice.reducer;
