
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Accounts } from 'meteor/accounts-base';

import { Link } from "react-router-dom";
import { Container, Navbar, Nav } from 'react-bootstrap';

import { Question, HouseFill } from 'react-bootstrap-icons';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

const EmailVerificationMessage = () => {

    const { token } = useParams();

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });

    useEffect(() => {
        setShowSpinner(true);

        Accounts.verifyEmail(token, (error) => {
            if (error) {
                const message = {
                    type: 'warning',
                    message: `Error: ha ocurrido un error al intentar validar su dirección de correo. <br /> 
                              El mensaje del error obtenido es: ${error.message ? error.message : error} <br /><br /> 
                              Por favor revise e inténtelo nuevamente. 
                              `,
                    show: true
                }
                setMessage(message);
                setShowSpinner(false);
            } else {
                const message = {
                    type: 'primary',
                    message: `Ok, su dirección de correo ha sido verificada en forma satisfactoria. <br />
                              Gracias por verificar su dirección de correo.`,
                    show: true
                }
                setMessage(message);
                setShowSpinner(false);
            }
        });
    }, [])
    
    return (
        <Container>
            <Navbar className="navbar" style={{ backgroundColor: 'white' }} expand="md">
                <Navbar.Brand href="/">
                    <Link className='text-link-menu' to="/">
                        <span style={{ padding: '10px' }}><em>contabm consultas / Dirección de correo verificada</em></span>
                    </Link><br />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse className="justify-content-end">
                    <Nav.Link href="#link"><Question className="bootstrap-icon" size={26} /></Nav.Link>
                    <Link className='text-link' to="/"><HouseFill className="bootstrap-icon" size={26} /></Link><br />
                </Navbar.Collapse>
            </Navbar>

            <div style={{ border: '1px lightGray solid', minHeight: 'calc(100vh - 80px)', borderRadius: '10px', padding: '15px' }}>
                {showSpinner && <Spinner />}
                {message.show && <Message message={message} setMessage={setMessage} />}
                <br /> 
                <h5><em>Contabm Consultas</em> - Dirección de correo verificada</h5>
            </div>
        </Container>
    );
}

export default EmailVerificationMessage; 