
import { Meteor } from 'meteor/meteor';

import numeral from 'numeral';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Row, Col } from 'react-bootstrap';
import { Table, Navbar, Nav } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

const reactDataGridNumberFormatter = ({ value }) => numeral(value).format('0,0.00');

const columns = [
    { key: 'simboloMoneda', name: 'Mon', resizable: true, sortable: true, frozen: false, width: 80, cellClass: 'text-center' },
    { key: 'cuentaContable', name: 'Cuenta contable', resizable: true, sortable: true, frozen: false, width: 150 },
    { key: 'nombreCuentaContable', name: 'Nombre', resizable: true, sortable: true, frozen: false, width: 200 },
    { key: 'count', name: 'Cant mvtos', resizable: true, sortable: true, frozen: false, cellClass: 'text-center', width: 100 },

    { key: 'saldoAnterior', name: 'Saldo ant', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },

    { key: 'sumOfDebe', name: 'Debe', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },
    { key: 'sumOfHaber', name: 'Haber', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },

    { key: 'saldoActual', name: 'Saldo actual', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 }
];

const CuentasContables = ({ filtrosLoading,
    ciaContabId,
    setMessage,
    setShowSpinner,
    setCurrentTab,
    filtro, 
    setTransformarGridData }) => {

    const [pageData, setPageData] = useState({
        page: 1,
        recsPerPage: 25,
        recordCount: 0,
        cantPages: 0,
        leerResto: false,
        loadingRecordCount: true,
        loadingPage: false,
        items: [],
        totales: {}
    })

    // --------------------------------------------------------------------------------
    // para leer la cantidad de registros 
    useEffect(() => {
        if (filtrosLoading || !pageData.loadingRecordCount) {
            // este código necesita que el subscription 'filtro' se haya completado 
            return;
        }

        const filtroIsObjectEmpty = !filtro.constructor === Object || Object.entries(filtro).length === 0;
        if (filtroIsObjectEmpty) {
            // filtro no es un object o es {} (empty)
            return;
        }

        setShowSpinner(true);

        // determinamos la cantidad de registros que regresará la consulta 
        Meteor.call('estadoGyP.leerSaldosContables.recordCount', filtro, ciaContabId, (err, result) => {

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

            const recordCount = result.recCount;
            const recsPerPage = pageData.recsPerPage;

            // calculamos la cantidad máxima de páginas y pasamos como un prop 
            let cantPages = Math.floor(recordCount / recsPerPage);
            cantPages = (recordCount % recsPerPage) ? cantPages + 1 : cantPages; // si hay un resto, agregamos 1 página 

            setPageData((prevState) => ({ ...prevState, recordCount, cantPages, loadingRecordCount: false, loadingPage: true }));
            setShowSpinner(false);
        })

    }, [filtro, pageData.loadingRecordCount])

    // --------------------------------------------------------------------------------
    // para leer los registros 
    useEffect(() => {

        if (filtrosLoading || pageData.loadingRecordCount || !pageData.loadingPage) {
            // este código necesita que el subscription 'filtro' se haya completado; también que se haya leído la cant de records (desde sql) 
            return;
        }

        const filtroIsObjectEmpty = !filtro.constructor === Object || Object.entries(filtro).length === 0;
        if (filtroIsObjectEmpty) {
            // filtro no es un object o es {} (empty)
            return;
        }

        setShowSpinner(true);

        // cada vez que el usuario quiere una nueva página, o cuando tenemos la cantidad de registros (1ra vez), leemos el db
        Meteor.call('estadoGyP.leerSaldosContables', pageData.page,
            pageData.recsPerPage,
            pageData.recordCount,
            pageData.leerResto,
            filtro, ciaContabId, (err, result) => {

                if (err) {
                    const msg = {
                        type: 'danger',
                        message: `Error: ha ocurrido un error al intentar ejecutar esta función. El mensaje de error obtenido es: <br />
                              ${err.message}`,
                        show: true
                    }

                    setMessage(msg);
                    setPageData((prevState) => ({ ...prevState, loadingPage: false }));

                    setShowSpinner(false);

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

                    setShowSpinner(false);

                    return;
                }

                // ----------------------------------------------------------------------------------------------------------
                // agregamos un index (0, 1, 2, 3, ...) a los rows, para poder restablecer el orden de estos items 
                // cuando el usuario hace un sort mediante el react-data-grid
                const items = pageData.items;

                // recuperamos el index mayor; la 1ra vez, cuando no haya items, el index será siempre 0  
                let maxIndex = items.reduce((acum, current) => (current.idx >= acum ? current.idx : acum), -1);

                result.items.forEach(x => items.push({ idx: ++maxIndex, ...x }));
                // ----------------------------------------------------------------------------------------------------------

                let page = pageData.page;

                if (pageData.leerResto) {
                    page = pageData.cantPages;
                }

                const totales = {
                    saldoAnterior: items.reduce((acum, x) => { return acum + x.saldoAnterior; }, 0),
                    debe: items.reduce((acum, x) => { return acum + x.sumOfDebe; }, 0),
                    haber: items.reduce((acum, x) => { return acum + x.sumOfHaber; }, 0),
                    saldoActual: items.reduce((acum, x) => { return acum + x.saldoActual; }, 0),
                }

                setPageData((prevState) => ({ ...prevState, page, items, totales, loadingPage: false }));
                setShowSpinner(false);
            })
    }, [pageData.loadingPage])

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

    const crearTranformar = () => {
        // grabamos los items que usa este component al array que usa el component Transformar 
        setTransformarGridData(pageData.items);
        setCurrentTab("transformar");           // mostramos el tab Transformar 
    }

    const pagingText = `(${pageData.items.length} de ${pageData.recordCount} - pag ${pageData.page} de ${pageData.cantPages})`;

    return (
        <>
            <Row>
                <Col>
                    <Navbar bg="light" variant="light" style={{ fontSize: '14px', maxHeight: '30px' }}>
                        <Navbar.Collapse>
                            <Nav.Link href="#" onClick={crearTranformar}>Transformar</Nav.Link>
                        </Navbar.Collapse>

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
                    <div className="div-react-data-grid">
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
                                <td>{numeral(pageData.totales.saldoAnterior).format('0,0.00')}</td>
                                <td>{numeral(pageData.totales.debe).format('0,0.00')}</td>
                                <td>{numeral(pageData.totales.haber).format('0,0.00')}</td>
                                <td>{numeral(pageData.totales.saldoActual).format('0,0.00')}</td>
                            </tr>
                        </tbody>
                    </Table>
                </Col>
                <Col />
            </Row>
        </>
    )
}

CuentasContables.propTypes = {
    filtrosLoading: PropTypes.bool.isRequired,
    ciaContabId: PropTypes.number,
    setMessage: PropTypes.func.isRequired,
    setShowSpinner: PropTypes.func.isRequired,
    setCurrentTab: PropTypes.func.isRequired,
    filtro: PropTypes.object.isRequired, 
    setTransformarGridData: PropTypes.func.isRequired
};

export default CuentasContables;