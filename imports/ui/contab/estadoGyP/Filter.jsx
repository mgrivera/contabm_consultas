
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { useTracker } from 'meteor/react-meteor-data';

import lodash from 'lodash';

import React, { useState, useEffect } from 'react';

import AsyncSelect from 'react-select/async';

import { useHistory, useRouteMatch } from "react-router-dom";

import { Row, Col, Button } from 'react-bootstrap';
import { Form, Table } from 'react-bootstrap';

import Message from '/imports/ui/genericReactComponents/Message';
import Spinner from '/imports/ui/genericReactComponents/Spinner';

import { Filtros } from '/imports/collections/filtros';

import './styles.css';

const Filter = () => {

    const { url } = useRouteMatch();
    const history = useHistory();

    // nota: ponemos 1 como default value para el mes, pues si el usuario no tenía un filtro en Filtros y no selecciona uno, 
    // el select (html ddl) muestra  siempre la 1ra opción (Enero), pero este valor *no* está en el state. Si el usuario selecciona 
    // un elemento en el select, por supuesto, el valor pasa al state ... 
    const [formValues, setFormValues] = useState({ mes: '1', 
                                                   ano: '2021', 
                                                   opciones: { 
                                                       cantNiveles: 'detalle', 
                                                       excluirCuentasSinSaldoNiMovtos: true, 
                                                       excluirCuentasConSaldoFinalCero: true } 
                                                    });

    const [message, setMessage] = useState({ type: '', message: '', show: false });

    const [monedasSeleccionadas, setMonedasSeleccionadas] = useState([]);

    const filtrosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('filtros', Meteor.userId(), "consultas_estadoGyP");
        return !handle.ready();
    }, []);

    // para leer el filtro que el usuario usó antes 
    useEffect(() => {
        const filtroExiste = Filtros.find({ nombre: 'consultas_estadoGyP', userId: Meteor.userId() }).count();

        if (filtroExiste) {
            const filtro = Filtros.findOne({ nombre: 'consultas_estadoGyP', userId: Meteor.userId() });

            const monedas = filtro?.filtro?.monedas ? filtro.filtro.monedas : [];

            const ano = filtro?.filtro?.ano ? filtro.filtro.ano : [];
            const mes = filtro?.filtro?.mes ? filtro.filtro.mes : [];

            const opciones = filtro?.filtro?.opciones ? filtro.filtro.opciones : { cantNiveles: 'detalle', 
                                                                                   excluirCuentasSinSaldoNiMovtos: true, 
                                                                                   excluirCuentasConSaldoFinalCero: true };

            setFormValues({ mes, ano, opciones });
            setMonedasSeleccionadas(monedas);
        }
    }, [filtrosLoading])

    const onInputChange = (e) => {
        let name = e.target.name;
        
        // nótese que hacemos algo diferente cuando el valor corresponde a un 'sub' (inner) object. Ej: { ..., opciones: { ... }}
        if (name.includes(".")) { 
            name = name.replace("opciones.", ""); 
            const value = e.target && "checked" in e.target ? e.target.checked : e.target.value;         // para checkboxes viene un checked 
            setFormValues(prev => ({ ...prev, opciones: { ...prev.opciones, [name]: value }} ));
        } else { 
            const value = e.target && "checked" in e.target ? e.target.checked : e.target.value;         // para checkboxes viene un checked 
            setFormValues(prev => ({ ...prev, [name]: value }));
        }
    }

    const aplicarFiltro = (e) => {

        e.preventDefault();

        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        const { mes, ano, opciones } = formValues;
        const filtroExiste = Filtros.find({ nombre: 'consultas_estadoGyP', userId: Meteor.userId() }).count();

        const monedas = monedasSeleccionadas && Array.isArray(monedasSeleccionadas) ? monedasSeleccionadas : [];

        // el usuario debe seleccionar una moneda (y solo una) 
        if (!monedasSeleccionadas.length || monedasSeleccionadas.length > 1) { 
            const msg = {
                type: 'danger',
                message: `Ud. debe seleccionar una moneda, y solo una, antes de intentar aplicar el filtro.`,
                show: true
            }

            setMessage(msg);
            return; 
        }

        if (filtroExiste) {
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'consultas_estadoGyP', userId: Meteor.userId() })._id,
                { $set: { filtro: { mes, ano, monedas, opciones } } },
                { validate: false });
        }
        else {
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'consultas_estadoGyP',
                filtro: { mes, ano, monedas, opciones }
            });
        }

        // para ir al route '.../list'
        let url2 = url.toLowerCase();

        if (url2.includes("filter")) {
            url2 = url2.replace("filter", "list");
        } else {
            url2 = url2 + "/list";
        }

        history.push(url2);
    }

    // ------------------------------------------------------------------------------------------------
    // para guardar en el state las cuentas que el usuario selecciona en la lista 
    const monedasHandleOnChange = option => {
        const monedas = monedasSeleccionadas;
        const existe = monedas.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        monedas.push(option);
        const monedas2 = lodash.sortBy(monedas, ['label']);
        setMonedasSeleccionadas(monedas2);
    }

    // ------------------------------------------------------------------------------------------------
    // para eliminar un row de la tabla de monedas seleccionadas 
    const monedasRemoveFromList = (value) => {
        const monedas = monedasSeleccionadas.filter(x => x.value != value);
        setMonedasSeleccionadas(monedas);
    }

    const loading = filtrosLoading;

    return (
        <div>
            <Row>
                <Col>
                    {loading && <Spinner />}
                    {message.show && <Message message={message} setMessage={setMessage} />}
                </Col>
            </Row>

            <Form>

                <Row>
                    <Col sm={1} />
                    <Col sm={4}>
                        <Form.Group controlId="mes">
                            <Form.Label size="sm">Mes</Form.Label>
                            <Form.Control as="select" size="sm" name="mes" value={formValues.mes} onChange={onInputChange}>
                                <option value="1">Enero</option>
                                <option value="2">Febrero</option>
                                <option value="3">Marzo</option>
                                <option value="4">Abril</option>
                                <option value="5">Mayo</option>
                                <option value="6">Junio</option>
                                <option value="7">Julio</option>
                                <option value="8">Agosto</option>
                                <option value="9">Septiembre</option>
                                <option value="10">Octubre</option>
                                <option value="11">Noviembre</option>
                                <option value="12">Diciembre</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col />
                    <Col sm={4}>
                        <Form.Group controlId="ano">
                            <Form.Label size="sm">Año</Form.Label>
                            <Form.Control as="select" size="sm" name="ano" value={formValues.ano} onChange={onInputChange}>
                                <option value="2018">2018</option>
                                <option value="2019">2019</option>
                                <option value="2020">2020</option>
                                <option value="2021">2021</option>
                                <option value="2022">2022</option>
                                <option value="2023">2023</option>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                                <option value="2028">2028</option>
                                <option value="2029">2029</option>
                                <option value="2030">2030</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col sm={1} />
                </Row>

                <Row className="align-items-center">
                    <Col sm={1} />
                    <Col sm={4}>
                        <AsyncSelect cacheOptions
                            placeholder='Filtro por moneda'
                            defaultOptions
                            onChange={monedasHandleOnChange}
                            loadOptions={monedasReactSelectOptions} />
                    </Col>
                    <Col />
                    <Col sm={4}>
                    </Col>
                    <Col sm={1} />
                </Row>

                <Row style={{ marginTop: '10px' }}>
                    <Col sm={1} />
                    <Col sm={4}>
                        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                            <Table bordered style={{ fontSize: '.875rem' }} size="sm">
                                <tbody>
                                    {monedasSeleccionadas.map(item => (
                                        <tr key={item.value}>
                                            <td style={{ width: '90%' }}>{item.label}</td>
                                            <td style={{ width: '10%', textAlign: 'center' }}>
                                                <a href="#" className="removeAnchor" onClick={() => monedasRemoveFromList(item.value)}>*</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Col>
                    <Col />
                    <Col sm={4}>
                    </Col>
                    <Col sm={1} />
                </Row>

                <Row style={{ marginTop: '10px' }}>
                    <Col sm={1} />
                    <Col>
                        <fieldset className="border p-2">
                            <legend style={{ paddingLeft: '10px', paddingRight: '10px', fontSize: '1rem' }} className="w-auto">
                                Opciones: 
                            </legend>

                            <Row>
                                <Col sm={1} />
                                <Col>
                                    <Form.Group controlId="cantNiveles">
                                        <Form.Label size="sm">Cantidad de niveles</Form.Label>
                                        <Form.Control as="select" size="sm" name="opciones.cantNiveles" 
                                                      value={formValues.opciones.cantNiveles} 
                                                      onChange={onInputChange}>
                                            <option value="1">Un nivel</option>
                                            <option value="2">Dos niveles</option>
                                            <option value="3">Tres niveles</option>
                                            <option value="4">Cuatro niveles</option>
                                            <option value="5">Çinco niveles</option>
                                            <option value="6">Seis niveles</option>
                                            <option value="detalle">Nivel de detalle para cada cuenta</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>

                                <Col sm={1} />

                                <Col>
                                    <fieldset className="border p-2">
                                        <legend style={{ paddingLeft: '10px', paddingRight: '10px', fontSize: '1rem' }} className="w-auto">
                                            Excluir cuentas contables:
                                        </legend>
                                        <Form.Group controlId="excluirCuentasSinSaldoNiMovtos">
                                            <Form.Check type="checkbox"
                                                        name="opciones.excluirCuentasSinSaldoNiMovtos"
                                                        checked={formValues.opciones.excluirCuentasSinSaldoNiMovtos}
                                                        onChange={onInputChange}
                                                        label="Con saldo inicial cero y sin movimientos en el período" />
                                        </Form.Group>
                                        <Form.Group controlId="excluirCuentasConSaldoFinalCero">
                                            <Form.Check type="checkbox" 
                                                        name="opciones.excluirCuentasConSaldoFinalCero"
                                                        checked={formValues.opciones.excluirCuentasConSaldoFinalCero}
                                                        onChange={onInputChange}
                                                        label="Con saldo final cero" />
                                        </Form.Group>
                                    </fieldset>
                                </Col>
                                <Col sm={1} />
                            </Row>
                            
                        </fieldset>
                    </Col>
                    <Col sm={1} />
                </Row>

            </Form>

            <Row style={{ marginTop: 'auto' }} className="align-bottom">
                <Col sm={1} />
                <Col>
                    <hr />
                </Col>
                <Col sm={1} />
            </Row>

            <Row style={{ marginTop: 'auto' }} className="align-bottom">
                <Col sm={1} />
                <Col sm={4}>
                    <Button variant="link">Limpiar filtro</Button>
                </Col>
                <Col></Col>
                <Col sm={4}>
                    <Button className="float-right" variant="primary" size="sm" onClick={aplicarFiltro}>Aplicar filtro</Button>
                </Col>
                <Col sm={1} />
            </Row>

        </div>
    )
}

export default Filter;

// -----------------------------------------------------------------------------------------------
// promise para leer las monedas cuando el usuario hace el search en el react-select/async 
const monedasReactSelectOptions = (search) => {
    return new Promise(resolve => {
        Meteor.call('reactSelectAsync.monedas', search, (err, result) => {
            resolve(result.options);
        })
    })
}