import sqlite3
import json
import time
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fila.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    with get_db() as conn:
        conn.executescript(schema_sql)
        # Check if categories table is populated
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM categories")
        if cur.fetchone()[0] == 0:
            seed_defaults(conn)

def seed_defaults(conn):
    cur = conn.cursor()
    
    # 1. Categories
    default_categories = [
        ('cat-sp', 'SP', 'Atendimento Prioritário', 'Lei nº 10.048: Idosos 60+, Gestantes, PCD, Autistas (TEA) e Lactantes', 'Prioritário', 'emerald', 10, 15, 'heart-pulse'),
        ('cat-sg', 'SG', 'Atendimento Geral', 'Consultas gerais, serviços cadastrais, informações e solicitações regulares', 'Convencional', 'blue', 1, 30, 'users'),
        ('cat-se', 'SE', 'Atendimento Expresso', 'Retirada rápida de exames, documentos prontos, assinaturas e pagamentos simples', 'Rápido', 'amber', 5, 10, 'zap'),
        ('cat-sc', 'SC', 'Comercial & Especializado', 'Negociações, contratos, abertura de cadastro e orientações especializadas', 'Comercial', 'violet', 3, 20, 'briefcase'),
    ]
    cur.executemany("""
        INSERT INTO categories (id, code, name, description, badge, color_accent, priority_weight, target_wait_minutes, icon_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, default_categories)

    # 2. Counters
    default_counters = [
        ('cnt-1', 1, 'Guichê 01', 'Térreo - Setor A', 'Fernanda Oliveira', 'available', None, json.dumps(['SP', 'SG', 'SE', 'SC'])),
        ('cnt-2', 2, 'Guichê 02', 'Térreo - Setor A', 'Carlos Eduardo', 'available', None, json.dumps(['SP', 'SG'])),
        ('cnt-3', 3, 'Guichê 03', 'Térreo - Setor B', 'Mariana Duarte', 'available', None, json.dumps(['SE', 'SG'])),
        ('cnt-4', 4, 'Mesa 04', '1º Andar - Negócios', 'Rodrigo Guimarães', 'available', None, json.dumps(['SC', 'SP'])),
    ]
    cur.executemany("""
        INSERT INTO counters (id, number, name, room, attendant_name, status, current_ticket_id, allowed_categories)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, default_counters)

    # 3. Settings
    default_settings = {
        'businessName': 'Centro de Atendimento Integrado',
        'unitName': 'Unidade Central - Atendimento ao Cidadão',
        'soundEnabled': 'true',
        'voiceEnabled': 'true',
        'speechRate': '0.95',
        'speechPitch': '1.0',
        'chimeVolume': '0.85',
        'priorityStrategy': 'ratio_2_1',
        'tvBannerMessage': 'Atenção aos painéis de chamada • Tenha em mãos documento oficial com foto e comprovante',
        'autoCallEnabled': 'false'
    }
    for k, v in default_settings.items():
        cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))

    # 4. Initial Sample Tickets
    now = int(time.time() * 1000)
    sample_tickets = [
        ('t-101', 1, 'SP-001', 'SP', 'Atendimento Prioritário', 'Dona Maria de Lourdes', '***.482.910-**', 'preferential', 'completed', now - 45*60*1000, now - 35*60*1000, now - 34*60*1000, now - 22*60*1000, 'cnt-1', 'Guichê 01', 'Fernanda Oliveira', 1, 'Atendimento prioritário concluído com emissão de certidão.'),
        ('t-102', 1, 'SG-001', 'SG', 'Atendimento Geral', 'Roberto Alves', '***.193.882-**', 'general', 'completed', now - 40*60*1000, now - 25*60*1000, now - 24*60*1000, now - 12*60*1000, 'cnt-2', 'Guichê 02', 'Carlos Eduardo', 1, None),
        ('t-103', 2, 'SP-002', 'SP', 'Atendimento Prioritário', 'Antônio Ferreira (PCD)', '***.331.028-**', 'preferential', 'called', now - 18*60*1000, now - 2*60*1000, None, None, 'cnt-1', 'Guichê 01', 'Fernanda Oliveira', 1, None),
        ('t-104', 2, 'SG-002', 'SG', 'Atendimento Geral', 'Juliana Costa', '***.729.110-**', 'general', 'waiting', now - 15*60*1000, None, None, None, None, None, None, 0, None),
        ('t-105', 1, 'SE-001', 'SE', 'Atendimento Expresso', 'Marcos Vinicius', None, 'express', 'waiting', now - 11*60*1000, None, None, None, None, None, None, 0, None),
        ('t-106', 3, 'SP-003', 'SP', 'Atendimento Prioritário', 'Beatriz Vasconcelos (Gestante)', None, 'preferential', 'waiting', now - 8*60*1000, None, None, None, None, None, None, 0, None),
        ('t-107', 3, 'SG-003', 'SG', 'Atendimento Geral', None, None, 'general', 'waiting', now - 5*60*1000, None, None, None, None, None, None, 0, None),
        ('t-108', 1, 'SC-001', 'SC', 'Comercial & Especializado', 'Luciano Prado (Empresarial)', None, 'commercial', 'waiting', now - 3*60*1000, None, None, None, None, None, None, 0, None),
    ]

    cur.executemany("""
        INSERT INTO tickets (
            id, number, display_number, category_code, category_name,
            customer_name, customer_doc, priority_type, status,
            created_at, called_at, service_started_at, completed_at,
            counter_id, counter_name, attendant_name, call_count, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_tickets)

    # Initial Calls
    cur.execute("""
        INSERT INTO calls (id, ticket_id, display_number, category_code, category_name, customer_name, counter_name, room, timestamp, recalled)
        VALUES ('call-1', 't-103', 'SP-002', 'SP', 'Atendimento Prioritário', 'Antônio Ferreira (PCD)', 'Guichê 01', 'Térreo - Setor A', ?, 0)
    """, (now - 2*60*1000,))

    cur.execute("""
        INSERT INTO calls (id, ticket_id, display_number, category_code, category_name, customer_name, counter_name, room, timestamp, recalled)
        VALUES ('call-2', 't-102', 'SG-001', 'SG', 'Atendimento Geral', 'Roberto Alves', 'Guichê 02', 'Térreo - Setor A', ?, 0)
    """, (now - 25*60*1000,))

    # Update counter status for cnt-1
    cur.execute("UPDATE counters SET status = 'busy', current_ticket_id = 't-103' WHERE id = 'cnt-1'")
    conn.commit()

def dict_from_row(row):
    if not row:
        return None
    d = dict(row)
    if 'allowed_categories' in d and isinstance(d['allowed_categories'], str):
        try:
            d['allowedCategories'] = json.loads(d['allowed_categories'])
        except Exception:
            d['allowedCategories'] = ['SP', 'SG', 'SE', 'SC']
    return d
