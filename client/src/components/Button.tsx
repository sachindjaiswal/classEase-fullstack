import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  primary:
    'bg-ink text-white shadow-soft hover:bg-ink-hover hover:shadow-card-hover active:translate-y-px',
  secondary:
    'bg-white text-ink2 border border-border shadow-sm hover:border-ink/25 hover:bg-ink-50',
  danger:
    'bg-danger text-white shadow-soft hover:brightness-95 active:translate-y-px',
  ghost: 'text-ink2 hover:bg-ink-50',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
