import {
  BookOpen,
  ClipboardList,
  Home,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', shortLabel: 'Home', icon: Home },
  { path: '/groups', label: 'My Groups', shortLabel: 'Groups', icon: Users },
  { path: '/assignments', label: 'Assignments', shortLabel: 'Tasks', icon: ClipboardList, badgeKey: 'total' },
  { path: '/toolkit', label: "AI Teacher's Toolkit", shortLabel: 'Toolkit', icon: Sparkles },
  { path: '/library', label: 'My Library', shortLabel: 'Library', icon: BookOpen },
  { path: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export const isNavItemActive = (pathname, path) =>
  pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
