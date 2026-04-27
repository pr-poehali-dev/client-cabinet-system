ALTER TABLE t_p86039137_client_cabinet_syste.objects
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
