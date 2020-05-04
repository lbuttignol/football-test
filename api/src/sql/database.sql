-- DROP DATABASE IF EXISTS footballDb;
CREATE DATABASE IF NOT EXISTS footballdb;

USE footballdb

CREATE TABLE IF NOT EXISTS competitions (
  id        INT NOT NULL PRIMARY KEY,
  name      VARCHAR(255),
  code      VARCHAR(3) NOT NULL,
  areaName  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS teams (
  id        INT NOT NULL PRIMARY KEY,
  name      VARCHAR(255),
  tla       VARCHAR(255),
  shortName VARCHAR(255),
  areaName  VARCHAR(255),
  email     VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS players (
  id              INT NOT NULL PRIMARY KEY,
  name            VARCHAR(255),
  position        VARCHAR(255),
  dateOfBirth     DATE,
  countryOfBirth  VARCHAR(255),
  nacionality     VARCHAR(255)
);

INSERT INTO competitions (id, name,code, areaName) values (
1, 'equipo1','arg','argentina');