
CREATE TABLE t_p86039137_client_cabinet_syste.documents (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.objects(id),
  uploaded_by INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Документ',
  s3_key TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p86039137_client_cabinet_syste.photos (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.objects(id),
  uploaded_by INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(100),
  tag VARCHAR(50) DEFAULT 'Фото',
  s3_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_object ON t_p86039137_client_cabinet_syste.documents(object_id);
CREATE INDEX idx_photos_object ON t_p86039137_client_cabinet_syste.photos(object_id);
