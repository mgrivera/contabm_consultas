
import { Accounts } from 'meteor/accounts-base';

Accounts.emailTemplates.siteName = "Contab";
Accounts.emailTemplates.from = "Contab <smr.software@gmail.com>";

// ------------------------------------------------------------------------------------------------------------
// Meteor proporciona estas plantillas para personalizar los emails que podemos enviar desde account-passwords; 
// a saber: sendResetPasswordEmail, sendEnrollmentEmail, and sendVerificationEmail.
// ------------------------------------------------------------------------------------------------------------

Accounts.emailTemplates.verifyEmail = {
    subject() {
        return "[Contab] Por favor verifique su dirección de correo";
    },
    html(user, url) {
        const emailAddress = user.emails[0].address; 
        const urlWithoutHash = url.replace('#/', ''); 
        const userName = user.username; 
        const supportEmail = "smr.software@gmail.com"; 
        const emailBody = `Hola ${userName}, <br /><br /> 
                        Para verificar su dirección de correo (${emailAddress}), Ud. debe hacer 
                        un <em>click</em> en el siguiente <em>link</em>:<br /><br />
                        ${urlWithoutHash}<br /><br />
                        Luego, Ud. debe revisar una página que se abrirá en su navegador, por ejemplo Chrome, y que confirmará  
                        la ejecución de esta función. 
                        <hr />
                        Si Ud. no requirió esta verificación, por favor ignore este correo. <br />
                        Si Ud. percibe que algo no está bien, por favor contacte nuestro personal de apoyo: ${supportEmail}.`;

        return emailBody;
    }
}

Accounts.emailTemplates.resetPassword = {
    subject() {
        return "[Contab] Establezca su nuevo password";
    },
    html(user, url) {
        const userName = user.username; 
        const urlWithoutHash = url.replace('#/', '');
        const supportEmail = "smr.software@gmail.com"; 
        const emailBody = `Hola ${userName}, <br /><br /> 
                        Para establecer un nuevo password, Ud. debe hacer 
                        un <em>click</em> en el siguiente <em>link</em>:<br /><br />
                        ${urlWithoutHash}<br /><br />
                        Luego, Ud. debe revisar una página que se abrirá en su navegador, por ejemplo Chrome, y que le permitirá 
                        la ejecución de esta función. 
                        <hr />
                        Si Ud. no requirió esta función, por favor ignore este correo. <br />
                        Si Ud. percibe que algo no está bien, por favor contacte nuestro personal de apoyo: ${supportEmail}.`;

        return emailBody;
    }
}