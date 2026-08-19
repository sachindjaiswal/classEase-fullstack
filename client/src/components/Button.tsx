import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink-hover',
  secondary: 'bg-white text-ink border border-border hover:bg-base',
  danger: 'bg-danger text-white hover:opacity-90',
};

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: Props) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
