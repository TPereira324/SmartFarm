-- ============================================
-- POPULATE
-- ============================================
USE coco_db;

-- CIDADE
INSERT INTO cidade (cid_nome) VALUES
('Lisboa'),
('Porto'),
('Setúbal'),
('Faro'),
('Braga');

-- UTILIZADOR
-- Todos os utilizadores de teste têm a password: password123
INSERT INTO utilizador (ut_nome, ut_email, ut_password, ut_nome_fazenda, ut_agricultor_iniciante) VALUES
('João Silva',     'joao@email.com',   '$2y$10$69/qilvw.uNrEKdllldOjO23JJwResJm4WVTmwfJ/TWQn6fyk8rIG', 'Quinta do João',   FALSE),
('Maria Santos',   'maria@email.com',  '$2y$10$69/qilvw.uNrEKdllldOjO23JJwResJm4WVTmwfJ/TWQn6fyk8rIG', 'Horta da Maria',   TRUE),
('Carlos Ferreira','carlos@email.com', '$2y$10$69/qilvw.uNrEKdllldOjO23JJwResJm4WVTmwfJ/TWQn6fyk8rIG', 'Fazenda Ferreira', FALSE),
('Ana Oliveira',   'ana@email.com',    '$2y$10$69/qilvw.uNrEKdllldOjO23JJwResJm4WVTmwfJ/TWQn6fyk8rIG', 'Verde Vivo',       TRUE),
('Rui Costa',      'rui@email.com',    '$2y$10$69/qilvw.uNrEKdllldOjO23JJwResJm4WVTmwfJ/TWQn6fyk8rIG', 'Campos do Rui',    FALSE);

-- CULTIVO
INSERT INTO cultivo (cult_nome, cult_descricao) VALUES
('Alface', 'Cultura de folha verde, cresce bem em hidroponia e fibra de coco.'),
('Tomate', 'Fruto versátil, requer suporte e boa rega.'),
('Manjericão', 'Erva aromática de crescimento rápido.'),
('Morango', 'Fruto pequeno ideal para vasos e fibra de coco.'),
('Outra', 'Cultura personalizada pelo utilizador.');

-- PARCELA
INSERT INTO parcela (par_nome, par_area, par_estado, par_ut_id) VALUES
('Parcela Norte', 120.50, 'Saudável', 1),
('Parcela Sul', 85.00, 'Atenção', 1),
('Horta Principal', 200.00, 'Saudável', 2),
('Canteiro A', 45.00, 'Crítico', 3),
('Canteiro B', 60.00, 'Saudável', 3),
('Estufa 1', 150.00, 'Atenção', 4),
('Jardim Urbano', 30.00, 'Saudável', 5);

-- PARCELA_CULTIVO
INSERT INTO parcela_cultivo (pc_par_id, pc_cult_id, pc_metodo_cultivo, pc_objetivo) VALUES
(1, 4, 'Hidroponia', 'Produção para Venda'),
(1, 2, 'Vasos', 'Produção para Consumo Próprio'),
(2, 1, 'Hidroponia', 'Melhorar Eficiência'),
(3, 3, 'Vasos', 'Produção para Consumo Próprio'),
(4, 2, 'Outro', 'Testar pela Primeira Vez'),
(5, 4, 'Vasos', 'Produção para Consumo Próprio'),
(6, 1, 'Hidroponia', 'Produção para Venda'),
(7, 3, 'Vasos', 'Testar pela Primeira Vez');

-- TAREFA
INSERT INTO tarefa (tar_titulo, tar_descricao, tar_data_inicio, tar_data_fim, tar_estado, tar_prioridade, tar_par_id, tar_ut_id) VALUES
('Rega matinal', 'Regar os morangos de manhã cedo.', '2026-03-01', '2026-03-31', 'Em Progresso', 'Alta', 1, 1),
('Aplicar fertilizante', 'Usar fertilizante NPK nas raízes.', '2026-03-05', '2026-03-06', 'Concluída', 'Média', 1, 1),
('Verificar pragas', 'Inspecionar folhas por sinais de pragas.', '2026-03-10', '2026-03-10', 'Pendente', 'Alta', 2, 1),
('Transplante de alface', 'Mover plantas para novo canteiro.', '2026-03-08', '2026-03-09', 'Concluída', 'Média', 3, 2),
('Poda do tomate', 'Retirar ramos secos do tomate.', '2026-03-12', '2026-03-12', 'Pendente', 'Baixa', 4, 3),
('Limpeza da estufa', 'Limpar estrutura e verificar ventilação.', '2026-03-15', '2026-03-16', 'Pendente', 'Média', 6, 4),
('Semear manjericão', 'Preparar novos vasos para sementeira.', '2026-03-20', '2026-03-21', 'Pendente', 'Baixa', 7, 5);

-- HISTORICO_TAREFA
INSERT INTO historico_tarefa (ht_tar_id, ht_estado_anterior, ht_estado_novo, ht_ut_id) VALUES
(1, 'Pendente', 'Em Progresso', 1),
(2, 'Pendente', 'Em Progresso', 1),
(2, 'Em Progresso', 'Concluída', 1),
(4, 'Pendente', 'Em Progresso', 2),
(4, 'Em Progresso', 'Concluída', 2);

-- MONITORIZACAO
INSERT INTO monitorizacao (mon_par_id, mon_observacao) VALUES
(1, 'Plantas com aspeto saudável, solo bem húmido após rega.'),
(1, 'Folhas levemente amareladas, possível falta de nutrientes.'),
(2, 'Solo seco, necessita rega urgente.'),
(3, 'Crescimento normal, sem anomalias visíveis.'),
(4, 'Sinais de míldio nas folhas inferiores do tomate.'),
(5, 'Morangos em floração, bom desenvolvimento.'),
(6, 'Alface com crescimento uniforme, sem pragas visíveis.'),
(7, 'Manjericão aromático, pronto para primeira colheita.');

-- ALERTA
INSERT INTO alerta (alt_tipo, alt_mensagem, alt_par_id) VALUES
('Atenção', 'Humidade do solo abaixo do recomendado.', 2),
('Crítico', 'Sinais de doença fúngica detetados.', 4),
('Atenção', 'Temperatura elevada na estufa, verificar ventilação.', 6),
('Atenção', 'Folhas amareladas detetadas na Parcela Norte.', 1);

-- HISTORICO_PARCELA
INSERT INTO historico_parcela (hp_par_id, hp_estado_anterior, hp_estado_novo) VALUES
(2, 'Saudável', 'Atenção'),
(4, 'Atenção', 'Crítico'),
(6, 'Saudável', 'Atenção');

-- NOTIFICACAO
INSERT INTO notificacao (not_ut_id, not_mensagem, not_lida) VALUES
(1, 'Alerta: Humidade baixa na Parcela Sul.', FALSE),
(1, 'Tarefa "Aplicar fertilizante" foi concluída.', TRUE),
(2, 'Tarefa "Transplante de alface" foi concluída.', TRUE),
(3, 'Alerta crítico: doença fúngica no Canteiro A.', FALSE),
(4, 'Alerta: Temperatura elevada na Estufa 1.', FALSE),
(5, 'Lembrete: Semear manjericão agendado para dia 20.', FALSE);

-- POST (Comunidade)
INSERT INTO post (post_ut_id, post_titulo, post_conteudo, post_categoria) VALUES
(1, 'Como aumentar a produção de morangos?', 'Tenho usado fibra de coco há 3 meses e os resultados são incríveis. Alguém tem dicas para aumentar ainda mais a produção?', 'duvidas'),
(2, 'A minha experiência com hidroponia', 'Comecei há 6 meses sem saber nada. Hoje produzo alface para a família toda. Partilho aqui o meu percurso.', 'experiencias'),
(3, 'Problema com míldio no tomate', 'Apareceram manchas brancas nas folhas do tomate. Já alguém passou por isto? Como resolveram?', 'duvidas'),
(4, 'História de Sucesso: Morangos em Fibra de Coco', 'Em apenas 2 meses consegui os primeiros frutos. O segredo foi controlar bem a rega e usar substrato de qualidade.', 'dicas'),
(5, 'Dica: manjericão em vasos pequenos', 'Descobri que o manjericão cresce melhor em vasos de barro do que em plástico. Partilho a minha experiência.', 'experiencias');

-- COMENTARIO
INSERT INTO comentario (com_post_id, com_ut_id, com_conteudo) VALUES
(1, 2, 'Eu uso solução nutritiva a cada 3 dias e os resultados melhoraram muito!'),
(1, 3, 'Tenta reduzir o espaçamento entre plantas, ajuda bastante.'),
(2, 1, 'Inspiring! Eu também comecei sem experiência, dá mesmo para aprender rápido.'),
(3, 4, 'Tive o mesmo problema. Usei calda bordalesa e resolveu em duas semanas.'),
(3, 1, 'Verifica também a ventilação, o míldio adora humidade estagnada.'),
(4, 2, 'Parabéns! Qual a marca de substrato que usas?'),
(5, 3, 'Boa dica! Vou experimentar com os meus vasos de barro.');
