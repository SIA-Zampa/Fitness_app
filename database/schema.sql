CREATE DATABASE IF NOT EXISTS fitness_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fitness_app;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    goal ENUM('dimagrimento', 'massa', 'forza', 'benessere', 'mobilita') NOT NULL DEFAULT 'benessere',
    height_cm SMALLINT UNSIGNED NULL,
    starting_weight_kg DECIMAL(5,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    level ENUM('principiante', 'intermedio', 'avanzato') NOT NULL,
    duration_weeks TINYINT UNSIGNED NOT NULL,
    weekly_sessions TINYINT UNSIGNED NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workouts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plan_id INT UNSIGNED NOT NULL,
    title VARCHAR(140) NOT NULL,
    day_number TINYINT UNSIGNED NOT NULL,
    estimated_minutes SMALLINT UNSIGNED NOT NULL,
    notes TEXT NULL,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
);

CREATE TABLE exercises (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(140) NOT NULL,
    muscle_group VARCHAR(80) NOT NULL,
    equipment VARCHAR(80) NULL,
    instructions TEXT NOT NULL
);

CREATE TABLE workout_exercises (
    workout_id INT UNSIGNED NOT NULL,
    exercise_id INT UNSIGNED NOT NULL,
    sets TINYINT UNSIGNED NOT NULL,
    reps VARCHAR(40) NOT NULL,
    rest_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 60,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY (workout_id, exercise_id),
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE progress_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    logged_at DATE NOT NULL,
    weight_kg DECIMAL(5,2) NULL,
    calories INT UNSIGNED NULL,
    workout_completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO workout_plans (name, level, duration_weeks, weekly_sessions, description) VALUES
('Forza', 'intermedio', 4, 4, 'Progressione sui fondamentali, core e recupero attivo.'),
('Dimagrimento', 'principiante', 6, 3, 'Circuiti metabolici, camminata veloce e mobilita.'),
('Mobilita', 'principiante', 2, 5, 'Routine brevi per postura, elasticita e respirazione.');
