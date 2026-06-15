import sqlite3
conn = sqlite3.connect('/home/dev/xaynha-chiphi/prisma/data.db')
cur = conn.execute('SELECT budget, typeof(budget), startDate, typeof(startDate), endDate, typeof(endDate), status FROM Project WHERE deletedAt IS NULL')
for r in cur.fetchall():
    print(f'budget={r[0]} (type={r[1]}), startDate={r[2]} (type={r[3]}), endDate={r[4]} (type={r[5]}), status={r[6]}')

# Check if any deletedAt is set with non-standard format
cur = conn.execute('SELECT id, name, deletedAt, typeof(deletedAt) FROM Project WHERE deletedAt IS NOT NULL LIMIT 5')
for r in cur.fetchall():
    print(f'deleted: id={r[0][:8]}... name={r[1][:30]} deletedAt={r[2]} type={r[3]}')
conn.close()
