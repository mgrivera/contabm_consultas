
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useRouteMatch, Link } from "react-router-dom";

import { Row, Col } from 'react-bootstrap';
import { Navbar } from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';

import { Filtros } from '/imports/collections/filtros';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

import CuentasContables from './CuentasContables';
import Movimientos from './Movimientos';
import Transformar from './Transformar'; 

const List = ({ companiaContabSeleccionada }) => {

    const { url } = useRouteMatch();
    const [filtro, setFiltro] = useState({});

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });

    const [currentTab, setCurrentTab] = useState('cuentas');

    const [selectedCuentaContable, setSelectedCuentaContable] = useState({});

    // este es el array para el grid que está en el tab Transformar; el array se inicializa en el tab (component) CuentasContables 
    const [transformarGridData, setTransformarGridData] = useState([]); 

    const regresarAlFiltro = () => {
        // para ir al route '.../filter' cuando el usuario hace un click en Regresar 
        let url2 = url.toLowerCase();

        if (url2.includes("list")) {
            url2 = url2.replace("list", "filter");
        } else {
            url2 = url2 + "/filter";
        }

        return url2;
    }

    // --------------------------------------------------------------------------------
    // para ejecutar el sub 'filtros' 
    const filtrosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('filtros', Meteor.userId(), "consultas_estadoGyP");
        return !handle.ready();
    }, []);

    // --------------------------------------------------------------------------------
    // para leer el filtro que el usuario usó antes 
    useEffect(() => {
        if (filtrosLoading) {
            // este código necesita que el subscription 'filtro' se haya completado 
            return;
        }

        const filtroExiste = Filtros.find({ nombre: 'consultas_estadoGyP', userId: Meteor.userId() }).count();

        if (filtroExiste) {
            const filtro = Filtros.findOne({ nombre: 'consultas_estadoGyP', userId: Meteor.userId() });
            setFiltro(filtro.filtro);
        }
    }, [filtrosLoading])

    const loading = filtrosLoading || showSpinner;

    return (
        <>
            <Navbar bg="dark" variant="dark" style={{ marginRight: '-15px', marginLeft: '-15px', fontSize: '14px', maxHeight: '30px' }}>
                <Navbar.Collapse className="justify-content-end">
                    <Link className='text-link-menu' to={regresarAlFiltro}>
                        <span style={{ padding: '10px' }}>Regresar</span>
                    </Link><br />
                </Navbar.Collapse>
            </Navbar>

            <Row style={{ marginTop: '15px' }}>
                <Col>
                    {loading && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}
                </Col>
            </Row>

            <Tabs
                id="movimientoDeCuentasContablesTab"
                activeKey={currentTab}
                onSelect={(k) => setCurrentTab(k)}
            >
                <Tab eventKey="cuentas" title="Cuentas">
                    <CuentasContables filtrosLoading={filtrosLoading}
                        ciaContabId={companiaContabSeleccionada.numero_sql}
                        setMessage={setMessage}
                        setShowSpinner={setShowSpinner}
                        setCurrentTab={setCurrentTab}
                        filtro={filtro} 
                        setTransformarGridData={setTransformarGridData} />
                </Tab>
                <Tab eventKey="transformar" title="Transformar">
                    <Transformar transformarGridData={transformarGridData} 
                                 setTransformarGridData={setTransformarGridData}
                                 setMessage={setMessage}
                                 setShowSpinner={setShowSpinner}
                                 setCurrentTab={setCurrentTab}
                                 setSelectedCuentaContable={setSelectedCuentaContable} 
                                 ciaContabId={companiaContabSeleccionada.numero_sql}/>
                </Tab>
                <Tab eventKey="movimientos" title="Movimientos">
                    <Movimientos selectedCuentaContable={selectedCuentaContable}
                        mes={filtro.mes}
                        ano={filtro.ano}
                        ciaContabId={companiaContabSeleccionada.numero_sql}
                        setMessage={setMessage}
                        setShowSpinner={setShowSpinner} />
                </Tab>
            </Tabs>
        </>
    )
}

List.propTypes = {
    companiaContabSeleccionada: PropTypes.object.isRequired
};

export default List;