import type { ReactNode } from 'react';

export interface Column<T> {
    header: ReactNode;
    className?: string;
    render: (row: T, index: number) => ReactNode;
}

export default function DataTable<T>({
    columns,
    data,
    keyFor,
    empty = 'No data yet.',
}: {
    columns: Column<T>[];
    data: T[];
    keyFor: (row: T) => number | string;
    empty?: string;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                        {columns.map((c, i) => (
                            <th key={i} className={`px-3 py-2.5 font-medium ${c.className ?? ''}`}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-10 text-center text-muted">
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr
                                key={keyFor(row)}
                                className="border-b border-border/60 last:border-0 hover:bg-ink/[0.02]"
                            >
                                {columns.map((c, i) => (
                                    <td key={i} className={`px-3 py-2.5 align-middle ${c.className ?? ''}`}>
                                        {c.render(row, index)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}