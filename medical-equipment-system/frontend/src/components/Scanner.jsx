import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Scanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize the scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        const onScanSuccess = (decodedText, decodedResult) => {
            // Stop scanning
            scanner.clear();
            setScanResult(decodedText);

            // Navigate to equipment details page
            // Assuming the QR code value is the equipment ID UUID
            navigate(`/equipment/${decodedText}`);
        };

        const onScanFailure = (error) => {
            // handle scan failure, usually better to ignore and keep scanning
            // setScanError(error);
        };

        scanner.render(onScanSuccess, onScanFailure);

        // Cleanup function
        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [navigate]);

    return (
        <div className="page" style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Scan Equipment QR Code</h2>
            <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
            {scanResult && <p style={{ color: 'green', marginTop: '10px' }}>Success: Scanned {scanResult}</p>}
            {scanError && <p style={{ color: 'red', marginTop: '10px' }}>{scanError}</p>}
        </div>
    );
};

export default Scanner;
