-- Восстанавливаем проекты, которые были скрыты старым кодом архивирования
-- (is_active=FALSE, но archived_at IS NULL — значит это "архив", а не удаление)
UPDATE t_p86039137_client_cabinet_syste.objects
SET is_active = TRUE,
    archived_at = NOW()
WHERE is_active = FALSE AND archived_at IS NULL;
