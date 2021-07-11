import React, { useState, useEffect } from "react";
import { listReservations, listTables } from "../utils/api";
import { Redirect, Route, Switch } from "react-router-dom";
import NotFound from "./NotFound";
//import { today } from "../utils/date-time";
import useQuery from "../utils/useQuery";

import Dashboard from "../dashboard/Dashboard";
import NewReservation from "../Reservations/NewReservation";
import SeatReservation from "../Reservations/SeatReservation";
import Search from "../Search/search";
import NewTable from "../Tables/NewTable";
import { today } from "../utils/date-time";


/**
 * Defines all the routes for the application.
 *
 * You will need to make changes to this file.
 *
 * @returns {JSX.Element}
 */
function Routes() {

  const query = useQuery();
  const date = query.get("date") ? query.get("date") : today();

  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);

  const [tables, setTables] = useState([]);
  const [tablesError, setTablesErrors] = useState(null);

  useEffect(loadDashboard, [date]);

  function loadDashboard() {
    const abortController = new AbortController();
    setReservationsError(null);
    
    listReservations({ date: date }, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);

    listTables(abortController.signal)
      .then((tables) => tables.sort((tableA, tableB) => tableA.table_id - tableB.table_id))
      .then(setTables)
      .catch(setTablesErrors);

    return () => abortController.abort();
  }

  return (
    <Switch>
      <Route exact={true} path="/">
        <Redirect to={`/dashboard`} />
      </Route>
      <Route exact={true} path="/reservations">
        <Redirect to={`/dashboard`} />
      </Route>
      <Route exact={true} path="/reservations/new">
        <NewReservation 
          loadDashboard={loadDashboard}
        />
      </Route>
      <Route exact={true} path="/reservations/:reservation_id/edit">
        <NewReservation 
          loadDashboard={loadDashboard}
          edit={true}
        />
      </Route>
      <Route path="/reservations/:reservation_id/seat">
        <SeatReservation 
          tables={tables}
          loadDashboard={loadDashboard}
        />
      </Route>
      <Route path="/tables/new">
        <NewTable
          loadDashboard={loadDashboard}
        />
      </Route>
      
      <Route path="/dashboard">
        <Dashboard 
          date={date} 
          reservations={reservations}
          reservationsError={reservationsError}
          tables={tables}
          tablesError={tablesError}
          loadDashboard={loadDashboard}
        />
      </Route>
      <Route path="/search">
        <Search />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default Routes;
