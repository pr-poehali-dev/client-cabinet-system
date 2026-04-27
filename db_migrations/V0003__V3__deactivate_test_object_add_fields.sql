-- Деактивируем пробный объект Краснодар
UPDATE t_p86039137_client_cabinet_syste.objects SET is_active = FALSE WHERE id = 1;
UPDATE t_p86039137_client_cabinet_syste.users SET object_id = NULL WHERE object_id = 1;

-- Добавляем поля в objects
ALTER TABLE t_p86039137_client_cabinet_syste.objects
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES t_p86039137_client_cabinet_syste.users(id),
  ADD COLUMN IF NOT EXISTS description TEXT;
