
import { Meteor } from 'meteor/meteor';

import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

import { Container, Navbar, Nav } from 'react-bootstrap';
import { Question, HouseFill } from 'react-bootstrap-icons';
import { Row, Col } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

const columns = [
    { key: 'nombreCompania', name: 'Compañía', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false },
    { key: 'nombreMes', name: 'Mes', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false, width: 100 },
    { key: 'año', name: 'Año', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false, cellClass: 'text-center', width: 80 },
    { key: 'fecha', name: 'Fecha', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false, cellClass: 'text-center' },
    { key: 'manAuto', name: 'Man/Auto', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false, cellClass: 'text-center', width: 100 },
    { key: 'usuario', name: 'Usuario', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false }
];

const CierresContables = () => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [loadCompaniaContabSeleccionada, setLoadCompaniaContabSeleccionada] = useState(false); 
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [companiaContabSeleccionada, setCompaniaContabSeleccionada] = useState({});
    const [items, setItems] = useState([]);

    // para leer la compania Contab seleccionada 
    useEffect(() => {
        setLoadCompaniaContabSeleccionada(true);

        Meteor.call('leerCompaniaContabSeleccionada', (err, result) => {

            if (err) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                    show: true
                }
                setMessage(msg);
                setLoadCompaniaContabSeleccionada(false);

                return;
            }

            if (result.error) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${result.message}`,
                    show: true
                }
                setMessage(msg);
                setLoadCompaniaContabSeleccionada(false);

                return;
            }

            setCompaniaContabSeleccionada(result.companiaContabSeleccionada);

            setMessage(result.message);
            setLoadCompaniaContabSeleccionada(false);
        })
    }, [])

    useEffect(() => {
        setShowSpinner(true);

        Meteor.call('leerUltimoMesCerradoContab', (err, result) => {

            if (err) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                    show: true
                }
                setMessage(msg);
                setShowSpinner(false);

                return;
            }

            if (result.error) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${result.message}`,
                    show: true
                }
                setMessage(msg);
                setShowSpinner(false);

                return;
            }

            setItems(result.items);

            const msg = {
                type: 'primary',
                message: result.message,
                show: true
            }

            setMessage(msg);
            setShowSpinner(false);
        })
    }, [])

    const loading = showSpinner || loadCompaniaContabSeleccionada;

    return (
        <>
            <Container>
                <Navbar className="navbar" style={{ backgroundColor: 'white' }} expand="md">
                    <Navbar.Brand href="/">
                        <Link className='text-link-menu' to="/">
                            <span style={{ padding: '10px' }}><em>contabm consultas / contab / Cierres de contabilidad</em></span>
                        </Link><br />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text>
                            {companiaContabSeleccionada?.nombre && <span><em>{companiaContabSeleccionada.nombre}</em></span>}
                        </Navbar.Text>
                        <Nav.Link href="https://sites.google.com/view/contabm-consultas/home/contab/cierres-de-contabilidad" target="_blank">
                            <Question className="bootstrap-icon" size={26} />
                        </Nav.Link>
                        <Link className='text-link' to="/"><HouseFill className="bootstrap-icon" size={26} /></Link><br />
                    </Navbar.Collapse>
                </Navbar>

                <div style={{ border: '1px lightGray solid', minHeight: 'calc(100vh - 80px)', borderRadius: '10px', padding: '15px' }}>

                    <Row style={{ marginTop: '15px' }}>
                        <Col>
                            {loading && <Spinner />}
                            {message.show && <Message message={message} setMessage={setMessage} />}
                        </Col>
                    </Row>

                    <Row style={{ marginTop: '15px' }}>
                        <Col></Col>
                        <Col sm={10}>
                            <div className="div-react-data-grid">
                                <ReactDataGrid
                                    columns={columns}
                                    rowGetter={i => items[i]}
                                    rowsCount={items.length}
                                    minHeight={400}
                                />
                            </div>
                        </Col>
                        <Col></Col>
                    </Row>

                </div>
            </Container>
        </>
    )
}

export default CierresContables;