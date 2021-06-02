
import { Meteor } from 'meteor/meteor'; 

import React, { useState } from "react"; 

import { Modal, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

const SignOut_Modal = ({ showModal, setShowModal, setSpecialAction }) => { 

    const [showSpinner, setShowSpinner] = useState(false);
    const [message, setMessage] = useState({ type: '', message: '', show: false })

    const cancelSignOut = () => {
        // simplemente cerramos el modal, sin hacer el sign out 
        setShowModal(false);
    }

    const signOut = () => {
        // hacemos el sign out y cerramos el modal 
        setShowSpinner(true); 

        Meteor.logout((error) => { 
            if (error) { 
                const message = { 
                    type: 'danger', 
                    message: `Error: ha ocurrido un error al intentar ejecutar el logout. El mensaje de error obtenido es: 
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

    const changeUserName = () => {
        setSpecialAction("changeUserName");
        setShowModal(false);
    }

    const changeUserEmail = () => {
        setSpecialAction("changeUserEmail");
        setShowModal(false);
    }

    const verificarUserEmail = () => {
        setSpecialAction("verificarUserEmail");
        setShowModal(false);
    }

    const resetUserPassword = () => {
        setSpecialAction("resetUserPassword");
        setShowModal(false);
    }

    return (
        <>
            {/* backdrop='static' impide que se cierre el modal si el usuario hace un click fuera del mismo  */}
            <Modal show={showModal} size="sm" backdrop="static">

                <Modal.Body>
                    {showSpinner && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}

                    <Button variant="primary" style={{ width: "100%", marginTop: '5px' }} onClick={() => signOut()}>
                        Dejar sesión (<em>sign out</em>)
                    </Button>
                    <br /> 
                    <Button variant="warning" style={{ width: "100%", marginTop: '5px' }} onClick={() => cancelSignOut()}>
                        Cancelar
                    </Button>
                    <hr /> 
                    <Button variant="link" 
                        style={{ fontSize: 'small', fontStyle: 'italic', paddingTop: '0' }} 
                        onClick={() => changeUserName()} size="sm">
                        Cambiar nombre del usuario
                    </Button>
                    <Button variant="link" 
                        style={{ fontSize: 'small', fontStyle: 'italic', paddingTop: '0' }} 
                        onClick={() => changeUserEmail()} size="sm">
                        Cambiar E-mail del usuario
                    </Button>
                    <Button variant="link" 
                        style={{ fontSize: 'small', fontStyle: 'italic', paddingTop: '0' }} 
                        onClick={() => verificarUserEmail()} size="sm">
                        Verificar e-mail
                    </Button> <br /> 
                    <Button variant="link"
                        style={{ fontSize: 'small', fontStyle: 'italic', paddingTop: '0' }}
                        onClick={() => resetUserPassword()} size="sm">
                        Cambiar password
                    </Button>
                </Modal.Body>

            </Modal>
        </>
    )
}

SignOut_Modal.propTypes = {
    showModal: PropTypes.bool.isRequired, 
    setShowModal: PropTypes.func.isRequired,
    setSpecialAction: PropTypes.func.isRequired
};

export default SignOut_Modal; 