INSERT INTO locations (location) VALUES
('New York'),
('Mexico')
ON CONFLICT DO NOTHING;

INSERT INTO workers
(first_name, last_name, middle_name, gender, address, contact, age, id_number, availability, hours)
VALUES
('John', 'Doe', 'A', 'Male', '123 Main St, New York, NY', '555-1234', 30, 123456789, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Jane', 'Smith', 'B', 'Female', '456 Elm St, Mexico City, MX', '555-5678', 28, 987654321, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Alice', 'Johnson', 'C', 'Female', '789 Oak St, Houston, TX', '555-9012', 35, 111222333, 'Eclipse', '["24hrs"]'::jsonb),
('Bob', 'Brown', 'D', 'Male', '321 Pine St, Miami, FL', '555-3456', 40, 444555666, 'Specified', '["6am-6pm","2pm-10pm"]'::jsonb),
('Charlie', 'Davis', 'E', 'Male', '654 Cedar St, Chicago, IL', '555-7890', 25, 777888999, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Eve', 'Miller', 'F', 'Female', '987 Spruce St, New York, NY', '555-2345', 32, 222333444, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Frank', 'Wilson', 'G', 'Male', '135 Maple St, Mexico City, MX', '555-6789', 29, 555666777, 'Eclipse', '["24hrs"]'::jsonb),
('Grace', 'Taylor', 'H', 'Female', '246 Birch St, Houston, TX', '555-0123', 27, 888999000, 'Specified', '["6pm-6am","2pm-10pm"]'::jsonb),
('Hank', 'Anderson', 'I', 'Male', '357 Walnut St, Miami, FL', '555-4567', 33, 333444555, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Ivy', 'Thomas', 'J', 'Female', '468 Chestnut St, Chicago, IL', '555-8901', 31, 666777888, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Jack', 'Garcia', 'K', 'Male', '579 Aspen St, New York, NY', '555-3456', 26, 999000111, 'Eclipse', '["24hrs"]'::jsonb),
('Karen', 'Martinez', 'L', 'Female', '680 Poplar St, Mexico City, MX', '555-7890', 34, 444555667, 'Specified', '["6am-2pm","6pm-6am","2pm-10pm"]'::jsonb),
('Leo', 'Robinson', 'M', 'Male', '791 Willow St, Houston, TX', '555-0123', 30, 777888998, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Mia', 'Clark', 'N', 'Female', '902 Fir St, Miami, FL', '555-4567', 28, 222333445, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Nina', 'Rodriguez', 'O', 'Female', '135 Maple St, Chicago, IL', '555-8901', 29, 555666778, 'Eclipse', '["24hrs"]'::jsonb),
('Oscar', 'Lewis', 'P', 'Male', '246 Birch St, New York, NY', '555-2345', 31, 888999001, 'Specified', '["6am-6pm","6pm-6am"]'::jsonb),
('Paul', 'Lee', 'Q', 'Male', '357 Walnut St, Mexico City, MX', '555-6789', 27, 333444556, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Quinn', 'Walker', 'R', 'Female', '468 Chestnut St, Houston, TX', '555-0123', 32, 666777889, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Rachel', 'Hall', 'S', 'Female', '579 Aspen St, Miami, FL', '555-4567', 30, 999000112, 'Eclipse', '["24hrs"]'::jsonb),
('Steve', 'Young', 'T', 'Male', '680 Elm St, Chicago, IL', '555-8901', 26, 111222334, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Tina', 'Allen', 'U', 'Female', '791 Pine St, New York, NY', '555-2345', 29, 444555668, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Uma', 'King', 'V', 'Female', '902 Cedar St, Mexico City, MX', '555-6789', 27, 777888997, 'Eclipse', '["24hrs"]'::jsonb),
('Victor', 'Wright', 'W', 'Male', '135 Spruce St, Houston, TX', '555-0123', 31, 222333446, 'Specified', '["6am-6pm","6am-2pm","2pm-10pm"]'::jsonb),
('Wendy', 'Scott', 'X', 'Female', '246 Walnut St, Miami, FL', '555-4567', 28, 555666779, 'Day', '["6am-6pm","6am-2pm"]'::jsonb),
('Xander', 'Green', 'Y', 'Male', '357 Chestnut St, Chicago, IL', '555-8901', 30, 888999002, 'Night', '["6pm-6am","10pm-6am"]'::jsonb),
('Yara', 'Adams', 'Z', 'Female', '468 Aspen St, New York, NY', '555-2345', 29, 333444557, 'Specified', '["2pm-10pm","10pm-6am"]'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO worker_locations (worker_id, location_id) VALUES
(1, 1), (2, 2), (3, 1), (4, 2), (5, 1),
(6, 1), (7, 2), (8, 1), (9, 2), (10, 1),
(11, 1), (12, 2), (13, 1), (14, 2), (15, 1),
(16, 1), (17, 2), (18, 1), (19, 2), (20, 1),
(21, 1), (22, 2), (23, 1), (24, 2), (25, 1)
ON CONFLICT DO NOTHING;

INSERT INTO days_off (worker_id, start_date, end_date) VALUES
(1, '2026-01-01', '2026-01-07'),
(2, '2026-02-01', '2026-02-05'),
(10, '2026-10-01', '2026-10-20')
ON CONFLICT DO NOTHING;

INSERT INTO worker_constraints (worker1_id, worker2_id, note) VALUES
(1, 2, 'Cannot work together due to conflicting schedules.'),
(3, 4, 'Prefer not to work together due to personal differences.')
ON CONFLICT DO NOTHING;

INSERT INTO permanent_restrictions (worker_id, day_of_week) VALUES
(1, 'Monday'),
(2, 'Tuesday'),
(3, 'Wednesday')
ON CONFLICT DO NOTHING;

