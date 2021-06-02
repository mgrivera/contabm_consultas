
import { Meteor } from 'meteor/meteor';

import React, { useState } from "react";
import PropTypes from 'prop-types';

import { Modal, Button } from 'react-bootstrap';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

const VerifyUserEmail_Modal = ({ showModal, setShowModal, setSpecialAction }) => {

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false });

    const closeModal = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setSpecialAction(null);         // dejamos el special action (cambiar userName)
        setShowModal(false);
    }

    const verifyUserEmail = () => {
        // hacemos el sign out y cerramos el modal 
        setShowSpinner(true);

        Meteor.call('sendVerificationLink', (err, result) => {

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
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} size="sm" backdrop="static">

                <Modal.Body>

                    {showSpinner && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}

                    <Button variant="primary" style={{ width: "100%" }} onClick={() => verifyUserEmail()}>
                        Verificar dirección de correo del usuario
                    </Button>
                    <br />
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => closeModal()}>
                        Salir
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

VerifyUserEmail_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default VerifyUserEmail_Modal;