CREATE DATABASE footballDb;

USE footballDb;

SHOW TABLES;

CREATE TABLE Competitions (
  code INT NOT NULL PRIMARY KEY,
  name VARCHAR(100),
  areaName VARCHAR(100)
);

DESCRIBE footballDb;

INSERT INTO Competitions (code, name, area) values (
1, 'equipo1','argentina');

Select * FROM Competitions;