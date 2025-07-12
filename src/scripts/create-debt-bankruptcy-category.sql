-- Create Debt & Bankruptcy Law Category
-- Singapore Legal Help Platform - Task DB-1

-- Generate UUID for Debt & Bankruptcy category
-- UUID: 8f2e5c4d-9b1a-4e6f-8c3d-2a7b9e5f1c8d

INSERT INTO public.legal_categories (
    id,
    name,
    description,
    icon,
    color,
    sort_order,
    is_active,
    created_at,
    updated_at
) VALUES (
    '8f2e5c4d-9b1a-4e6f-8c3d-2a7b9e5f1c8d',
    'Debt & Bankruptcy',
    'Debt recovery, bankruptcy procedures, corporate insolvency, and creditor rights',
    'credit-card',
    '#f59e0b',
    9,
    true,
    NOW(),
    NOW()
);

-- Verify the category was created
SELECT * FROM public.legal_categories WHERE name = 'Debt & Bankruptcy';
