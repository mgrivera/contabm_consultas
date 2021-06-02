
import { Meteor } from 'meteor/meteor';

import React, { useState } from "react";
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';
import { FormGroup, FormControl } from 'react-bootstrap';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

function FieldGroup({ id, label, help, ...props }) {
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

const SignIn_Modal = ({ showModal, setShowModal, setSpecialAction }) => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false }); 
    const [formValues, setFormValues] = useState({ userId: '', password: '' }); 

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const cancelSignOut = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setShowModal(false);
    }

    const signIn = () => {
        // hacemos el sign out y cerramos el modal 
        setShowSpinner(true);

        const result = validarSignIn(formValues); 

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

        Meteor.loginWithPassword(formValues.userId, formValues.password, (error) => {
            if (error) {
                const message = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar el sign in. El mensaje de error obtenido es: 
                              ${error.message}`,
                    show: true
                }
                setMessage(message);
                setShowSpinner(false);
            } else {
                setShowSpinner(false);
                setShowModal(false);
            }
        })
    }

    const createNewAccount = () => {
        setSpecialAction("createNewAccount");
        setShowModal(false);
    }

    const forgotUserPassword = () => {
        setSpecialAction("forgotUserPassword");
        setShowModal(false);
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} size="sm" backdrop="static">

                <Modal.Body>

                    {showSpinner && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}

                    <FieldGroup
                        id="userId"
                        name="userId"
                        value={formValues.userId}
                        type="text"
                        placeholder="Nombre del usuario o su E-mail"
                        onChange={(e) => onInputChange(e)} 
                        style={{ marginTop: '5px' }} />

                    <FieldGroup
                        id="password"
                        name="password"
                        value={formValues.password}
                        type="password"
                        placeholder="Password"
                        onChange={(e) => onInputChange(e)} />

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => signIn()} size="sm">
                        Tomar una sesión (sign in)
                    </Button>
                    <br />
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => cancelSignOut()} size="sm">
                        Cancelar
                    </Button>
                    <hr />
                    <Button variant="link"
                            style={{ fontSize: 'small', fontStyle: 'italic', paddingTop: '0' }} 
                            onClick={() => createNewAccount()} size="sm">
                        Crear nueva cuenta de usuario
                    </Button>
                    <Button variant="link"
                            style={{ fontSize: 'small', fontStyle: 'italic', paddingTop: '0' }} 
                            onClick={() => forgotUserPassword()} size="sm">
                        Olvidó su password? 
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

SignIn_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default SignIn_Modal; 

const validarSignIn = (formValues) => { 

    if (!formValues.userId) {
        return {
            error: true,
            message: 'Ud. debe indicar su nombre de usuario o su E-mail.'
        }
    }

    if (!formValues.password) {
        return {
            error: true,
            message: 'Ud. debe indicar su password.'
        }
    }

    return {
        error: false
    }
}