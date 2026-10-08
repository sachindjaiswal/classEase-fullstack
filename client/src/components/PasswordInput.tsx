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
        <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink2">{label}</span>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full rounded-md border px-3 py-2 pr-16 text-sm outline-none focus:border-ink ${
                        error ? 'border-danger' : 'border-border'
                    }`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-muted hover:text-ink"
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
            {error && <span className="text-xs text-danger">{error}</span>}
        </label>
    );
}