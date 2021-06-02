
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

// NOTA: esta función es prácticamente igual a ResetUserPassword. La única diferencia es que cuando el usuario hace un 
// reset tiene una sesión; mientras que cuando hace un forgot no la tiene y debe indicar un Email 

const ForgotUserPassword_Modal = ({ showModal, setShowModal, setSpecialAction }) => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [formValues, setFormValues] = useState({ userEmail: '' });

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const closeModal = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setSpecialAction(null);         // dejamos el special action (cambiar userName)
        setShowModal(false);
    }

    const sendResetPasswordEmail = () => {

        setShowSpinner(true);

        const email = formValues.userEmail; 

        if (!validateEmail(email)) {
            const message = {
                type: 'warning',
                message: `Aparentemente, la dirección de correo indicada no es válida. Por favor revise.`,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);

            return;
        }

        // el usuario no tiene una sesión; está intentando obtener una pero olvidó su password; 
        // debemos saber cual es el usuario *antes* de intentar enviar el email para hacer el reset password 
        Meteor.call('findUserByEmail', email, (err, result) => {

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
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${result.message}`,
                    show: true
                }
                setMessage(message);
                setShowSpinner(false);

                return;
            }

            // Ok, el método trajo el usuario 
            // intentamos leer el id y el email del usuario 
            const user = result.user;
            const userId = user && user._id ? user._id : "";
            const userEmail = user && user.emails && user.emails.length ? user.emails[0].address : "";

            Meteor.call('sendResetPasswordEmail', userId, userEmail, (err, result) => {

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
                        message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${result.message}`,
                        show: true
                    }
                    setMessage(message);
                    setShowSpinner(false);

                    return;
                }

                const message = {
                    type: 'success',
                    message: result.message,
                    show: true
                }

                setMessage(message);
                setShowSpinner(false);
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
                        id="userEmail"
                        name="userEmail"
                        value={formValues.userEmail}
                        type="email"
                        placeholder="Email del usuario"
                        onChange={(e) => onInputChange(e)}
                        style={{ marginTop: '5px' }} />

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => sendResetPasswordEmail()} size="sm">
                        Email para crear nuevo password
                    </Button>
                    <br />
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => closeModal()} size="sm">
                        Salir
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

ForgotUserPassword_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default ForgotUserPassword_Modal;

function validateEmail(value) {

    if (!value) {
        return false;
    }

    const mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!value.match(mailformat)) {
        return false;
    }

    return true;
}