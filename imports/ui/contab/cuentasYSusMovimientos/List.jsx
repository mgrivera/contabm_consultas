
import React from 'react';
import { useRouteMatch, Link } from "react-router-dom";

import { Row, Col } from 'react-bootstrap';
import { Navbar } from 'react-bootstrap';

const List = () => {

    const { url } = useRouteMatch();

    const regresarAlFiltro = () => {
        // para ir al route '.../filter'
        let url2 = url.toLowerCase();

        if (url2.includes("list")) {
            url2 = url2.replace("list", "filter");
        } else {
            url2 = url2 + "/filter";
        }

        return url2;
    }

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="xl" style={{ marginRight: '-15px', marginLeft: '-15px' }}>
                <Navbar.Collapse className="justify-content-end">
                    <Link className='text-link-menu' to={regresarAlFiltro}>
                        <span style={{ padding: '10px' }}>Regresar</span>
                    </Link><br />
                </Navbar.Collapse>
            </Navbar>

            <Row className="align-items-center">
                <Col className="text-center">
                </Col>
                <Col></Col>
                <Col></Col>
                <Col className="text-center">
                </Col>
            </Row>
        </>
    )
}

export default List;