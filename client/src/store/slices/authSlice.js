// client/src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ── Thunks ────────────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('assessly_token', res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    localStorage.setItem('assessly_token', res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/profile', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('assessly_token') || null,
    loading: false,
    initializing: true,   // true while we check saved token on mount
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('assessly_token');
    },
    clearError(state) { state.error = null; },
    setInitializing(state, action) { state.initializing = action.payload; },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true;  state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      // register
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user; state.token = payload.token;
      })
      .addCase(registerUser.rejected, rejected)
      // login
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user; state.token = payload.token;
      })
      .addCase(loginUser.rejected, rejected)
      // me
      .addCase(fetchMe.pending, (state) => { state.initializing = true; })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.initializing = false; state.user = payload.user;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.initializing = false; state.user = null; state.token = null;
        localStorage.removeItem('assessly_token');
      })
      // profile update
      .addCase(updateProfile.fulfilled, (state, { payload }) => { state.user = payload.user; });
  },
});

export const { logout, clearError, setInitializing } = authSlice.actions;
export default authSlice.reducer;
