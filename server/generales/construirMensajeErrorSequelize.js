
// recibimos un error desde Sequelize e intentamos regresar un mensaje adecuado con el error ... 
const construirMensajeErrorSequelize = (err) => { 

    let message = err?.parent?.message;             // nótese cómo vienen los errores desde sequelize 
    if (!message) {
        message = err?.message;
    }
    if (!message) {
        message = JSON.stringify(err);
    }

    return message; 
}

export { construirMensajeErrorSequelize }; 