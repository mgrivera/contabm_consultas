
import { Meteor } from 'meteor/meteor';

import numeral from 'numeral';
import moment from 'moment';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Table, Row, Col } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

const reactDataGridNumberFormatter = ({ value }) => numeral(value).format('0,0.00');

const columns = [
    { key: 'partida', name: '##', resizable: true, sortable: true, frozen: false, cellClass: 'text-center', width: 50 },
    { key: 'cuentaContable', name: 'Cuenta contable', resizable: true, sortable: true, frozen: false, width: 150 },
    { key: 'nombreCuentaContable', name: 'Nombre', resizable: true, sortable: true, frozen: false, width: 175 },
    { key: 'descripcion', name: 'Descripción', resizable: true, sortable: true, frozen: false, width: 270 },
    { key: 'referencia', name: 'Referencia', resizable: true, sortable: true, frozen: false, width: 100 },
    { key: 'debe', name: 'Debe', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },
    { key: 'haber', name: 'Haber', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },
    { key: 'centroCosto', name: 'Centro costo', resizable: true, sortable: true, frozen: false, width: 220 }
];

const Movimientos = ({ asientoId, setMessage, showSpinner, setShowSpinner }) => {

    const [pageData, setPageData] = useState({
        page: 1,
        recsPerPage: 25,
        recordCount: 0,
        cantPages: 0,
        leerResto: false,
        loadingRecordCount: false,
        loadingPage: false,
        items: []
    })

    const [asientoContable, setAsientoContable] = useState({
        loading: false,
        item: {}
    })

    // --------------------------------------------------------------------------------
    // para leer la cantidad de registros 
    useEffect(() => {
        if (!asientoId) {
            return;
        }

        setShowSpinner(true);

        // cada vez que este comprobante deba mostrar los movimientos de una cuenta en un mes, restablecemos su state 
        const state = {
            page: 1,
            recsPerPage: 25,
            recordCount: 0,
            cantPages: 0,
            leerResto: false,
            loadingRecordCount: true,
            loadingPage: false,
            items: []
        };

        setPageData(state);

        // determinamos la cantidad de registros que regresará la consulta 
        Meteor.call('movimientoDeCuentasContables.leerPartidasAsientoContable.recordCount', asientoId, (err, result) => {

            if (err) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                    show: true
                }

                setMessage(msg);
                setPageData((prevState) => ({ ...prevState, loadingRecordCount: false }));

                return;
            }

            const recordCount = result.recCount;
            const recsPerPage = pageData.recsPerPage;

            // calculamos la cantidad máxima de páginas y pasamos como un prop 
            let cantPages = Math.floor(recordCount / recsPerPage);
            cantPages = (recordCount % recsPerPage) ? cantPages + 1 : cantPages; // si hay un resto, agregamos 1 página 

            setPageData((prevState) => ({ ...prevState, recordCount, cantPages, loadingRecordCount: false, loadingPage: true }));
        })

    }, [asientoId])

    // --------------------------------------------------------------------------------
    // para leer la cantidad de registros 
    useEffect(() => {
        if (!asientoId) {
            return;
        }

        setAsientoContable({ loading: true, item: {} });

        // determinamos la cantidad de registros que regresará la consulta 
        Meteor.call('movimientoDeCuentasContables.leerAsientoContable', asientoId, (err, result) => {

            if (err) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                    show: true
                }

                setMessage(msg);
                setAsientoContable({ loading: false });

                return;
            }

            setAsientoContable({ loading: false, item: result.item });
        })

    }, [asientoId])

    // --------------------------------------------------------------------------------
    // para leer los registros 
    useEffect(() => {

        if (pageData.loadingRecordCount || !pageData.loadingPage) {
            // este código necesita que el subscription 'filtro' se haya completado; también que se haya leído la cant de records (desde sql) 
            return;
        }

        // cada vez que el usuario quiere una nueva página, o cuando tenemos la cantidad de registros (1ra vez), leemos el db
        Meteor.call('movimientoDeCuentasContables.leerPartidasAsientoContable', pageData.page,
                                                                        pageData.recsPerPage,
                                                                        pageData.recordCount,
                                                                        pageData.leerResto,
                                                                        asientoId, (err, result) => {

            if (err) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                            ${err.message}`,
                    show: true
                }

                setMessage(msg);
                setPageData((prevState) => ({ ...prevState, loadingPage: false }));

                return;
            }

            if (result.error) {
                const msg = {
                    type: 'danger',
                    message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                            ${result.message}`,
                    show: true
                }

                setMessage(msg);
                setPageData((prevState) => ({ ...prevState, loadingPage: false }));

                return;
            }

            // ----------------------------------------------------------------------------------------------------------
            // agregamos un index (0, 1, 2, 3, ...) a los rows, para poder restablecer el orden de estos items 
            // cuando el usuario hace un sort mediante el react-data-grid
            const items = pageData.items;

            // recuperamos el index mayor; la 1ra vez, cuando no haya items, el index será siempre 0  
            let maxIndex = items.reduce((acum, current) => (current.idx >= acum ? current.idx : acum), -1);

            // agregamos el centro de costo, en base a los datos que regresan desde la ejecución del method 
            result.items.forEach(x => {
                x.centroCosto = "";
                if (x.nombreCentroCosto) {
                    x.centroCosto = `${x.nombreCentroCosto} - ${x.nombreCortoCentroCosto}`;

                    if (x.suspendidoCentroCosto) {
                        x.centroCosto += " (susp)";
                    }
                }
            })

            result.items.forEach(x => items.push({ idx: ++maxIndex, ...x }));
            // ----------------------------------------------------------------------------------------------------------

            let page = pageData.page;

            if (pageData.leerResto) {
                page = pageData.cantPages;
            }

            setPageData((prevState) => ({ ...prevState, page, items, loadingPage: false }));
        })
    }, [pageData.loadingPage])

    // -----------------------------------------------------------------------------------------------------------
    // para que el react-data-grid ordene sus rows, cuando el usuario hace click en alguna columna 
    const handleGridSort = (sortColumn, sortDirection) => {
        const items0 = [...pageData.items];
        const items = sortRows(items0, sortColumn, sortDirection);
        setPageData((prevState) => ({ ...prevState, items }));
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

    const masRegistros = () => {
        if (pageData.page < pageData.cantPages) {
            const page = pageData.page + 1;
            setPageData((prevState) => ({ ...prevState, page, loadingPage: true }));
        }
    }

    const leerResto = () => {
        if (pageData.page < pageData.cantPages) {
            const page = pageData.page + 1;
            const leerResto = true;
            setPageData((prevState) => ({ ...prevState, page, leerResto, loadingPage: true }));
        }
    }

    const pagingText = `(${pageData.items.length} de ${pageData.recordCount} - pag ${pageData.page} de ${pageData.cantPages})`;

    useEffect(() => { 
        const loadingData = asientoContable.loading || pageData.loadingRecordCount || pageData.loadingPage;
        if (loadingData != showSpinner) {
            // hay useEffects para cargar: dAsientos-count, dAsientos, asiento 
            setShowSpinner(loadingData);
        }
    }, [asientoContable.loading, pageData.loadingRecordCount, pageData.loadingPage])

    const asiento = asientoContable?.item?.numero ? asientoContable.item : null; 
    
    return (
        <>
            {asiento &&
            
                <div style={{ paddingTop: '16px', paddingBottom: '25px', paddingLeft: '40px', paddingRight: '40px' }}>

                    <div style={{ border: 'solid 1px lightGray', padding: '15px', borderRadius: '10px' }}>
                    
                        <Row style={{ topMargin: '5px' }}>
                            <Col>
                                {(asientoId) &&
                                    <p>
                                        Asiento contable que corresponde al movimiento seleccionado.
                                </p>
                                }
                            </Col>
                        </Row>

                        <Table striped bordered hover size="sm" style={{ fontSize: 'small' }}>
                            <thead style={{ backgroundColor: '#CADFF0', color: '#818193' }}>
                                <tr>
                                    <th style={{ width: '20%' }}>##</th>
                                    <th style={{ width: '20%' }}>Fecha</th>
                                    <th style={{ width: '20%' }}>Tipo</th>
                                    <th style={{ width: '20%' }}>Mon</th>
                                    <th style={{ width: '20%' }}>Mon orig.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{asiento.numero}</td>
                                    <td>{asiento.fecha}</td>
                                    <td>{asiento.tipo}</td>
                                    <td>{asiento.simboloMoneda}</td>
                                    <td>{asiento.simboloMonedaOriginal}</td>
                                </tr>
                            </tbody>
                        </Table>

                        <Table striped bordered hover size="sm" style={{ fontSize: 'small' }}>
                            <thead style={{ backgroundColor: '#CADFF0', color: '#818193' }}>
                                <tr>
                                    <th style={{ width: '60%' }}>Descripción</th>
                                    <th style={{ width: '20%' }}>Proviene de</th>
                                    <th style={{ width: '20%' }}>Tasa de cambio</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{asiento.descripcion}</td>
                                    <td>{asiento.provieneDe}</td>
                                    <td>{asiento.tasaCambio}</td>
                                </tr>
                            </tbody>
                        </Table>

                        <Table striped bordered hover size="sm" style={{ fontSize: 'small' }}>
                            <thead style={{ backgroundColor: '#CADFF0', color: '#818193' }}>
                                <tr>
                                    <th style={{ width: '25%' }}>Ingreso</th>
                                    <th style={{ width: '25%' }}>Ult act</th>
                                    <th style={{ width: '25%' }}>Usuario</th>
                                    <th style={{ width: '25%' }}>Cia Contab</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{moment(asiento.ingreso).format('DD-MMM-YYYY h:mm a')}</td>
                                    <td>{moment(asiento.ultAct).format('DD-MMM-YYYY h:mm a')}</td>
                                    <td>{asiento.usuario}</td>
                                    <td>{asiento.abreviaturaCiaContab}</td>
                                </tr>
                            </tbody>
                        </Table>

                    </div>
                </div>
            }    

            <Row>
                <Col>
                    <Navbar bg="light" variant="light" style={{ fontSize: '14px', maxHeight: '30px' }}>
                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text>
                                {pagingText}
                            </Navbar.Text>

                            <Nav.Link href="#" onClick={masRegistros}>Más</Nav.Link>
                            <Nav.Link href="#" onClick={leerResto}>Todo</Nav.Link>
                        </Navbar.Collapse>
                    </Navbar>
                </Col>
            </Row>

            <Row>
                <Col>
                    <div className="div-react-data-grid" style={{ width: 'auto' }}>
                        <ReactDataGrid
                            columns={columns}
                            rowGetter={i => pageData.items[i]}
                            rowsCount={pageData.items.length}
                            minHeight={400}
                            onGridSort={(sortColumn, sortDirection) => handleGridSort(sortColumn, sortDirection)}
                        />
                    </div>
                </Col>
            </Row>
        </>
    )
}

Movimientos.propTypes = {
    asientoId: PropTypes.number,
    setMessage: PropTypes.func.isRequired,
    showSpinner: PropTypes.bool.isRequired, 
    setShowSpinner: PropTypes.func.isRequired
};

export default Movimientos;