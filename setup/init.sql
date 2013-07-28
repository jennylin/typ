CREATE TABLE games (
  id bigserial primary key,
  finished boolean default FALSE,
  created_at timestamp default now()
);

CREATE TABLE moves (
  id bigserial primary key,
  game_id bigint NOT NULL,
  player_id bigint NOT NULL
);

CREATE UNIQUE INDEX moves_game_index ON moves (game_id);

CREATE TABLE players (
  id bigserial primary key,
  game_id bigint NOT NULL,
  user_id bigint NOT NULL,
  position int
);

CREATE UNIQUE INDEX players_game_user_index ON players (game_id, user_id);

CREATE TABLE users (
  id bigserial primary key,
  name varchar(200) NOT NULL,
  password varchar(200) NOT NULL
);