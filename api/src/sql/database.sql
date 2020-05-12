-- DROP DATABASE IF EXISTS footballDb;
CREATE DATABASE IF NOT EXISTS footballdb 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
-- SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE footballdb;

CREATE TABLE IF NOT EXISTS competitions (
  id        INT NOT NULL PRIMARY KEY,
  name      VARCHAR(255),
  code      VARCHAR(3) NOT NULL,
  areaName  VARCHAR(255)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teams (
  id        INT NOT NULL PRIMARY KEY,
  name      VARCHAR(255) ,
  tla       VARCHAR(255) ,
  shortName VARCHAR(255) ,
  areaName  VARCHAR(255) ,
  email     VARCHAR(255) 
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comp_teams (
  competition_id  INT NOT NULL ,
  team_id        INT NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES competitions(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS players (
  id              INT NOT NULL PRIMARY KEY,
  name            VARCHAR(255) ,
  position        VARCHAR(255) ,
  dateOfBirth     DATE,
  countryOfBirth  VARCHAR(255) ,
  nationality     VARCHAR(255) 
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_players (
  team_id     INT NOT NULL ,
  player_id   INT NOT NULL , 
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;