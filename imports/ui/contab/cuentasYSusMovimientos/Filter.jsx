
import React from 'react';
import { useHistory, useRouteMatch } from "react-router-dom";

import { Row, Col, Button } from 'react-bootstrap';

const Filter = () => {

    const { url } = useRouteMatch();
    const history = useHistory();

    const aplicarFiltro = () => {

        // para ir al route '.../list'
        let url2 = url.toLowerCase();

        if (url2.includes("filter")) {
            url2 = url2.replace("filter", "list");
        } else {
            url2 = url2 + "/list";
        }
        
        history.push(url2);
    }

    return (
        <>
            <br /><br /><br /><br />
            <Row className="align-items-center">
                <Col className="text-center">
                    <Button variant="light" size="sm">Limpiar filtro</Button>
                </Col>
                <Col></Col>
                <Col></Col>
                <Col className="text-center">
                    <Button variant="primary" size="sm" onClick={aplicarFiltro}>Aplicar filtro</Button>
                </Col>
            </Row>
        </>
    )
}

export default Filter;