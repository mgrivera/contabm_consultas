
import { Meteor } from 'meteor/meteor';

import numeral from 'numeral';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Row, Col } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

const reactDataGridNumberFormatter = ({ value }) => numeral(value).format('0,0.00');

const columns = [
    { key: 'fecha', name: 'Fecha', resizable: true, sortable: true, frozen: false, cellClass: 'text-center', width: 120 },
    { key: 'comprobante', name: 'Comp', resizable: true, sortable: true, frozen: false, cellClass: 'text-center', width: 80 },
    { key: 'partida', name: '##', resizable: true, sortable: true, frozen: false, cellClass: 'text-center', width: 60 },
    { key: 'cuentaContableEditada', name: 'Cuenta', resizable: true, sortable: true, frozen: false, width: 120 },
    { key: 'descripcion', name: 'Descripción', resizable: true, sortable: true, frozen: false, width: 200 },
    { key: 'referencia', name: 'Referencia', resizable: true, sortable: true, frozen: false, width: 120 },
    { key: 'debe', name: 'Debe', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },
    { key: 'haber', name: 'Haber', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 },
    { key: 'factorCambio', name: 'F cambio', resizable: true, sortable: true, formatter: reactDataGridNumberFormatter, frozen: false, cellClass: 'text-right', width: 150 }
];

const Movimientos = ({ selectedCuentaContable, mes, ano, ciaContabId, setMessage, setShowSpinner }) => {

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

    // --------------------------------------------------------------------------------
    // para leer la cantidad de registros 
    useEffect(() => {
        if (!selectedCuentaContable?.cuentaContableEditada) {
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

        // desde Transformar viene la cuentaContableEditada; la convertimos a cuenta normal, para buscar en sql server 
        const cuentaContable = selectedCuentaContable.cuentaContableEditada.replace(/\s/g, ''); 

        // determinamos la cantidad de registros que regresará la consulta 
        Meteor.call('estadoGyP.leerMovimientos.recordCount', cuentaContable,
            mes,
            ano,
            selectedCuentaContable.monedaId,
            ciaContabId, (err, result) => {

                const recordCount = result.recCount;
                const recsPerPage = pageData.recsPerPage;

                // calculamos la cantidad máxima de páginas y pasamos como un prop 
                let cantPages = Math.floor(recordCount / recsPerPage);
                cantPages = (recordCount % recsPerPage) ? cantPages + 1 : cantPages; // si hay un resto, agregamos 1 página 

                setPageData((prevState) => ({ ...prevState, recordCount, cantPages, loadingRecordCount: false, loadingPage: true }));
                setShowSpinner(false);
            })

    }, [selectedCuentaContable?.cuentaContableEditada, mes, ano, selectedCuentaContable?.monedaId, ciaContabId])

    // --------------------------------------------------------------------------------
    // para leer los registros 
    useEffect(() => {

        if (pageData.loadingRecordCount || !pageData.loadingPage) {
            // este código necesita que el subscription 'filtro' se haya completado; también que se haya leído la cant de records (desde sql) 
            return;
        }

        setShowSpinner(true);

        // desde Transformar viene la cuentaContableEditada; la convertimos a cuenta normal, para buscar en sql server 
        const cuentaContable = selectedCuentaContable.cuentaContableEditada.replace(/\s/g, '');

        // cada vez que el usuario quiere una nueva página, o cuando tenemos la cantidad de registros (1ra vez), leemos el db
        Meteor.call('estadoGyP.leerMovimientos', pageData.page,
            pageData.recsPerPage,
            pageData.recordCount,
            pageData.leerResto,
            cuentaContable,
            mes, ano, selectedCuentaContable.monedaId,
            ciaContabId, (err, result) => {

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

                setPageData((prevState) => ({ ...prevState, page, items, loadingPage: false }));
                setShowSpinner(false);
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

    return (
        <>
            <Row style={{ topMargin: '5px' }}>
                <Col>
                    {(selectedCuentaContable && selectedCuentaContable.cuenta && selectedCuentaContable.nombreCuenta) &&
                        <p>
                            <b>Movimientos para la cuenta contable:
                                {` ${selectedCuentaContable.cuenta} ${selectedCuentaContable.nombreCuenta}, `}
                                {`el mes ${mes}/${ano} y la moneda ${selectedCuentaContable.simboloMoneda}`}</b>
                        </p>
                    }

                    <p>
                        Movimientos contables (asientos) para la cuenta contable seleccionada 
                    </p>
                </Col>
            </Row>

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
    selectedCuentaContable: PropTypes.object.isRequired,
    mes: PropTypes.string,
    ano: PropTypes.string,
    ciaContabId: PropTypes.number,
    setMessage: PropTypes.func.isRequired,
    setShowSpinner: PropTypes.func.isRequired
};

export default Movimientos;