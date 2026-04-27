
-- Пароль: admin123 (sha256)
INSERT INTO t_p86039137_client_cabinet_syste.users (login, password_hash, full_name, role_id, object_id, is_active)
VALUES (
  'admin',
  encode(sha256('admin123'::bytea), 'hex'),
  'Администратор системы',
  (SELECT id FROM t_p86039137_client_cabinet_syste.roles WHERE code = 'admin'),
  NULL,
  TRUE
);
