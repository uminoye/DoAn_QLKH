import { useState } from 'react';

export default function DataTable({ columns, data, loading, emptyMessage = 'Không có dữ liệu', onRowClick }) {
  if (loading) {
    return (
      <div className="card">
        <div className="p-8 text-center text-gray-500">
          <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="p-8 text-center text-gray-400">
          <div className="text-4xl mb-2">-</div>
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold" style={{ width: col.width }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
