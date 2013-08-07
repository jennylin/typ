CREATE TABLE games (
  id bigserial primary key,
  name varchar(200),
  -- seed varchar(200), # we need a random seed being stored too
  finished boolean default FALSE,
  created_at timestamp default now()
);

CREATE INDEX games_finished ON games (finished);

CREATE TABLE moves (
  id bigserial primary key,
  game_id bigint NOT NULL,
  position int NOT NULL,
  action varchar(200),
  created_at timestamp default now()
);

CREATE INDEX moves_game ON moves (game_id);

CREATE TABLE players (
  id bigserial primary key,
  game_id bigint NOT NULL,
  user_id bigint NOT NULL,
  position int
);

CREATE UNIQUE INDEX players_game_user ON players (game_id, user_id);
CREATE UNIQUE INDEX players_game_game_position ON players (game_id, position);

CREATE TABLE users (
  id bigserial primary key,
  name varchar(200) NOT NULL,
  password varchar(200) NOT NULL,
  human boolean default FALSE
);

CREATE UNIQUE INDEX users_name ON users (name);
