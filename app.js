const express = require("express");

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjToResObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

//API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
   SELECT *
   FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjToResObj(eachState))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
      SELECT 
      *
       FROM
     state 
      WHERE state_id = ${stateId};`;
  const gotState = await db.get(getStateIdQuery);
  response.send(convertDbObjToResObj(gotState));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  //console.log(districtDetails);
  const { stateId, cases, cured, active, deaths } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO 
  district 
  (state_id,cases,cured,active,deaths)
  VALUES(
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );`;
  const dbResponse = await db.run(addDistrictQuery);
  const districtId = dbResponse.lastID;
  const updatedDistrict = { districtId: districtId };
  // console.log(updatedDistrict);
  response.send("District Successfully Added");
});

const convertDbToRes = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getSpecificDistrictQuery = `
        SELECT 
        *
        FROM district
        WHERE 
        district_id = ${districtId};`;
  const gotDistrict = await db.get(getSpecificDistrictQuery);
  response.send(convertDbToRes(gotDistrict));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
      DELETE FROM district 
      WHERE district_id = ${districtId};`;
  const dbResp = await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  console.log(districtDetails);
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = `
  UPDATE district 
  SET 
   district_name = '${districtName}',
   state_id = ${stateId},
   cases = ${cases},
   cured = ${cured},
   active = ${active},
   deaths = ${deaths}
   WHERE district_id = ${districtId};
   `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
  SELECT 
  SUM(cases) AS totalCases,
  SUM(cured)AS totalCured,
  SUM(active)AS totalActive,
  SUM(deaths)AS totalDeaths
  FROM district 
  WHERE state_id = ${stateId};`;
  const totalResponse = await db.get(statsQuery);
  response.send(totalResponse);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT 
    state_name AS stateName
    FROM
     district 
     NATURAL JOIN state
     WHERE district_id= ${districtId};`;
  const responseState = await db.get(getStateNameQuery);
  response.send(responseState);
});

module.exports = app;
