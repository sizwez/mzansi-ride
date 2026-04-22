-- Phase 28: Democratic Governance Samples
INSERT INTO public.coop_proposals (title, description, deadline, total_eligible)
VALUES 
('Bara Taxi Rank Safety Patrols', 'Allocate R50,000 from the Phakamisa Fund to hire 10 community safety wardens for Bara Rank for 3 months to reduce petty theft and improve member safety.', NOW() + INTERVAL '14 days', 100),
('Co-op Education Grant 2026', 'Establish a R100,000 grant pool for the children of verified cooperative members (Drivers & Riders) to assist with secondary school registration fees for the 2027 academic year.', NOW() + INTERVAL '30 days', 100);
