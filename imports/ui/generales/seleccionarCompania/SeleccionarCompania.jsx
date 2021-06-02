
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

import { Container, Navbar, Nav } from 'react-bootstrap';
import { Question, HouseFill } from 'react-bootstrap-icons';
import { Row, Col } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Companias } from '/imports/collections/companias';

const columns = [
    { key: 'nombre', name: 'Compañía', resizable: true, sortable: true, sortDescendingFirst: false, frozen: false },
];

const SeleccionarCompaniaContab = () => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [companias, setCompanias] = useState([]); 

    const catalogosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('companias');
        return !handle.ready();
    }, []);

    useEffect(() => {
        setShowSpinner(true);

        const userId = Meteor.userId(); 

        if (!userId) { 
            // no hay un usuario con una sesión (???!!!) 
            const msg = {
                type: 'danger',
                message: `Error: el usuario debe tener una sesión (estar autenticado). Por favor revise.`,
                show: true
            }

            setMessage(msg);
            setShowSpinner(false); 

            return; 
        }

        // userID, companiaID
        const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: userId });      

        Meteor.call('leerCompaniasContab', (err, result) => {

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

            const companias = result.companias; 
            let msg = {}; 

            // si el usuario ya tenía una compañía seleccionada (casi siempre), la leemos desde el array que regresó el method y mostramos su nombre
            if (companiaSeleccionada) {
                // lamentablemente, tenemos que buscar el numero (pk en sql) de la compañía en el collection de Compañías
                const companiaMongo = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: 1 } });

                if (companiaMongo?.numero) {
                    const companiaSql = companias.find(x => x.numero === companiaMongo.numero);

                    if (companiaSql?.nombre) {
                        // Ok, finalmente tenemos la compañía que el usuario había seleccionado ... la mostramos 
                        const message = result.message + '<br />' + `<b><em>${companiaSql.nombre}</em></b> está ahora seleccionada.`;
                        msg = { type: 'primary', message, show: true }; 
                    } else {
                        const message = result.message + '<br />' + `Ahora no hay una compañía seleccionada.`;
                        msg = { type: 'danger', message, show: true }; 
                    }
                }

            }

            setCompanias(companias); 

            setMessage(msg);
            setShowSpinner(false);
        })
    }, [])

    const onRowClick = (index) => {
        
        setShowSpinner(true);

        const userId = Meteor.userId();

        if (!userId) {
            // no hay un usuario con una sesión (???!!!) 
            const msg = {
                type: 'danger',
                message: `Error: el usuario debe tener una sesión (estar autenticado). Por favor revise.`,
                show: true
            }

            setMessage(msg);
            setShowSpinner(false);

            return;
        }

        const companiaSeleccionada = Companias.findOne({ numero: companias[index].numero });

        Meteor.call('seleccionarCompaniaContab', userId, companiaSeleccionada._id, (err, result) => {

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

            const companiaMongo = Companias.findOne(companiaSeleccionada._id);
            let msg = {};

            if (companiaMongo?.nombre) {
                // Ok, tenemos la compañía que el usuario seleccionó ... la mostramos 
                const message = result.message + '<br />' + `<b><em>${companiaMongo.nombre}</em></b> está ahora seleccionada.`;

                msg = {
                    type: 'primary',
                    message,
                    show: true
                }
            } else {
                const message = result.message + '<br />' +
                    `La verdad parece que hubo un error al ejecutar la función.<br />`;
                    `Ahora no hay una compañía seleccionada (???!!!).`;

                msg = {
                    type: 'danger',
                    message,
                    show: true
                }
            }

            setMessage(msg);
            setShowSpinner(false);
        })
    }

    return (
        <>
            <Container>
                <Navbar className="navbar" style={{ backgroundColor: 'white' }} expand="md">
                    <Navbar.Brand href="/">
                        <Link className='text-link-menu' to="/">
                            <span style={{ padding: '10px' }}><em>contabm consultas / generales / Seleccionar compañía</em></span>
                        </Link><br />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                    <Navbar.Collapse className="justify-content-end">
                        <Nav.Link href="#link"><Question className="bootstrap-icon" size={26} /></Nav.Link>
                        <Link className='text-link' to="/"><HouseFill className="bootstrap-icon" size={26} /></Link><br />
                    </Navbar.Collapse>
                </Navbar>

                <div style={{ border: '1px lightGray solid', minHeight: 'calc(100vh - 80px)', borderRadius: '10px', padding: '15px' }}>

                    <Row style={{ marginTop: '15px' }}>
                        <Col>
                            {(showSpinner || catalogosLoading) && <Spinner />}
                            {message.show && <Message message={message} setMessage={setMessage} />}
                        </Col>
                    </Row>

                    <Row style={{ marginTop: '15px' }}>
                        <Col></Col>
                        <Col sm={5}>
                            <div className="div-react-data-grid">
                                <p>
                                    Haga <em>click</em> en alguna de las compañías para seleccionarla.
                                </p>
                                <ReactDataGrid
                                    columns={columns}
                                    rowGetter={i => companias[i]}
                                    rowsCount={companias.length}
                                    onRowClick={onRowClick}
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

export default SeleccionarCompaniaContab;