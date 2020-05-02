CREATE DATABASE footballDb;

USE footballDb;

CREATE TABLE Competitions (
  code INT NOT NULL PRIMARY KEY,
  name VARCHAR(100),
  areaName VARCHAR(100)
);

INSERT INTO Competitions (code, name, areaName) values (
1, 'equipo1','argentina');
