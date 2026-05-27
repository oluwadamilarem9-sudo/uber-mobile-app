export type AppTheme = {
  mode: 'light';
  colors: {
    primary: string;
    ink: string;
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    muted: string;
    shadow: string;
    danger: string;
    success: string;
    info: string;
  };
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    primary: '#FFD000',
    ink: '#1A1A1A',
    bg: '#FFFFFF',
    surface: '#F5F5F5',
    surface2: '#FFFFFF',
    border: 'rgba(26,26,26,0.10)',
    muted: 'rgba(26,26,26,0.55)',
    shadow: 'rgba(0,0,0,0.12)',
    danger: '#DC2626',
    success: '#16A34A',
    info: '#2563EB',
  },
};
