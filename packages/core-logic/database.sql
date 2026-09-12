-- Supabase Database Schema Definitions

-- Table: Themes
-- Stores the configuration and branding for each specific event/celebrant.
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- The unique code users enter (e.g., 'ALLEN')
    name VARCHAR(255) NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    header_banner_url TEXT,
    logo_url TEXT,
    leaderboard_title_url TEXT,
    stadium_bg_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Players
-- Stores the user registration details linked to a specific theme.
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (theme_id, phone),
    UNIQUE (theme_id, email)
);

-- Table: DuoLock_Cards
-- Stores the specific image pairs configured for the DuoLock game per theme.
CREATE TABLE duolock_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
    image_url_1 TEXT NOT NULL,
    image_url_2 TEXT NOT NULL, -- For Image+Image matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Scores
-- Stores the leaderboard data across all mini-games.
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
    game_name VARCHAR(50) NOT NULL, -- e.g., 'DuoLock', 'Flipizi'
    score INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) Policies could be added here to restrict read/write access.
