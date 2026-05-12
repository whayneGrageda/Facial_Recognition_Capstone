-- Create security_alerts table for storing spoofing detection events
CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'SPOOF',
    camera_type VARCHAR(20) NOT NULL, -- 'time-in' or 'time-out'
    ai_analysis TEXT NOT NULL,
    image_path VARCHAR(500),
    severity VARCHAR(20) DEFAULT 'high', -- 'low', 'medium', 'high', 'critical'
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Additional data like confidence scores, etc.
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_is_resolved ON security_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_alert_type ON security_alerts(alert_type);
