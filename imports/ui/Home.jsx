
import React from 'react'; 
import { Link } from "react-router-dom";

import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { Jumbotron, Container, Row, Col } from 'react-bootstrap';
import { Question } from 'react-bootstrap-icons';

import MeteorLogin from '/imports/ui/generales/meteorLogin/MeteorLogin';

const Home = () => {

    return (
        <>
            <Container>

                <Navbar className="navbar" style={{ backgroundColor: 'white', marginBottom: '20px' }} expand="md">
                    <Navbar.Brand >
                        <Link to="/">
                            <img className="img-responsive" src={'/images/logo.png'} alt="logo" />
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mr-auto">
                            <Nav.Link href="#link">Bancos</Nav.Link>

                            <NavDropdown title="Contab" id="basic-nav-dropdown">
                                <Link className='text-link-menu' to="/contab/movimientoCuentasContables">
                                    <span style={{ padding: '10px' }}>Movimiento de cuentas contables</span>
                                </Link><br />

                                <Link className='text-link-menu' to="/contab/estadoGyP">
                                    <span style={{ padding: '10px' }}>Estado de ganancias y pérdidas (GyP)</span>
                                </Link><br />
                                
                                <NavDropdown.Divider />

                                <Link className='text-link-menu' to="/contab/cierresContables">
                                    <span style={{ padding: '10px' }}>Cierres contables</span>
                                </Link><br />
                            </NavDropdown>

                            <Nav.Link href="#link">Nómina</Nav.Link>

                            <NavDropdown title="Generales" id="basic-nav-dropdown">
                                <Link className='text-link-menu' to="/generales/seleccionarUnaCompaniaContab">
                                    <span style={{ padding: '10px' }}>Seleccionar una compañía</span>
                                </Link><br />
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>

                    <Navbar.Collapse className="justify-content-end">
                        <Nav.Link href="https://sites.google.com/view/contabm-consultas/home" target="_blank" >
                            <Question className="bootstrap-icon" size={26} />
                        </Nav.Link>
                    </Navbar.Collapse>
                </Navbar>

                <Jumbotron fluid style={{ minHeight: 'calc(100vh - 160px)' }} className="jumbotron">
                    <Container>
                    </Container>
                </Jumbotron>

                <Row >
                    <Col className="text-center">
                        
                    </Col>
                    <Col className="text-center">
                        <MeteorLogin></MeteorLogin>
                    </Col>
                    <Col className="text-center">
                        <span style={{ fontStyle: 'italic' }}>smr.software</span>
                    </Col>
                </Row>

            </Container>
        </>
    )
}

export default Home;