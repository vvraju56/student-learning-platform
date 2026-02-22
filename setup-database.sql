-- Complete database setup for student learning platform

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  total_videos_watched INTEGER DEFAULT 0,
  total_quizzes_passed INTEGER DEFAULT 0,
  average_focus_score NUMERIC(5,2) DEFAULT 0,
  average_posture_score NUMERIC(5,2) DEFAULT 0,
  study_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video progress tracking
CREATE TABLE IF NOT EXISTS video_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  video_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  watch_time INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  camera_denied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, video_id)
);

-- Course completion tracking
CREATE TABLE IF NOT EXISTS course_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  videos_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  current_module INTEGER DEFAULT 1,
  overall_progress NUMERIC(5,2) DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Quiz attempts with anti-cheat tracking
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_number INTEGER NOT NULL,
  mcq_score INTEGER DEFAULT 0,
  coding_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  copy_paste_attempts INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  focus_lost_count INTEGER DEFAULT 0,
  time_taken INTEGER NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User focus and attention analytics
CREATE TABLE IF NOT EXISTS focus_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  video_id TEXT,
  focus_duration INTEGER DEFAULT 0,
  distraction_count INTEGER DEFAULT 0,
  posture_good_duration INTEGER DEFAULT 0,
  posture_bad_duration INTEGER DEFAULT 0,
  attention_score NUMERIC(5,2) DEFAULT 0,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring session logs
CREATE TABLE IF NOT EXISTS monitoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER DEFAULT 0,
  face_detected_duration INTEGER DEFAULT 0,
  attention_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Other tables policies
CREATE POLICY "Users can manage own video progress" ON video_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own course progress" ON course_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own focus analytics" ON focus_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own monitoring sessions" ON monitoring_sessions FOR ALL USING (auth.uid() = user_id);