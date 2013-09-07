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
  question_id int NOT NULL,
  position int NOT NULL,
  action json,
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

INSERT INTO moves (game_id, question_id, position, action) VALUES (1, 0, 0, '["Aclubs","2diamonds","Jdiamonds"]');
INSERT INTO moves (game_id, question_id, position, action) VALUES (1, 1, 1, '["8spades","Aspades","10diamonds"]');
INSERT INTO moves (game_id, question_id, position, action) VALUES (1, 2, 2, '["Ahearts","4spades","7diamonds"]');
INSERT INTO moves (game_id, question_id, position, action) VALUES (1, 3, 3, '["Qdiamonds","3diamonds","6spades"]');

-- # player 0 has [{"suit":"clubs","rank":14,"id":"Aclubs"},{"suit":"diamonds","rank":2,"id":"2diamonds"},{"suit":"spades","rank":13,"id":"Kspades"},{"suit":"spades","rank":7,"id":"7spades"},{"suit":"spades","rank":5,"id":"5spades"},{"suit":"spades","rank":9,"id":"9spades"},{"suit":"hearts","rank":8,"id":"8hearts"},{"suit":"clubs","rank":7,"id":"7clubs"},{"suit":"clubs","rank":6,"id":"6clubs"},{"suit":"clubs","rank":5,"id":"5clubs"},{"suit":"diamonds","rank":11,"id":"Jdiamonds"},{"suit":"spades","rank":10,"id":"10spades"},{"suit":"spades","rank":3,"id":"3spades"}]
-- # player 1 has [{"suit":"spades","rank":8,"id":"8spades"},{"suit":"hearts","rank":4,"id":"4hearts"},{"suit":"spades","rank":11,"id":"Jspades"},{"suit":"diamonds","rank":8,"id":"8diamonds"},{"suit":"spades","rank":14,"id":"Aspades"},{"suit":"clubs","rank":4,"id":"4clubs"},{"suit":"diamonds","rank":13,"id":"Kdiamonds"},{"suit":"hearts","rank":12,"id":"Qhearts"},{"suit":"hearts","rank":6,"id":"6hearts"},{"suit":"clubs","rank":2,"id":"2clubs"},{"suit":"clubs","rank":8,"id":"8clubs"},{"suit":"hearts","rank":5,"id":"5hearts"},{"suit":"diamonds","rank":10,"id":"10diamonds"}]
-- # player 2 has [{"suit":"hearts","rank":9,"id":"9hearts"},{"suit":"spades","rank":4,"id":"4spades"},{"suit":"hearts","rank":13,"id":"Khearts"},{"suit":"hearts","rank":14,"id":"Ahearts"},{"suit":"diamonds","rank":6,"id":"6diamonds"},{"suit":"diamonds","rank":9,"id":"9diamonds"},{"suit":"hearts","rank":3,"id":"3hearts"},{"suit":"clubs","rank":3,"id":"3clubs"},{"suit":"clubs","rank":13,"id":"Kclubs"},{"suit":"spades","rank":12,"id":"Qspades"},{"suit":"diamonds","rank":7,"id":"7diamonds"},{"suit":"clubs","rank":10,"id":"10clubs"},{"suit":"spades","rank":2,"id":"2spades"}]
-- # player 3 has [{"suit":"diamonds","rank":5,"id":"5diamonds"},{"suit":"hearts","rank":10,"id":"10hearts"},{"suit":"clubs","rank":9,"id":"9clubs"},{"suit":"clubs","rank":12,"id":"Qclubs"},{"suit":"diamonds","rank":3,"id":"3diamonds"},{"suit":"hearts","rank":7,"id":"7hearts"},{"suit":"diamonds","rank":12,"id":"Qdiamonds"},{"suit":"clubs","rank":11,"id":"Jclubs"},{"suit":"diamonds","rank":4,"id":"4diamonds"},{"suit":"hearts","rank":11,"id":"Jhearts"},{"suit":"diamonds","rank":14,"id":"Adiamonds"},{"suit":"spades","rank":6,"id":"6spades"},{"suit":"hearts","rank":2,"id":"2hearts"}]
