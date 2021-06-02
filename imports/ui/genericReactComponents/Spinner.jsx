
import React from 'react';
import { Spinner as BootStrapSpinner } from 'react-bootstrap';

function Spinner() {
    return (
        <div style={{ textAlign: 'center' }}>
            <BootStrapSpinner animation="border" variant="secondary" />
        </div>
    )
}

export default Spinner