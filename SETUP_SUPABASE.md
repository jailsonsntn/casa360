# Setup Supabase Database

## Passos para criar as tabelas no Supabase

### 1. Acesse o Supabase Console
- Vá para https://app.supabase.com
- Faça login com sua conta
- Selecione seu projeto

### 2. Abra o SQL Editor
- No painel esquerdo, clique em "SQL Editor"
- Clique em "New Query"

### 3. Execute o Schema
- Copie todo o conteúdo do arquivo `supabase_schema.sql`
- Cole no editor SQL
- Clique em "Run"

### 4. Verifique as Tabelas
- Vá em "Banco de Dados" → "Tabelas"
- Verifique se as seguintes tabelas foram criadas:
  - `profiles`
  - `tasks`
  - `credit_cards`
  - `finance`
  - `medications`
  - `shopping_items`
  - `investments`
  - `financial_goals`

## Se tiver erro de relação circular ou dados não salvam

Se receber erro sobre tabelas já existentes ou dados não estão sendo salvos (problema de RLS), você pode:

1. Dropar as tabelas antigas e recriar tudo:
```sql
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;
DROP TABLE IF EXISTS finance CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

2. Depois execute o schema completo novamente

## Se dados não ficam salvos

Se você consegue salvar mas os dados não aparecem quando recarrega a página:

1. Verifique se há erro de RLS (Row Level Security) no console do navegador
2. Abra o Supabase Console → SQL Editor
3. Execute este SQL para atualizar as políticas:

```sql
-- Atualizar políticas RLS com WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can upsert own profile" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Fazer o mesmo para outras tabelas
DROP POLICY IF EXISTS "Users can CRUD own tasks" ON tasks;
CREATE POLICY "Users can CRUD own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own credit cards" ON credit_cards;
CREATE POLICY "Users can CRUD own credit cards" ON credit_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own finance" ON finance;
CREATE POLICY "Users can CRUD own finance" ON finance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own medications" ON medications;
CREATE POLICY "Users can CRUD own medications" ON medications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own shopping items" ON shopping_items;
CREATE POLICY "Users can CRUD own shopping items" ON shopping_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own investments" ON investments;
CREATE POLICY "Users can CRUD own investments" ON investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own financial goals" ON financial_goals;
CREATE POLICY "Users can CRUD own financial goals" ON financial_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## Campos Importantes

### Tabela `finance`
- Agora tem a coluna `credit_card_id` para referenciar cartões de crédito
- Tem suporte a parcelamento com `is_installment`, `installment_count`, `installment_number`

### Tabela `medications`
- Mudou de `stock` para `stock_quantity` 
- Adicionou `first_dose_date` e `first_dose_time` para agendar primeira dose

## Próximos Passos
- Reinicie o app: `npm run dev`
- Tente adicionar uma despesa com cartão de crédito
- Tente adicionar um medicamento com horário de primeira dose
