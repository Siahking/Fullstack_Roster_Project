INSERT IGNORE INTO locations (location) VALUES 
('New York'),
('Mexico');

INSERT IGNORE INTO workers 
(first_name, last_name, middle_name, gender, address, contact, age, id_number, availability, hours)
VALUES
('John', 'Doe', 'A', 'Male', '123 Main St, New York, NY', '555-1234', 30, 123456789, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Jane', 'Smith', 'B', 'Female', '456 Elm St, Mexico City, MX', '555-5678', 28, 987654321, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Alice', 'Johnson', 'C', 'Female', '789 Oak St, Houston, TX', '555-9012', 35, 111222333, 'Eclipse', JSON_ARRAY('24hrs')),
('Bob', 'Brown', 'D', 'Male', '321 Pine St, Miami, FL', '555-3456', 40, 444555666, 'Specified', JSON_ARRAY('6am-6pm','2pm-10pm')),
('Charlie', 'Davis', 'E', 'Male', '654 Cedar St, Chicago, IL', '555-7890', 25, 777888999, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Eve', 'Miller', 'F', 'Female', '987 Spruce St, New York, NY', '555-2345', 32, 222333444, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Frank', 'Wilson', 'G', 'Male', '135 Maple St, Mexico City, MX', '555-6789', 29, 555666777, 'Eclipse', JSON_ARRAY('24hrs')),
('Grace', 'Taylor', 'H', 'Female', '246 Birch St, Houston, TX', '555-0123', 27, 888999000, 'Specified', JSON_ARRAY('6pm-6am','2pm-10pm')),
('Hank', 'Anderson', 'I', 'Male', '357 Walnut St, Miami, FL', '555-4567', 33, 333444555, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Ivy', 'Thomas', 'J', 'Female', '468 Chestnut St, Chicago, IL', '555-8901', 31, 666777888, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Jack', 'Garcia', 'K', 'Male', '579 Aspen St, New York, NY', '555-3456', 26, 999000111, 'Eclipse', JSON_ARRAY('24hrs')),
('Karen', 'Martinez', 'L', 'Female', '680 Poplar St, Mexico City, MX', '555-7890', 34, 444555667, 'Specified', JSON_ARRAY('6am-2pm','6pm-6am','2pm-10pm')),
('Leo', 'Robinson', 'M', 'Male', '791 Willow St, Houston, TX', '555-0123', 30, 777888998, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Mia', 'Clark', 'N', 'Female', '902 Fir St, Miami, FL', '555-4567', 28, 222333445, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Nina', 'Rodriguez', 'O', 'Female', '135 Maple St, Chicago, IL', '555-8901', 29, 555666778, 'Eclipse', JSON_ARRAY('24hrs')),
('Oscar', 'Lewis', 'P', 'Male', '246 Birch St, New York, NY', '555-2345', 31, 888999001, 'Specified', JSON_ARRAY('6am-6pm','6pm-6am')),
('Paul', 'Lee', 'Q', 'Male', '357 Walnut St, Mexico City, MX', '555-6789', 27, 333444556, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Quinn', 'Walker', 'R', 'Female', '468 Chestnut St, Houston, TX', '555-0123', 32, 666777889, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Rachel', 'Hall', 'S', 'Female', '579 Aspen St, Miami, FL', '555-4567', 30, 999000112, 'Eclipse', JSON_ARRAY('24hrs')),
('Steve', 'Young', 'T', 'Male', '680 Elm St, Chicago, IL', '555-8901', 26, 111222334, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Tina', 'Allen', 'U', 'Female', '791 Pine St, New York, NY', '555-2345', 29, 444555668, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Uma', 'King', 'V', 'Female', '902 Cedar St, Mexico City, MX', '555-6789', 27, 777888997, 'Eclipse', JSON_ARRAY('24hrs')),
('Victor', 'Wright', 'W', 'Male', '135 Spruce St, Houston, TX', '555-0123', 31, 222333446, 'Specified', JSON_ARRAY('6am-6pm','6am-2pm','2pm-10pm')),
('Wendy', 'Scott', 'X', 'Female', '246 Walnut St, Miami, FL', '555-4567', 28, 555666779, 'Day', JSON_ARRAY('6am-6pm','6am-2pm')),
('Xander', 'Green', 'Y', 'Male', '357 Chestnut St, Chicago, IL', '555-8901', 30, 888999002, 'Night', JSON_ARRAY('6pm-6am','10pm-6am')),
('Yara', 'Adams', 'Z', 'Female', '468 Aspen St, New York, NY', '555-2345', 29, 333444557, 'Specified', JSON_ARRAY('2pm-10pm','10pm-6am'));

INSERT IGNORE INTO worker_locations (worker_id, location_id) VALUES
(1, 1), (2, 2), (3, 1), (4, 2), (5, 1),
(6, 1), (7, 2), (8, 1), (9, 2), (10, 1),
(11, 1), (12, 2), (13, 1), (14, 2), (15, 1),
(16, 1), (17, 2), (18, 1), (19, 2), (20, 1),
(21, 1), (22, 2), (23, 1), (24, 2), (25, 1);

INSERT IGNORE INTO days_off (worker_id, start_date, end_date) VALUES
(1, '2026-01-01', '2026-01-07'),
(2, '2026-02-01', '2026-02-05'),
(10, '2026-10-01', '2026-10-20');

INSERT INTO worker_constraints (worker1_id, worker2_id, note) VALUES
(1, 2, 'Cannot work together due to conflicting schedules.'),
(3, 4, 'Prefer not to work together due to personal differences.');

INSERT IGNORE INTO permanent_restrictions (worker_id, day_of_week) VALUES
(1, 'Monday'),
(2, 'Tuesday'),
(3, 'Wednesday');

