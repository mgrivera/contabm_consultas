
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { useTracker } from 'meteor/react-meteor-data';

import lodash from 'lodash'; 

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import AsyncSelect from 'react-select/async';

import { useHistory, useRouteMatch } from "react-router-dom";

import { Tabs, Tab } from 'react-bootstrap';
import { Row, Col, Button } from 'react-bootstrap';
import { Form, Table } from 'react-bootstrap';

import Spinner from '/imports/ui/genericReactComponents/Spinner';

import { Filtros } from '/imports/collections/filtros';

import './styles.css'; 

const Filter = ({ companiaContabSeleccionada }) => {

    const { url } = useRouteMatch();
    const history = useHistory();

    // nota: ponemos 1 como default value para el mes, pues si el usuario no tenía un filtro en Filtros y no selecciona uno, 
    // el select (html ddl) muestra  siempre la 1ra opción (Enero), pero este valor *no* está en el state. Si el usuario selecciona 
    // un elemento en el select, por supuesto, el valor pasa al state ... 
    const [formValues, setFormValues] = useState({ mes: '1', ano: '2021', centrosCosto: 3 });

    const [showSpinner, setShowSpinner] = useState(false);
    const [currentTab, setCurrentTab] = useState('generales');

    const [cuentasContablesSeleccionadas, setCuentasContablesSeleccionadas] = useState([]);
    const [monedasSeleccionadas, setMonedasSeleccionadas] = useState([]);
    const [centrosCostoSeleccionados, setCentrosCostoSeleccionados] = useState([]);

    const filtrosLoading = useTracker(() => {
        // Note that this subscription will get cleaned up when your component is unmounted or deps change.
        const handle = Meteor.subscribe('filtros', Meteor.userId(), "consultas_movimientoDeCuentasContables");
        return !handle.ready();
    }, []);

    // para leer el filtro que el usuario usó antes 
    useEffect(() => { 
        const filtroExiste = Filtros.find({ nombre: 'consultas_movimientoDeCuentasContables', userId: Meteor.userId() }).count();

        if (filtroExiste) {
            const filtro = Filtros.findOne({ nombre: 'consultas_movimientoDeCuentasContables', userId: Meteor.userId() }); 
            
            const monedas = filtro?.filtro?.monedas ? filtro.filtro.monedas : [];
            const cuentas = filtro?.filtro?.cuentas ? filtro.filtro.cuentas : [];
            const cc = filtro?.filtro?.cc ? filtro.filtro.cc : []; 

            const ano = filtro?.filtro?.ano ? filtro.filtro.ano : [];
            const mes = filtro?.filtro?.mes ? filtro.filtro.mes : [];

            const centrosCosto = filtro?.filtro?.centrosCosto ? filtro.filtro.centrosCosto : 3;         // todos los movimientos: con/sin centros costo

            setFormValues({ mes, ano, centrosCosto });

            setMonedasSeleccionadas(monedas); 
            setCuentasContablesSeleccionadas(cuentas); 
            setCentrosCostoSeleccionados(cc); 
        }
    }, [filtrosLoading])

    const onInputChange = (e) => {
        const values = { ...formValues };
        const name = e.target.name;
        const value = e.target.value;

        setFormValues({ ...values, [name]: value });
    }

    const aplicarFiltro = (e) => {

        e.preventDefault();

        // ------------------------------------------------------------------------------------------------------
        // guardamos el filtro indicado por el usuario
        const { mes, ano, centrosCosto } = formValues;
        const filtroExiste = Filtros.find({ nombre: 'consultas_movimientoDeCuentasContables', userId: Meteor.userId() }).count();

        const monedas = monedasSeleccionadas && Array.isArray(monedasSeleccionadas) ? monedasSeleccionadas : [];
        const cuentas = cuentasContablesSeleccionadas && Array.isArray(cuentasContablesSeleccionadas) ? cuentasContablesSeleccionadas : [];
        const cc = centrosCostoSeleccionados && Array.isArray(centrosCostoSeleccionados) ? centrosCostoSeleccionados : []; 

        if (filtroExiste) {
            // el filtro existía antes; lo actualizamos
            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
            Filtros.update(Filtros.findOne({ nombre: 'consultas_movimientoDeCuentasContables', userId: Meteor.userId() })._id,
                { $set: { filtro: { mes, ano, centrosCosto, monedas, cuentas, cc } } },
                { validate: false });
        }
        else {
            Filtros.insert({
                _id: new Mongo.ObjectID()._str,
                userId: Meteor.userId(),
                nombre: 'consultas_movimientoDeCuentasContables',
                filtro: { mes, ano, centrosCosto, monedas, cuentas, cc }
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

    // -----------------------------------------------------------------------------------------------------
    // promise para leer las cuentas contables cuando el usuario hace el search en el react-select/async 
    // a diferencia de otros casos similares, incluímos esta en la función para poder pasar un prop como 
    // parémetro 
    const cuentasContablesReactSelectOptions = (search) => {
        return new Promise(resolve => {
            const ciaContabId = companiaContabSeleccionada?.numero_sql ? companiaContabSeleccionada.numero_sql : -1;
            Meteor.call('reactSelectAsync.cuentasContables', search, ciaContabId, (err, result) => {
                resolve(result.options);
            })
        })
    }

    // ------------------------------------------------------------------------------------------------
    // para guardar en el state las cuentas que el usuario selecciona en la lista 
    const cuentasContablesHandleOnChange = option => {
        const cuentas = cuentasContablesSeleccionadas;
        const existe = cuentas.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        cuentas.push(option);
        const cuentas2 = lodash.sortBy(cuentas, ['label']);
        setCuentasContablesSeleccionadas(cuentas2);
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

    // -----------------------------------------------------------------------------------------------------
    // promise para leer las cuentas contables cuando el usuario hace el search en el react-select/async 
    // a diferencia de otros casos similares, incluímos esta en la función para poder pasar un prop como 
    // parémetro 
    const centrosCostoReactSelectOptions = (search) => {
        return new Promise(resolve => {
            Meteor.call('reactSelectAsync.centrosCosto', search, (err, result) => {
                resolve(result.options);
            })
        })
    }

    // ------------------------------------------------------------------------------------------------
    // para guardar en el state las cuentas que el usuario selecciona en la lista 
    const centrosCostoHandleOnChange = option => {
        const centrosCosto = centrosCostoSeleccionados;
        const existe = centrosCosto.some(x => x.value === option.value);

        if (existe) {
            return;
        }

        centrosCosto.push(option);
        const centrosCosto2 = lodash.sortBy(centrosCosto, ['label']);
        setCentrosCostoSeleccionados(centrosCosto2);
    }

    // ------------------------------------------------------------------------------------------------
    // para eliminar un row de la tabla de monedas seleccionadas 
    const cuentasRemoveFromList = (value) => {
        const cuentas = cuentasContablesSeleccionadas.filter(x => x.value != value);
        setCuentasContablesSeleccionadas(cuentas);
    }

    // ------------------------------------------------------------------------------------------------
    // para eliminar un row de la tabla de monedas seleccionadas 
    const monedasRemoveFromList = (value) => {
        const monedas = monedasSeleccionadas.filter(x => x.value != value);
        setMonedasSeleccionadas(monedas);
    }

    // ------------------------------------------------------------------------------------------------
    // para eliminar un row de la tabla de centros de costo seleccionados
    const centrosCostoRemoveFromList = (value) => {
        const centrosCosto = centrosCostoSeleccionados.filter(x => x.value != value);
        setCentrosCostoSeleccionados(centrosCosto);
    }

    const loading = showSpinner || filtrosLoading; 
    
    return (
        <div style={{ marginTop: '10px'}}>

            <Tabs
                id="filterTab"
                activeKey={currentTab}
                onSelect={(k) => setCurrentTab(k)}
            >
                <Tab eventKey="generales" title="Generales">
                        
                    <Form>

                        <Row style={{ marginTop: '10px' }}>
                            <Col sm={1}/>
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
                            <Col sm={1}/>
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
                                <AsyncSelect cacheOptions
                                            placeholder='Filtro por cuenta contable'
                                            defaultOptions
                                            onChange={cuentasContablesHandleOnChange}
                                            loadOptions={cuentasContablesReactSelectOptions} />
                            </Col>
                            <Col sm={1} />
                        </Row>

                        <Row style={{ marginTop: '10px' }}>
                            <Col sm={1} />
                            <Col sm={4}>
                                <div style={{ maxHeight: '300px', overflow: 'auto'  }}>
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
                                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                    <Table bordered style={{ fontSize: '.875rem' }} size="sm">
                                        <tbody>
                                            {cuentasContablesSeleccionadas.map(item => (
                                                <tr key={item.value}>
                                                    <td style={{ width: '90%' }}>{item.label}</td>
                                                    <td style={{ width: '10%', textAlign: 'center' }}>
                                                        <a href="#" className="removeAnchor" onClick={() => cuentasRemoveFromList(item.value)}>*</a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Col>
                            <Col sm={1} />
                        </Row>

                    </Form>

                </Tab>

                <Tab eventKey="listas" title="Centros de costo">

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
                                        <AsyncSelect cacheOptions
                                            placeholder='Filtro por centro de costos'
                                            defaultOptions
                                            onChange={centrosCostoHandleOnChange}
                                            loadOptions={centrosCostoReactSelectOptions} />
                                        <br />
                                        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                            <Table bordered style={{ fontSize: '.875rem' }} size="sm">
                                                <tbody>
                                                    {centrosCostoSeleccionados.map(item => (
                                                        <tr key={item.value}>
                                                            <td style={{ width: '90%' }}>{item.label}</td>
                                                            <td style={{ width: '10%', textAlign: 'center' }}>
                                                                <a href="#" className="removeAnchor" onClick={() => centrosCostoRemoveFromList(item.value)}>*</a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Col>

                                    <Col sm={1} />

                                    <Col>
                                        <fieldset className="border p-2">
                                            <legend style={{ paddingLeft: '10px', paddingRight: '10px', fontSize: '1rem' }} className="w-auto">
                                                Solo movimientos contables:
                                            </legend>
                                            <Form.Group controlId="movimientosConCentrosCosto">
                                                <Form.Check type="radio"
                                                    name="centrosCosto"
                                                    checked={formValues.centrosCosto === 1}
                                                    onChange={() => setFormValues(prev => ({ ...prev, centrosCosto: 1 }))}
                                                    label="Con centros de costo asociado" />
                                            </Form.Group>
                                            <Form.Group controlId="movimientosSinCentrosCosto">
                                                <Form.Check type="radio"
                                                    name="centrosCosto"
                                                    checked={formValues.centrosCosto === 2}
                                                    onChange={() => setFormValues(prev => ({ ...prev, centrosCosto: 2 }))}
                                                    label="Sin centros de costo asociado" />
                                            </Form.Group>
                                            <Form.Group controlId="movimientosTodos">
                                                <Form.Check type="radio"
                                                    name="centrosCosto"
                                                    checked={formValues.centrosCosto === 3}
                                                    onChange={() => setFormValues(prev => ({ ...prev, centrosCosto: 3 }))}
                                                    label="Todos" />
                                            </Form.Group>
                                        </fieldset>
                                    </Col>
                                    <Col sm={1} />
                                </Row>

                                <Row>
                                    <Col sm={1} />

                                    <Col>
                                        
                                    </Col>

                                    <Col sm={1} />
                                    <Col />
                                    <Col sm={1} />
                                </Row>
                            </fieldset>
                        </Col>
                        <Col sm={1} />
                    </Row>

                </Tab>

            </Tabs>
            
            <Row style={{ marginTop: '25px' }} className="align-bottom">
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

Filter.propTypes = {
    companiaContabSeleccionada: PropTypes.object
};

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