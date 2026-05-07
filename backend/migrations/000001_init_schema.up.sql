CREATE TABLE locations(
    id INT PRIMARY KEY AUTO_INCREMENT,
    location VARCHAR(255) NOT NULL UNIQUE
);

CREATE Table workers(
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    gender VARCHAR(6),
    address TEXT NOT NULL,
    contact VARCHAR(15),
    age INT NOT NULL,
    id_number INT UNIQUE NOT NULL,
    availability ENUM("Day","Night","Eclipse","Specified") NOT NULL,
    hours JSON NOT NULL
);

CREATE TABLE worker_locations(
    id INT PRIMARY KEY AUTO_INCREMENT,
    worker_id INT,
    location_id INT,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE (worker_id, location_id)
);

CREATE TABLE days_off(
    break_id INT PRIMARY KEY AUTO_INCREMENT,
    worker_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    CHECK (start_date <= end_date),
    UNIQUE (worker_id, start_date,end_date)
);

CREATE TABLE worker_constraints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker1_id INT NOT NULL,
    worker2_id INT NOT NULL,
    note TEXT,
    CONSTRAINT unique_constraint UNIQUE (worker1_id, worker2_id),  -- To prevent duplicate constraints
    FOREIGN KEY (worker1_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (worker2_id) REFERENCES workers(id) ON DELETE CASCADE
);

CREATE TABLE permanent_restrictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    day_of_week ENUM('Any','Sunday','Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday') DEFAULT 'Any',
    start_time TIME NULL,
    end_time TIME NULL,

    start_time_normalized TIME GENERATED ALWAYS AS (IFNULL(start_time, "00:00:00")) STORED,
    end_time_normalized TIME GENERATED ALWAYS AS (IFNULL(end_time, "00:00:00")) STORED,


    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time),
    UNIQUE (worker_id,day_of_week,start_time_normalized,end_time_normalized)
);

CREATE TABLE occupancy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    event_date DATE NOT NULL,
    note TEXT,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    CONSTRAINT unique_occupancy UNIQUE (worker_id,event_date)
);

CREATE TABLE roster (
    roster_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year INT NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE (location_id,month,year)
);

CREATE TABLE roster_entries(
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    roster_id INT NOT NULL,
    worker_id INT NOT NULL,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(10) NOT NULL,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (roster_id) REFERENCES roster(roster_id) ON DELETE CASCADE,
    UNIQUE( roster_id,worker_id,shift_date,shift_type )
);

CREATE TABLE user_accounts(
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    UNIQUE(username)
);