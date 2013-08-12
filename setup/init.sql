DROP TABLE games;
DROP TABLE moves;
DROP TABLE players;
DROP TABLE users;

CREATE TABLE games (
  id bigserial primary key,
  name varchar(200),
  -- seed varchar(200), # we need a random seed being stored too
  user_id bigint NOT NULL,
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
  position int NOT NULL
);

CREATE UNIQUE INDEX players_game_user ON players (game_id, user_id);
CREATE UNIQUE INDEX players_game_position ON players (game_id, position);

CREATE TABLE users (
  id bigserial primary key,
  name varchar(200) NOT NULL,
  facebook_id varchar(200),
  twitter_id varchar(200),
  password varchar(200),
  profile_image_url varchar(200),
  human boolean default FALSE
);


CREATE UNIQUE INDEX users_name ON users (name);

INSERT INTO users (id, name) VALUES (1, 'josh');
INSERT INTO users (id, name) VALUES (2, 'jen');
INSERT INTO users (id, name) VALUES (3, 'phuc');
INSERT INTO users (id, name) VALUES (4, 'gabe');

INSERT INTO games (id, name, user_id) VALUES (1, 'hearts', 1);

INSERT INTO players (game_id, user_id, position) VALUES (1, 1, 0);
INSERT INTO players (game_id, user_id, position) VALUES (1, 2, 1);
INSERT INTO players (game_id, user_id, position) VALUES (1, 3, 2);
INSERT INTO players (game_id, user_id, position) VALUES (1, 4, 3);
