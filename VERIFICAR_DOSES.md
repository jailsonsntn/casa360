# Verificação de Histórico de Doses

## SQL para executar no Supabase

Execute estes comandos no SQL Editor do Supabase para verificar e criar a tabela se necessário:

```sql
-- 1. Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'medication_doses';

-- 2. Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS medication_doses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  medication_id uuid references medications on delete cascade not null,
  taken_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Criar políticas de segurança
ALTER TABLE medication_doses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own medication doses" ON medication_doses;

CREATE POLICY "Users can CRUD own medication doses" ON medication_doses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Verificar doses existentes
SELECT 
  md.id,
  m.name as medication_name,
  md.taken_at,
  md.created_at
FROM medication_doses md
JOIN medications m ON m.id = md.medication_id
ORDER BY md.taken_at DESC;
```

## Debug no Console do Navegador

Após executar o SQL acima, abra o console do navegador (F12) e procure por:

1. `Medicamento [nome]: X doses encontradas` - ao carregar a página
2. `Dose salva com sucesso:` - ao registrar uma dose
3. `Medicamento atualizado:` - confirmação da atualização

Se não aparecer nada, a tabela não existe no Supabase ainda.
