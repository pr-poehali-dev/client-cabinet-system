CREATE TABLE IF NOT EXISTS t_p86039137_client_cabinet_syste.notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
    type        VARCHAR(30) NOT NULL DEFAULT 'info',
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    meta        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p86039137_client_cabinet_syste.join_requests (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.users(id),
    object_id   INTEGER NOT NULL REFERENCES t_p86039137_client_cabinet_syste.objects(id),
    message     TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES t_p86039137_client_cabinet_syste.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, object_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON t_p86039137_client_cabinet_syste.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON t_p86039137_client_cabinet_syste.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_join_requests_object ON t_p86039137_client_cabinet_syste.join_requests(object_id, status);
