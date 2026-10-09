export default function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    required,
}: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <label className="flex flex-col text-sm">
            <span className="label">
                {label}
                {required && <span className="ml-0.5 text-danger">*</span>}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`input ${error ? 'input-error' : ''}`}
            />
            {error && <span className="mt-1 text-xs text-danger">{error}</span>}
        </label>
    );
}
