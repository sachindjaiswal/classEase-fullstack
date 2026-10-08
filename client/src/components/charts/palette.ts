export const CHART_COLORS = {
    ink: '#1E2A4A',
    gold: '#C89B3C',
    goldLight: '#E4C989',
    goldDark: '#A87F2C',
    success: '#2F9E5B',
    danger: '#D64545',
    warning: '#E0A339',
    muted: '#646F82',
    surface: '#FFFFFF',
    border: '#E4E7EC',
    inkLight: '#33456F',
    ink2: '#1A1F2B',
    teal: '#2E9B9A',
    tealDark: '#227675',
    tealLight: '#5FC4C3',
    yellow: '#FFD014',
    pink: '#FF3E6C',
    blue: '#2F6FED',
};

export const BENTO_RADIUS = 16;

export const TEAL_GRADIENT = {
    from: '#2E9B9A',
    to: '#3FB8B7',
};

export const INK_GRADIENT = {
    from: '#1E2A4A',
    to: '#33456F',
};

export const SERIES = {
    primary: '#1E2A4A',
    gold: '#C89B3C',
    success: '#2F9E5B',
    danger: '#D64545',
    warning: '#E0A339',
    muted: '#B9C2D0',
    goldLight: '#E4C989',
    teal: '#2E9B9A',
    yellow: '#FFD014',
    pink: '#FF3E6C',
};

// Professional chart sequence (blue/green/gold/red) that matches the project theme.
export const ACCENT_SEQUENCE = [
    CHART_COLORS.blue,
    CHART_COLORS.success,
    CHART_COLORS.gold,
    CHART_COLORS.danger,
    CHART_COLORS.ink,
    CHART_COLORS.warning,
];

export const PIE_COLORS = ['#2F9E5B', '#D64545', '#E0A339', '#1E2A4A', '#C89B3C', '#33456F'];

export const RADIAL_COLORS = [
    { from: '#D64545', to: '#E0A339', label: 'Needs attention (0-49)' },
    { from: '#E0A339', to: '#C89B3C', label: 'Developing (50-69)' },
    { from: '#C89B3C', to: '#2F9E5B', label: 'Good (70-84)' },
    { from: '#2F9E5B', to: '#1E2A4A', label: 'Excellent (85-100)' },
];

export const TOOLTIP_STYLE = {
    borderRadius: 8,
    border: '1px solid #E4E7EC',
    fontSize: 12,
    fontFamily: '"IBM Plex Sans", sans-serif',
    boxShadow: '0 8px 24px rgba(30,42,74,0.12)',
};

export const AXIS_TICK = { fill: '#646F82', fontSize: 11, fontFamily: '"IBM Plex Sans", sans-serif' };

export function fmt(value: unknown, unit = ''): [string, string] {
    const n = typeof value === 'number' ? Math.round(value) : 0;
    return [`${n}${unit}`, ''];
}
