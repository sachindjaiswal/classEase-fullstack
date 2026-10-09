import { useState } from 'react';

export default function PasswordInput({
    label,
    value,
    onChange,
    error,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
}) {
    const [visible, setVisible] = useState(false);

    return (
        <label className="flex flex-col text-sm">
            <span className="label">{label}</span>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`input pr-16 ${error ? 'input-error' : ''}`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-xs font-semibold text-gold-dark transition hover:text-ink2"
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
            {error && <span className="mt-1 text-xs text-danger">{error}</span>}
        </label>
    );
}
