const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api');

export async function downloadServiceReport(serviceId) {
    const token = localStorage.getItem('jwt_token');

    const response = await fetch(`${API_BASE}/reports/service/${serviceId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate report' }));
        throw new Error(err.error || 'Failed to generate report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-report-${serviceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
