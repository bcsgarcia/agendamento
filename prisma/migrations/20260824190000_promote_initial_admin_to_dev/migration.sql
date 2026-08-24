-- Promove o usuário seed inicial (bcsgarcia@outlook.com) para role 'dev'.
-- Idempotente: rodar 2x não tem efeito colateral.
UPDATE "User" SET role = 'dev' WHERE email = 'bcsgarcia@outlook.com';
