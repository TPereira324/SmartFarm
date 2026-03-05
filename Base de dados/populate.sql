-- ============================================
-- CIDADE
-- ============================================

INSERT INTO cidade (cid_nome) VALUES
('Lisboa'),
('Porto'),
('Braga'),
('Coimbra'),
('Faro');

-- ============================================
-- UTILIZADOR
-- ============================================

INSERT INTO utilizador (ut_nome, ut_email, ut_password) VALUES
('Ana Silva','ana@email.com','1234'),
('Joao Pereira','joao@email.com','1234'),
('Maria Costa','maria@email.com','1234'),
('Pedro Santos','pedro@email.com','1234'),
('Carla Ferreira','carla@email.com','1234');

-- ============================================
-- PARCELA
-- ============================================

INSERT INTO parcela (par_nome, par_area, par_estado, par_ut_id) VALUES
('Horta Norte', 25.5, 'Saudável', 1),
('Horta Sul', 18.2, 'Atenção', 2),
('Horta Central', 30.0, 'Saudável', 3),
('Horta Leste', 15.7, 'Crítico', 4),
('Horta Oeste', 22.1, 'Saudável', 5);

-- ============================================
-- CULTIVO
-- ============================================

INSERT INTO cultivo (cult_nome, cult_descricao) VALUES
('Tomate','Cultivo de tomate vermelho'),
('Alface','Cultivo de alface verde'),
('Morangos','Cultivo de morangos'),
('Cenoura','Cultivo de cenouras'),
('Batata','Cultivo de batata');

-- ============================================
-- PARCELA_CULTIVO
-- ============================================

INSERT INTO parcela_cultivo (pc_par_id, pc_cult_id) VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,5);

-- ============================================
-- TAREFA
-- ============================================

INSERT INTO tarefa 
(tar_titulo, tar_descricao, tar_data_inicio, tar_data_fim, tar_estado, tar_prioridade, tar_par_id, tar_ut_id)
VALUES
('Regar plantas','Regar a horta pela manhã','2026-03-01','2026-03-01','Concluída','Alta',1,1),
('Verificar solo','Analisar humidade do solo','2026-03-02','2026-03-03','Pendente','Média',2,2),
('Aplicar fertilizante','Adicionar fertilizante natural','2026-03-03','2026-03-04','Em Progresso','Alta',3,3),
('Remover ervas daninhas','Limpar plantas invasoras','2026-03-04','2026-03-05','Pendente','Baixa',4,4),
('Colheita','Colher vegetais maduros','2026-03-05','2026-03-05','Pendente','Alta',5,5);

-- ============================================
-- HISTORICO_TAREFA
-- ============================================

INSERT INTO historico_tarefa (ht_tar_id, ht_estado_anterior, ht_estado_novo, ht_ut_id) VALUES
(1,'Pendente','Concluída',1),
(2,'Pendente','Pendente',2),
(3,'Pendente','Em Progresso',3),
(4,'Pendente','Pendente',4),
(5,'Pendente','Pendente',5);

-- ============================================
-- MONITORIZACAO
-- ============================================

INSERT INTO monitorizacao (mon_par_id, mon_humidade, mon_temperatura, mon_ph) VALUES
(1,65.5,22.3,6.5),
(2,55.2,21.0,6.8),
(3,70.1,23.4,6.4),
(4,40.0,25.1,5.9),
(5,60.5,22.0,6.6);

-- ============================================
-- ALERTA
-- ============================================

INSERT INTO alerta (alt_tipo, alt_mensagem, alt_par_id) VALUES
('Atenção','Humidade baixa na parcela',2),
('Crítico','Solo muito seco',4),
('Atenção','Temperatura alta',3),
('Atenção','Possível praga detectada',5),
('Crítico','pH fora do ideal',4);

-- ============================================
-- HISTORICO_PARCELA
-- ============================================

INSERT INTO historico_parcela (hp_par_id, hp_estado_anterior, hp_estado_novo) VALUES
(1,'Atenção','Saudável'),
(2,'Saudável','Atenção'),
(3,'Saudável','Saudável'),
(4,'Atenção','Crítico'),
(5,'Saudável','Saudável');

-- ============================================
-- NOTIFICACAO
-- ============================================

INSERT INTO notificacao (not_ut_id, not_mensagem) VALUES
(1,'Nova tarefa atribuída'),
(2,'Alerta de humidade baixa'),
(3,'Monitorização atualizada'),
(4,'Parcela em estado crítico'),
(5,'Nova colheita disponível');

