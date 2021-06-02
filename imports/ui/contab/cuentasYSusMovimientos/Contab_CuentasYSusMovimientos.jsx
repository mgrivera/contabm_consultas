
import React from 'react';
import { Link, useRouteMatch, Route } from "react-router-dom";

import { Container, Navbar, Nav } from 'react-bootstrap';

import Filter from './Filter';
import List from './List';

import { Question, HouseFill } from 'react-bootstrap-icons';

const Contab_CuentasYSusMovimientos = () => {

    const { url } = useRouteMatch();

    return (
        <>
            <Container>
                <Navbar className="navbar" style={{ backgroundColor: 'white' }} expand="md">
                    <Navbar.Brand href="/">
                        <Link className='text-link-menu' to="/">
                            <span style={{ padding: '10px' }}><em>contabm consultas / contab / Cuentas y sus movimientos</em></span>
                        </Link><br />
                    </Navbar.Brand>
                    
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                    <Navbar.Collapse className="justify-content-end">
                        <Nav.Link href="#link"><Question className="bootstrap-icon" size={26} /></Nav.Link>
                        <Link className='text-link' to="/"><HouseFill className="bootstrap-icon" size={26} /></Link><br />
                    </Navbar.Collapse>
                </Navbar>

                <Container style={{ border: '1px lightGray solid', minHeight: 'calc(100vh - 80px)', borderRadius: '0 0 10px 10px' }}>
                    <Route exact path={`${url}/filter`}><Filter /></Route>
                    <Route exact path={`${url}/list`}><List /></Route>

                    {/* inicialmente, cuando se llega desde Home, mostramos Filter  */}
                    <Route exact path={`${url}`}><Filter /></Route>
                </Container>
            </Container>
        </>
    )
}

export default Contab_CuentasYSusMovimientos;