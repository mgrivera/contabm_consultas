
import { Meteor } from 'meteor/meteor';

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { Row, Col } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css';

const columns = [
    { key: 'link', name: 'Dirección del anexo', resizable: true, sortable: true, frozen: false, width: 850 }
];

const Anexos = ({ asientoId, setMessage, setShowSpinner }) => {

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

    const anexosLink = useRef(null); 

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
        Meteor.call('movimientoDeCuentasContables.leerAnexos.recordCount', asientoId, (err, result) => {

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

    }, [asientoId])

    // --------------------------------------------------------------------------------
    // para leer los registros 
    useEffect(() => {

        if (pageData.loadingRecordCount || !pageData.loadingPage) {
            // este código necesita que el subscription 'filtro' se haya completado; también que se haya leído la cant de records (desde sql) 
            return;
        }

        setShowSpinner(true);

        // cada vez que el usuario quiere una nueva página, o cuando tenemos la cantidad de registros (1ra vez), leemos el db
        Meteor.call('movimientoDeCuentasContables.leerAnexos', pageData.page,
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

    const onCuentasRowClick = (index) => {

        if (index === -1) {
            // el index es igual a -1 cuando el usuario hace un click en el header row
            return;
        }

        const row = pageData.items[index];
        
        anexosLink.current.href = row.link; 
        anexosLink.current.click(); 
    }

    const pagingText = `(${pageData.items.length} de ${pageData.recordCount} - pag ${pageData.page} de ${pageData.cantPages})`;

    return (
        <>
            <Row style={{ topMargin: '5px' }}>
                <Col>
                    {(asientoId) &&
                        <a href="#" ref={anexosLink} target='_blank' hidden>Link para abrir el anexo ...</a>
                    }
                </Col>
            </Row>
            <Row style={{ topMargin: '5px' }}>
                <Col>
                    {(asientoId) &&
                        <>
                            <p>
                                <b>Anexos registrados para el asiento contable</b>
                            </p>
                            <p>
                                Haga un <em>click</em> en alguno de los <em>links</em> para consultar el anexo.
                            </p>
                        </>
                    }
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
                            onRowClick={onCuentasRowClick}
                        />
                    </div>
                </Col>
            </Row>
        </>
    )
}

Anexos.propTypes = {
    asientoId: PropTypes.number,
    setMessage: PropTypes.func.isRequired,
    setShowSpinner: PropTypes.func.isRequired
};

export default Anexos;