# Exercise

The goal is to make a project that exposes an API with an HTTP GET in this 
URI: /import-league/{leagueCode} . E.g., it must be possible to invoke the 
service using this URL:
`http://localhost:<port>/import-league/CL`
 
The service implementation must get data using the given {leagueCode}, by 
making requests to the http://www.football-data.org/ API (you can see the 
documentation entering to the site, use the API v2),  and import the data into 
a DB (MySQL is suggested, but you can use any DB of your preference). The data 
requested is:

```
Competition ("name", "code", "areaName")
Team ("name", "tla", "shortName", "areaName", "email")
Player("name", "position", "dateOfBirth", "countryOfBirth", "nationality")
```
 
Feel free to add to this data structure any other field that you might need 
(for the foreign keys relationship).
 
Additionally, expose an HTTP GET in URI /total-players/{leagueCode}  , with a 
simple JSON response like this:

{"total" : N } and HTTP Code 200.

Where N is the total amount of players belonging to all teams that participate 
in the given league (leagueCode). This service must rely exclusively on the 
data saved inside the DB (it must not access the API football-data.org). If the
given leagueCode is not present into the DB, it should respond an HTTP Code 404.
 
Once you have finished the project, you must upload all the relevant files 
inside a ZIP compressed file. It must include all the sources, plus the files 
related to project configuration and/or dependency management. 
 
## Remarks
 
- You are allowed to use any library related to the language in which you are 
implementing the project.

- You must provide the SQL for data structure creation; it is a plus that the 
project automatically creates the structure (if it doesn't exist) when it runs 
the first time.

- All the mentioned DB entities must keep their proper relationships (the 
players with which team they belong to; the teams in which leagues participate).

- The API responses for /import-league/{leagueCode} are:
 
	-- HttpCode 201, {"message": "Successfully imported"} --> When the leagueCode was
 successfully imported.
 
 	-- HttpCode 409, {"message": "League already imported"} --> If the given 
 leagueCode was already imported into the DB (and in this case, it doesn't need
 to be imported again).
 
 	-- HttpCode 404, {"message": "Not found" } --> if the leagueCode was not found.
 
 	-- HttpCode 504, {"message": "Server Error" } --> If there is any connectivity 
 issue either with the football API or the DB server.
 
- It might happen that when a given leagueCode is being imported, the league 
has participant teams that are already imported (because each team might belong
to one or more leagues). For these cases, it must add the relationship between 
the league and the team(s) (and omit the process of the preexistent teams and 
their players).


## Requeriments

To run this application must have docker in your server: https://www.docker.com/get-started

## Running This App

From the home folder, run the following commands:

For the very first build:

- `$ docker-compose up --build`

The server can be hit at `http://localhost:3000/`


The MySQL database will be running inside a docker container, to access must run :
`docker exec -it football-test_db_1 /bin/bash`

