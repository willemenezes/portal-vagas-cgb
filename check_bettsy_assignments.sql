-- Verificar atribuições da Bettsy
SELECT 
    id,
    user_id,
    full_name,
    email,
    role,
    assigned_states,
    assigned_cities,
    created_at,
    updated_at
FROM rh_users 
WHERE full_name ILIKE '%Bettsy%' OR email ILIKE '%bettsy%';