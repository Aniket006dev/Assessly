// client/src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,           // mobile sidebar toggle
    activeNav: 'dashboard',       // current nav item
    dashboardStats: null,
    statsLoading: false,
  },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    closeSidebar(state) { state.sidebarOpen = false; },
    setActiveNav(state, { payload }) { state.activeNav = payload; },
    setDashboardStats(state, { payload }) { state.dashboardStats = payload; },
    setStatsLoading(state, { payload }) { state.statsLoading = payload; },
  },
});

export const { toggleSidebar, closeSidebar, setActiveNav, setDashboardStats, setStatsLoading } = uiSlice.actions;
export default uiSlice.reducer;
