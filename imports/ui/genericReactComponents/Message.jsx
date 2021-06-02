
import React from 'react'
import PropTypes from 'prop-types';

import { Alert } from 'react-bootstrap';

function Message({ message, setMessage }) {

    return (
        <Alert variant={message.type} onClose={() => setMessage(state => ({ ...state, show: false }))} dismissible>
            <div style={{ textAlign: 'left' }} dangerouslySetInnerHTML={outputHtmlMarkup(message.message)} />
        </Alert>
    )
}

Message.propTypes = {
    message: PropTypes.object.isRequired,
    setMessage: PropTypes.func.isRequired
};

export default Message;

function outputHtmlMarkup(text) {
    return { __html: text };
}