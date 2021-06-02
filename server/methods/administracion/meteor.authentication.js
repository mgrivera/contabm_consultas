
import { Meteor } from 'meteor/meteor'; 
import { check } from 'meteor/check';

import { Accounts } from 'meteor/accounts-base'; 
import { Email } from 'meteor/email'; 

Meteor.methods(
    {
        // ----------------------------------------------------------------------
        // changeUserName
        // ----------------------------------------------------------------------
        changeUserName: function (userId, newUsername) {

            check(userId, String);
            check(newUsername, String);

            try {
                Accounts.setUsername(userId, newUsername)
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }

            return {
                error: false,
                message: `Ok, el nombre del usuario ha sido cambiado en forma satisfactoria.<br />
                          El nuevo nombre de usuario debe ahora ser mostrado en lugar del anterior.`
            }
        }, 

        // ----------------------------------------------------------------------
        // createNewAccount
        // ----------------------------------------------------------------------
        createNewAccount: function (username, email, password) {

            check(username, String);
            check(email, String);
            check(password, String);

            try {
                Accounts.createUser({ username, email, password });
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }

            return {
                error: false,
                message: `Ok, la nueva cuenta de usuario ha sido creada en forma exitosa.<br />
                          Ud. debe ahora hacer un <em>login</em> con el usuario y password indicados a esta función.`
            }
        }, 

        // ----------------------------------------------------------------------
        // changeEmail
        // ----------------------------------------------------------------------
        changeEmail: function (userId, newEmail) {

            // cómo no hay una forma de cambiar el e-mail del usuario, primero eliminamos el que exista y luego agregamos el 
            // nuevo ... 

            // Nota: para meteor, la idea es que un usuario puede tener varios e-mails; sin embargo, nos parece, al menos por ahora, 
            // que mejor solo mantenemos un e-mail, que el usuario pueda cambiar, por supuesto ..l. 

            check(userId, String);
            check(newEmail, String);

            // la dirección de correo indicada no debe existir 
            const userWithEmail = Accounts.findUserByEmail(newEmail); 

            if (userWithEmail) { 
                return {
                    error: true,
                    message: `Error: la dirección de correo indicada ya ha sido usada en alguna cuenta de usuario.<br /> 
                              Por favor indique una dirección de correo que no haya sido usada aún. 
                             `
                }
            }

            // primero leemos el usuario para tener su e-mail y poder eliminarlo 
            const user = Meteor.user({ fields: { emails: 1 }}); 

            if (!user) { 
                // ésto no debe nunca ocurrir! 
                return {
                    error: true,
                    message: "Error: Ud. debe tener una sesión en el programa antes de intentar ejecutar esta función."
                }
            }

            const emailAnterior = user.emails[0].address; 

            if (emailAnterior) { 
                // Ok, vamos a eliminar el e-mail 
                try {
                    Accounts.removeEmail(userId, emailAnterior);
                } catch (error) {
                    return {
                        error: true,
                        message: error.message
                    }
                }
            }

            // Ok, ya eliminamos el e-mail; ahora agregamos el nuevo 

            try {
                Accounts.addEmail(userId, newEmail);
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }

            return {
                error: false,
                message: `Ok, el E-mail para este usuario ha sido cambiado por el que se ha indicado.<br />
                          Para revisar que el cambio ha sido exitoso, intente hacer un login usando el nuevo e-mail y su password .`
            }
        }, 

        // ----------------------------------------------------------------------
        // sendVerificationLink
        // ----------------------------------------------------------------------
        sendVerificationLink() {
            const userId = Meteor.userId();

            if (!userId) {
                // ésto no debe nunca ocurrir, pues se supone que el usuario tiene una sesión 
                return {
                    error: true,
                    message: "Error: Ud. debe tener una sesión antes de intentar ejecutar esta función."
                }
            }

            try {
                // tenemos que inicializar esta variable para que sea usada por el Email package 
                process.env.MAIL_URL = Meteor.settings.mail_url;

                Accounts.sendVerificationEmail(userId);
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }

            const user = Meteor.user({ fields: { emails: 1 } });
            const email = user.emails[0].address;

            return {
                error: false,
                message: `Ok, este proceso se ha ejecutado en forma satisfactoria.<br /><br />
                         Hemos enviado un correo a su dirección de Email (<em>${email}</em>), 
                         que le permitirá verificar el mismo.<br /><br /> 
                         Haga un <em>click</em> en <b><em>Salir</em></b> para cerrar esta ventana.
                         `
            }
        }, 

        // ----------------------------------------------------------------------
        // sendResetPasswordEmail
        // ----------------------------------------------------------------------
        sendResetPasswordEmail(userId, userEmail) {

            check([userId, userEmail], [String]);

            try {
                // tenemos que inicializar esta variable para que sea usada por el Email package 
                process.env.MAIL_URL = Meteor.settings.mail_url;

                Accounts.sendResetPasswordEmail(userId, userEmail);
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }
            
            return {
                error: false,
                message: `Ok, este proceso se ha ejecutado en forma satisfactoria.<br /><br />
                         Hemos enviado un correo a su dirección de Email (<em>${userEmail}</em>),
                         que le permitirá registrar un nuevo password.<br /><br /> 
                         Haga un <em>click</em> en <b><em>Salir</em></b> para cerrar esta ventana.
                         `
            }
        }, 

        // ----------------------------------------------------------------------
        // sendResetPasswordEmail
        // ----------------------------------------------------------------------
        findUserByEmail(userEmail) {

            check([userEmail], [String]);

            let user = {}; 

            try {
                user = Accounts.findUserByEmail(userEmail, { fields: { username: 1, emails: 1 }});
            } catch (error) {
                return {
                    error: true,
                    message: error.message
                }
            }

            return {
                error: false,
                user, 
                message: `Ok, el usuario para el Email <em>${userEmail}</em> ha sido leído en forma satisfactoria.`
            }
        },  

        // ----------------------------------------------------------------------
        // sendEmail
        // ----------------------------------------------------------------------
        sendEmail(to, from, cc, subject, text) {
            // Make sure that all arguments are strings.
            check([to, from, cc, subject, text], [String]);

            // tenemos que inicializar esta variable para que sea usada por el Email package 
            process.env.MAIL_URL = Meteor.settings.mail_url;

            // Let other method calls from the same client start running, without waiting for the email sending to complete.
            this.unblock();

            try { 
                Email.send({ to, from, cc, subject, html: text });
            } catch(error) { 
                return {
                    error: true,
                    message: error.message
                }
            }

            return {
                error: false,
                message: `Ok, el E-mail ha sido enviado sin problemas aparentes ....<br />
                          Ahora Ud. debe revisar su correo para acceder al que le hemos enviado por aquí ...`
            }
        }
    })