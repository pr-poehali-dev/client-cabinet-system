-- Таблица чатов по проектам
CREATE TABLE t_p86039137_client_cabinet_syste.chats (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.objects(id),
  name VARCHAR(255) NOT NULL DEFAULT 'Общий чат',
  created_by INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Участники чата (менеджер добавляет конкретных людей)
CREATE TABLE t_p86039137_client_cabinet_syste.chat_members (
  chat_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.chats(id),
  user_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- Сообщения чата
CREATE TABLE t_p86039137_client_cabinet_syste.chat_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.chats(id),
  user_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Сертификаты материалов (загружает снабжение)
CREATE TABLE t_p86039137_client_cabinet_syste.certificates (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.objects(id),
  uploaded_by INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  name VARCHAR(255) NOT NULL,
  material VARCHAR(100),
  vendor VARCHAR(100),
  issued_date DATE,
  s3_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Этапы Ганта — создаёт руководитель проекта
CREATE TABLE t_p86039137_client_cabinet_syste.gantt_stages (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.objects(id),
  name VARCHAR(255) NOT NULL,
  start_day INTEGER NOT NULL DEFAULT 0,
  plan_duration INTEGER NOT NULL DEFAULT 0,
  fact_duration INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'planned',
  color VARCHAR(30) NOT NULL DEFAULT '195,100%,50%',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chats_object ON t_p86039137_client_cabinet_syste.chats(object_id);
CREATE INDEX idx_chat_messages_chat ON t_p86039137_client_cabinet_syste.chat_messages(chat_id);
CREATE INDEX idx_certificates_object ON t_p86039137_client_cabinet_syste.certificates(object_id);
CREATE INDEX idx_gantt_object ON t_p86039137_client_cabinet_syste.gantt_stages(object_id);
