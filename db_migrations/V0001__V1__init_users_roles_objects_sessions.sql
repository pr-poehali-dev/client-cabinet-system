
CREATE TABLE t_p86039137_client_cabinet_syste.roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  has_global_access BOOLEAN DEFAULT FALSE
);

INSERT INTO t_p86039137_client_cabinet_syste.roles (code, name, has_global_access) VALUES
  ('admin',       'Администратор',        TRUE),
  ('head',        'Руководитель проекта', TRUE),
  ('manager',     'Менеджер проекта',     TRUE),
  ('supply',      'Снабжение',            TRUE),
  ('foreman',     'Операционный контроль (прораб)', TRUE),
  ('client',      'Заказчик',             FALSE),
  ('designer',    'Проектировщик',        FALSE),
  ('supervision', 'Технический надзор',   FALSE),
  ('contractor',  'Подрядчик',            FALSE);

CREATE TABLE t_p86039137_client_cabinet_syste.objects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  area_m2 NUMERIC(10,2),
  started_at DATE,
  deadline_at DATE,
  progress_pct INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p86039137_client_cabinet_syste.objects (name, address, area_m2, started_at, deadline_at, progress_pct) VALUES
  ('Дом 180 м² · Краснодар', 'Краснодар, ул. Садовая 15', 180, '2025-01-10', '2025-08-15', 58);

CREATE TABLE t_p86039137_client_cabinet_syste.users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.roles(id),
  object_id INTEGER REFERENCES t_p86039137_client_cabinet_syste.objects(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE t_p86039137_client_cabinet_syste.sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT
);

CREATE TABLE t_p86039137_client_cabinet_syste.activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
