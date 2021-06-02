
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

const ChangeUserName_Modal = ({ showModal, setShowModal, setSpecialAction }) => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });
    const [formValues, setFormValues] = useState({ userName: '' });

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const cancelChangingUserName = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setSpecialAction(null);         // dejamos el special action (cambiar userName)
        setShowModal(false);
    }

    const changeUserName = () => {
        // hacemos el sign out y cerramos el modal 
        setShowSpinner(true);

        const result = validarUserName(formValues);

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

        if (!userId) {
            // ésto nunca debe en realidad ocurrir; este modal solo debe abrirse cuando el usuario ha hecho un login 
            const message = {
                type: 'warning',
                message: `Ud. debe hacer un <em>login</em> antes de intentar cambiar el nombre de su usuario.`,
                show: true
            }
            setMessage(message);
            setShowSpinner(false);

            return;
        }

        Meteor.call('changeUserName', userId, formValues.userName, (err, result) => {

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
                        id="userName"
                        name="userName"
                        value={formValues.userName}
                        type="text"
                        placeholder="Nombre del usuario (ej: manuel)"
                        onChange={(e) => onInputChange(e)} 
                        style={{ marginTop: '5px' }} />

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => changeUserName()} size="sm">
                        Cambiar nombre del usuario
                    </Button>
                    <br />
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => cancelChangingUserName()} size="sm">
                        Cancelar
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

ChangeUserName_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default ChangeUserName_Modal;

const validarUserName = (formValues) => {

    if (!formValues.userName) {
        return {
            error: true,
            message: 'Ud. debe indicar un nombre de usuario.'
        }
    }

    return {
        error: false
    }
}