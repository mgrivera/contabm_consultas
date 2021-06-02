
import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import { useParams } from "react-router-dom";
import { Accounts } from 'meteor/accounts-base';

import { Link } from "react-router-dom";
import { Container, Navbar, Nav } from 'react-bootstrap';
import { FormGroup, FormControl } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import { Question, HouseFill } from 'react-bootstrap-icons';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

function FieldGroup({ id, ...props }) {
    return (
        <FormGroup controlId={id}>
            <FormControl {...props} size="sm" />
        </FormGroup>
    );
}

FieldGroup.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    help: PropTypes.string,
};

const ResetUserPassword = () => {

    const { token } = useParams();

    const [formValues, setFormValues] = useState({ password: '', password2: '' });
    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const resetPassword = () => {

        setShowSpinner(true);

        const result = validarInputValues(formValues);

        if (result.error) {
            const message = {
                type: 'warning',
                message: `${result.message}`,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);

            return;
        }

        // con el siguiente método cambiamos el password del usuario al cual corresponde el token 
        Accounts.resetPassword(token, formValues.password, (err) => { 
            
            if (err) {
                const message = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                    show: true
                }
                setMessage(message);
                setShowSpinner(false);

                return;
            }

            const user = Meteor.user({ fields: { username: 1, emails: 1 } });

            if (!user) {
                // ésto no debe nunca ocurrir, pues el usuario cambió su password y no hubo un error (justo arriba) 
                const message = {
                    type: 'danger',
                    message: `Error: (inespeerado) al intentar obtener los datos del usuario. <br />
                              No hemos podido leer los datos del usuario. `, 
                    show: true
                }

                setMessage(message);
                setShowSpinner(false);

                return;
            }

            const userName = user && user.username ? user.username : user.emails[0].address; 

            const message = {
                type: 'primary',
                message: `Ok, su password ha sido cambiado en forma satisfactoria.<br />
                          Además, ahora hemos hecho un <em>login</em> para el usuario (${userName}) y ahora tiene una sesión en el programa. `,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);
        })
    }

    return (
        <Container>
            <Navbar className="navbar" style={{ backgroundColor: 'white' }} expand="md">
                <Navbar.Brand href="/">
                    <Link className='text-link-menu' to="/">
                        <span style={{ padding: '10px' }}><em>contabm consultas / Reset password</em></span>
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

                <div style={{ border: '1px blue solid', borderRadius: '10px', padding: '15px', width: '350px' }}>
                    <p>
                        Indique un nuevo password y haga un click en <em>Cambiar (reset) password</em>
                    </p>

                    <FieldGroup
                        id="password"
                        name="password"
                        value={formValues.password}
                        type="password"
                        placeholder="Password"
                        onChange={(e) => onInputChange(e)} />

                    <FieldGroup
                        id="password2"
                        name="password2"
                        value={formValues.password2}
                        type="password"
                        placeholder="Repita el password"
                        onChange={(e) => onInputChange(e)} />

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => resetPassword()} size="sm">
                        Cambiar (reset) password
                    </Button>
                </div>
            </div>
        </Container>
    );
}

const validarInputValues = (formValues) => {

    if (!formValues.password || !formValues.password2) {
        return {
            error: true,
            message: 'Ud. debe indicar los valores que se requieren.'
        }
    }

    if (formValues.password != formValues.password2) {
        return {
            error: true,
            message: 'Ambos passwords deben coincidir.'
        }
    }

    return {
        error: false
    }
}

export default ResetUserPassword;