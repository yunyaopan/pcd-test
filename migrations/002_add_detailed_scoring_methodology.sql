-- Migration: Add detailed_scoring_methodology to evaluation_criteria
-- This migration adds the detailed_scoring_methodology column and removes the scoring methods system

-- 1. Add detailed_scoring_methodology column to evaluation_criteria
ALTER TABLE evaluation_criteria ADD COLUMN detailed_scoring_methodology TEXT;

-- 2. Drop the evaluation_criteria_scoring_methods table since we're using detailed_scoring_methodology instead
DROP TABLE IF EXISTS evaluation_criteria_scoring_methods CASCADE;

-- 3. Update existing evaluation criteria with sample detailed scoring methodologies
UPDATE evaluation_criteria 
SET detailed_scoring_methodology = CASE 
    WHEN name = 'Technical Capability' THEN 'Fully meets requirements with exceptional capabilities (10 points), Fully meets requirements (8 points), Substantially meets requirements (6 points), Partially meets requirements (4 points), Does not meet requirements (0 points)'
    WHEN name = 'Safety Record' THEN 'Excellent safety record with zero incidents (10 points), Very good safety record with minimal incidents (8 points), Good safety record with few incidents (6 points), Fair safety record with some incidents (4 points), Poor safety record with multiple incidents (0 points)'
    WHEN name = 'Past Performance' THEN 'Exceptional performance with outstanding results (10 points), Very good performance with consistent delivery (8 points), Good performance with mostly on-time delivery (6 points), Fair performance with some delays (4 points), Poor performance with significant issues (0 points)'
    WHEN name = 'Financial Stability' THEN 'Excellent financial health with strong credit rating (10 points), Very good financial position with stable cash flow (8 points), Good financial standing with adequate resources (6 points), Fair financial condition with some concerns (4 points), Poor financial health with significant risks (0 points)'
    WHEN name = 'Innovation' THEN 'Highly innovative with cutting-edge solutions (10 points), Very innovative with advanced approaches (8 points), Moderately innovative with good solutions (6 points), Some innovation with basic improvements (4 points), No innovation with conventional approaches (0 points)'
    WHEN name = 'Environmental Compliance' THEN 'Exceeds environmental standards with sustainability initiatives (10 points), Meets all environmental requirements (8 points), Mostly compliant with minor issues (6 points), Partially compliant with some violations (4 points), Non-compliant with major violations (0 points)'
    WHEN name = 'Quality Management' THEN 'Excellent quality systems with ISO certification (10 points), Very good quality processes with certifications (8 points), Good quality management systems (6 points), Basic quality controls in place (4 points), Poor quality management (0 points)'
    WHEN name = 'Project Management' THEN 'Exceptional project management with PMP certification (10 points), Very good project management capabilities (8 points), Good project management skills (6 points), Basic project management experience (4 points), Limited project management experience (0 points)'
    WHEN name = 'Team Experience' THEN 'Highly experienced team with relevant expertise (10 points), Very experienced team with good qualifications (8 points), Experienced team with adequate skills (6 points), Moderately experienced team (4 points), Inexperienced team with limited skills (0 points)'
    WHEN name = 'Cost Effectiveness' THEN 'Excellent value for money with competitive pricing (10 points), Very good cost effectiveness (8 points), Good value proposition (6 points), Fair pricing with some concerns (4 points), Poor value for money (0 points)'
    ELSE 'Detailed scoring methodology to be defined'
END;

-- 4. Make detailed_scoring_methodology NOT NULL after updating existing records
ALTER TABLE evaluation_criteria ALTER COLUMN detailed_scoring_methodology SET NOT NULL;

