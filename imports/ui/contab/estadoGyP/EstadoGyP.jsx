
import { Meteor } from 'meteor/meteor';

import React, { useState, useEffect } from 'react';

import { Switch, Link, useRouteMatch, Route } from "react-router-dom";
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Row, Col } from 'react-bootstrap';

import Filter from './Filter';
import List from './List';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

import { Question, HouseFill } from 'react-bootstrap-icons';

const MovimientoDeCuentasContables = () => {

    const { url } = useRouteMatch();

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [loadCompaniaContabSeleccionada, setLoadCompaniaContabSeleccionada] = useState(false);
    const [companiaContabSeleccionada, setCompaniaContabSeleccionada] = useState({});

    useEffect(() => {
        setShowSpinner(false);
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
                setLoadCompaniaContabSeleccionada(false);
                setShowSpinner(false);

                return;
            }

            setCompaniaContabSeleccionada(result.companiaContabSeleccionada);

            setMessage(result.message);
            setLoadCompaniaContabSeleccionada(false);
        })
    }, [])

    const loading = showSpinner || loadCompaniaContabSeleccionada;

    return (
        <>
            <Container>
                <Navbar className="navbar" style={{ backgroundColor: 'white' }} expand="md">
                    <Navbar.Brand href="/">
                        <Link className='text-link-menu' to="/">
                            <span style={{ padding: '10px' }}><em>contabm consultas / contab / Estado de ganancias y pérdidas (GyP)</em></span>
                        </Link><br />
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text>
                            {companiaContabSeleccionada?.nombre && <span><em>{companiaContabSeleccionada.nombre}</em></span>}
                        </Navbar.Text>
                        <Nav.Link href="#link"><Question className="bootstrap-icon" size={26} /></Nav.Link>
                        <Link className='text-link' to="/"><HouseFill className="bootstrap-icon" size={26} /></Link><br />
                    </Navbar.Collapse>
                </Navbar>

                <Container style={{ border: '1px lightGray solid', minHeight: 'calc(100vh - 80px)', borderRadius: '0 0 10px 10px' }}>

                    <Row>
                        <Col>
                            <div style={{ marginTop: '10px' }}>
                                {loading && <Spinner />}
                                {message.show && <Message message={message} setMessage={setMessage} />}
                            </div>
                        </Col>
                    </Row>

                    <Switch>
                        <Route exact path={`${url}/filter`}>
                            <Filter />
                        </Route>

                        <Route exact path={`${url}/list`}>
                            <List companiaContabSeleccionada={companiaContabSeleccionada} />
                        </Route>

                        {/* inicialmente, cuando se llega desde Home, mostramos Filter  */}
                        <Route exact path={`${url}`}>
                            <Filter />
                        </Route>
                    </Switch>
                </Container>
            </Container>
        </>
    )
}

export default MovimientoDeCuentasContables;