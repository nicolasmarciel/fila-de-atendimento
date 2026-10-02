#!/usr/bin/env python3
"""
FilaExpress - Sistema de Gestão de Filas de Atendimento
Backend em Python, Flask e SQLite
"""

import os
import sys
import time
import json
import sqlite3
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from database import get_db, init_db, dict_from_row, seed_defaults

app = Flask(__name__)
CORS(app)

# Initialize SQLite database on startup
init_db()

consecutive_preferential_counter = {}

@app.route('/')
def home():
    return jsonify({
        'name': 'FilaExpress - API de Gestão de Filas',
        'tech_stack': 'Python 3 + Flask + SQLite',
        'status': 'online',
        'endpoints': [
            '/api/status',
            '/api/categories',
            '/api/counters',
            '/api/tickets',
            '/api/calls/active',
            '/api/calls/history',
            '/api/metrics',
            '/api/settings',
            '/api/export/csv'
        ]
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'waiting'")
        waiting_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'completed'")
        completed_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM counters")
        counters_count = cur.fetchone()[0]

    return jsonify({
        'status': 'healthy',
        'database': 'SQLite (fila.db)',
        'framework': 'Flask',
        'waiting_count': waiting_count,
        'completed_today': completed_count,
        'counters_count': counters_count,
        'timestamp': int(time.time() * 1000)
    })

# ----------------- CATEGORIES -----------------
@app.route('/api/categories', methods=['GET'])
def list_categories():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM categories ORDER BY priority_weight DESC")
        rows = cur.fetchall()
        categories = []
        for r in rows:
            d = dict(r)
            accent = d.get('color_accent', 'blue')
            categories.append({
                'id': d['id'],
                'code': d['code'],
                'name': d['name'],
                'description': d['description'],
                'badge': d['badge'],
                'priorityWeight': d['priority_weight'],
                'targetWaitMinutes': d['target_wait_minutes'],
                'iconName': d['icon_name'],
                'color': {
                    'bg': f'bg-{accent}-950/40',
                    'border': f'border-{accent}-600/40',
                    'text': f'text-{accent}-400',
                    'glow': f'shadow-{accent}-900/30',
                    'accent': accent
                }
            })
    return jsonify(categories)

# ----------------- COUNTERS -----------------
@app.route('/api/counters', methods=['GET'])
def list_counters():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM counters ORDER BY number ASC")
        rows = cur.fetchall()
        counters = []
        for r in rows:
            d = dict(r)
            allowed = json.loads(d['allowed_categories']) if d['allowed_categories'] else ['SP', 'SG', 'SE', 'SC']
            counters.append({
                'id': d['id'],
                'number': d['number'],
                'name': d['name'],
                'room': d['room'],
                'attendantName': d['attendant_name'],
                'status': d['status'],
                'currentTicketId': d['current_ticket_id'],
                'allowedCategories': allowed
            })
    return jsonify(counters)

@app.route('/api/counters/<counter_id>', methods=['PATCH'])
def update_counter(counter_id):
    data = request.json or {}
    fields = []
    values = []

    if 'status' in data:
        fields.append("status = ?")
        values.append(data['status'])
    if 'attendantName' in data:
        fields.append("attendant_name = ?")
        values.append(data['attendantName'])
    if 'room' in data:
        fields.append("room = ?")
        values.append(data['room'])

    if not fields:
        return jsonify({'error': 'No fields to update'}), 400

    values.append(counter_id)
    with get_db() as conn:
        conn.execute(f"UPDATE counters SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    return jsonify({'success': True})

# ----------------- TICKETS -----------------
@app.route('/api/tickets', methods=['GET'])
def list_tickets():
    status = request.args.get('status')
    category = request.args.get('category')
    search = request.args.get('search')

    query = "SELECT * FROM tickets WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if category and category != 'all':
        query += " AND category_code = ?"
        params.append(category)
    if search:
        query += " AND (display_number LIKE ? OR customer_name LIKE ? OR customer_doc LIKE ?)"
        wild = f"%{search}%"
        params.extend([wild, wild, wild])

    query += " ORDER BY created_at ASC"

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, params)
        rows = cur.fetchall()
        tickets = []
        for r in rows:
            d = dict(r)
            tickets.append({
                'id': d['id'],
                'number': d['number'],
                'displayNumber': d['display_number'],
                'categoryCode': d['category_code'],
                'categoryName': d['category_name'],
                'customerName': d['customer_name'],
                'customerDoc': d['customer_doc'],
                'priorityType': d['priority_type'],
                'status': d['status'],
                'createdAt': d['created_at'],
                'calledAt': d['called_at'],
                'serviceStartedAt': d['service_started_at'],
                'completedAt': d['completed_at'],
                'counterId': d['counter_id'],
                'counterName': d['counter_name'],
                'attendantName': d['attendant_name'],
                'callCount': d['call_count'] or 0,
                'notes': d['notes']
            })
    return jsonify(tickets)

@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    data = request.json or {}
    category_code = data.get('categoryCode', 'SG')
    customer_name = (data.get('customerName') or '').strip() or None
    customer_doc = (data.get('customerDoc') or '').strip() or None

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT name FROM categories WHERE code = ?", (category_code,))
        cat_row = cur.fetchone()
        category_name = cat_row['name'] if cat_row else 'Atendimento Geral'

        # Next sequential number for this category
        cur.execute("SELECT MAX(number) FROM tickets WHERE category_code = ?", (category_code,))
        last_num = cur.fetchone()[0] or 0
        next_num = last_num + 1
        display_num = f"{category_code}-{str(next_num).zfill(3)}"

        priority_type = 'preferential' if category_code == 'SP' else (
            'express' if category_code == 'SE' else ('commercial' if category_code == 'SC' else 'general')
        )

        now = int(time.time() * 1000)
        ticket_id = f"t-{now}-{int(time.time() % 1000)}"

        cur.execute("""
            INSERT INTO tickets (
                id, number, display_number, category_code, category_name,
                customer_name, customer_doc, priority_type, status,
                created_at, call_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?, 0)
        """, (ticket_id, next_num, display_num, category_code, category_name, customer_name, customer_doc, priority_type, now))
        conn.commit()

        # Fetch newly created ticket
        cur.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        new_row = dict(cur.fetchone())

    return jsonify({
        'id': new_row['id'],
        'number': new_row['number'],
        'displayNumber': new_row['display_number'],
        'categoryCode': new_row['category_code'],
        'categoryName': new_row['category_name'],
        'customerName': new_row['customer_name'],
        'customerDoc': new_row['customer_doc'],
        'priorityType': new_row['priority_type'],
        'status': new_row['status'],
        'createdAt': new_row['created_at'],
        'callCount': 0
    }), 201

# ----------------- CALL DISPATCHER & ACTIONS -----------------
@app.route('/api/call-next', methods=['POST'])
def call_next():
    data = request.json or {}
    counter_id = data.get('counterId')
    if not counter_id:
        return jsonify({'error': 'counterId required'}), 400

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM counters WHERE id = ?", (counter_id,))
        counter = cur.fetchone()
        if not counter:
            return jsonify({'error': 'Counter not found'}), 404

        allowed_cats = json.loads(counter['allowed_categories']) if counter['allowed_categories'] else ['SP', 'SG']

        # Get settings for priority strategy
        cur.execute("SELECT value FROM settings WHERE key = 'priorityStrategy'")
        strat_row = cur.fetchone()
        strategy = strat_row['value'] if strat_row else 'ratio_2_1'

        # Query waiting tickets allowed for this counter
        placeholders = ','.join(['?'] * len(allowed_cats))
        cur.execute(f"""
            SELECT * FROM tickets
            WHERE status = 'waiting' AND category_code IN ({placeholders})
            ORDER BY created_at ASC
        """, allowed_cats)
        waiting = cur.fetchall()

        if not waiting:
            return jsonify({'ticket': None, 'message': 'Fila vazia para este guichê'}), 200

        # Split into preferential (SP) and standard
        preferential = [t for t in waiting if t['category_code'] == 'SP']
        standard = [t for t in waiting if t['category_code'] != 'SP']

        chosen = None
        if not preferential:
            chosen = standard[0]
        elif not standard:
            chosen = preferential[0]
        else:
            if strategy == 'preferential_first':
                chosen = preferential[0]
            elif strategy == 'fifo':
                chosen = waiting[0]
            else:
                # Ratio 2:1 or 3:1
                limit = 3 if strategy == 'ratio_3_1' else 2
                cnt_calls = consecutive_preferential_counter.get(counter_id, 0)
                if cnt_calls < limit and preferential:
                    consecutive_preferential_counter[counter_id] = cnt_calls + 1
                    chosen = preferential[0]
                else:
                    consecutive_preferential_counter[counter_id] = 0
                    chosen = standard[0] if standard else preferential[0]

        now = int(time.time() * 1000)
        call_id = f"call-{chosen['id']}-{now}"

        # Update ticket
        cur.execute("""
            UPDATE tickets
            SET status = 'called',
                called_at = ?,
                counter_id = ?,
                counter_name = ?,
                attendant_name = ?,
                call_count = call_count + 1
            WHERE id = ?
        """, (now, counter['id'], counter['name'], counter['attendant_name'], chosen['id']))

        # Update counter
        cur.execute("""
            UPDATE counters
            SET status = 'busy', current_ticket_id = ?
            WHERE id = ?
        """, (chosen['id'], counter['id']))

        # Record call event in calls table
        cur.execute("""
            INSERT INTO calls (
                id, ticket_id, display_number, category_code, category_name,
                customer_name, counter_name, room, timestamp, recalled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            call_id, chosen['id'], chosen['display_number'], chosen['category_code'],
            chosen['category_name'], chosen['customer_name'], counter['name'],
            counter['room'], now
        ))
        conn.commit()

        # Fetch updated ticket
        cur.execute("SELECT * FROM tickets WHERE id = ?", (chosen['id'],))
        updated_row = dict(cur.fetchone())

    return jsonify({
        'ticket': {
            'id': updated_row['id'],
            'number': updated_row['number'],
            'displayNumber': updated_row['display_number'],
            'categoryCode': updated_row['category_code'],
            'categoryName': updated_row['category_name'],
            'customerName': updated_row['customer_name'],
            'customerDoc': updated_row['customer_doc'],
            'priorityType': updated_row['priority_type'],
            'status': updated_row['status'],
            'createdAt': updated_row['created_at'],
            'calledAt': updated_row['called_at'],
            'counterId': updated_row['counter_id'],
            'counterName': updated_row['counter_name'],
            'attendantName': updated_row['attendant_name'],
            'callCount': updated_row['call_count']
        },
        'call': {
            'id': call_id,
            'ticketId': chosen['id'],
            'displayNumber': chosen['display_number'],
            'counterName': counter['name'],
            'room': counter['room'],
            'timestamp': now
        }
    })

@app.route('/api/call-specific', methods=['POST'])
def call_specific():
    data = request.json or {}
    ticket_id = data.get('ticketId')
    counter_id = data.get('counterId')

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        ticket = cur.fetchone()
        cur.execute("SELECT * FROM counters WHERE id = ?", (counter_id,))
        counter = cur.fetchone()

        if not ticket or not counter:
            return jsonify({'error': 'Ticket or counter not found'}), 404

        now = int(time.time() * 1000)
        call_id = f"call-{ticket['id']}-{now}"

        cur.execute("""
            UPDATE tickets
            SET status = 'called',
                called_at = ?,
                counter_id = ?,
                counter_name = ?,
                attendant_name = ?,
                call_count = call_count + 1
            WHERE id = ?
        """, (now, counter['id'], counter['name'], counter['attendant_name'], ticket['id']))

        cur.execute("UPDATE counters SET status = 'busy', current_ticket_id = ? WHERE id = ?", (ticket['id'], counter['id']))

        cur.execute("""
            INSERT INTO calls (
                id, ticket_id, display_number, category_code, category_name,
                customer_name, counter_name, room, timestamp, recalled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            call_id, ticket['id'], ticket['display_number'], ticket['category_code'],
            ticket['category_name'], ticket['customer_name'], counter['name'],
            counter['room'], now, 1 if ticket['call_count'] > 0 else 0
        ))
        conn.commit()

    return jsonify({'success': True, 'callId': call_id})

@app.route('/api/recall', methods=['POST'])
def recall():
    data = request.json or {}
    ticket_id = data.get('ticketId')

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        ticket = cur.fetchone()
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404

        now = int(time.time() * 1000)
        call_id = f"recall-{ticket['id']}-{now}"

        cur.execute("""
            UPDATE tickets
            SET called_at = ?, call_count = call_count + 1
            WHERE id = ?
        """, (now, ticket['id']))

        cur.execute("""
            INSERT INTO calls (
                id, ticket_id, display_number, category_code, category_name,
                customer_name, counter_name, room, timestamp, recalled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            call_id, ticket['id'], ticket['display_number'], ticket['category_code'],
            ticket['category_name'], ticket['customer_name'], ticket['counter_name'] or 'Guichê',
            '', now
        ))
        conn.commit()

    return jsonify({'success': True, 'callId': call_id})

@app.route('/api/service/start', methods=['POST'])
def start_service():
    data = request.json or {}
    ticket_id = data.get('ticketId')
    now = int(time.time() * 1000)

    with get_db() as conn:
        conn.execute("""
            UPDATE tickets
            SET status = 'in_service', service_started_at = ?
            WHERE id = ?
        """, (now, ticket_id))
        conn.commit()

    return jsonify({'success': True})

@app.route('/api/service/finish', methods=['POST'])
def finish_service():
    data = request.json or {}
    ticket_id = data.get('ticketId')
    notes = (data.get('notes') or '').strip() or None
    now = int(time.time() * 1000)

    with get_db() as conn:
        conn.execute("""
            UPDATE tickets
            SET status = 'completed', completed_at = ?, notes = ?
            WHERE id = ?
        """, (now, notes, ticket_id))

        conn.execute("""
            UPDATE counters
            SET status = 'available', current_ticket_id = NULL
            WHERE current_ticket_id = ?
        """, (ticket_id,))
        conn.commit()

    return jsonify({'success': True})

@app.route('/api/service/no-show', methods=['POST'])
def no_show():
    data = request.json or {}
    ticket_id = data.get('ticketId')

    with get_db() as conn:
        conn.execute("UPDATE tickets SET status = 'no_show' WHERE id = ?", (ticket_id,))
        conn.execute("UPDATE counters SET status = 'available', current_ticket_id = NULL WHERE current_ticket_id = ?", (ticket_id,))
        conn.commit()

    return jsonify({'success': True})

@app.route('/api/transfer', methods=['POST'])
def transfer_ticket():
    data = request.json or {}
    ticket_id = data.get('ticketId')
    target_category_code = data.get('targetCategoryCode')
    target_counter_id = data.get('targetCounterId')

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT name FROM categories WHERE code = ?", (target_category_code,))
        cat_row = cur.fetchone()
        category_name = cat_row['name'] if cat_row else 'Geral'

        counter_name = None
        if target_counter_id:
            cur.execute("SELECT name FROM counters WHERE id = ?", (target_counter_id,))
            c_row = cur.fetchone()
            if c_row:
                counter_name = c_row['name']

        cur.execute("""
            UPDATE tickets
            SET category_code = ?,
                category_name = ?,
                status = 'waiting',
                counter_id = ?,
                counter_name = ?,
                called_at = NULL,
                service_started_at = NULL
            WHERE id = ?
        """, (target_category_code, category_name, target_counter_id, counter_name, ticket_id))

        cur.execute("UPDATE counters SET status = 'available', current_ticket_id = NULL WHERE current_ticket_id = ?", (ticket_id,))
        conn.commit()

    return jsonify({'success': True})

# ----------------- CALLS (TV DISPLAY) -----------------
@app.route('/api/calls/active', methods=['GET'])
def get_active_call():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM calls ORDER BY timestamp DESC LIMIT 1")
        call_row = cur.fetchone()
        if not call_row:
            return jsonify({'call': None})

        d = dict(call_row)
        return jsonify({
            'call': {
                'id': d['id'],
                'ticket': {
                    'id': d['ticket_id'],
                    'displayNumber': d['display_number'],
                    'categoryCode': d['category_code'],
                    'categoryName': d['category_name'],
                    'customerName': d['customer_name']
                },
                'counterName': d['counter_name'],
                'room': d['room'],
                'timestamp': d['timestamp'],
                'recalled': bool(d['recalled'])
            }
        })

@app.route('/api/calls/history', methods=['GET'])
def get_call_history():
    limit = request.args.get('limit', 10, type=int)
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM calls ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        history = []
        for r in rows:
            d = dict(r)
            history.append({
                'id': d['id'],
                'ticket': {
                    'id': d['ticket_id'],
                    'displayNumber': d['display_number'],
                    'categoryCode': d['category_code'],
                    'categoryName': d['category_name'],
                    'customerName': d['customer_name']
                },
                'counterName': d['counter_name'],
                'room': d['room'],
                'timestamp': d['timestamp'],
                'recalled': bool(d['recalled'])
            })
    return jsonify(history)

# ----------------- METRICS & REPORTS -----------------
@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'waiting'")
        waiting_total = cur.fetchone()[0]

        cur.execute("SELECT category_code, COUNT(*) FROM tickets WHERE status = 'waiting' GROUP BY category_code")
        cat_counts = dict(cur.fetchall())

        cur.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('called', 'in_service')")
        in_service_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'completed'")
        completed_today = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'no_show'")
        no_show_count = cur.fetchone()[0]

        # Calculate average wait time (minutes)
        cur.execute("""
            SELECT AVG((called_at - created_at) / 60000.0)
            FROM tickets
            WHERE called_at IS NOT NULL AND created_at IS NOT NULL
        """)
        avg_wait = cur.fetchone()[0]
        avg_wait_minutes = round(avg_wait) if avg_wait else 12

        # Calculate average service duration (minutes)
        cur.execute("""
            SELECT AVG((completed_at - service_started_at) / 60000.0)
            FROM tickets
            WHERE completed_at IS NOT NULL AND service_started_at IS NOT NULL
        """)
        avg_service = cur.fetchone()[0]
        avg_service_minutes = round(avg_service) if avg_service else 8

    return jsonify({
        'waitingTotal': waiting_total,
        'waitingByCategory': cat_counts,
        'inServiceCount': in_service_count,
        'completedToday': completed_today,
        'noShowCount': no_show_count,
        'avgWaitMinutes': avg_wait_minutes,
        'avgServiceMinutes': avg_service_minutes
    })

# ----------------- SETTINGS -----------------
@app.route('/api/settings', methods=['GET'])
def get_settings():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT key, value FROM settings")
        rows = cur.fetchall()
        settings = {}
        for r in rows:
            k, v = r['key'], r['value']
            if v == 'true': settings[k] = True
            elif v == 'false': settings[k] = False
            else:
                try:
                    if '.' in v: settings[k] = float(v)
                    else: settings[k] = int(v)
                except ValueError:
                    settings[k] = v
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def save_settings():
    data = request.json or {}
    with get_db() as conn:
        for k, v in data.items():
            str_val = 'true' if v is True else ('false' if v is False else str(v))
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str_val))
        conn.commit()
    return jsonify({'success': True})

# ----------------- EXPORT CSV -----------------
@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM tickets ORDER BY created_at ASC")
        rows = cur.fetchall()

    csv_lines = ['Senha,Categoria,Prioridade,Cliente,Documento,Status,CriadoEm,ChamadoEm,ConcluidoEm,Guiche,Atendente,Observacoes']
    for r in rows:
        d = dict(r)
        created_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(d['created_at']/1000)) if d['created_at'] else ''
        called_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(d['called_at']/1000)) if d['called_at'] else ''
        completed_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(d['completed_at']/1000)) if d['completed_at'] else ''
        csv_lines.append(f"{d['display_number']},\"{d['category_name']}\",{d['priority_type']},\"{d['customer_name'] or ''}\",\"{d['customer_doc'] or ''}\",{d['status']},{created_str},{called_str},{completed_str},\"{d['counter_name'] or ''}\",\"{d['attendant_name'] or ''}\",\"{d['notes'] or ''}\"")

    csv_data = "\n".join(csv_lines)
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename=relatorio_fila_{time.strftime('%Y-%m-%d')}.csv"}
    )

# ----------------- PRESETS & RESET -----------------
@app.route('/api/reset', methods=['POST'])
def reset_queue():
    with get_db() as conn:
        conn.execute("DELETE FROM tickets")
        conn.execute("DELETE FROM calls")
        conn.execute("UPDATE counters SET status = 'available', current_ticket_id = NULL")
        conn.commit()
    return jsonify({'success': True, 'message': 'Fila do dia zerada com sucesso'})

@app.route('/api/scenario', methods=['POST'])
def load_scenario():
    data = request.json or {}
    preset = data.get('preset', 'clinica')

    presets = {
        'clinica': ('Clínica Médica & Diagnósticos Saúde Viva', 'Ala de Consultórios & Exames', 'Apresente o pedido médico e documento com foto no guichê de chamada.'),
        'banco': ('Cooperativa de Crédito & Finanças', 'Agência Central Metropolitana', 'Atendimento com sigilo e segurança. Dúvidas sobre cartões podem ser tiradas no totem.'),
        'cartorio': ('1º Ofício de Notas e Registro Civil', 'Comarca Central', 'Reconhecimento de firma, procurações e certidões. Apresente RG original atualizado.'),
        'poupatempo': ('Poupatempo Cidadão & Serviços Públicos', 'Posto de Atendimento Integrado', 'Emissão de RG, CNH, Carteira de Trabalho Digital e serviços municipais.')
    }

    b_name, u_name, banner = presets.get(preset, presets['clinica'])

    with get_db() as conn:
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('businessName', ?)", (b_name,))
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('unitName', ?)", (u_name,))
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('tvBannerMessage', ?)", (banner,))
        
        # Reset and re-seed sample tickets
        conn.execute("DELETE FROM tickets")
        conn.execute("DELETE FROM calls")
        conn.execute("UPDATE counters SET status = 'available', current_ticket_id = NULL")
        seed_defaults(conn)
        conn.commit()

    return jsonify({'success': True, 'preset': preset})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Iniciando FilaExpress Backend Flask + SQLite na porta {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
