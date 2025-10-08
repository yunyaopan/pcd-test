-- Migration: Project Type Configuration System
-- This migration creates the new project type system and drops the old evaluation_approaches table

-- 1. Create project_types table
CREATE TABLE project_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price_percentage NUMERIC NOT NULL CHECK (price_percentage > 0 AND price_percentage < 100),
    quality_percentage NUMERIC NOT NULL CHECK (quality_percentage > 0 AND quality_percentage < 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT price_quality_sum CHECK (price_percentage + quality_percentage = 100)
);

-- 2. Create evaluation_criteria table
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create evaluation_criteria_scoring_methods table
CREATE TABLE evaluation_criteria_scoring_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    condition TEXT NOT NULL,
    points NUMERIC NOT NULL CHECK (points >= 0),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create project_type_evaluation_criteria junction table
CREATE TABLE project_type_evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_type_id UUID NOT NULL REFERENCES project_types(id) ON DELETE CASCADE,
    evaluation_criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    is_applicable BOOLEAN NOT NULL DEFAULT true,
    minimum_weight NUMERIC CHECK (minimum_weight >= 0 AND minimum_weight <= 100),
    default_weight NUMERIC CHECK (default_weight >= 0 AND default_weight <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_type_id, evaluation_criteria_id)
);

-- 5. Create project_evaluation_criteria_weights table
CREATE TABLE project_evaluation_criteria_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    evaluation_criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, evaluation_criteria_id)
);

-- 6. Update projects table - add project_type_id column
ALTER TABLE projects ADD COLUMN project_type_id UUID REFERENCES project_types(id);

-- 7. Create indexes for better performance
CREATE INDEX idx_project_types_name ON project_types(name);
CREATE INDEX idx_evaluation_criteria_name ON evaluation_criteria(name);
CREATE INDEX idx_evaluation_criteria_scoring_methods_criteria_id ON evaluation_criteria_scoring_methods(evaluation_criteria_id);
CREATE INDEX idx_project_type_evaluation_criteria_project_type_id ON project_type_evaluation_criteria(project_type_id);
CREATE INDEX idx_project_type_evaluation_criteria_criteria_id ON project_type_evaluation_criteria(evaluation_criteria_id);
CREATE INDEX idx_project_evaluation_criteria_weights_project_id ON project_evaluation_criteria_weights(project_id);
CREATE INDEX idx_project_evaluation_criteria_weights_criteria_id ON project_evaluation_criteria_weights(evaluation_criteria_id);

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
CREATE TRIGGER update_project_types_updated_at BEFORE UPDATE ON project_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_criteria_updated_at BEFORE UPDATE ON evaluation_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Drop the old evaluation_approaches table
DROP TABLE IF EXISTS evaluation_approaches CASCADE;

-- 11. Remove the old evaluation_approach_id column from projects table
ALTER TABLE projects DROP COLUMN IF EXISTS evaluation_approach_id;

-- 12. Insert sample data
INSERT INTO project_types (name, price_percentage, quality_percentage) VALUES
('Construction', 70, 30),
('IT Services', 60, 40),
('Consulting', 50, 50),
('Maintenance', 80, 20);

INSERT INTO evaluation_criteria (name, description) VALUES
('Technical Capability', 'Assessment of technical skills and capabilities'),
('Safety Record', 'Historical safety performance and compliance'),
('Past Performance', 'Previous project delivery and quality'),
('Financial Stability', 'Financial health and stability'),
('Innovation', 'Innovative approaches and solutions'),
('Environmental Compliance', 'Environmental policies and compliance'),
('Quality Management', 'Quality control systems and processes'),
('Project Management', 'Project management capabilities'),
('Team Experience', 'Team qualifications and experience'),
('Cost Effectiveness', 'Value for money and cost efficiency');

-- Insert scoring methods for Technical Capability
INSERT INTO evaluation_criteria_scoring_methods (evaluation_criteria_id, condition, points, order_index)
SELECT 
    ec.id,
    conditions.condition,
    conditions.points,
    conditions.order_index
FROM evaluation_criteria ec,
(VALUES 
    ('Fully meets requirements with exceptional capabilities', 10, 1),
    ('Fully meets requirements', 8, 2),
    ('Substantially meets requirements', 6, 3),
    ('Partially meets requirements', 4, 4),
    ('Does not meet requirements', 0, 5)
) AS conditions(condition, points, order_index)
WHERE ec.name = 'Technical Capability';

-- Insert scoring methods for Safety Record
INSERT INTO evaluation_criteria_scoring_methods (evaluation_criteria_id, condition, points, order_index)
SELECT 
    ec.id,
    conditions.condition,
    conditions.points,
    conditions.order_index
FROM evaluation_criteria ec,
(VALUES 
    ('Excellent safety record with zero incidents', 10, 1),
    ('Very good safety record with minimal incidents', 8, 2),
    ('Good safety record with few incidents', 6, 3),
    ('Fair safety record with some incidents', 4, 4),
    ('Poor safety record with multiple incidents', 0, 5)
) AS conditions(condition, points, order_index)
WHERE ec.name = 'Safety Record';

-- Insert scoring methods for Past Performance
INSERT INTO evaluation_criteria_scoring_methods (evaluation_criteria_id, condition, points, order_index)
SELECT 
    ec.id,
    conditions.condition,
    conditions.points,
    conditions.order_index
FROM evaluation_criteria ec,
(VALUES 
    ('Exceptional performance with outstanding results', 10, 1),
    ('Very good performance with consistent delivery', 8, 2),
    ('Good performance with mostly on-time delivery', 6, 3),
    ('Fair performance with some delays', 4, 4),
    ('Poor performance with significant issues', 0, 5)
) AS conditions(condition, points, order_index)
WHERE ec.name = 'Past Performance';

-- Configure applicable criteria for Construction project type
INSERT INTO project_type_evaluation_criteria (project_type_id, evaluation_criteria_id, is_applicable, minimum_weight, default_weight)
SELECT 
    pt.id,
    ec.id,
    true,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 10
        WHEN ec.name = 'Safety Record' THEN 5
        WHEN ec.name = 'Past Performance' THEN 5
        ELSE 0
    END,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 15
        WHEN ec.name = 'Safety Record' THEN 10
        WHEN ec.name = 'Past Performance' THEN 5
        ELSE NULL
    END
FROM project_types pt, evaluation_criteria ec
WHERE pt.name = 'Construction' 
AND ec.name IN ('Technical Capability', 'Safety Record', 'Past Performance', 'Environmental Compliance', 'Quality Management');

-- Configure applicable criteria for IT Services project type
INSERT INTO project_type_evaluation_criteria (project_type_id, evaluation_criteria_id, is_applicable, minimum_weight, default_weight)
SELECT 
    pt.id,
    ec.id,
    true,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 15
        WHEN ec.name = 'Innovation' THEN 5
        WHEN ec.name = 'Team Experience' THEN 5
        ELSE 0
    END,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 20
        WHEN ec.name = 'Innovation' THEN 10
        WHEN ec.name = 'Team Experience' THEN 10
        ELSE NULL
    END
FROM project_types pt, evaluation_criteria ec
WHERE pt.name = 'IT Services' 
AND ec.name IN ('Technical Capability', 'Innovation', 'Team Experience', 'Project Management', 'Cost Effectiveness');

-- Configure applicable criteria for Consulting project type
INSERT INTO project_type_evaluation_criteria (project_type_id, evaluation_criteria_id, is_applicable, minimum_weight, default_weight)
SELECT 
    pt.id,
    ec.id,
    true,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 10
        WHEN ec.name = 'Past Performance' THEN 10
        WHEN ec.name = 'Team Experience' THEN 5
        ELSE 0
    END,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 15
        WHEN ec.name = 'Past Performance' THEN 15
        WHEN ec.name = 'Team Experience' THEN 10
        WHEN ec.name = 'Innovation' THEN 10
        ELSE NULL
    END
FROM project_types pt, evaluation_criteria ec
WHERE pt.name = 'Consulting' 
AND ec.name IN ('Technical Capability', 'Past Performance', 'Team Experience', 'Innovation', 'Project Management');

-- Configure applicable criteria for Maintenance project type
INSERT INTO project_type_evaluation_criteria (project_type_id, evaluation_criteria_id, is_applicable, minimum_weight, default_weight)
SELECT 
    pt.id,
    ec.id,
    true,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 5
        WHEN ec.name = 'Safety Record' THEN 10
        WHEN ec.name = 'Past Performance' THEN 5
        ELSE 0
    END,
    CASE 
        WHEN ec.name = 'Technical Capability' THEN 8
        WHEN ec.name = 'Safety Record' THEN 12
        WHEN ec.name = 'Past Performance' THEN 0
        ELSE NULL
    END
FROM project_types pt, evaluation_criteria ec
WHERE pt.name = 'Maintenance' 
AND ec.name IN ('Technical Capability', 'Safety Record', 'Past Performance', 'Quality Management');
