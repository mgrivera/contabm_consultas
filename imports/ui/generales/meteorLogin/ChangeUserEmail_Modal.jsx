
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

const ChangeUserEmail_Modal = ({ showModal, setShowModal, setSpecialAction }) => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [formValues, setFormValues] = useState({ userEmail: '' });

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const cancelChangingUserEmail = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setSpecialAction(null);         // dejamos el special action (cambiar userName)
        setShowModal(false);
    }

    const changeUserEmail = () => {
        // hacemos el sign out y cerramos el modal 
        setShowSpinner(true);

        if (!validateEmail(formValues.userEmail)) {
            const message = {
                type: 'warning',
                message: `Aparentemente, la dirección de correo indicada no es válida. Por favor revise.`,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);

            return;
        }

        const userId = Meteor.userId();

        if (!userId) {
            // ésto nunca debe en realidad ocurrir; este modal solo debe abrirse cuando el usuario ha hecho un login 
            const message = {
                type: 'warning',
                message: `Ud. debe hacer un <em>login</em> antes de intentar cambiar la dirección de correo de su usuario.`,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);

            return;
        }

        Meteor.call('changeEmail', userId, formValues.userEmail, (err, result) => {

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

            setShowSpinner(false);
            setShowModal(false);
            setSpecialAction(null);         // dejamos el special action (cambiar userName)
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
                        placeholder="Nueva dirección de e-mail"
                        onChange={(e) => onInputChange(e)}
                        style={{ marginTop: '5px' }} />

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => changeUserEmail()} size="sm">
                        Cambiar dirección de correo del usuario
                    </Button>
                    <br />
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => cancelChangingUserEmail()} size="sm">
                        Cancelar
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

ChangeUserEmail_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default ChangeUserEmail_Modal;

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