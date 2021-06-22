
import { Meteor } from 'meteor/meteor';

import numeral from 'numeral';
import lodash from 'lodash'; 

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Row, Col } from 'react-bootstrap';
import { Table, Navbar, NavDropdown } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

const reactDataGridNumberFormatter = ({ value }) => numeral(value).format('0,0.00');

const columns = [
    { key: 'simboloMoneda', name: 'Mon', resizable: true, sortable: true, frozen: false, width: 80, cellClass: 'text-center' },
    { key: 'cuentaContableEditada', name: 'Cuenta contable', resizable: true, sortable: true, frozen: false, width: 150 },
    { key: 'nombreCuentaContable', name: 'Nombre', resizable: true, sortable: true, frozen: false, width: 200 },
    { key: 'count', name: 'Cant mvtos', resizable: true, sortable: true, frozen: false, cellClass: 'text-center', width: 100 },

    { key: 'saldoAnterior', name: 'Saldo ant', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },

    { key: 'sumOfDebe', name: 'Debe', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },
    { key: 'sumOfHaber', name: 'Haber', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },

    { key: 'saldoActual', name: 'Saldo actual', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 }
];

const Transformar = ({ transformarGridData, 
                       setTransformarGridData, 
                       setMessage, 
                       setShowSpinner, 
                       setCurrentTab, 
                       setSelectedCuentaContable, 
                       ciaContabId }) => {

    const [totales, setTotales] = useState({ saldoAnterior: 0, debe: 0, haber: 0, saldoActual: 0 }); 

    useEffect(() => { 
        // calculamos los totales para los montos en el array que se muestra en el grid 
        const saldoAnterior = transformarGridData.reduce((acum, curr) => (acum + curr.saldoAnterior), 0);
        const debe = transformarGridData.reduce((acum, curr) => (acum + curr.sumOfDebe), 0);
        const haber = transformarGridData.reduce((acum, curr) => (acum + curr.sumOfHaber), 0);
        const saldoActual = saldoAnterior + debe - haber; 

        setTotales({ saldoAnterior, debe, haber, saldoActual });
    }, [transformarGridData.length])

    // -----------------------------------------------------------------------------------------------------------
    // para que el react-data-grid ordene sus rows, cuando el usuario hace click en alguna columna 
    const handleGridSort = (sortColumn, sortDirection) => {
        const items0 = [...transformarGridData];
        const items = sortRows(items0, sortColumn, sortDirection);
        setTransformarGridData(items);
    }

    const sortRows = (initialRows, sortColumn, sortDirection) => {
        const comparer = (a, b) => {
            if (sortDirection === "ASC") {
                return a[sortColumn] > b[sortColumn] ? 1 : -1;
            } else if (sortDirection === "DESC") {
                return a[sortColumn] < b[sortColumn] ? 1 : -1;
            } else {
                // el sortDirection es 'NONE' (3er. click); regresamos el orden *original* de los items 
                // recuérdese que al crear el array de items, agregamoso un idx (0, 1, 2, 3, 4, ...)
                return a['idx'] > b['idx'] ? 1 : -1;
            }
        }
        return [...initialRows].sort(comparer);
    };

    const excluirCuentasSinSaldoNiMovimientos = () => {
        // eliminamos los items sin saldo ni movimientos 
        const items = [...transformarGridData];
        const items2 = items.filter(x => (
            !(x.saldoAnterior === 0 && x.sumOfDebe === 0 && x.sumOfHaber === 0)
        ))
        setTransformarGridData(items2);
    }

    const excluirCuentasSinMovimientos = () => {
        // eliminamos los items sin saldo ni movimientos 
        const items = [...transformarGridData];
        const items2 = items.filter(x => (!(x.sumOfDebe === 0 && x.sumOfHaber === 0)))
        setTransformarGridData(items2);
    }

    const excluirCuentasConSaldoCero = () => {
        // eliminamos los items con saldo final cero 
        const items = [...transformarGridData];
        const items2 = items.filter(x => x.saldoActual != 0); 
        setTransformarGridData(items2);
    }

    const reducirNiveles = (cantNivelesRequeridos) => { 

        setShowSpinner(true);

        const items = [...transformarGridData]; 

        for (const item of items) { 
            // determinamos la cantidad de niveles de la cuenta; ej: para la cuenta 5 01 01 003, es 4 
            // además, regresamos los niveles 
            const result = determinarCantidadNiveles(item); 

            item.cantNiveles = result.cantNiveles; 
            item.niveles = result.niveles; 

            if (item.cantNiveles <= cantNivelesRequeridos) { 
                // la cuenta contable tiene menos niveles o lo mismos, que los requeridos; ej: se quieren 4 pero la cuenta tiene 3 
                continue; 
            }

            // determinamos la nueva cuenta; si la cuenta es: 5 01 01 003, y el usuario quiere *solo* 3 niveles, la cuenta queda: 5 01 01
            const cuentaContableEditada = determinarNuevaCuenta(item.niveles, cantNivelesRequeridos);

            item.cuentaContableEditada = cuentaContableEditada; 
        }

        // ahora agrupamos por cuenta, pues quedan muchas cuenta iguales al reducir los nivles; 
        // también sumarizamos los montos (saldos y debe/haber) 
        const items2 = agruparCuentasContables(items);

        // TODO: finalmente, ejecutamos un meteor method para leer en la db el nombre de cada cuenta 
        // como las cuentas fueron transformadas a una cantidad menor de niveles, debemos leer su nombre para mostrarlo en el grid 

        // preparamos el filtro para leer los nombres de las cuentas 
        let filtroCuentasContables = "c.Cuenta In ('xyz'"; 

        items2.forEach(x => { 
            filtroCuentasContables += `, '${x.cuentaContableEditada.replace(/\s/g, '')}'`;      // cambiamos la cuenta, de editada a normal
        })

        filtroCuentasContables += ")"; 

        Meteor.call('estadoGyP.leerNombresCuentasContables', filtroCuentasContables, ciaContabId, (err, result) => {

            if (err) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                    show: true
                }

                setMessage(msg);
                setShowSpinner(false);

                return;
            }

            // buscamos el nombre de cada cuenta en el array que regresa el method 
            items2.forEach(x => { 
                const cuenta = result.items.find(c => c.cuenta === x.cuentaContableEditada.replace(/\s/g, '')); 
                x.nombreCuentaContable = cuenta?.nombreCuentaContable ? cuenta.nombreCuentaContable : "Indefinido (???)"; 
            })

            setTransformarGridData(items2);
            setShowSpinner(false);
        })
    }

    const onCuentasRowClick = (index) => {

        if (index === -1) {
            // el index es igual a -1 cuando el usuario hace un click en el header row
            return;
        }

        const row = transformarGridData[index];
        setSelectedCuentaContable(row);

        // para ir a tab Movimientos 
        setCurrentTab("movimientos");
    }

    const pagingText = `(${transformarGridData.length.toString()} registros)`;

    return (
        <>
            <Row style={{ topMargin: '5px' }}>
                <Col>
                    <p>
                        Haga un <em>click</em> en una cuenta, para leer y mostrar sus movimientos.
                    </p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Navbar bg="light" variant="light" style={{ fontSize: '14px', maxHeight: '30px' }}>

                        <NavDropdown title="Excluir cuentas contables" id="basic-nav-dropdown">
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={excluirCuentasSinSaldoNiMovimientos}>
                                Sin saldo ni movimientos en el período
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={excluirCuentasConSaldoCero}>
                                Con saldo actual cero
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={excluirCuentasSinMovimientos}>
                                Sin movimientos en el período
                            </NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown title="Reducir niveles" id="basic-nav-dropdown2">
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={() => reducirNiveles(1)}>
                                Un nivel
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={() => reducirNiveles(2)}>
                                Dos niveles
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={() => reducirNiveles(3)}>
                                Tres niveles
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={() => reducirNiveles(4)}>
                                Cuatro niveles
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={() => reducirNiveles(5)}>
                                Cinco niveles
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#" style={{ fontSize: '14px' }} onClick={() => reducirNiveles(6)}>
                                Seis niveles
                            </NavDropdown.Item>
                            
                        </NavDropdown>

                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text>
                                {pagingText}
                            </Navbar.Text>

                            {/* <Nav.Link href="#" onClick={masRegistros}>Más</Nav.Link>
                            <Nav.Link href="#" onClick={leerResto}>Todo</Nav.Link> */}
                        </Navbar.Collapse>
                    </Navbar>
                </Col>
            </Row>

            <Row>
                <Col>
                    <div className="div-react-data-grid">
                        <ReactDataGrid
                            columns={columns}
                            rowGetter={i => transformarGridData[i]}
                            rowsCount={transformarGridData.length}
                            minHeight={400}
                            onRowClick={onCuentasRowClick}
                            onGridSort={(sortColumn, sortDirection) => handleGridSort(sortColumn, sortDirection)}
                        />
                    </div>
                </Col>
            </Row>

            <Row style={{ marginTop: '25px' }}>
                <Col />
                <Col sm={10}>
                    <Table striped bordered hover size="sm" style={{ fontSize: 'small' }}>
                        <thead style={{ backgroundColor: '#CADFF0', color: '#818193' }}>
                            <tr>
                                <th style={{ width: '20%' }}></th>
                                <th style={{ width: '20%' }}>Saldo anterior</th>
                                <th style={{ width: '20%' }}>Debe</th>
                                <th style={{ width: '20%' }}>Haber</th>
                                <th style={{ width: '20%' }}>Saldo actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Totales:</td>
                                <td>{numeral(totales.saldoAnterior).format('0,0.00')}</td>
                                <td>{numeral(totales.debe).format('0,0.00')}</td>
                                <td>{numeral(totales.haber).format('0,0.00')}</td>
                                <td>{numeral(totales.saldoActual).format('0,0.00')}</td>
                            </tr>
                        </tbody>
                    </Table>
                </Col>
                <Col />
            </Row>
        </>
    )
}

Transformar.propTypes = {
    transformarGridData: PropTypes.array.isRequired,
    setTransformarGridData: PropTypes.func.isRequired,
    setMessage: PropTypes.func.isRequired,
    setShowSpinner: PropTypes.func.isRequired,
    setCurrentTab: PropTypes.func.isRequired,
    setSelectedCuentaContable: PropTypes.func.isRequired,
    ciaContabId: PropTypes.number
};

export default Transformar;

// para determinar la cantidad de niveles de la cuenta contable; ejemplo: la cuenta contable 10 05 03 02 001, tiene 5 niveles 
function determinarCantidadNiveles(item) { 

    const cuentaContable = item.cuentaContableEditada; 
    
    // la cuenta debe tener espacios 
    if (!cuentaContable.includes(" ")) { 
        return 1; 
    }

    const niveles = cuentaContable.split(" "); 
    const cantNiveles = niveles.length; 

    return { 
        cantNiveles, 
        niveles
    }
}

// para determinar la nueva cuenta contable; Ej: la cuenta es '1 01 01 03 005' y el usuario quiere 3 niveles; la cuenta es: 1 01 01
function determinarNuevaCuenta(nivelesArray, cantNivelesRequeridos) { 

    let nuevaCuentaContable = ""; 

    for (let i = 0; i < cantNivelesRequeridos; i++) {
        nuevaCuentaContable += nuevaCuentaContable ? ` ${nivelesArray[i]}` : nivelesArray[i]; 
    }
    
    return nuevaCuentaContable; 
}

function agruparCuentasContables(items) { 
    // agrupamos todos los registros que tienen la misma cuenta en uno solo; además, sumarizamos los saldos y el debe y haber 
    const items2 = []; 

    // agrupamos por cuentaContableEditada usando lodash 
    const groups = lodash.groupBy(items, "cuentaContableEditada"); 

    // ahora recorremos cada grupo para sumarizar en un solo item y construir el nuevo array 
    for (const [key, value] of Object.entries(groups)) {

        const { ano, monedaId, simboloMoneda } = value[0]; 

        const count = value.reduce((acum, curr) => acum + curr.count, 0);
        const saldoAnterior = value.reduce((acum, curr) => acum + curr.saldoAnterior, 0);
        const sumOfDebe = value.reduce((acum, curr) => acum + curr.sumOfDebe, 0);
        const sumOfHaber = value.reduce((acum, curr) => acum + curr.sumOfHaber, 0);
        const saldoActual = saldoAnterior + sumOfDebe - sumOfHaber; 
        
        const object = {
            ano, 
            monedaId,
            simboloMoneda, 
            cuentaContableEditada: key, 
            nombreCuentaContable: "Aquí debemos poner el nombre de la cuenta contable ...", 
            count, 
            saldoAnterior, 
            sumOfDebe, 
            sumOfHaber, 
            saldoActual
        }

        items2.push(object); 
    }

    return items2; 
}