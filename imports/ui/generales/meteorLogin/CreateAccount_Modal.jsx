
import { Meteor } from 'meteor/meteor';

import React, { useState } from "react";
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';
import { FormGroup, FormControl } from 'react-bootstrap';

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

const CreateAccount_Modal = ({ showModal, setShowModal, setSpecialAction }) => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [formValues, setFormValues] = useState({ userName: '', userEmail: '', password: '', password2: '' });

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const cancelCreatingNewAccount = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setSpecialAction(null);         // dejamos el special action (cambiar userName)
        setShowModal(false);
    }

    const createNewAccount = () => {
        // hacemos el sign out y cerramos el modal 
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

        const userId = Meteor.userId();

        if (userId) {
            // ésto nunca debe en realidad ocurrir; este modal solo debe abrirse cuando el usuario ha hecho un logout 
            const message = {
                type: 'warning',
                message: `Ud. debe hacer un logout antes de intentar agregar una nueva cuenta de usuario.`,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);

            return;
        }

        Meteor.call('createNewAccount', formValues.userName, formValues.userEmail, formValues.password, (err, result) => {

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

            if (result.error) {
                const message = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar crear la cuenta de usuario: <br />
                              ${result.message}`,
                    show: true
                }
                setMessage(message);
                setShowSpinner(false);

                return; 
            }
        
            // la cuenta de usuario fue creada en el servidor; ahora hacemos un login para que el usuario 
            // no tenga que hacerlo 
            Meteor.loginWithPassword(formValues.userName, formValues.password, (err) => { 

                if (err) {
                    const message = {
                        type: 'danger',
                        message: `Error: ha ocurrido un error al intentar crear la cuenta de usuario: <br />
                            ${err.message}`,
                        show: true
                    }
                    setMessage(message);
                    setShowSpinner(false);

                    result; 
                }

                setShowSpinner(false);
                setShowModal(false);
                setSpecialAction(null);         // dejamos el special action (cambiar userName)
            })

        })
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} size="sm" backdrop="static">

                <Modal.Body>

                    {showSpinner && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}

                    <FieldGroup
                        id="userName"
                        name="userName"
                        value={formValues.userName}
                        type="text"
                        placeholder="Nombre del usuario (ej: manuel)"
                        onChange={(e) => onInputChange(e)}
                        style={{ marginTop: '5px' }} />

                    <FieldGroup
                        id="userEmail"
                        name="userEmail"
                        value={formValues.userEmail}
                        type="email"
                        placeholder="E-mail"
                        onChange={(e) => onInputChange(e)} />

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

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => createNewAccount()} size="sm">
                        Crear nueva cuenta de usuario
                    </Button>
                    <br />
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => cancelCreatingNewAccount()} size="sm">
                        Cancelar
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

CreateAccount_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default CreateAccount_Modal;

const validarInputValues = (formValues) => {

    if (!formValues.userName || !formValues.userEmail || !formValues.password || !formValues.password2) {
        return {
            error: true,
            message: 'Ud. debe indicar los valores que se requieren.'
        }
    }

    if (!validateEmail(formValues.userEmail)) {
        return {
            error: true,
            message: 'Aparentemente, el correo indicado no es válido. Por favor revise.'
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

function validateEmail(value) {
    const mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!value.match(mailformat)) {
        return false;
    }

    return true; 
}