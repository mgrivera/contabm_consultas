
import React from "react";
import { Switch, Route } from "react-router-dom";

import Home from './Home';
import SeleccionarCompaniaContab from './generales/seleccionarCompania/SeleccionarCompania';
import Contab_CuentasYSusMovimientos from './contab/cuentasYSusMovimientos/Contab_CuentasYSusMovimientos';
import CierresContables from './contab/cierresContables/CierresContables';
import EmailVerificationMessage from './generales/meteorLogin/EmailVerificationMessage';
import ResetUserPassword from './generales/meteorLogin/ResetUserPassword';
import MovimientoDeCuentasContables from "./contab/movimientoDeCuentasContables/MovimientoDeCuentasContables";

export default function App() {
    return (
        <>
            <Switch>
                <Route path="/contab/movimientoCuentasContables"><MovimientoDeCuentasContables /></Route>
                <Route path="/contab/cuentasYSusMovimientos"><Contab_CuentasYSusMovimientos /></Route>
                <Route path="/contab/cierresContables"><CierresContables /></Route>

                <Route path="/generales/seleccionarUnaCompaniaContab"><SeleccionarCompaniaContab /></Route>

                <Route path="/verify-email/:token"><EmailVerificationMessage /></Route>
                <Route path="/reset-password/:token"><ResetUserPassword /></Route>
                <Route path="/"><Home /></Route>
            </Switch >
        </>
    )
}