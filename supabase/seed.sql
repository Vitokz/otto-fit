-- Supabase Seed Data
-- This file contains seed data for development and testing purposes
-- Run with: supabase db reset --db-url <your-db-url>
-- =============================================================================
-- SEED DATA
-- =============================================================================
-- Activity Categories with fixed UUIDs
-- Test user profile
INSERT INTO
    user_profiles (
        telegram_id,
        first_name,
        last_name,
        username,
        gender,
        height,
        weight,
        birth_date,
        profile_completed,
        created_at,
        updated_at
    )
VALUES
    (
        123456789,
        'Виталий',
        'Казиев',
        'testuser',
        'male',
        182,
        81.00,
        '2002-09-11',
        true,
        '2025-10-01 18:03:36.730841+00',
        '2025-10-01 18:03:36.706+00'
    );

INSERT INTO
    activity_categories (id, name, sort_order)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Тяжелая атлетика',
        1
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Классические упражнения',
        2
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Выносливость',
        3
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Гимнастика',
        4
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Метконы',
        5
    );

-- Insert default measurement units with fixed UUIDs
INSERT INTO
    measurement_units (id, name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'кг.'),
    ('22222222-2222-2222-2222-222222222222', 'мин.');

-- Exercises for Тяжелая атлетика
INSERT INTO
    exercises (id, category_id, name, sort_order)
VALUES
    (
        'e1111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Рывок в сед',
        1
    ),
    (
        'e2222222-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Рывок в стойку',
        2
    ),
    (
        'e3333333-3333-3333-3333-333333333333',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Взятие в стойку',
        3
    ),
    (
        'e4444444-4444-4444-4444-444444444444',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Взятие в сед',
        4
    ),
    (
        'e5555555-5555-5555-5555-555555555555',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Швунг толчковый',
        5
    ),
    (
        'e6666666-6666-6666-6666-666666666666',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Швунг жимовой',
        6
    ),
    (
        'e7777777-7777-7777-7777-777777777777',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Ножницы со стоек',
        7
    ),
    (
        'e8888888-8888-8888-8888-888888888888',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Ножницы с пола',
        8
    ),
    (
        'e9999999-9999-9999-9999-999999999999',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Жим стоя',
        9
    ),
    (
        'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Выброс со стоек',
        10
    ),
    (
        '0199a0e2-760a-732d-8baa-efb65734ab94',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Выброс с пола',
        11
    ),
    (
        '0199a0e2-9049-70ff-bd3c-98a99c0676c6',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Присед над головой',
        12
    );