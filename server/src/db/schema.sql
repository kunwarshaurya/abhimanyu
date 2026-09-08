-- ============================================================
-- Abhimanyu — Conveyor Health Monitoring System
-- Database Schema v1.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS abhimanyu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE abhimanyu;

-- ----------------------------------------------------------
-- Sensor readings (temperature, voltage, current, power, etc.)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  conveyor_id   VARCHAR(32)   NOT NULL DEFAULT 'CONV-01',
  recorded_at   DATETIME(3)   NOT NULL COMMENT 'Timestamp from AI/ML payload',
  temperature   DECIMAL(8,3),
  voltage       DECIMAL(8,3),
  current       DECIMAL(8,4),
  power         DECIMAL(8,3),
  distance      DECIMAL(8,3),
  motor_speed   DECIMAL(8,3),
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_sensor_conveyor_time (conveyor_id, recorded_at),
  INDEX idx_sensor_time (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Vibration / IMU readings (MPU6050 accelerometer + gyroscope)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vibration_readings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  conveyor_id   VARCHAR(32)   NOT NULL DEFAULT 'CONV-01',
  recorded_at   DATETIME(3)   NOT NULL,
  acc_x         DECIMAL(10,4),
  acc_y         DECIMAL(10,4),
  acc_z         DECIMAL(10,4),
  gyro_x        DECIMAL(10,4),
  gyro_y        DECIMAL(10,4),
  gyro_z        DECIMAL(10,4),
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_vibration_conveyor_time (conveyor_id, recorded_at),
  INDEX idx_vibration_time (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Detection results (crack detection from AI/ML)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS detections (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conveyor_id     VARCHAR(32)   NOT NULL DEFAULT 'CONV-01',
  recorded_at     DATETIME(3)   NOT NULL,
  crack_detected  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_detection_conveyor_time (conveyor_id, recorded_at),
  INDEX idx_detection_time (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Health assessments (score, confidence, status from AI/ML)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_assessments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  conveyor_id   VARCHAR(32)   NOT NULL DEFAULT 'CONV-01',
  recorded_at   DATETIME(3)   NOT NULL,
  score         DECIMAL(6,2),
  confidence    DECIMAL(5,3),
  status        VARCHAR(32),
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_health_conveyor_time (conveyor_id, recorded_at),
  INDEX idx_health_time (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Alerts from AI/ML
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conveyor_id     VARCHAR(32)   NOT NULL DEFAULT 'CONV-01',
  alert_id        INT           COMMENT 'Alert ID from AI/ML payload',
  alert_time      DATETIME(3)   COMMENT 'Alert timestamp from AI/ML payload',
  message         TEXT,
  damage_severity VARCHAR(32),
  recorded_at     DATETIME(3)   NOT NULL COMMENT 'Payload-level timestamp',
  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_alert_conveyor_time (conveyor_id, recorded_at),
  INDEX idx_alert_time (recorded_at),
  INDEX idx_alert_severity (damage_severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
